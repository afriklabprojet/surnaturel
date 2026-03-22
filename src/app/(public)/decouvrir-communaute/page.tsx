import { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Users, CalendarDays, MessageCircle, Sparkles, ArrowRight, Heart, UserPlus } from "lucide-react"

export const metadata: Metadata = {
  title: "Communauté",
  description: "Rejoignez la communauté du Surnaturel de Dieu — partagez vos expériences, découvrez des événements bien-être et échangez avec d'autres femmes d'Abidjan.",
}

async function getStats() {
  try {
    const [membres, groupes, evenements, posts] = await Promise.all([
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.groupe.count(),
      prisma.evenement.count({ where: { dateDebut: { gte: new Date() } } }),
      prisma.post.count(),
    ])
    return { membres, groupes, evenements, posts }
  } catch {
    return { membres: 0, groupes: 0, evenements: 0, posts: 0 }
  }
}

async function getRecentPosts() {
  try {
    return await prisma.post.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        contenu: true,
        createdAt: true,
        auteur: { select: { prenom: true, nom: true } },
        _count: { select: { commentaires: true, reactions: true } },
      },
    })
  } catch {
    return []
  }
}

async function getUpcomingEvents() {
  try {
    return await prisma.evenement.findMany({
      where: { dateDebut: { gte: new Date() } },
      take: 3,
      orderBy: { dateDebut: "asc" },
      select: { id: true, titre: true, dateDebut: true, lieu: true },
    })
  } catch {
    return []
  }
}

export default async function CommunautePage() {
  const [stats, posts, events] = await Promise.all([getStats(), getRecentPosts(), getUpcomingEvents()])

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Hero */}
      <section className="bg-primary-brand px-6 py-20 text-center lg:px-10">
        <p className="font-body text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
          Notre communauté
        </p>
        <h1 className="mt-3 font-display text-[36px] font-light leading-tight text-white md:text-[48px]">
          Un espace d&apos;échanges<br />et de sororité
        </h1>
        <p className="mx-auto mt-4 max-w-lg font-body text-[15px] font-light leading-relaxed text-white/75">
          Partagez vos expériences bien-être, découvrez des conseils et 
          rejoignez une communauté bienveillante de femmes à Abidjan.
        </p>
        <Link
          href="/inscription"
          className="mt-8 inline-flex items-center gap-2 bg-gold px-8 py-3 font-body text-[12px] uppercase tracking-[0.15em] text-white transition-colors hover:bg-gold-dark"
        >
          <UserPlus size={16} />
          Rejoindre la communauté
        </Link>
      </section>

      {/* Stats */}
      <section className="-mt-8 px-6 lg:px-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: Users, value: stats.membres, label: "Membres" },
            { icon: MessageCircle, value: stats.posts, label: "Publications" },
            { icon: Sparkles, value: stats.groupes, label: "Groupes" },
            { icon: CalendarDays, value: stats.evenements, label: "Événements à venir" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="border border-border-brand bg-white p-5 text-center">
              <Icon size={20} className="mx-auto mb-2 text-gold" />
              <p className="font-display text-[28px] font-light text-text-main">{value}</p>
              <p className="font-body text-[11px] text-text-muted-brand">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent posts */}
      {posts.length > 0 && (
        <section className="px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-[28px] font-light text-text-main">
              Dernières publications
            </h2>
            <div className="mt-8 space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="border border-border-brand bg-white p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-body text-[13px] font-medium text-text-main">
                      {post.auteur.prenom} {post.auteur.nom?.charAt(0)}.
                    </span>
                    <span className="font-body text-[11px] text-text-muted-brand">
                      {new Date(post.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="font-body text-[14px] font-light text-text-mid line-clamp-2">
                    {post.contenu}
                  </p>
                  <div className="mt-3 flex items-center gap-4 font-body text-[11px] text-text-muted-brand">
                    <span className="flex items-center gap-1"><Heart size={12} /> {post._count.reactions}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={12} /> {post._count.commentaires}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming events */}
      {events.length > 0 && (
        <section className="bg-white px-6 py-16 lg:px-10">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-display text-[28px] font-light text-text-main">
              Prochains événements
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {events.map((ev) => (
                <div key={ev.id} className="border border-border-brand border-t-2 border-t-gold p-5">
                  <p className="font-body text-[10px] font-medium uppercase tracking-[0.15em] text-gold">
                    {new Date(ev.dateDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <h3 className="mt-2 font-display text-[18px] text-text-main">{ev.titre}</h3>
                  {ev.lieu && (
                    <p className="mt-1 font-body text-[12px] text-text-muted-brand">{ev.lieu}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="px-6 py-16 text-center lg:px-10">
        <h2 className="font-display text-[28px] font-light text-text-main">
          Prête à nous rejoindre ?
        </h2>
        <p className="mx-auto mt-3 max-w-md font-body text-[14px] font-light text-text-mid">
          Créez votre compte gratuitement et accédez à la communauté, aux groupes et aux événements.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/inscription"
            className="flex items-center gap-2 bg-primary-brand px-8 py-3 font-body text-[12px] uppercase tracking-[0.15em] text-white transition-colors hover:bg-primary-dark"
          >
            Créer mon compte
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/connexion"
            className="flex items-center gap-2 border border-primary-brand px-8 py-3 font-body text-[12px] uppercase tracking-[0.15em] text-primary-brand transition-colors hover:bg-primary-light"
          >
            Se connecter
          </Link>
        </div>
      </section>
    </div>
  )
}
