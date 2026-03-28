// Animations Framer Motion — Design Parisien Le Surnaturel de Dieu

import type { Variants, Transition } from "framer-motion"

// ─── Reduced‑motion : désactive les mouvements si l'OS le demande ─
const isReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

const instant: Transition = { duration: 0.01 }

// Helper — quand reduced motion est actif, on neutralise les transforms
// pour que tout apparaisse instantanément (opacity seule suffit).
function rm<T extends Variants>(v: T): T {
  if (!isReducedMotion) return v
  const patched = { ...v } as Record<string, unknown>
  for (const key of Object.keys(patched)) {
    const val = patched[key]
    if (typeof val === "object" && val !== null) {
      const o = { ...val } as Record<string, unknown>
      // Neutralise transforms
      if ("y" in o) o.y = 0
      if ("x" in o) o.x = 0
      if ("scale" in o) o.scale = 1
      if ("rotate" in o) o.rotate = 0
      // Accélère transitions
      if ("transition" in o) o.transition = instant
      patched[key] = o
    }
  }
  return patched as T
}

// Transition par défaut élégante
export const transitionElegante: Transition = isReducedMotion
  ? instant
  : {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1], // cubic-bezier élégant
    }

// Fade in avec montée subtile
export const fadeInUp: Variants = rm({
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: transitionElegante
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: { duration: 0.2 }
  }
})

// Fade in simple
export const fadeIn: Variants = rm({
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
})

// Slide depuis la droite (pour dropdowns, sidebars)
export const slideInRight: Variants = rm({
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    x: 10,
    transition: { duration: 0.2 }
  }
})

// Slide depuis le bas (pour modales)
export const slideInBottom: Variants = rm({
  initial: { opacity: 0, y: 30 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: { duration: 0.2 }
  }
})

// Effet scale (pour modales, QR code)
export const scaleIn: Variants = rm({
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    scale: 0.98,
    transition: { duration: 0.2 }
  }
})

// Container avec stagger pour listes
export const staggerContainer: Variants = isReducedMotion
  ? { initial: {}, animate: {} }
  : {
      initial: {},
      animate: {
        transition: {
          staggerChildren: 0.08,
          delayChildren: 0.1,
        }
      }
    }

// Item pour stagger
export const staggerItem: Variants = rm({
  initial: { opacity: 0, y: 15 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: transitionElegante
  }
})

// Hover pour cartes (subtil et élégant)
export const cardHover = isReducedMotion
  ? { whileHover: {}, whileTap: {} }
  : {
      whileHover: { 
        y: -3,
        transition: { duration: 0.25, ease: "easeOut" as const }
      },
      whileTap: { 
        scale: 0.99,
        transition: { duration: 0.1 }
      }
    }

// Hover pour boutons
export const buttonHover = isReducedMotion
  ? { whileHover: {}, whileTap: {} }
  : {
      whileHover: { 
        scale: 1.02,
        transition: { duration: 0.2 }
      },
      whileTap: { 
        scale: 0.98,
        transition: { duration: 0.1 }
      }
    }

// Animation pulse pour favoris (cœur)
export const heartPulse: Variants = rm({
  initial: { scale: 1 },
  animate: { 
    scale: [1, 1.3, 1],
    transition: { 
      duration: 0.4,
      times: [0, 0.4, 1],
      ease: "easeOut"
    }
  }
})

// Animation notification badge
export const notificationBadge: Variants = rm({
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: "spring",
      stiffness: 500,
      damping: 25
    }
  },
  exit: { 
    scale: 0, 
    opacity: 0,
    transition: { duration: 0.15 }
  }
})

// Animation progress bar (utilise custom prop pour la largeur dynamique)
export const progressBar: Variants = {
  initial: { width: "0%" },
  animate: (pourcentage: number) => ({
    width: `${pourcentage}%`,
    transition: isReducedMotion
      ? instant
      : { duration: 0.8, ease: [0.33, 1, 0.68, 1], delay: 0.2 },
  }),
}

// Animation skeleton shimmer
export const shimmer: Variants = isReducedMotion
  ? { initial: {}, animate: {} }
  : {
      initial: { backgroundPosition: "-200% 0" },
      animate: {
        backgroundPosition: "200% 0",
        transition: { repeat: Infinity, duration: 1.5, ease: "linear" },
      },
    }

// Overlay modal fade
export const overlayFade: Variants = rm({
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.25 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
})

// Animation étoiles (avis)
export const starPop = (delay: number): Variants => rm({
  initial: { scale: 0, rotate: -30 },
  animate: { 
    scale: 1, 
    rotate: 0,
    transition: { 
      delay: delay * 0.1,
      type: "spring",
      stiffness: 400,
      damping: 20
    }
  }
})

// Animation tab indicator
export const tabIndicator: Variants = rm({
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.2 }
  }
})

// Fade in depuis la gauche
export const fadeInLeft: Variants = rm({
  initial: { opacity: 0, x: -24 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
})

// Fade in depuis la droite
export const fadeInRight: Variants = rm({
  initial: { opacity: 0, x: 24 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
})

// Pulse pour badges stock faible
export const pulseAnimation: Variants = rm({
  initial: {},
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
})
