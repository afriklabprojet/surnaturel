import type { Metadata } from "next"
import { Suspense } from "react"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import ChatBubble from "@/components/layout/ChatBubble"
import ChatIA from "@/components/soins/ChatIA"

export const metadata: Metadata = {
  title: {
    default: "Le Surnaturel de Dieu — Institut de Bien-Être à Abidjan",
    template: "%s — Le Surnaturel de Dieu",
  },
  description:
    "Institut de bien-être à Abidjan : soins du corps, hammam, gommage, soins visage, post-accouchement, sage-femme et boutique de produits naturels.",
  openGraph: {
    siteName: "Le Surnaturel de Dieu",
    locale: "fr_CI",
    type: "website",
  },
}

export default function PublicLayout({
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
      <ChatBubble />
      <ChatIA />
    </>
  )
}
