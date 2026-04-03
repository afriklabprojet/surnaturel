/**
 * Test setup — global mocks for external services.
 *
 * vi.mock() calls are hoisted by Vitest, so imports in route handlers
 * automatically resolve to these stubs.  Individual tests can override
 * specific mock return values via vi.mocked().
 */
import { vi } from "vitest"

/* ───── Prisma ────────────────────────────────────────────────────── */
// Each test file builds its own mock data; here we just wire the module.
export const prismaMock = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  rendezVous: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  soin: { findUnique: vi.fn(), findMany: vi.fn() },
  commande: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  produit: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
  dossierMedical: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  messageMedical: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    updateMany: vi.fn(),
  },
  post: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  message: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
  },
  conversation: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
  },
  appConfig: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  blocage: { findMany: vi.fn() },
  membreGroupe: { findUnique: vi.fn() },
  mention: { createMany: vi.fn() },
  postSauvegarde: { findMany: vi.fn() },
  notification: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  codePromo: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  utilisationCode: {
    create: vi.fn(),
  },
  favori: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  pointsFidelite: {
    findUnique: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
  },
  abonneNewsletter: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
  avis: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn((fn: (tx: typeof prismaMock) => Promise<unknown>) =>
    fn(prismaMock)
  ),
  $executeRaw: vi.fn().mockResolvedValue(0),
}

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

/* ───── Auth ──────────────────────────────────────────────────────── */
export const mockAuth = vi.fn()
vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

/* ───── Email ─────────────────────────────────────────────────────── */
vi.mock("@/lib/email", () => ({
  envoyerEmailInscription: vi.fn().mockResolvedValue(undefined),
  envoyerEmailConfirmationRDV: vi.fn().mockResolvedValue(undefined),
  envoyerEmailMessageMedical: vi.fn().mockResolvedValue(undefined),
  envoyerEmailConfirmationCommande: vi.fn().mockResolvedValue(undefined),
  envoyerEmailCommandePayee: vi.fn().mockResolvedValue(undefined),
  envoyerEmailResetMotDePasse: vi.fn().mockResolvedValue(undefined),
  envoyerEmailInvitationParrainage: vi.fn().mockResolvedValue(undefined),
  envoyerEmailRappelRDV: vi.fn().mockResolvedValue(undefined),
}))

/* ───── Pusher ────────────────────────────────────────────────────── */
vi.mock("@/lib/pusher", () => ({
  getPusherServeur: () => ({ trigger: vi.fn().mockResolvedValue(undefined) }),
  getPusherClient: vi.fn(),
  initPusherClient: vi.fn().mockResolvedValue({
    subscribe: vi.fn().mockReturnValue({ bind: vi.fn(), unbind_all: vi.fn() }),
    unsubscribe: vi.fn(),
  }),
  PUSHER_CHANNELS: {
    conversation: (a: string, b: string) =>
      `conversation-${[a, b].sort().join("-")}`,
    medical: (id: string) => `medical-${id}`,
    communaute: "communaute-feed",
    groupe: (id: string) => `groupe-${id}`,
    notification: (id: string) => `notification-${id}`,
  },
  PUSHER_EVENTS: {
    NOUVEAU_MESSAGE: "new-message",
    NOUVEAU_POST: "new-post",
    POST_SUPPRIME: "post-deleted",
  },
}))

/* ───── Notifications ─────────────────────────────────────────────── */
vi.mock("@/lib/notifications", () => ({
  creerNotification: vi.fn().mockResolvedValue(undefined),
  notifierRDVConfirme: vi.fn().mockResolvedValue(undefined),
  notifierCommandePayee: vi.fn().mockResolvedValue(undefined),
  notifierPointsFidelite: vi.fn().mockResolvedValue(undefined),
  notifierRecompenseFidelite: vi.fn().mockResolvedValue(undefined),
}))

/* ───── Fidélité ────────────────────────────────────────────────────── */
vi.mock("@/lib/fidelite", () => ({
  crediterCommande: vi.fn().mockResolvedValue(undefined),
  crediterParrainage: vi.fn().mockResolvedValue(undefined),
  crediterAvis: vi.fn().mockResolvedValue(undefined),
  PALIERS: [
    { points: 500, nom: "Bronze", recompense: "10% sur prochain soin" },
    { points: 1000, nom: "Argent", recompense: "Soin gommage offert" },
    { points: 2000, nom: "Or", recompense: "Hammam + gommage offerts" },
    { points: 5000, nom: "Platine", recompense: "Soin VIP complet offert" },
  ],
  getPalierActuel: vi.fn().mockReturnValue(null),
  getProgressionPalier: vi.fn().mockReturnValue({ pourcentage: 0, restant: 500, prochain: { points: 500, nom: "Bronze" } }),
}))

/* ───── Resend (email API for contact form) ───────────────────────── */
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: "email_mock_id" }),
    },
  })),
}))

/* ───── Sentry ────────────────────────────────────────────────────── */
vi.mock("@/lib/sentry", () => ({
  captureApiError: vi.fn(),
  capturePaymentError: vi.fn(),
  captureAuthError: vi.fn(),
}))

/* ───── Next.js cache ─────────────────────────────────────────────── */
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => Promise<unknown>) => fn,
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

/* ───── Crypto (real or mock depending on ENCRYPTION_KEY) ─────────── */
// Provide a valid 32-byte key encoded as base64 for AES-256-GCM
import crypto from "crypto"
process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64")

/* ───── Jeko (payment) ────────────────────────────────────────────── */
vi.mock("@/lib/jeko", () => ({
  creerPaiement: vi.fn().mockResolvedValue({
    redirectUrl: "https://pay.jeko.test/abc",
    paiementId: "pay_123",
  }),
  verifierStatutPaiement: vi.fn().mockResolvedValue("success"),
}))

/* ───── Logger ────────────────────────────────────────────────────── */
vi.mock("@/lib/logger", () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

/* ───── Web Push ──────────────────────────────────────────────────── */
vi.mock("@/lib/web-push", () => ({
  envoyerPushNotification: vi.fn().mockResolvedValue(undefined),
  isPushConfigured: () => false,
}))

/* ───── Rate Limit ────────────────────────────────────────────────── */
vi.mock("@/lib/rate-limit", () => ({
  createRateLimiter: () => vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0, limit: 30 }),
}))

/* ───── bcryptjs (keep real for auth tests) ───────────────────────── */
// NOT mocked — used for realistic password hashing assertions

/* ───── Helper: build a Request object for route handlers ─────────── */
import { NextRequest } from "next/server"

export function buildRequest(
  url: string,
  options?: RequestInit & { searchParams?: Record<string, string> }
) {
  const u = new URL(url, "http://localhost:3000")
  if (options?.searchParams) {
    for (const [k, v] of Object.entries(options.searchParams)) {
      u.searchParams.set(k, v)
    }
  }
  // NextRequest ne tolère pas signal:null (contrairement à RequestInit standard)
  const { signal, searchParams: _sp, ...rest } = options ?? {}
  const init = signal != null ? { ...rest, signal } : rest
  return new NextRequest(u.toString(), init)
}

export function buildJsonRequest(
  url: string,
  body: unknown,
  method = "POST"
) {
  return buildRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}
