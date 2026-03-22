"use client"

import { useI18n, type Locale } from "@/lib/i18n"

export default function LangSwitch() {
  const { locale, setLocale } = useI18n()

  return (
    <button
      onClick={() => setLocale(locale === "fr" ? "en" : "fr" as Locale)}
      className="px-2 py-1.5 border border-border-brand font-body text-[11px] font-medium uppercase tracking-widest text-text-mid hover:text-primary-brand hover:border-primary-brand transition-colors"
      aria-label={locale === "fr" ? "Switch to English" : "Passer en français"}
    >
      {locale === "fr" ? "EN" : "FR"}
    </button>
  )
}
