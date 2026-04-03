"use client"

import { useState } from "react"
import Image from "next/image"

interface Props {
  src: string
  alt: string
  className?: string
  fallbackInitiales?: string
  fallbackClassName?: string
}

export function ImgAvecFallback({
  src,
  alt,
  className,
  fallbackInitiales,
  fallbackClassName,
}: Props) {
  const [erreur, setErreur] = useState(false)

  if (erreur) {
    return (
      <div
        className={`flex items-center justify-center bg-gold-light/50 ${fallbackClassName ?? ""}`}
      >
        {fallbackInitiales && (
          <span className="font-display text-6xl font-light text-gold/50">
            {fallbackInitiales}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setErreur(true)}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  )
}
