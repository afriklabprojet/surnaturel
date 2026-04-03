import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/* ━━━━━━━━━━ Security Headers ━━━━━━━━━━ */

const csp = [
  // Base
  "default-src 'self'",

  // Scripts : 'unsafe-inline' requis par Next.js (hydration + data scripts)
  // 'unsafe-eval' requis par React en dev (callstack reconstruction) — jamais utilisé en prod
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com https://cdn.vercel-insights.com`,

  // Styles : 'unsafe-inline' requis par Tailwind + styled-jsx
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

  // Images
  "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com",

  // Médias audio/vidéo (messages vocaux, vidéos Cloudinary, prévisualisations blob)
  "media-src 'self' blob: https://res.cloudinary.com",

  // Polices
  "font-src 'self' https://fonts.gstatic.com",

  // Connexions API / WebSocket
  [
    "connect-src 'self'",
    "https://api.jeko.africa",
    "https://*.pusher.com",
    "https://*.pusherapp.com",
    "wss://*.pusher.com",
    "wss://*.pusherapp.com",
    "https://res.cloudinary.com",
    "https://api.cloudinary.com",
    "https://va.vercel-scripts.com",
    "https://cdn.vercel-insights.com",
    "https://vitals.vercel-insights.com",
  ].join(" "),

  // Iframes : Pusher + Google Maps
  "frame-src 'self' https://*.pusher.com https://www.google.com https://maps.google.com",

  // Formulaires
  "form-action 'self'",

  // Base URI — prévient les attaques <base>
  "base-uri 'self'",

  // Pas d'embed de la page
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // HSTS géré automatiquement par Vercel (includeSubDomains, preload)
  // On l'ajoute quand même pour les previews et le dev derrière un reverse proxy
  ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

/* ━━━━━━━━━━ Next.js Config ━━━━━━━━━━ */

const nextConfig: NextConfig = {
  // Hostinger Node.js — build autonome (inclut node_modules nécessaires dans .next/standalone)
  output: "standalone",
  reactCompiler: {
    // "none" = le compilateur saute silencieusement les composants
    // qu'il ne peut pas optimiser au lieu de les signaler comme erreurs ESLint.
    panicThreshold: "none",
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "recharts"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Envoyer les source maps à Sentry (pas exposées publiquement)
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Tunnel pour éviter les ad-blockers
  tunnelRoute: "/monitoring",
});
