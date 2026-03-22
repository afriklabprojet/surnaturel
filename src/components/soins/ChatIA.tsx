"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, Send, X, Sparkles } from "lucide-react"
import Link from "next/link"

interface Message {
  role: "bot" | "user"
  text: string
  soins?: { slug: string; nom: string; prix: number }[]
}

const QUESTIONS = [
  {
    id: "objectif",
    question: "Quel est votre objectif principal ?",
    options: [
      { label: "Détente & relaxation", value: "detente" },
      { label: "Beauté du visage", value: "visage" },
      { label: "Minceur & silhouette", value: "minceur" },
      { label: "Soins post-accouchement", value: "maman" },
      { label: "Consultation médicale", value: "medical" },
      { label: "Découvrir l'institut", value: "decouvrir" },
    ],
  },
  {
    id: "budget",
    question: "Quel est votre budget ?",
    options: [
      { label: "Moins de 10 000 F", value: "petit" },
      { label: "10 000 – 20 000 F", value: "moyen" },
      { label: "20 000 F et plus", value: "grand" },
      { label: "Pas de limite", value: "illimite" },
    ],
  },
  {
    id: "temps",
    question: "Combien de temps avez-vous ?",
    options: [
      { label: "30 min – 1h", value: "court" },
      { label: "1h – 2h", value: "moyen" },
      { label: "Demi-journée", value: "long" },
    ],
  },
]

const SOINS_DB: { slug: string; nom: string; prix: number; categories: string[]; dureeMax: number }[] = [
  { slug: "hammam-royal", nom: "Hammam Royal", prix: 8000, categories: ["detente", "decouvrir"], dureeMax: 60 },
  { slug: "hammam-duo", nom: "Hammam Duo", prix: 15000, categories: ["detente", "decouvrir"], dureeMax: 90 },
  { slug: "gommage-corps-luxe", nom: "Gommage Corps Luxe", prix: 12000, categories: ["detente", "minceur", "decouvrir"], dureeMax: 90 },
  { slug: "gommage-visage-eclat", nom: "Gommage Visage Éclat", prix: 8000, categories: ["visage", "decouvrir"], dureeMax: 45 },
  { slug: "soin-amincissant-expert", nom: "Soin Amincissant Expert", prix: 15000, categories: ["minceur"], dureeMax: 90 },
  { slug: "soin-visage-eclat", nom: "Soin Visage Éclat", prix: 12000, categories: ["visage"], dureeMax: 60 },
  { slug: "programme-post-accouchement", nom: "Programme Post-Accouchement", prix: 25000, categories: ["maman"], dureeMax: 120 },
  { slug: "consultation-sage-femme", nom: "Consultation Sage-Femme", prix: 10000, categories: ["medical", "maman"], dureeMax: 60 },
  { slug: "conseil-esthetique", nom: "Conseil Esthétique", prix: 5000, categories: ["visage", "decouvrir"], dureeMax: 30 },
]

function recommend(answers: Record<string, string>) {
  let results = SOINS_DB.filter((s) => s.categories.includes(answers.objectif))

  if (answers.budget === "petit") results = results.filter((s) => s.prix < 10000)
  else if (answers.budget === "moyen") results = results.filter((s) => s.prix <= 20000)

  if (answers.temps === "court") results = results.filter((s) => s.dureeMax <= 60)
  else if (answers.temps === "moyen") results = results.filter((s) => s.dureeMax <= 120)

  if (results.length === 0) results = SOINS_DB.filter((s) => s.categories.includes(answers.objectif)).slice(0, 2)
  return results.slice(0, 3)
}

function formatPrix(prix: number) { return new Intl.NumberFormat("fr-FR").format(prix) + " F CFA" }

export default function ChatIA() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Bonjour ! 🌿 Je suis votre assistante bien-être. Je vais vous recommander les soins idéaux pour vous." },
    { role: "bot", text: QUESTIONS[0].question },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleOption(value: string, label: string) {
    const q = QUESTIONS[step]
    const newAnswers = { ...answers, [q.id]: value }
    setAnswers(newAnswers)

    const newMessages: Message[] = [...messages, { role: "user", text: label }]

    if (step < QUESTIONS.length - 1) {
      const next = QUESTIONS[step + 1]
      newMessages.push({ role: "bot", text: next.question })
      setStep(step + 1)
    } else {
      const reco = recommend(newAnswers)
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
      { role: "bot", text: "Recommençons ! 🌿 Quel est votre objectif principal ?" },
    ])
  }

  const currentQ = step < QUESTIONS.length ? QUESTIONS[step] : null
  const isDone = step >= QUESTIONS.length - 1 && Object.keys(answers).length >= QUESTIONS.length

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-white shadow-lg transition-transform hover:scale-105"
          aria-label="Ouvrir l'assistant bien-être"
        >
          <Sparkles size={24} />
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
