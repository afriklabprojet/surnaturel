import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { Suspense } from "react";
import CookieConsent from "@/components/layout/CookieConsent";
import { Toaster } from "sonner";
import { CartProvider } from "@/lib/cart-context";
import { I18nProvider } from "@/lib/i18n";
import SessionWrapper from "@/components/providers/SessionWrapper";
import { SiteConfigProvider } from "@/components/providers/SiteConfigProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import PostHogProvider from "@/components/providers/PostHogProvider";
import PwaInstallPrompt from "@/components/layout/PwaInstallPrompt";
import { BrandingProvider } from "@/components/branding";
import { getConfig } from "@/lib/config";
import { getBranding } from "@/app/actions/branding";
import { generateBrandingCSS, generateFontUrl } from "@/lib/branding-utils";
import { auth } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";
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

const APP_URL = SITE_URL

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
    images: [
      {
        url: `${APP_URL}/images/hero.jpg`,
        width: 1200,
        height: 630,
        alt: "Le Surnaturel de Dieu — Institut de Bien-Être à Abidjan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Le Surnaturel de Dieu — Institut de Bien-Être à Abidjan",
    description:
      "Hammam, gommage, soins du visage, post-accouchement, sage-femme et boutique à Abidjan.",
    images: [`${APP_URL}/images/hero.jpg`],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [config, branding, session] = await Promise.all([
    getConfig(),
    getBranding(),
    auth(),
  ])
  
  // Générer le CSS dynamique et l'URL des polices
  const brandingCSS = generateBrandingCSS(branding)
  const fontUrl = generateFontUrl(branding)
  
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${cormorant.variable} ${jost.variable} h-full antialiased overflow-x-hidden`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={branding.primaryColor} />
        {/* Polices Google Fonts dynamiques */}
        {fontUrl && <link rel="stylesheet" href={fontUrl} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "HealthAndBeautyBusiness",
              name: config.nomCentre,
              description: "Institut de bien-être holistique à Abidjan — Hammam, gommage, soins du visage, post-accouchement, sage-femme et boutique de produits naturels.",
              url: APP_URL,
              telephone: config.telephoneTel,
              email: config.email,
              address: {
                "@type": "PostalAddress",
                streetAddress: config.adresse,
                addressLocality: config.ville,
                addressRegion: config.ville,
                postalCode: "",
                addressCountry: "CI",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: config.latitude,
                longitude: config.longitude,
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
                name: "Pathologies & Services médicaux",
                itemListElement: [
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Prise en charge du Diabète", description: "Suivi et accompagnement personnalisé pour le diabète" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Prise en charge du Cholestérol", description: "Dépistage et suivi du cholestérol et des dyslipidémies" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Prise en charge de la Drépanocytose", description: "Accompagnement spécialisé pour la drépanocytose" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Prise en charge de l'Obésité", description: "Programme de suivi nutritionnel et perte de poids" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Prise en charge de l'Insuffisance rénale", description: "Suivi néphrologique et accompagnement rénal" } },
                  { "@type": "Offer", itemOffered: { "@type": "Service", name: "Sage-femme", description: "Consultations sage-femme personnalisées" } },
                ],
              },
              sameAs: [
                config.facebook,
                config.instagram,
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-body bg-bg-page text-text-main">
        {/* Injection CSS branding dynamique */}
        <style dangerouslySetInnerHTML={{ __html: brandingCSS }} />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-9999 focus:bg-primary-brand focus:text-white focus:px-4 focus:py-2 focus:font-body focus:text-sm">Aller au contenu principal</a>
        <ThemeProvider>
        <BrandingProvider branding={branding} css={brandingCSS} fontUrl={fontUrl}>
        <SiteConfigProvider config={config}>
        <SessionWrapper session={session}>
          <I18nProvider>
            <CartProvider>
              <Suspense>
                <PostHogProvider>
                  <main id="main-content">{children}</main>
                </PostHogProvider>
              </Suspense>
            </CartProvider>
          </I18nProvider>
        </SessionWrapper>
        <PwaInstallPrompt />
        </SiteConfigProvider>
        </BrandingProvider>
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
              backgroundColor: "var(--color-bg-card)",
              color: "var(--color-text)",
            },
          }}
        />
        <CookieConsent />
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){if(location.hostname==="localhost"){navigator.serviceWorker.getRegistrations().then(rs=>{rs.forEach(r=>r.unregister())})}else{window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js")})}}`
          }}
        />
      </body>
    </html>
  );
}
