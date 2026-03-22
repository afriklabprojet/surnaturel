"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { fadeInUp, fadeInLeft, fadeInRight } from "@/lib/animations"

interface FormData {
  nom: string
  email: string
  telephone: string
  sujet: string
  message: string
}

const INITIAL_FORM: FormData = {
  nom: "",
  email: "",
  telephone: "",
  sujet: "",
  message: "",
}

export default function PageContact() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {}
    if (!form.nom.trim() || form.nom.trim().length < 2) errs.nom = "Le nom est requis (min. 2 caractères)"
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Email invalide"
    if (!form.sujet.trim()) errs.sujet = "Le sujet est requis"
    if (!form.message.trim() || form.message.trim().length < 10) errs.message = "Le message est requis (min. 10 caractères)"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom.trim(),
          email: form.email.trim(),
          telephone: form.telephone.trim() || undefined,
          sujet: form.sujet.trim(),
          message: form.message.trim(),
        }),
      })

      if (res.ok) {
        setResult({ type: "success", text: "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais." })
        setForm(INITIAL_FORM)
        setErrors({})
      } else {
        const data = await res.json()
        setResult({ type: "error", text: data.error ?? "Une erreur est survenue. Veuillez réessayer." })
      }
    } catch {
      setResult({ type: "error", text: "Erreur réseau. Vérifiez votre connexion." })
    } finally {
      setSubmitting(false)
    }
  }

  function handleChange(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  const inputCls = (hasError: boolean) =>
    `w-full border bg-bg-page px-4 py-3 font-body text-[14px] text-text-main outline-none placeholder:text-text-muted-brand focus:border-gold ${hasError ? "border-danger" : "border-border-brand"}`

  return (
    <div className="bg-bg-page">
      {/* Hero */}
      <section className="bg-primary-brand px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="mx-auto max-w-4xl text-center"
        >
          <span className="font-body text-[11px] uppercase tracking-[0.2em] text-gold">
            Nous écrire
          </span>
          <h1 className="mt-4 font-display text-[44px] font-light text-white">
            Contactez-nous
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-body text-[14px] text-white/80">
            Une question, une demande de renseignement ? Notre équipe vous répondra dans les meilleurs délais.
          </p>
          <div className="mx-auto mt-6 h-px w-16 bg-gold" />
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Informations — 2 colonnes */}
          <motion.div
            variants={fadeInLeft}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            className="space-y-6 lg:col-span-2"
          >
            <div className="border border-border-brand bg-white p-6">
              <h3 className="font-display text-[20px] text-text-main mb-4">Nos coordonnées</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-primary-brand" />
                  <div>
                    <p className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">Adresse</p>
                    <p className="font-body text-[14px] text-text-main">Cocody Angré, Abidjan, Côte d&apos;Ivoire</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={16} className="mt-0.5 shrink-0 text-primary-brand" />
                  <div>
                    <p className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">Téléphone</p>
                    <p className="font-body text-[14px] text-text-main">+225 07 09 00 00 00</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 shrink-0 text-primary-brand" />
                  <div>
                    <p className="font-body text-[11px] uppercase tracking-widest text-text-muted-brand">Email</p>
                    <p className="font-body text-[14px] text-text-main">contact@surnatureldedieu.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-border-brand bg-white p-6">
              <h3 className="font-display text-[20px] text-text-main mb-4">Horaires</h3>
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-border-brand">
                    <td className="py-3 font-body text-[13px] text-text-mid">Lundi — Vendredi</td>
                    <td className="py-3 text-right font-body text-[13px] font-medium text-primary-brand">08h00 — 18h00</td>
                  </tr>
                  <tr className="border-b border-border-brand">
                    <td className="py-3 font-body text-[13px] text-text-mid">Samedi</td>
                    <td className="py-3 text-right font-body text-[13px] font-medium text-primary-brand">09h00 — 16h00</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-body text-[13px] text-text-mid">Dimanche</td>
                    <td className="py-3 text-right font-body text-[13px] font-medium text-danger">Fermé</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Map Placeholder */}
            <div className="flex h-48 items-center justify-center border border-border-brand bg-primary-light">
              <span className="font-body text-[12px] text-primary-brand/50">Google Maps</span>
            </div>
          </motion.div>

          {/* Formulaire — 3 colonnes */}
          <motion.div
            variants={fadeInRight}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            className="lg:col-span-3"
          >
            <form onSubmit={handleSubmit} className="border border-border-brand bg-white p-6 sm:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gold" />
                <span className="font-body text-[11px] uppercase tracking-[0.15em] text-gold">
                  Envoyer un message
                </span>
                <div className="h-px flex-1 bg-gold" />
              </div>

              {result && (
                <div className={`mb-6 flex items-start gap-2 p-4 font-body text-[13px] ${
                  result.type === "success" ? "bg-primary-light text-primary-brand" : "bg-red-50 text-danger"
                }`}>
                  {result.type === "success" ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                  {result.text}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="nom" className="mb-1.5 block font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
                    Nom complet <span className="text-danger">*</span>
                  </label>
                  <input id="nom" type="text" value={form.nom} onChange={(e) => handleChange("nom", e.target.value)} maxLength={100} className={inputCls(!!errors.nom)} placeholder="Votre nom" />
                  {errors.nom && <p className="mt-1 font-body text-[11px] text-danger">{errors.nom}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input id="email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} maxLength={200} className={inputCls(!!errors.email)} placeholder="votre@email.com" />
                  {errors.email && <p className="mt-1 font-body text-[11px] text-danger">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="telephone" className="mb-1.5 block font-body text-[11px] uppercase tracking-widest text-text-muted-brand">Téléphone</label>
                  <input id="telephone" type="tel" value={form.telephone} onChange={(e) => handleChange("telephone", e.target.value)} maxLength={20} className={inputCls(false)} placeholder="+225 XX XX XX XX XX" />
                </div>
                <div>
                  <label htmlFor="sujet" className="mb-1.5 block font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
                    Sujet <span className="text-danger">*</span>
                  </label>
                  <input id="sujet" type="text" value={form.sujet} onChange={(e) => handleChange("sujet", e.target.value)} maxLength={200} className={inputCls(!!errors.sujet)} placeholder="Objet de votre message" />
                  {errors.sujet && <p className="mt-1 font-body text-[11px] text-danger">{errors.sujet}</p>}
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="message" className="mb-1.5 block font-body text-[11px] uppercase tracking-widest text-text-muted-brand">
                  Message <span className="text-danger">*</span>
                </label>
                <textarea id="message" value={form.message} onChange={(e) => handleChange("message", e.target.value)} rows={5} maxLength={3000}
                  className={`w-full border bg-bg-page px-4 py-3 font-body text-[14px] text-text-main outline-none placeholder:text-text-muted-brand focus:border-gold ${errors.message ? "border-danger" : "border-border-brand"}`}
                  placeholder="Votre message…"
                />
                {errors.message && <p className="mt-1 font-body text-[11px] text-danger">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex items-center gap-2 bg-primary-brand px-6 py-3 font-body text-[11px] uppercase tracking-[0.15em] text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Envoyer le message
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
