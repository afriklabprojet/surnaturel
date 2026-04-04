import Link from "next/link"
import { Metadata } from "next"
import { Clock } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { BtnUnderline } from "@/components/ui/buttons"
import { MotionSection, MotionStagger, MotionItem } from "@/components/ui/MotionWrapper"
import { fadeInUp } from "@/lib/animations"

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/!?\[.*?\]\(.*?\)/g, "")
    .replace(/\n+/g, " ")
    .trim()
}

export const metadata: Metadata = {
  title: "Blog Bien-être & Beauté | Le Surnaturel de Dieu — Abidjan",
  description:
    "Conseils santé, beauté, nutrition et bien-être par les experts du Surnaturel de Dieu. Articles sur les soins du corps, la maternité et la beauté naturelle.",
  alternates: { canonical: "/blog" },
}

async function getArticles(categorie?: string) {
  const where = categorie
    ? { publie: true, categorie }
    : { publie: true }
  const articles = await prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })
  return articles
}

async function getCategories(): Promise<string[]> {
  const rows = await prisma.article.findMany({
    where: { publie: true },
    select: { categorie: true },
    distinct: ["categorie"],
    orderBy: { categorie: "asc" },
  })
  return rows.map((r) => r.categorie).filter(Boolean) as string[]
}

export default async function PageBlog({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string }>
}) {
  const { categorie } = await searchParams
  const activeCategorie = categorie ?? "Tous"
  const [articles, dbCategories] = await Promise.all([
    getArticles(activeCategorie === "Tous" ? undefined : activeCategorie),
    getCategories(),
  ])
  const categories = ["Tous", ...dbCategories]

  return (
    <div className="bg-bg-page">
      {/* Hero */}
      <section className="bg-primary-brand px-4 py-16 sm:px-6 lg:px-8">
        <MotionSection variants={fadeInUp} trigger="animate" className="mx-auto max-w-4xl text-center">
          <span className="font-body text-xs uppercase tracking-[0.2em] text-gold">
            Conseils & Actualités
          </span>
          <h1 className="mt-4 font-display text-[44px] font-light text-white">
            Notre <em className="italic">blog</em>
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-body text-[14px] text-white/80">
            Conseils santé, beauté, nutrition et bien-être par les experts du Surnaturel de Dieu.
          </p>
          <div className="mx-auto mt-6 h-px w-16 bg-gold" />
        </MotionSection>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Filtres par catégorie */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={cat === "Tous" ? "/blog" : `/blog?categorie=${encodeURIComponent(cat)}`}
              className={`px-4 py-2 font-body text-xs uppercase tracking-widest transition-colors ${
                activeCategorie === cat
                  ? "bg-primary-brand text-white"
                  : "border border-border-brand text-text-mid hover:border-primary-brand hover:text-primary-brand"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Grid */}
        {articles.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-body text-[14px] text-text-muted-brand">Aucun article dans cette catégorie.</p>
          </div>
        ) : (
          <MotionStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <MotionItem
                key={article.id}
                className="group overflow-hidden border border-border-brand bg-white hover:border-gold transition-colors"
              >
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden bg-linear-to-br from-primary-light via-bg-page to-gold-light">
                  {article.imageUrl ? (
                    <img src={article.imageUrl} alt={article.titre} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center">
                      <div className="h-px w-10 bg-gold" />
                      <span className="mt-3 font-display text-[20px] font-light italic text-primary-brand/40">
                        {(article as { categorie?: string }).categorie || "Bien-être"}
                      </span>
                      <div className="mt-3 h-px w-10 bg-gold" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  {/* Date + Temps de lecture */}
                  <div className="mb-2 flex items-center gap-3">
                    <span className="flex items-center gap-1 font-body text-xs text-text-muted-brand">
                      <Clock size={10} />
                      {formatDate(article.createdAt)}
                    </span>
                    {(article as { tempsLecture?: number }).tempsLecture && (
                      <span className="font-body text-xs text-text-muted-brand">
                        {(article as { tempsLecture?: number }).tempsLecture} min de lecture
                      </span>
                    )}
                  </div>

                  {/* Catégorie */}
                  {(article as { categorie?: string }).categorie && (
                    <span className="mb-2 inline-block border border-border-brand px-2 py-0.5 font-body text-xs uppercase tracking-widest text-primary-brand">
                      {(article as { categorie?: string }).categorie}
                    </span>
                  )}

                  {/* Titre */}
                  <h2 className="font-display text-[18px] leading-snug text-text-main group-hover:text-primary-brand transition-colors">
                    {article.titre}
                  </h2>

                  {/* Extrait */}
                  <p className="mt-2 font-body text-[13px] leading-relaxed text-text-mid">
                    {stripMarkdown(article.contenu).slice(0, 150)}
                    {stripMarkdown(article.contenu).length > 150 ? "…" : ""}
                  </p>

                  {/* Auteur */}
                  <div className="mt-3 flex items-center gap-2 border-t border-border-brand pt-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary-light font-display text-[10px] text-primary-brand">
                      {((article as { auteur?: string }).auteur || "É")[0]}
                    </div>
                    <p className="font-body text-[11px] text-text-muted-brand">
                      {(article as { auteur?: string }).auteur || "Équipe éditoriale"}
                    </p>
                  </div>

                  {/* Lire la suite */}
                  <div className="mt-4">
                    <BtnUnderline href={`/blog/${article.slug}`}>
                      Lire la suite
                    </BtnUnderline>
                  </div>
                </div>
              </MotionItem>
            ))}
          </MotionStagger>
        )}
      </section>
    </div>
  )
}
