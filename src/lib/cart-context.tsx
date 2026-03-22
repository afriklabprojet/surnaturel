"use client"

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react"

// ─── Types ───────────────────────────────────────────────────────

export interface CartItem {
  id: string
  nom: string
  prix: number
  quantite: number
  imageUrl: string
  stock: number
}

export interface CartState {
  items: CartItem[]
  totalArticles: number
  totalPrix: number
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantite: number } }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE"; payload: CartItem[] }

// ─── Helpers ─────────────────────────────────────────────────────

function computeTotals(items: CartItem[]): CartState {
  return {
    items,
    totalArticles: items.reduce((sum, item) => sum + item.quantite, 0),
    totalPrix: items.reduce((sum, item) => sum + item.prix * item.quantite, 0),
  }
}

const STORAGE_KEY = "surnaturel-panier"

function persistCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // localStorage indisponible (SSR, quota dépassé, etc.)
  }
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as CartItem[]
  } catch {
    return []
  }
}

// ─── Reducer ─────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  let newItems: CartItem[]

  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.payload.id)
      if (existing) {
        const newQty = Math.min(
          existing.quantite + action.payload.quantite,
          action.payload.stock
        )
        newItems = state.items.map((i) =>
          i.id === action.payload.id ? { ...i, quantite: newQty } : i
        )
      } else {
        newItems = [...state.items, action.payload]
      }
      persistCart(newItems)
      return computeTotals(newItems)
    }

    case "REMOVE_ITEM": {
      newItems = state.items.filter((i) => i.id !== action.payload.id)
      persistCart(newItems)
      return computeTotals(newItems)
    }

    case "UPDATE_QUANTITY": {
      if (action.payload.quantite <= 0) {
        newItems = state.items.filter((i) => i.id !== action.payload.id)
      } else {
        newItems = state.items.map((i) =>
          i.id === action.payload.id
            ? { ...i, quantite: Math.min(action.payload.quantite, i.stock) }
            : i
        )
      }
      persistCart(newItems)
      return computeTotals(newItems)
    }

    case "CLEAR_CART": {
      persistCart([])
      return computeTotals([])
    }

    case "HYDRATE": {
      return computeTotals(action.payload)
    }

    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────

interface CartContextValue extends CartState {
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantite: number) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, computeTotals([]))

  useEffect(() => {
    const stored = loadCart()
    if (stored.length > 0) {
      dispatch({ type: "HYDRATE", payload: stored })
    }
  }, [])

  function addItem(item: CartItem) {
    dispatch({ type: "ADD_ITEM", payload: item })
  }

  function removeItem(id: string) {
    dispatch({ type: "REMOVE_ITEM", payload: { id } })
  }

  function updateQuantity(id: string, quantite: number) {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantite } })
  }

  function clearCart() {
    dispatch({ type: "CLEAR_CART" })
  }

  return (
    <CartContext.Provider
      value={{ ...state, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart doit être utilisé dans un CartProvider")
  }
  return context
}
