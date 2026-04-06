"use client"

import { useEffect, useState } from "react"
import { Save, Home, Users, Stethoscope, FileText, ShieldCheck, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = "accueil" | "apropos" | "sagefemme" | "mentions" | "confidentialite"

interface Section { titre: string; contenu: string }

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "accueil", label: "Page d'accueil", icon: Home },
  { key: "apropos", label: "Page À propos", icon: Users },
  { key: "sagefemme", label: "Page Sage-femme", icon: Stethoscope },
  { key: "mentions", label: "Mentions légales", icon: FileText },
  { key: "confidentialite", label: "Confidentialité", icon: ShieldCheck },
]

interface ContentForm {
  // Hero
  heroTag: string
  heroTitre: string
  heroSousTitre: string
  heroCta1: string
  heroCta2: string
  heroBadge: string
  // Services section
  servicesTag: string
  servicesTitre: string
  servicesSousTitre: string
  // Chiffres labels
  chiffresLabel1: string
  chiffresLabel2: string
  chiffresLabel3: string
  chiffresAnneeDebut: string
  // Témoignages
  temoignagesTag: string
  temoignagesTitre: string
  // Vidéos
  videosTag: string
  videosTitre: string
  videosSousTitre: string
  // CTA
  ctaTitre: string
  ctaSousTitre: string
  ctaBouton: string
  // Fondatrice
  fondatriceNom: string
  fondatriceTag: string
  fondatricePara1: string
  fondatricePara2: string
  fondatricePara3: string
  // À propos — valeurs (4 cartes)
  valeur1Icon: string
  valeur1Titre: string
  valeur1Description: string
  valeur2Icon: string
  valeur2Titre: string
  valeur2Description: string
  valeur3Icon: string
  valeur3Titre: string
  valeur3Description: string
  valeur4Icon: string
  valeur4Titre: string
  valeur4Description: string
  // Sage-femme — bio
  sageFemmeNom: string
  sageFemmeTitre: string
  sageFemmePara1: string
  sageFemmePara2: string
}

const DEFAULTS: ContentForm = {
  heroTag: "Institut de bien-être",
  heroTitre: "Votre bien-être est notre vocation",
  heroSousTitre: "Depuis 2015, Marie Jeanne accueille les femmes d'Abidjan dans un espace de sérénité unique, dédié à la beauté naturelle et au bien-être holistique.",
  heroCta1: "Découvrir nos soins",
  heroCta2: "Prendre rendez-vous",
  heroBadge: "Depuis 2015 à Abidjan",
  servicesTag: "Nos soins",
  servicesTitre: "Soins & Services",
  servicesSousTitre: "Des soins sur mesure pour votre beauté, votre santé et votre sérénité",
  chiffresLabel1: "Clientes satisfaites",
  chiffresLabel2: "Soins disponibles",
  chiffresLabel3: "D'expérience",
  chiffresAnneeDebut: "2015",
  temoignagesTag: "Témoignages",
  temoignagesTitre: "Ce que disent nos clientes",
  videosTag: "Témoignages vidéo",
  videosTitre: "Elles partagent leur expérience",
  videosSousTitre: "Découvrez les témoignages authentiques de nos clientes satisfaites",
  ctaTitre: "Prête à prendre soin de vous ?",
  ctaSousTitre: "Réservez votre créneau en quelques clics et offrez-vous un moment de bien-être sur mesure.",
  ctaBouton: "Réserver maintenant",
  fondatriceNom: "Marie Jeanne",
  fondatriceTag: "Fondatrice",
  fondatricePara1: "C'est en 2015 que Marie Jeanne a donné vie au Surnaturel de Dieu, au cœur d'Abidjan. Formée entre la France et la Côte d'Ivoire, elle a acquis une double expertise en esthétique et en bien-être holistique, qu'elle met aujourd'hui au service des femmes ivoiriennes.",
  fondatricePara2: "Sa conviction : chaque femme mérite un espace où elle peut se ressourcer, prendre soin de sa santé et révéler sa beauté naturelle, dans un cadre bienveillant et professionnel.",
  fondatricePara3: "Entourée d'une équipe de professionnelles passionnées, Marie Jeanne continue de faire évoluer l'institut pour offrir des soins d'exception accessibles à toutes les femmes d'Abidjan.",  valeur1Icon: "Heart",
  valeur1Titre: "Bienveillance",
  valeur1Description: "Chaque cliente est accueillie avec chaleur, respect et sans jugement.",
  valeur2Icon: "Shield",
  valeur2Titre: "Confidentialité",
  valeur2Description: "Vos données personnelles et médicales restent strictement privées.",
  valeur3Icon: "Award",
  valeur3Titre: "Excellence",
  valeur3Description: "Nos praticiens sont formés et sélectionnés pour leur savoir-faire.",
  valeur4Icon: "Leaf",
  valeur4Titre: "Naturalité",
  valeur4Description: "Nous privilégions des ingrédients naturels adaptés à la peau africaine.",
  sageFemmeNom: "Ama Kouassi",
  sageFemmeTitre: "Sage-femme diplômée d'État",
  sageFemmePara1: "",
  sageFemmePara2: "",}

