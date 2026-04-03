"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  // Éviter l'hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Afficher un placeholder pendant le chargement
    return (
      <button
        className="flex h-11 w-11 items-center justify-center rounded-md transition-colors duration-300 hover:bg-gray-50 dark:hover:bg-white/10"
        aria-label="Basculer le thème"
        disabled
      >
        <div className="h-[18px] w-[18px] animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
      </button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-11 w-11 items-center justify-center rounded-md transition-colors duration-300 hover:bg-gray-50 dark:hover:bg-white/10"
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
    >
      {isDark ? (
        <Sun size={18} className="text-gold transition-transform duration-300 hover:rotate-12" />
      ) : (
        <Moon size={18} className="text-text-mid transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  )
}
