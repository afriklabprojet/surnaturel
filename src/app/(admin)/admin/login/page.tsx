import { getLoginStats } from "./actions"
import AdminLoginForm from "./login-form"

export const metadata = {
  title: "Administration | Le Surnaturel de Dieu",
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage() {
  const stats = await getLoginStats()

  return <AdminLoginForm stats={stats} />
}
