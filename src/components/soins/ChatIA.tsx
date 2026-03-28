"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, Send, X, MessageCircle } from "lucide-react"
import Link from "next/link"
import { formatPrix } from "@/lib/utils"

interface Message {
  role: "bot" | "user"
  text: string
  soins?: { slug: string; nom: string; prix: number }[]
}

interface QuestionOption {
  label: string
  value: string
}

interface Question {
  id: string
  question: string
  options: QuestionOption[]
}

interface SoinChat {
  slug: string
  nom: string
  prix: number
  categorie: string
  duree: number
}

const CATEGORIE_MAP: Record<string, string[]> = {
  detente: ["HAMMAM"],
  visage: ["GOMMAGE", "VISAGE"],
  minceur: ["AMINCISSANT", "GOMMAGE"],
  maman: ["POST_ACCOUCHEMENT", "SAGE_FEMME"],
  medical: ["SAGE_FEMME"],
  decouvrir: ["HAMMAM", "GOMMAGE", "CONSEIL_ESTHETIQUE"],
}

function recommend(answers: Record<string, string>, soins: SoinChat[]) {
  const cats = CATEGORIE_MAP[answers.objectif] || []
  let results = soins.filter((s) => cats.includes(s.categorie))

  if (answers.budget === "petit") results = results.filter((s) => s.prix < 10000)
  else if (answers.budget === "moyen") results = results.filter((s) => s.prix <= 20000)

  if (answers.temps === "court") results = results.filter((s) => s.duree <= 60)
  else if (answers.temps === "moyen") results = results.filter((s) => s.duree <= 120)

  if (results.length === 0) results = soins.filter((s) => cats.includes(s.categorie)).slice(0, 2)
  return results.slice(0, 3)
}

export default function ChatIA() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [soinsData, setSoinsData] = useState<SoinChat[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Bonjour ! 🌿 Je suis votre assistante bien-être. Je vais vous recommander les soins idéaux pour vous." },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Charger soins + questions depuis la BDD
  useEffect(() => {
    if (!open) return
    Promise.all([
      fetch("/api/soins").then(r => r.json()).then(d => d.soins || []),
      fetch("/api/config/questions_chat_ia").then(r => r.json()).then(d => d.valeur || []).catch(() => []),
    ]).then(([soins, q]) => {
      setSoinsData(soins.map((s: Record<string, unknown>) => ({ slug: s.slug, nom: s.nom, prix: s.prix, categorie: s.categorie, duree: s.duree })))
      if (q.length > 0) {
        setQuestions(q)
        if (messages.length <= 1) {
          setMessages(prev => [...prev, { role: "bot", text: q[0].question }])
        }
      }
    }).catch(() => {})
  }, [open])

  function handleOption(value: string, label: string) {
    const q = questions[step]
    const newAnswers = { ...answers, [q.id]: value }
    setAnswers(newAnswers)

    const newMessages: Message[] = [...messages, { role: "user", text: label }]

    if (step < questions.length - 1) {
      const next = questions[step + 1]
      newMessages.push({ role: "bot", text: next.question })
      setStep(step + 1)
    } else {
      const reco = recommend(newAnswers, soinsData)
      if (reco.length > 0) {
        newMessages.push({
          role: "bot",
          text: "Voici mes recommandations pour vous ✨",
          soins: reco.map((s) => ({ slug: s.slug, nom: s.nom, prix: s.prix })),
        })
      } else {
        newMessages.push({ role: "bot", text: "Je vous conseille de nous contacter directement pour un conseil personnalisé." })
      }
      newMessages.push({ role: "bot", text: "Souhaitez-vous prendre rendez-vous ou recommencer ?" })
    }

    setMessages(newMessages)
  }

  function restart() {
    setStep(0)
    setAnswers({})
    setMessages([
      { role: "bot", text: "Recommençons ! 🌿 Quel est votre objectif principal ?" },      ...(questions.length > 0 ? [{ role: "bot" as const, text: questions[0].question }] : []),    ])
  }

  const currentQ = step < questions.length ? questions[step] : null
  const isDone = step >= questions.length - 1 && Object.keys(answers).length >= questions.length

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary-brand text-white shadow-lg transition-transform hover:scale-105"
          aria-label="Ouvrir l'assistant bien-être"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[480px] w-[340px] flex-col border border-border-brand bg-white shadow-2xl sm:w-[380px]">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary-brand px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-white" />
              <span className="font-body text-[13px] font-medium text-white">Assistant Bien-Être</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 font-body text-[13px] ${
                    m.role === "user"
                      ? "bg-primary-brand text-white"
                      : "border border-border-brand bg-bg-page text-text-main"
                  }`}
                >
                  {m.text}
                  {m.soins && (
                    <div className="mt-2 space-y-2">
                      {m.soins.map((s) => (
                        <Link
                          key={s.slug}
                          href={`/soins/${s.slug}`}
                          className="block border border-gold/30 bg-white p-2 transition-colors hover:border-gold"
                        >
                          <p className="font-display text-[14px] text-text-main">{s.nom}</p>
                          <p className="font-body text-[11px] text-gold">{formatPrix(s.prix)}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Options / Actions */}
          <div className="border-t border-border-brand bg-white p-3">
            {!isDone && currentQ ? (
              <div className="flex flex-wrap gap-2">
                {currentQ.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleOption(opt.value, opt.label)}
                    className="border border-border-brand px-3 py-1.5 font-body text-[11px] text-text-mid transition-colors hover:border-gold hover:text-gold"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/prise-rdv"
                  className="flex-1 bg-primary-brand py-2 text-center font-body text-[11px] uppercase tracking-wider text-white hover:bg-primary-dark transition-colors"
                >
                  Prendre RDV
                </Link>
                <button
                  onClick={restart}
                  className="flex-1 border border-border-brand py-2 font-body text-[11px] uppercase tracking-wider text-text-mid hover:border-gold hover:text-gold transition-colors"
                >
                  Recommencer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
