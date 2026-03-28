import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";
import { CartProvider } from "@/lib/cart-context";
import { I18nProvider } from "@/lib/i18n";
import SessionWrapper from "@/components/providers/SessionWrapper";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://surnatureldedieu.com"

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Le Surnaturel de Dieu — Institut de Bien-Être à Abidjan",
    template: "%s — Le Surnaturel de Dieu",
  },
  description:
    "Depuis 2015, Marie Jeanne accueille les femmes d'Abidjan dans un espace de sérénité dédié à la beauté naturelle et au bien-être holistique. Hammam, gommage, soins du visage, post-accouchement, sage-femme et boutique.",
  openGraph: {
    title: "Le Surnaturel de Dieu — Institut de Bien-Être à Abidjan",
    description:
      "Hammam, gommage, soins du visage, post-accouchement, sage-femme et boutique de produits naturels à Abidjan.",
    url: APP_URL,
    siteName: "Le Surnaturel de Dieu",
    locale: "fr_CI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Le Surnaturel de Dieu — Institut de Bien-Être à Abidjan",
    description:
      "Hammam, gommage, soins du visage, post-accouchement, sage-femme et boutique à Abidjan.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${jost.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2D7A1F" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "HealthAndBeautyBusiness",
              name: "Le Surnaturel de Dieu",
              description: "Institut de bien-être holistique à Abidjan — Hammam, gommage, soins du visage, post-accouchement, sage-femme et boutique de produits naturels.",
              url: APP_URL,
              telephone: "+2250778520699",
              email: "contact@surnatureldedieu.ci",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Cocody, Riviera Palmeraie",
                addressLocality: "Abidjan",
                addressRegion: "Abidjan",
                postalCode: "00225",
                addressCountry: "CI",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 5.3600,
                longitude: -3.9700,
              },
              openingHoursSpecification: [
                { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], opens: "08:00", closes: "19:00" },
              ],
              priceRange: "$$",
              image: `${APP_URL}/images/hero.jpg`,
              logo: `${APP_URL}/logos/logo.png`,
              currenciesAccepted: "XOF",
              paymentAccepted: "Cash, Mobile Money, Card",
              areaServed: {
                "@type": "City",
                name: "Abidjan",
              },
              hasOfferCatalog: {
                "@type": "OfferCatalog",
                name: "Soins & Services",
                itemListElement: [
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Hammam Royal", description: "Bain de vapeur purifiant inspiré des traditions orientales" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Gommage Corps Luxe", description: "Exfoliation douce aux huiles précieuses" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Soin du Visage Éclat", description: "Soin complet pour un teint lumineux" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Programme Post-accouchement", description: "Soins de récupération post-partum" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Sage-femme", description: "Consultations sage-femme personnalisées" } },
                ],
              },
              sameAs: [
                "https://www.facebook.com/surnatureldedieu",
                "https://www.instagram.com/surnatureldedieu",
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-body bg-bg-page text-text-main dark:bg-slate-900 dark:text-slate-100">
        <ThemeProvider>
        <SessionWrapper>
          <I18nProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </I18nProvider>
        </SessionWrapper>
        </ThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "font-body",
              title: "font-body text-[13px]",
              description: "font-body text-[12px] text-text-mid",
              success: "bg-primary-light border-primary-brand text-primary-brand",
              error: "bg-red-50 border-danger text-danger",
            },
            style: {
              border: "1px solid var(--color-border)",
            },
          }}
        />
        <Analytics />
        <SpeedInsights />
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js")})}`,
          }}
        />
      </body>
    </html>
  );
}