const MENTIONS_DEFAULTS: Section[] = [
  { titre: "Éditeur du site", contenu: "{{nomCentre}} — Institut de Bien-Être\nFondatrice : {{fondatrice}}\nAdresse : {{adresse}}\nTéléphone : {{telephone}}\nEmail : {{email}}" },
  { titre: "Hébergement", contenu: "Le site est hébergé par **Hostinger International Ltd.**\n61 Lordou Vironos str., 6023 Larnaca, Chypre\nSite web : hostinger.fr" },
  { titre: "Propriété intellectuelle", contenu: "L'ensemble des contenus présents sur le site (textes, images, logos, graphismes) sont la propriété exclusive de Le Surnaturel de Dieu, sauf mention contraire. Toute reproduction, représentation ou diffusion, en tout ou partie, du contenu de ce site sans l'autorisation expresse de l'éditeur est interdite et constituerait une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle." },
  { titre: "Données personnelles", contenu: "Les informations recueillies via les formulaires du site sont nécessaires au traitement de vos demandes. Conformément à la loi ivoirienne n°2013-450 relative à la protection des données à caractère personnel, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ce droit, contactez-nous à : {{email}}." },
  { titre: "Cookies", contenu: "Le site utilise des cookies techniques nécessaires à son bon fonctionnement (session d'authentification, préférences de thème). Aucun cookie publicitaire ou de suivi tiers n'est utilisé sans votre consentement." },
  { titre: "Limitation de responsabilité", contenu: "L'éditeur s'efforce de fournir des informations aussi précises que possible. Toutefois, il ne pourra être tenu responsable des omissions, des inexactitudes ou des carences dans la mise à jour. L'éditeur ne pourra être tenu responsable des dommages directs ou indirects résultant de l'accès ou de l'utilisation du site." },
]

