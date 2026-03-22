// Animations Framer Motion — Design Parisien Le Surnaturel de Dieu

import type { Variants, Transition } from "framer-motion"

// Transition par défaut élégante
export const transitionElegante: Transition = {
  duration: 0.4,
  ease: [0.25, 0.1, 0.25, 1], // cubic-bezier élégant
}

// Fade in avec montée subtile
export const fadeInUp: Variants = {
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
}

// Fade in simple
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

// Slide depuis la droite (pour dropdowns, sidebars)
export const slideInRight: Variants = {
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
}

// Slide depuis le bas (pour modales)
export const slideInBottom: Variants = {
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
}

// Effet scale (pour modales, QR code)
export const scaleIn: Variants = {
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
}

// Container avec stagger pour listes
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    }
  }
}

// Item pour stagger
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 15 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: transitionElegante
  }
}

// Hover pour cartes (subtil et élégant)
export const cardHover = {
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
export const buttonHover = {
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
export const heartPulse: Variants = {
  initial: { scale: 1 },
  animate: { 
    scale: [1, 1.3, 1],
    transition: { 
      duration: 0.4,
      times: [0, 0.4, 1],
      ease: "easeOut"
    }
  }
}

// Animation notification badge
export const notificationBadge: Variants = {
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
}

// Animation progress bar (utilise custom prop pour la largeur dynamique)
export const progressBar: Variants = {
  initial: { width: "0%" },
  animate: (pourcentage: number) => ({
    width: `${pourcentage}%`,
    transition: { 
      duration: 0.8, 
      ease: [0.33, 1, 0.68, 1],
      delay: 0.2
    }
  })
}

// Animation skeleton shimmer
export const shimmer: Variants = {
  initial: { 
    backgroundPosition: "-200% 0" 
  },
  animate: { 
    backgroundPosition: "200% 0",
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "linear"
    }
  }
}

// Overlay modal fade
export const overlayFade: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.25 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

// Animation étoiles (avis)
export const starPop = (delay: number): Variants => ({
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
export const tabIndicator: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.2 }
  }
}

// Fade in depuis la gauche
export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -24 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
}

// Fade in depuis la droite
export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
}

// Pulse pour badges stock faible
export const pulseAnimation: Variants = {
  initial: {},
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}
