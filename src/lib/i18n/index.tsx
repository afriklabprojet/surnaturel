"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import fr from "./fr.json"
import en from "./en.json"

export type Locale = "fr" | "en"

const dictionaries: Record<Locale, typeof fr> = { fr, en }

type Dict = typeof fr

interface I18nContextValue {
  locale: Locale
  t: Dict
  setLocale: (l: Locale) => void
}

const I18nContext = createContext<I18nContextValue>({
  locale: "fr",
  t: fr,
  setLocale: () => {},
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr")

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null
    if (stored && dictionaries[stored]) {
      setLocaleState(stored)
      document.documentElement.lang = stored
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem("locale", l)
    document.documentElement.lang = l
  }, [])

  return (
    <I18nContext.Provider value={{ locale, t: dictionaries[locale], setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