const CONFID_DEFAULTS: Section[] = [
  { titre: "1. Responsable du traitement", contenu: "Le responsable du traitement de vos données personnelles est **Le Surnaturel de Dieu**, institut de bien-être situé à {{adresse}}, représenté par {{fondatrice}}." },
  { titre: "2. Données collectées", contenu: "Nous collectons les données suivantes :\n- **Inscription** : nom, prénom, adresse email, mot de passe (chiffré)\n- **Prise de rendez-vous** : soin choisi, date et heure, notes optionnelles\n- **Commandes** : produits, adresse de livraison, méthode de paiement\n- **Suivi médical** : données de santé (chiffrées AES-256), consultations, mesures\n- **Navigation** : cookies de session, préférences de thème" },
  { titre: "3. Finalités du traitement", contenu: "- Gestion de votre compte et de vos rendez-vous\n- Traitement de vos commandes et paiements\n- Suivi médical personnalisé (avec votre consentement explicite)\n- Envoi de confirmations et rappels par email\n- Programme de fidélité et parrainage\n- Amélioration de nos services et analyse de fréquentation" },
  { titre: "4. Base légale", contenu: "Le traitement de vos données repose sur : votre consentement (inscription, suivi médical), l'exécution d'un contrat (commandes, rendez-vous) et notre intérêt légitime (amélioration du service, sécurité)." },
  { titre: "5. Sécurité des données", contenu: "- Mots de passe chiffrés avec bcrypt\n- Données médicales chiffrées AES-256 avec audit de chaque accès\n- Communications HTTPS obligatoires (HSTS)\n- Accès restreint par rôle (client, accompagnateur médical, administrateur)\n- Protection contre les attaques par limitation du débit (rate limiting)" },
  { titre: "6. Partage des données", contenu: "Vos données ne sont jamais vendues. Elles peuvent être partagées avec :\n- **Jeko Africa** : traitement des paiements Mobile Money\n- **Resend** : envoi des emails transactionnels\n- **Hostinger** : hébergement du site\n- **Neon** : hébergement de la base de données" },
  { titre: "7. Durée de conservation", contenu: "Vos données sont conservées pendant la durée de votre utilisation du service. À la suppression de votre compte, vos données personnelles sont effacées sous 30 jours, à l'exception des données comptables conservées conformément aux obligations légales (10 ans)." },
  { titre: "8. Vos droits", contenu: "Conformément à la loi ivoirienne n°2013-450, vous disposez des droits suivants :\n- Droit d'accès à vos données personnelles\n- Droit de rectification des données inexactes\n- Droit de suppression de vos données\n- Droit d'opposition au traitement\n- Droit à la portabilité de vos données\n\nPour exercer ces droits, contactez-nous à : {{email}}" },
  { titre: "9. Contact", contenu: "Pour toute question relative à cette politique, vous pouvez nous contacter :\nEmail : {{email}}\nTéléphone : {{telephone}}\nAdresse : {{adresse}}" },
]

