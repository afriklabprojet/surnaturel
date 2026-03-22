"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { FaqItem } from "@/lib/soins-data"

interface FaqSectionProps {
  faqs: FaqItem[]
}

export default function FaqSection({ faqs }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <div key={index} className="border border-border-brand bg-white">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="flex w-full items-center justify-between p-5 text-left transition-colors duration-300 hover:bg-bg-page"
          >
            <span className="pr-4 font-body text-[14px] font-medium text-text-main">
              {faq.question}
            </span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-gold transition-transform duration-300 ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="border-t border-border-brand px-5 pb-5 pt-4">
                  <p className="font-body text-[13px] leading-relaxed text-text-mid">
                    {faq.reponse}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
