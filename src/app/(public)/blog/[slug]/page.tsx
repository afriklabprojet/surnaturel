import Link from "next/link"
import Image from "next/image"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Clock, ArrowLeft } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { BtnSerif, BtnUnderline } from "@/components/ui/buttons"

// Génération statique de toutes les pages articles
export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    where: { publie: true },
    select: { slug: true },
  })
  return articles.map((a) => ({ slug: a.slug }))
}

// Calcul automatique du temps de lecture (~200 mots/min en français)
function tempsLectureCalcule(contenu: string): number {
  const mots = contenu.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(mots / 200))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await prisma.article.findUnique({ where: { slug, publie: true } })
  if (!article) return { title: "Article introuvable" }
  return {
    title: `${article.titre} | Blog — Le Surnaturel de Dieu`,
    description: article.contenu.slice(0, 160),
    alternates: { canonical: `/blog/${slug}` },
  }
}

export default async function PageArticle({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await prisma.article.findUnique({ where: { slug, publie: true } })
  if (!article) notFound()

  // Articles similaires — derniers 3 autres articles publiés
  const similaires = await prisma.article.findMany({
    where: { publie: true, id: { not: article.id } },
    orderBy: { createdAt: "desc" },
    take: 3,
  })

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.titre,
    description: article.contenu.slice(0, 160),
    datePublished: article.createdAt.toISOString(),
    ...(article.imageUrl && { image: article.imageUrl }),
    author: {
      "@type": "Person",
      name: (article as { auteur?: string }).auteur || "Équipe éditoriale",
      jobTitle: (article as { auteurRole?: string }).auteurRole || "Équipe du Surnaturel de Dieu",
    },
    publisher: {
      "@type": "Organization",
      name: "Le Surnaturel de Dieu",
    },
  }

  return (
    <div className="bg-bg-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Navigation retour */}
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-1 font-body text-xs uppercase tracking-widest text-primary-brand hover:text-primary-dark"
        >
          <ArrowLeft size={12} />
          Retour au blog
        </Link>

        {/* Image en-tête */}
        <div className="relative mb-8 h-64 overflow-hidden bg-linear-to-br from-primary-light via-bg-page to-gold-light border border-border-brand sm:h-80 lg:h-96">
          {article.imageUrl ? (
            <Image src={article.imageUrl} alt={article.titre} fill className="object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="h-px w-16 bg-gold" />
              <span className="mt-4 font-display text-[28px] font-light italic text-primary-brand/30">
                {(article as { categorie?: string }).categorie || "Le Surnaturel de Dieu"}
              </span>
              <p className="mt-2 font-body text-xs uppercase tracking-[0.15em] text-gold/60">Blog bien-être</p>
              <div className="mt-4 h-px w-16 bg-gold" />
            </div>
          )}
        </div>

        {/* Date + Temps de lecture */}
        <div className="mb-4 flex items-center gap-3">
          <span className="flex items-center gap-1 font-body text-[12px] text-text-muted-brand">
            <Clock size={14} />
            {formatDate(article.createdAt)}
          </span>
          <span className="font-body text-[12px] text-text-muted-brand">
            {(article as { tempsLecture?: number }).tempsLecture || tempsLectureCalcule(article.contenu)} min de lecture
          </span>
          {(article as { categorie?: string }).categorie && (
            <span className="border border-border-brand px-2 py-0.5 font-body text-xs uppercase tracking-widest text-primary-brand">
              {(article as { categorie?: string }).categorie}
            </span>
          )}
        </div>

        {/* Titre */}
        <h1 className="font-display text-[32px] font-light leading-tight text-text-main md:text-[40px]">
          {article.titre}
        </h1>
        <div className="mt-4 h-px w-16 bg-gold" />

        {/* Auteur */}
        <div className="mt-5 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary-light font-display text-sm font-light text-primary-brand">
            {((article as { auteur?: string }).auteur || "É")[0]}
          </div>
          <div>
            <p className="font-body text-[13px] font-medium text-text-main">
              {(article as { auteur?: string }).auteur || "Équipe éditoriale"}
            </p>
            <p className="font-body text-[11px] text-text-muted-brand">
              {(article as { auteurRole?: string }).auteurRole || "Équipe du Surnaturel de Dieu"}
            </p>
          </div>
        </div>

        {/* Contenu — Markdown */}
        <div className="prose prose-lg mt-8 max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h2 className="mb-3 mt-8 font-display text-[24px] font-light text-text-main">{children}</h2>
              ),
              h2: ({ children }) => (
                <h3 className="mb-3 mt-6 font-display text-[20px] font-light text-text-main">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 font-body text-[15px] leading-relaxed text-text-mid">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-medium text-text-main">{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic text-primary-brand">{children}</em>
              ),
              ul: ({ children }) => (
                <ul className="mb-4 list-disc pl-6 font-body text-[15px] text-text-mid">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-4 list-decimal pl-6 font-body text-[15px] text-text-mid">{children}</ol>
              ),
              li: ({ children }) => <li className="mb-1">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="my-4 border-l-2 border-gold pl-4 italic text-text-mid">
                  {children}
                </blockquote>
              ),
            }}
          >
            {article.contenu}
          </ReactMarkdown>
        </div>

        {/* Disclaimer médical */}
        <div className="mt-8 border border-gold/20 bg-primary-light p-4">
          <p className="font-body text-[12px] leading-relaxed text-text-muted-brand">
            <strong className="text-text-mid">Information à caractère éducatif — </strong>
            Cet article est fourni à titre informatif uniquement. Il ne constitue pas un avis médical et ne remplace pas une consultation avec un professionnel de santé qualifié. Pour toute question médicale, consultez votre médecin ou{" "}
            <a href="/sage-femme" className="underline hover:text-primary-brand">notre sage-femme</a>.
          </p>
        </div>

        {/* Retour au blog */}
        <div className="mt-12 pt-8 border-t border-border-brand">
          <BtnSerif href="/blog">
            Retour au blog
          </BtnSerif>
        </div>

        {/* Articles similaires */}
        {similaires.length > 0 && (
          <section className="mt-16 border-t border-border-brand pt-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-8 bg-gold" />
              <h2 className="font-body text-xs uppercase tracking-[0.15em] text-gold">
                Articles similaires
              </h2>
              <div className="h-px w-8 bg-gold" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similaires.map((a) => (
                <Link
                  key={a.id}
                  href={`/blog/${a.slug}`}
                  className="group overflow-hidden border border-border-brand bg-white hover:border-gold transition-colors"
                >
                  <div className="relative h-32 bg-linear-to-br from-primary-light to-bg-page">
                    {a.imageUrl ? (
                      <Image src={a.imageUrl} alt={a.titre} fill className="object-cover" />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-[16px] leading-snug text-text-main group-hover:text-primary-brand transition-colors">
                      {a.titre}
                    </h3>
                    <div className="mt-2">
                      <BtnUnderline href={`/blog/${a.slug}`}>
                        Lire la suite
                      </BtnUnderline>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  )
}
