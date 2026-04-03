"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Star, Quote, ArrowRight } from "lucide-react"
import { SkeletonTemoignages } from "@/components/ui/skeletons"
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations"
import Link from "next/link"

interface AvisPublic {
  id: string
  note: number
  commentaire: string | null
  createdAt: string
  user: { nom: string; prenom: string; photoUrl: string | null }
  soin: { nom: string }
}

interface AvisStats {
  total: number
  moyenne: number
  distribution: Record<number, number>
}

export default function PageAvis() {
  const [avis, setAvis] = useState<AvisPublic[]>([])
  const [stats, setStats] = useState<AvisStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/avis/aggregate")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setAvis(data.reviews || [])
          setStats({
            total: data.aggregateRating?.reviewCount || 0,
            moyenne: data.aggregateRating?.ratingValue || 0,
            distribution: data.distribution || {},
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <SkeletonTemoignages />
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-white px-6 py-16 lg:px-10">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="mx-auto max-w-3xl text-center"
        >
          <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Avis clients
          </p>
          <h1 className="mt-4 font-display text-3xl font-light text-text-main sm:text-4xl">
            Ce que disent nos <em className="text-primary-brand">clientes</em>
          </h1>
          <p className="mt-4 font-body text-sm text-text-mid">
            Des témoignages authentiques de femmes qui nous ont fait confiance
          </p>
        </motion.div>
      </section>

      {/* Stats */}
      {stats && stats.total > 0 && (
        <section className="border-y border-border-brand bg-bg-page px-6 py-12 lg:px-10">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 sm:flex-row sm:justify-center sm:gap-16">
            {/* Note moyenne */}
            <div className="text-center">
              <p className="font-display text-5xl font-light text-primary-brand">
                {stats.moyenne.toFixed(1)}
              </p>
              <div className="mt-2 flex justify-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={
                      i < Math.round(stats.moyenne)
                        ? "fill-gold text-gold"
                        : "text-border-brand"
                    }
                  />
                ))}
              </div>
              <p className="mt-1 font-body text-xs text-text-muted-brand">
                {stats.total} avis vérifiés
              </p>
            </div>

            {/* Distribution */}
            <div className="w-full max-w-xs space-y-1.5">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = stats.distribution[n] || 0
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
                return (
                  <div key={n} className="flex items-center gap-2">
                    <span className="w-8 text-right font-body text-xs text-text-mid">
                      {n} ★
                    </span>
                    <div className="h-2 flex-1 bg-border-brand">
                      <div
                        className="h-full bg-gold transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 font-body text-xs text-text-muted-brand">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Liste des avis */}
      <section className="bg-white px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-5xl">
          {avis.length === 0 ? (
            <div className="py-20 text-center">
              <div className="relative mx-auto mb-6 w-fit">
                <div className="absolute -inset-4 bg-gold-light opacity-50" />
                <div className="relative flex h-16 w-16 items-center justify-center bg-white">
                  <Star size={32} className="text-gold" strokeWidth={1.5} />
                </div>
                <div className="absolute -right-2 -top-2 h-3 w-3 bg-gold opacity-60" />
              </div>
              <h3 className="font-display text-[22px] font-light text-text-main">
                Aucun avis pour le moment
              </h3>
              <p className="mx-auto mt-2 max-w-sm font-body text-[13px] font-light leading-relaxed text-text-muted-brand">
                Soyez la première à partager votre expérience avec nous !
              </p>
              <Link
                href="/prise-rdv"
                className="mt-6 inline-flex items-center gap-2 border border-primary-brand bg-primary-brand px-6 py-2.5 font-body text-[12px] uppercase tracking-widest text-white transition-colors hover:bg-primary-dark"
              >
                Prendre rendez-vous
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {avis.map((a) => (
                <motion.div
                  key={a.id}
                  variants={staggerItem}
                  className="border border-border-brand bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <Quote size={20} className="text-gold/30" />
                  <div className="mt-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < a.note
                            ? "fill-gold text-gold"
                            : "text-border-brand"
                        }
                      />
                    ))}
                  </div>
                  {a.commentaire && (
                    <p className="mt-3 font-body text-[13px] leading-relaxed text-text-mid">
                      &ldquo;{a.commentaire}&rdquo;
                    </p>
                  )}
                  <div className="mt-4 border-t border-border-brand pt-3">
                    <p className="font-display text-sm font-medium text-text-main">
                      {a.user.prenom} {a.user.nom.charAt(0)}.
                    </p>
                    <p className="font-body text-xs text-gold">
                      {a.soin.nom}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gold-light px-6 py-16 lg:px-10">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="font-display text-2xl font-light text-text-main sm:text-3xl">
            Tentée par l&apos;expérience ?
          </h2>
          <p className="mt-3 font-body text-sm text-text-mid">
            Réservez votre premier soin et rejoignez nos clientes satisfaites
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/prise-rdv"
              className="border border-primary-brand bg-primary-brand px-7 py-3 font-body text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Prendre rendez-vous
            </Link>
            <Link
              href="/soins"
              className="border border-border-brand bg-white px-7 py-3 font-body text-sm font-medium text-text-main transition-colors hover:border-gold hover:text-gold"
            >
              Découvrir nos soins
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  )
}