export default function AdminContenuPage() {
  const [activeTab, setActiveTab] = useState<Tab>("accueil")
  const [form, setForm] = useState<ContentForm>(DEFAULTS)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [mentionsSections, setMentionsSections] = useState<Section[]>(MENTIONS_DEFAULTS)
  const [confidSections, setConfidSections] = useState<Section[]>(CONFID_DEFAULTS)

  useEffect(() => {
    fetchContent()
  }, [])

  async function fetchContent() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/contenu")
      if (res.ok) {
        const data = await res.json()
        setForm({
          heroTag: data.heroTag || DEFAULTS.heroTag,
          heroTitre: data.heroTitre || DEFAULTS.heroTitre,
          heroSousTitre: data.heroSousTitre || DEFAULTS.heroSousTitre,
          heroCta1: data.heroCta1 || DEFAULTS.heroCta1,
          heroCta2: data.heroCta2 || DEFAULTS.heroCta2,
          heroBadge: data.heroBadge || DEFAULTS.heroBadge,
          servicesTag: data.servicesTag || DEFAULTS.servicesTag,
          servicesTitre: data.servicesTitre || DEFAULTS.servicesTitre,
          servicesSousTitre: data.servicesSousTitre || DEFAULTS.servicesSousTitre,
          chiffresLabel1: data.chiffresLabel1 || DEFAULTS.chiffresLabel1,
          chiffresLabel2: data.chiffresLabel2 || DEFAULTS.chiffresLabel2,
          chiffresLabel3: data.chiffresLabel3 || DEFAULTS.chiffresLabel3,
          chiffresAnneeDebut: data.chiffresAnneeDebut || DEFAULTS.chiffresAnneeDebut,
          temoignagesTag: data.temoignagesTag || DEFAULTS.temoignagesTag,
          temoignagesTitre: data.temoignagesTitre || DEFAULTS.temoignagesTitre,
          videosTag: data.videosTag || DEFAULTS.videosTag,
          videosTitre: data.videosTitre || DEFAULTS.videosTitre,
          videosSousTitre: data.videosSousTitre || DEFAULTS.videosSousTitre,
          ctaTitre: data.ctaTitre || DEFAULTS.ctaTitre,
          ctaSousTitre: data.ctaSousTitre || DEFAULTS.ctaSousTitre,
          ctaBouton: data.ctaBouton || DEFAULTS.ctaBouton,
          fondatriceNom: data.fondatriceNom || DEFAULTS.fondatriceNom,
          fondatriceTag: data.fondatriceTag || DEFAULTS.fondatriceTag,
          fondatricePara1: data.fondatricePara1 || DEFAULTS.fondatricePara1,
          fondatricePara2: data.fondatricePara2 || DEFAULTS.fondatricePara2,
          fondatricePara3: data.fondatricePara3 || DEFAULTS.fondatricePara3,
          valeur1Icon: data.valeur1Icon || DEFAULTS.valeur1Icon,
          valeur1Titre: data.valeur1Titre || DEFAULTS.valeur1Titre,
          valeur1Description: data.valeur1Description || DEFAULTS.valeur1Description,
          valeur2Icon: data.valeur2Icon || DEFAULTS.valeur2Icon,
          valeur2Titre: data.valeur2Titre || DEFAULTS.valeur2Titre,
          valeur2Description: data.valeur2Description || DEFAULTS.valeur2Description,
          valeur3Icon: data.valeur3Icon || DEFAULTS.valeur3Icon,
          valeur3Titre: data.valeur3Titre || DEFAULTS.valeur3Titre,
          valeur3Description: data.valeur3Description || DEFAULTS.valeur3Description,
          valeur4Icon: data.valeur4Icon || DEFAULTS.valeur4Icon,
          valeur4Titre: data.valeur4Titre || DEFAULTS.valeur4Titre,
          valeur4Description: data.valeur4Description || DEFAULTS.valeur4Description,
          sageFemmeNom: data.sageFemmeNom || DEFAULTS.sageFemmeNom,
          sageFemmeTitre: data.sageFemmeTitre || DEFAULTS.sageFemmeTitre,
          sageFemmePara1: data.sageFemmePara1 || DEFAULTS.sageFemmePara1,
          sageFemmePara2: data.sageFemmePara2 || DEFAULTS.sageFemmePara2,
        })
        if (Array.isArray(data.mentionsLegales) && data.mentionsLegales.length > 0) {
          setMentionsSections(data.mentionsLegales)
        }
        if (Array.isArray(data.politiqueConfidentialite) && data.politiqueConfidentialite.length > 0) {
          setConfidSections(data.politiqueConfidentialite)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  function set(field: keyof ContentForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch("/api/admin/contenu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          mentionsLegales: mentionsSections,
          politiqueConfidentialite: confidSections,
        }),
      })
      setMessage(res.ok ? "Contenu enregistré ✓" : "Erreur lors de l'enregistrement")
    } catch {
      setMessage("Erreur lors de l'enregistrement")
    }
    setSaving(false)
  }

  const inputCls = "w-full border border-border-brand px-3 py-2 text-sm font-body focus:outline-none focus:border-primary-brand"
  const labelCls = "block text-xs uppercase tracking-widest text-gray-500 font-body mb-1"
  const areaCls = `${inputCls} resize-none`
  const legendCls = "px-2 font-body text-xs uppercase tracking-widest text-gold"
  const fieldsetCls = "border border-border-brand p-4 space-y-4"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-light text-text-main">Contenu du site</h2>
        <p className="font-body text-sm text-text-muted-brand mt-1">
          Modifiez tous les textes publics du site depuis cet espace.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-brand">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-body border-b-2 -mb-px transition-colors",
              activeTab === key
                ? "border-primary-brand text-primary-brand"
                : "border-transparent text-gray-500 hover:text-text-main"
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="h-5 w-5 border-2 border-primary-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
          {message && <p className="text-sm font-body text-primary-brand">{message}</p>}

          {/* ── ACCUEIL ─────────────────────────────────────────── */}
          {activeTab === "accueil" && (
            <div className="space-y-6">
              {/* Hero */}
              <fieldset className={fieldsetCls}>
                <legend className={legendCls}>Section Hero (bandeau principal)</legend>
                <div>
                  <label className={labelCls}>Tag / étiquette au-dessus du titre</label>
                  <input value={form.heroTag} onChange={(e) => set("heroTag", e.target.value)} className={inputCls} placeholder={DEFAULTS.heroTag} />
                </div>
                <div>
                  <label className={labelCls}>Titre principal</label>
                  <input value={form.heroTitre} onChange={(e) => set("heroTitre", e.target.value)} className={inputCls} placeholder={DEFAULTS.heroTitre} />
                </div>
                <div>
                  <label className={labelCls}>Sous-titre / description</label>
                  <textarea rows={3} value={form.heroSousTitre} onChange={(e) => set("heroSousTitre", e.target.value)} className={areaCls} placeholder={DEFAULTS.heroSousTitre} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Bouton principal (soins)</label>
                    <input value={form.heroCta1} onChange={(e) => set("heroCta1", e.target.value)} className={inputCls} placeholder={DEFAULTS.heroCta1} />
                  </div>
                  <div>
                    <label className={labelCls}>Bouton secondaire (RDV)</label>
                    <input value={form.heroCta2} onChange={(e) => set("heroCta2", e.target.value)} className={inputCls} placeholder={DEFAULTS.heroCta2} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Badge sur la photo</label>
                  <input value={form.heroBadge} onChange={(e) => set("heroBadge", e.target.value)} className={inputCls} placeholder={DEFAULTS.heroBadge} />
                </div>
              </fieldset>

              {/* Services */}
              <fieldset className={fieldsetCls}>
                <legend className={legendCls}>Section Soins & Services</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Tag</label>
                    <input value={form.servicesTag} onChange={(e) => set("servicesTag", e.target.value)} className={inputCls} placeholder={DEFAULTS.servicesTag} />
                  </div>
                  <div>
                    <label className={labelCls}>Titre</label>
                    <input value={form.servicesTitre} onChange={(e) => set("servicesTitre", e.target.value)} className={inputCls} placeholder={DEFAULTS.servicesTitre} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Sous-titre</label>
                  <input value={form.servicesSousTitre} onChange={(e) => set("servicesSousTitre", e.target.value)} className={inputCls} placeholder={DEFAULTS.servicesSousTitre} />
                </div>
              </fieldset>

              {/* Chiffres */}
              <fieldset className={fieldsetCls}>
                <legend className={legendCls}>Section Chiffres clés (libellés des statistiques)</legend>
                <p className="font-body text-xs text-text-muted-brand">Clientes satisfaites et Soins disponibles sont calculés automatiquement. Seule l&apos;année de fondation est modifiable.</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Libellé stat 1 (clientes)</label>
                    <input value={form.chiffresLabel1} onChange={(e) => set("chiffresLabel1", e.target.value)} className={inputCls} placeholder={DEFAULTS.chiffresLabel1} />
                  </div>
                  <div>
                    <label className={labelCls}>Libellé stat 2 (soins)</label>
                    <input value={form.chiffresLabel2} onChange={(e) => set("chiffresLabel2", e.target.value)} className={inputCls} placeholder={DEFAULTS.chiffresLabel2} />
                  </div>
                  <div>
                    <label className={labelCls}>Libellé stat 3 (expérience)</label>
                    <input value={form.chiffresLabel3} onChange={(e) => set("chiffresLabel3", e.target.value)} className={inputCls} placeholder={DEFAULTS.chiffresLabel3} />
                  </div>
                </div>
                <div className="mt-4 max-w-xs">
                  <label className={labelCls}>Année de fondation (pour le calcul des années d&apos;expérience)</label>
                  <input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={form.chiffresAnneeDebut}
                    onChange={(e) => set("chiffresAnneeDebut", e.target.value)}
                    className={inputCls}
                    placeholder="2015"
                  />
                  <p className="mt-1 font-body text-xs text-text-muted-brand">
                    Actuellement : {new Date().getFullYear()} − {form.chiffresAnneeDebut || "2015"} = <strong>{new Date().getFullYear() - parseInt(form.chiffresAnneeDebut || "2015", 10)} ans</strong>
                  </p>
                </div>
              </fieldset>

              {/* Témoignages */}
              <fieldset className={fieldsetCls}>
                <legend className={legendCls}>Section Témoignages</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Tag</label>
                    <input value={form.temoignagesTag} onChange={(e) => set("temoignagesTag", e.target.value)} className={inputCls} placeholder={DEFAULTS.temoignagesTag} />
                  </div>
                  <div>
                    <label className={labelCls}>Titre</label>
                    <input value={form.temoignagesTitre} onChange={(e) => set("temoignagesTitre", e.target.value)} className={inputCls} placeholder={DEFAULTS.temoignagesTitre} />
                  </div>
                </div>
              </fieldset>

              {/* Vidéos */}
              <fieldset className={fieldsetCls}>
                <legend className={legendCls}>Section Témoignages vidéo</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Tag</label>
                    <input value={form.videosTag} onChange={(e) => set("videosTag", e.target.value)} className={inputCls} placeholder={DEFAULTS.videosTag} />
                  </div>
                  <div>
                    <label className={labelCls}>Titre</label>
                    <input value={form.videosTitre} onChange={(e) => set("videosTitre", e.target.value)} className={inputCls} placeholder={DEFAULTS.videosTitre} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Sous-titre</label>
                  <input value={form.videosSousTitre} onChange={(e) => set("videosSousTitre", e.target.value)} className={inputCls} placeholder={DEFAULTS.videosSousTitre} />
                </div>
              </fieldset>

              {/* CTA */}
              <fieldset className={fieldsetCls}>
                <legend className={legendCls}>Section CTA (appel à l&apos;action finale)</legend>
                <div>
                  <label className={labelCls}>Titre</label>
                  <input value={form.ctaTitre} onChange={(e) => set("ctaTitre", e.target.value)} className={inputCls} placeholder={DEFAULTS.ctaTitre} />
                </div>
                <div>
                  <label className={labelCls}>Sous-titre</label>
                  <textarea rows={2} value={form.ctaSousTitre} onChange={(e) => set("ctaSousTitre", e.target.value)} className={areaCls} placeholder={DEFAULTS.ctaSousTitre} />
                </div>
                <div>
                  <label className={labelCls}>Texte du bouton</label>
                  <input value={form.ctaBouton} onChange={(e) => set("ctaBouton", e.target.value)} className={inputCls} placeholder={DEFAULTS.ctaBouton} />
                </div>
              </fieldset>
            </div>
          )}

          {/* ── À PROPOS ─────────────────────────────────────────── */}
          {activeTab === "apropos" && (
            <div className="space-y-6">
              <fieldset className={fieldsetCls}>
                <legend className={legendCls}>Présentation de la fondatrice</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Nom de la fondatrice</label>
                    <input value={form.fondatriceNom} onChange={(e) => set("fondatriceNom", e.target.value)} className={inputCls} placeholder={DEFAULTS.fondatriceNom} />
                  </div>
                  <div>
                    <label className={labelCls}>Étiquette (ex: Fondatrice)</label>
                    <input value={form.fondatriceTag} onChange={(e) => set("fondatriceTag", e.target.value)} className={inputCls} placeholder={DEFAULTS.fondatriceTag} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Paragraphe 1</label>
                  <textarea rows={4} value={form.fondatricePara1} onChange={(e) => set("fondatricePara1", e.target.value)} className={areaCls} placeholder="1er paragraphe de biographie…" />
                </div>
                <div>
                  <label className={labelCls}>Paragraphe 2</label>
                  <textarea rows={4} value={form.fondatricePara2} onChange={(e) => set("fondatricePara2", e.target.value)} className={areaCls} placeholder="2e paragraphe…" />
                </div>
                <div>
                  <label className={labelCls}>Paragraphe 3 (optionnel)</label>
                  <textarea rows={4} value={form.fondatricePara3} onChange={(e) => set("fondatricePara3", e.target.value)} className={areaCls} placeholder="3e paragraphe (optionnel)…" />
                </div>
                <p className="font-body text-xs text-text-muted-brand">
                  La photo de la fondatrice est dans <code>/public/images/fondatrice.jpg</code> — remplacez ce fichier pour changer l&apos;image.
                </p>
              </fieldset>

              {/* Valeurs */}
              <fieldset className={fieldsetCls}>
                <legend className={legendCls}>Nos valeurs (4 cartes — page À propos)</legend>
                {[
                  { n: "1", ik: "valeur1Icon", tk: "valeur1Titre", dk: "valeur1Description" },
                  { n: "2", ik: "valeur2Icon", tk: "valeur2Titre", dk: "valeur2Description" },
                  { n: "3", ik: "valeur3Icon", tk: "valeur3Titre", dk: "valeur3Description" },
                  { n: "4", ik: "valeur4Icon", tk: "valeur4Titre", dk: "valeur4Description" },
                ].map(({ n, ik, tk, dk }) => (
                  <div key={n} className="border border-border-brand p-3 space-y-3">
                    <p className="font-body text-xs uppercase tracking-widest text-text-muted-brand">Valeur {n}</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Icône</label>
                        <select
                          value={form[ik as keyof ContentForm]}
                          onChange={(e) => set(ik as keyof ContentForm, e.target.value)}
                          className={inputCls}
                        >
                          {["Flame","Sparkles","Zap","Smile","Baby","Wand2","Heart","Leaf","Stethoscope","Shield","Award","Clock","Users","Star","Lock"].map(ic => (
                            <option key={ic} value={ic}>{ic}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Titre</label>
                        <input
                          value={form[tk as keyof ContentForm]}
                          onChange={(e) => set(tk as keyof ContentForm, e.target.value)}
                          className={inputCls}
                          placeholder={DEFAULTS[tk as keyof ContentForm] as string}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Description</label>
                      <textarea
                        rows={2}
                        value={form[dk as keyof ContentForm]}
                        onChange={(e) => set(dk as keyof ContentForm, e.target.value)}
                        className={areaCls}
                        placeholder={DEFAULTS[dk as keyof ContentForm] as string}
                      />
                    </div>
                  </div>
                ))}
              </fieldset>
            </div>
          )}

          {/* ── SAGE-FEMME ─────────────────────────────────────────────── */}
          {activeTab === "sagefemme" && (
            <div className="space-y-6">
              <fieldset className={fieldsetCls}>
                <legend className={legendCls}>Biographie de la sage-femme</legend>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Nom</label>
                    <input value={form.sageFemmeNom} onChange={(e) => set("sageFemmeNom", e.target.value)} className={inputCls} placeholder={DEFAULTS.sageFemmeNom} />
                  </div>
                  <div>
                    <label className={labelCls}>Titre / spécialité</label>
                    <input value={form.sageFemmeTitre} onChange={(e) => set("sageFemmeTitre", e.target.value)} className={inputCls} placeholder={DEFAULTS.sageFemmeTitre} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Paragraphe 1 — présentation</label>
                  <textarea rows={4} value={form.sageFemmePara1} onChange={(e) => set("sageFemmePara1", e.target.value)} className={areaCls} placeholder="Présentation professionnelle…" />
                </div>
                <div>
                  <label className={labelCls}>Paragraphe 2 (optionnel)</label>
                  <textarea rows={4} value={form.sageFemmePara2} onChange={(e) => set("sageFemmePara2", e.target.value)} className={areaCls} placeholder="Informations complémentaires…" />
                </div>
                <p className="font-body text-xs text-text-muted-brand">
                  Les spécialités et prestations sont gérées depuis le menu Configuration.
                </p>
              </fieldset>
            </div>
          )}

          {/* ── MENTIONS LÉGALES ─────────────────────────────────── */}
          {activeTab === "mentions" && (
            <div className="space-y-6">
              <p className="font-body text-xs text-text-muted-brand">
                Variables disponibles : <code>{"{{nomCentre}}"}</code>, <code>{"{{fondatrice}}"}</code>, <code>{"{{adresse}}"}</code>, <code>{"{{telephone}}"}</code>, <code>{"{{email}}"}</code> — elles seront remplacées automatiquement.
                <br />Préfixez une ligne par <code>- </code> pour créer une liste à puces. Entourez du texte de <code>**</code> pour le mettre en gras.
              </p>
              {mentionsSections.map((section, i) => (
                <fieldset key={i} className={fieldsetCls}>
                  <legend className={legendCls}>Section {i + 1}</legend>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className={labelCls}>Titre de la section</label>
                      <input
                        value={section.titre}
                        onChange={(e) => {
                          const updated = [...mentionsSections]
                          updated[i] = { ...updated[i], titre: e.target.value }
                          setMentionsSections(updated)
                        }}
                        className={inputCls}
                      />
                    </div>
                    {mentionsSections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setMentionsSections(mentionsSections.filter((_, j) => j !== i))}
                        className="p-2 text-red-500 hover:bg-red-50 transition-colors"
                        title="Supprimer cette section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Contenu</label>
                    <textarea
                      rows={5}
                      value={section.contenu}
                      onChange={(e) => {
                        const updated = [...mentionsSections]
                        updated[i] = { ...updated[i], contenu: e.target.value }
                        setMentionsSections(updated)
                      }}
                      className={areaCls}
                    />
                  </div>
                </fieldset>
              ))}
              <button
                type="button"
                onClick={() => setMentionsSections([...mentionsSections, { titre: "", contenu: "" }])}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-border-brand text-sm font-body text-text-muted-brand hover:border-primary-brand hover:text-primary-brand transition-colors"
              >
                <Plus className="h-4 w-4" /> Ajouter une section
              </button>
            </div>
          )}

          {/* ── POLITIQUE DE CONFIDENTIALITÉ ────────────────────── */}
          {activeTab === "confidentialite" && (
            <div className="space-y-6">
              <p className="font-body text-xs text-text-muted-brand">
                Variables disponibles : <code>{"{{nomCentre}}"}</code>, <code>{"{{fondatrice}}"}</code>, <code>{"{{adresse}}"}</code>, <code>{"{{telephone}}"}</code>, <code>{"{{email}}"}</code> — elles seront remplacées automatiquement.
                <br />Préfixez une ligne par <code>- </code> pour créer une liste à puces. Entourez du texte de <code>**</code> pour le mettre en gras.
              </p>
              {confidSections.map((section, i) => (
                <fieldset key={i} className={fieldsetCls}>
                  <legend className={legendCls}>Section {i + 1}</legend>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className={labelCls}>Titre de la section</label>
                      <input
                        value={section.titre}
                        onChange={(e) => {
                          const updated = [...confidSections]
                          updated[i] = { ...updated[i], titre: e.target.value }
                          setConfidSections(updated)
                        }}
                        className={inputCls}
                      />
                    </div>
                    {confidSections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setConfidSections(confidSections.filter((_, j) => j !== i))}
                        className="p-2 text-red-500 hover:bg-red-50 transition-colors"
                        title="Supprimer cette section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Contenu</label>
                    <textarea
                      rows={5}
                      value={section.contenu}
                      onChange={(e) => {
                        const updated = [...confidSections]
                        updated[i] = { ...updated[i], contenu: e.target.value }
                        setConfidSections(updated)
                      }}
                      className={areaCls}
                    />
                  </div>
                </fieldset>
              ))}
              <button
                type="button"
                onClick={() => setConfidSections([...confidSections, { titre: "", contenu: "" }])}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-border-brand text-sm font-body text-text-muted-brand hover:border-primary-brand hover:text-primary-brand transition-colors"
              >
                <Plus className="h-4 w-4" /> Ajouter une section
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-brand text-white text-sm font-body hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Enregistrement…" : "Enregistrer le contenu"}
          </button>
        </form>
      )}
    </div>
  )
}
