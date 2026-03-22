// Calcul de complétion du profil utilisateur

interface UserProfil {
  prenom: string | null
  nom: string | null
  email: string | null
  telephone: string | null
  photoUrl: string | null
  ville: string | null
}

interface ChampProfil {
  champ: string | null | undefined
  label: string
  points: number
  lien?: string
}

export interface ProfilCompletion {
  pourcentage: number
  manquants: { label: string; lien?: string }[]
  complet: boolean
}

export function calculerCompletion(user: UserProfil): ProfilCompletion {
  const champs: ChampProfil[] = [
    { champ: user.prenom, label: "Prénom", points: 10, lien: "#prenom" },
    { champ: user.nom, label: "Nom", points: 10, lien: "#nom" },
    { champ: user.email, label: "Email", points: 20, lien: "#email" },
    { champ: user.telephone, label: "Téléphone", points: 20, lien: "#telephone" },
    { champ: user.photoUrl, label: "Photo de profil", points: 25, lien: "#photo" },
    { champ: user.ville, label: "Ville", points: 15, lien: "#ville" },
  ]

  let total = 0
  const manquants: { label: string; lien?: string }[] = []

  for (const c of champs) {
    if (c.champ && c.champ.trim() !== "") {
      total += c.points
    } else {
      manquants.push({ label: c.label, lien: c.lien })
    }
  }

  return {
    pourcentage: total,
    manquants,
    complet: total === 100,
  }
}

export function getMessageCompletion(pourcentage: number): string {
  if (pourcentage === 100) {
    return "Profil complet ! Merci pour votre confiance."
  }
  if (pourcentage >= 75) {
    return "Presque complet ! Plus que quelques informations."
  }
  if (pourcentage >= 50) {
    return "Bon début ! Continuez à compléter votre profil."
  }
  return "Complétez votre profil pour une meilleure expérience."
}

export function getCouleurProgression(pourcentage: number): string {
  if (pourcentage === 100) return "bg-primary-brand"
  if (pourcentage >= 75) return "bg-primary-brand"
  if (pourcentage >= 50) return "bg-gold"
  return "bg-text-muted-brand"
}
