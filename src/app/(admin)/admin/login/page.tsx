import { getLoginStats } from "./actions"
import AdminLoginForm from "./login-form"

export const metadata = {
  title: "Administration | Le Surnaturel de Dieu",
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage() {
  // Wrap stats in try/catch — si la DB est hors-ligne, la page doit quand même s'afficher
  let stats = { rdvAujourdhui: 0, clientsActifs: 0, commandesEnAttente: 0, articlesPublies: 0 }
  try {
    stats = await getLoginStats()
  } catch {
    // La page s'affiche même si les stats sont indisponibles
  }

  return <AdminLoginForm stats={stats} />
}
