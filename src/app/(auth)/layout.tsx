import { Suspense } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Navbar />
      <Suspense fallback={<main className="flex-1 min-h-screen" />}>
        <main className="flex-1">{children}</main>
      </Suspense>
      <Footer />
    </>
  )
}
