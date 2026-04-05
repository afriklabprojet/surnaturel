"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { MessageCircle, X } from "lucide-react"

interface MatchModalProps {
  matchId: string
  conversationId: string | null
  prenom: string
  photoUrl: string | null
  currentUserPhotoUrl: string | null
  onClose: () => void
}

/** Simple canvas confetti animé */
function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const COLORS = ["#f472b6", "#fb7185", "#c084fc", "#818cf8", "#f9a8d4", "#fde68a"]
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 5 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: Math.random() * 2 + 1,
      wobble: Math.random() * 10,
      wobbleSpeed: Math.random() * 0.05 + 0.02,
      angle: 0,
    }))

    let frame: number
    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        p.y += p.speed
        p.angle += p.wobbleSpeed
        p.x += Math.sin(p.angle) * p.wobble * 0.3
        if (p.y > canvas.height) {
          p.y = -10
          p.x = Math.random() * canvas.width
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
      }
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none rounded-2xl"
      aria-hidden="true"
    />
  )
}

export default function MatchModal({
  conversationId,
  prenom,
  photoUrl,
  currentUserPhotoUrl,
  onClose,
}: MatchModalProps) {
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handle)
    return () => window.removeEventListener("keydown", handle)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl text-center">
        {/* Fond dégradé */}
        <div className="absolute inset-0 bg-linear-to-br from-pink-600 via-fuchsia-600 to-violet-700" />

        {/* Confettis */}
        <Confetti />

        {/* Bouton fermer */}
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-10 text-white/70 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Contenu */}
        <div className="relative z-10 px-8 py-10 space-y-6">
          {/* Titre animé */}
          <div className="space-y-1">
            <p className="text-white/80 text-sm font-medium tracking-widest uppercase">
              Félicitations !
            </p>
            <h2 className="font-heading text-3xl font-bold text-white drop-shadow-lg">
              C&apos;est un Match&nbsp;💕
            </h2>
            <p className="text-white/80 text-sm">
              Vous et <strong className="text-white">{prenom}</strong> vous êtes mutuellement likés
            </p>
          </div>

          {/* Avatars avec animation pulse */}
          <div className="flex items-center justify-center gap-4">
            {/* Avatar gauche */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-pink-400 animate-ping opacity-30" />
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white/20">
                {currentUserPhotoUrl ? (
                  <Image
                    src={currentUserPhotoUrl}
                    alt="Vous"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl text-white/60">
                    ?
                  </div>
                )}
              </div>
            </div>

            {/* Cœur central */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-3xl animate-bounce">❤️</span>
            </div>

            {/* Avatar droite */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-pink-400 animate-ping opacity-30" />
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-xl bg-white/20">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={prenom}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-heading text-white/60">
                    {prenom[0]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            {conversationId && (
              <Link
                href={`/communaute/messages?conv=${conversationId}`}
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white text-fuchsia-700 font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                <MessageCircle size={18} />
                Envoyer un message
              </Link>
            )}
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl border-2 border-white/40 text-white font-medium hover:bg-white/10 transition-colors"
            >
              Continuer à découvrir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
