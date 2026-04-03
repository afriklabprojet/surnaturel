"use client"

import { createContext, useContext } from "react"
import fr from "./fr.json"

export type Locale = "fr"

type Dict = typeof fr

interface I18nContextValue {
  locale: Locale
  t: Dict
}

const I18nContext = createContext<I18nContextValue>({
  locale: "fr",
  t: fr,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return (
    <I18nContext.Provider value={{ locale: "fr", t: fr }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
