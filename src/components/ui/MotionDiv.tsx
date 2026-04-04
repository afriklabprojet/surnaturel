"use client"

import { type ComponentProps } from "react"
import { m, LazyMotion, domAnimation } from "framer-motion"

/**
 * Wrapper SSR-safe autour de `motion.div` (progressive enhancement).
 *
 * Problème :
 *   `<motion.div initial="initial">` écrit `opacity: 0; transform: ...`
 *   dans le HTML SSR. Si l'hydration JS est lente ou échoue → contenu invisible.
 *
 * Solution :
 *   Utilise `initial={false}` pour que le HTML SSR rende le contenu **visible**.
 *   Framer Motion démarre directement dans l'état `animate` (opacity: 1, x: 0).
 *   L'animation d'entrée ne joue pas au premier chargement SSR,
 *   mais joue normalement sur les navigations client (SPA transitions).
 *
 *   C'est le compromis standard pour les apps Next.js SSR :
 *   - Contenu toujours visible (accessible, pas de page blanche)
 *   - Animations fonctionnelles sur les navigations internes
 *   - `LazyMotion` réduit la taille du bundle framer-motion
 *
 * Usage :
 *   <MotionDiv variants={fadeInLeft} className="...">
 *     {children}
 *   </MotionDiv>
 */
export default function MotionDiv({
  variants,
  children,
  ...rest
}: ComponentProps<typeof m.div>) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        variants={variants}
        initial={false}
        animate="animate"
        {...rest}
      >
        {children}
      </m.div>
    </LazyMotion>
  )
}
