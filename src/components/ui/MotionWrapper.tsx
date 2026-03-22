"use client"

import { motion, type Variants } from "framer-motion"
import React, { type ComponentProps, type ReactNode } from "react"

type MotionDivProps = ComponentProps<typeof motion.div>

interface MotionSectionProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  variants: Variants
  /** @default "whileInView" */
  trigger?: "animate" | "whileInView"
  /** @default true */
  once?: boolean
  delay?: number
}

export function MotionSection({
  children,
  className,
  style,
  variants,
  trigger = "whileInView",
  once = true,
  delay,
}: MotionSectionProps) {
  const animProps: MotionDivProps =
    trigger === "animate"
      ? { initial: "initial", animate: "animate" }
      : { initial: "initial", whileInView: "animate", viewport: { once, margin: "-50px" } }

  return (
    <motion.div
      variants={variants}
      {...animProps}
      transition={delay ? { delay } : undefined}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

export function MotionStagger({
  children,
  className,
  style,
  trigger = "whileInView",
  once = true,
}: Omit<MotionSectionProps, "variants" | "delay">) {
  const stagger: Variants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.08 } },
  }

  const animProps: MotionDivProps =
    trigger === "animate"
      ? { initial: "initial", animate: "animate" }
      : { initial: "initial", whileInView: "animate", viewport: { once, margin: "-50px" } }

  return (
    <motion.div variants={stagger} {...animProps} className={className} style={style}>
      {children}
    </motion.div>
  )
}

export function MotionItem({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const item: Variants = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  }

  return (
    <motion.div variants={item} className={className} style={style}>
      {children}
    </motion.div>
  )
}
