"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react"
import { formatPrix } from "@/lib/utils"
import { useCart } from "@/lib/cart-context"
import { slideInRight, overlayFade } from "@/lib/animations"

interface MiniCartProps {
  open: boolean
  onClose: () => void
}

export default function MiniCart({ open, onClose }: MiniCartProps) {
  const { items, totalPrix, totalArticles, updateQuantity, removeItem } =
    useCart()
  const overlayRef = useRef<HTMLDivElement>(null)

  // Fermer avec Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.addEventListener("keydown", onKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            ref={overlayRef}
            variants={overlayFade}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/30"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            variants={slideInRight}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white border-l border-border-brand shadow-xl"
          >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-brand px-6 py-5">
          <h2 className="flex items-center gap-3 font-display text-[20px] font-normal text-text-main">
            Mon panier
            {totalArticles > 0 && (
              <span className="px-2 py-0.5 bg-primary-brand font-body text-[11px] text-white">
                {totalArticles}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border border-border-brand transition-colors duration-200 hover:border-gold"
            aria-label="Fermer le panier"
          >
            <X size={16} className="text-text-muted-brand" />
          </button>
        </div>

        {/* Contenu */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ShoppingBag size={48} className="mb-4 text-border-brand" />
            <p className="font-body text-[13px] text-text-muted-brand">Votre panier est vide</p>
            <Link
              href="/boutique"
              className="mt-6 px-6 py-2.5 bg-primary-brand font-body text-[11px] uppercase tracking-widest text-white transition-colors duration-200 hover:bg-primary-dark"
              onClick={onClose}
            >
              Voir la boutique
            </Link>
          </div>
        ) : (
          <>
            {/* Liste articles */}
            <ul className="flex-1 divide-y divide-border-brand overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-5">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-muted">
                    <Image
                      src={item.imageUrl || "/images/placeholder-produit.jpg"}
                      alt={item.nom}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between">
                      <Link 
                        href={`/boutique/${item.id}`}
                        onClick={onClose}
                        className="font-display text-[14px] font-normal text-text-main hover:text-primary-brand transition-colors duration-200"
                      >
                        {item.nom}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-2 text-text-muted-brand transition-colors duration-200 hover:text-danger"
                        aria-label={`Supprimer ${item.nom}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="mt-1 font-display text-[15px] font-normal text-gold">
                      {formatPrix(item.prix)}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantite - 1)
                        }
                        className="flex h-7 w-7 items-center justify-center border border-border-brand text-text-muted-brand transition-colors duration-200 hover:border-gold hover:text-gold"
                        aria-label="Diminuer"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center font-body text-[12px] text-text-main">
                        {item.quantite}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantite + 1)
                        }
                        disabled={item.quantite >= item.stock}
                        className="flex h-7 w-7 items-center justify-center border border-border-brand text-text-muted-brand transition-colors duration-200 hover:border-gold hover:text-gold disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Augmenter"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="border-t border-gold px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="font-body text-[12px] uppercase tracking-widest text-text-muted-brand">Total</span>
                <span className="font-display text-[22px] font-normal text-primary-brand">
                  {formatPrix(totalPrix)}
                </span>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href="/panier"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-primary-brand font-body text-[11px] uppercase tracking-widest text-primary-brand transition-colors duration-200 hover:bg-primary-brand hover:text-white"
                >
                  Voir le panier
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-brand font-body text-[11px] uppercase tracking-widest text-white transition-colors duration-200 hover:bg-primary-dark"
                >
                  Commander
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </>
      )}
    </AnimatePresence>
  )
}
