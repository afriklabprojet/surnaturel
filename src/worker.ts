/**
 * Worker BullMQ — processus PM2 dédié aux jobs asynchrones
 *
 * Démarré par PM2 via ecosystem.config.js (entrée "worker").
 * Consomme la queue "notifications" et toutes les futures queues BullMQ.
 *
 * Lancement manuel : npx tsx src/worker.ts
 */
import "dotenv/config"
import { startNotifWorker } from "@/lib/queue"

const worker = startNotifWorker()

worker.on("completed", (job) => {
  console.log(`[worker] job ${job.id} terminé (${job.name})`)
})

worker.on("failed", (job, err) => {
  console.error(`[worker] job ${job?.id} échoué :`, err.message)
})

console.log("[worker] BullMQ notification worker démarré ✓")

// Arrêt propre
process.on("SIGTERM", async () => {
  console.log("[worker] SIGTERM — arrêt propre…")
  await worker.close()
  process.exit(0)
})
