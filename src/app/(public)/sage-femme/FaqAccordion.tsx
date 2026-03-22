"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

interface FaqItem {
  question: string
  reponse: string
}

export default function FaqAccordion({ faq }: { faq: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {faq.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div key={i} className="border border-border-brand bg-white">
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between px-6 py-5 text-left"
            >
              <span className="font-display text-[16px] text-text-main pr-4">
                {item.question}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0"
              >
                <ChevronDown size={18} className="text-gold" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border-brand px-6 py-5">
                    <p className="font-body text-[14px] leading-relaxed text-text-mid">
                      {item.reponse}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
