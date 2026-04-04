"use client"

import Image from "next/image"
import { ExternalLink, FileText } from "lucide-react"

const imgLoader = ({ src }: { src: string }) => src
import type { PostData } from "./types"

export function PostMedia({ post }: { post: PostData }) {
  const altBase = `Photo par ${post.auteur.prenom}`

  if (post.images?.length > 0) {
    const imgs = post.images
    return (
      <div className="border-t border-border-brand">
        {imgs.length === 1 ? (
          <Image loader={imgLoader} src={imgs[0]} alt={altBase} width={800} height={400} sizes="100vw" className="w-full max-h-100 object-cover" />
        ) : (
          <div className={`grid gap-0.5 ${imgs.length >= 2 ? "grid-cols-2" : ""}`}>
            {imgs.slice(0, 4).map((url, i) => (
              <div key={i} className={`relative ${imgs.length === 3 && i === 0 ? "col-span-2" : ""}`}>
                <Image loader={imgLoader} src={url} alt={`${altBase} (${i + 1})`} width={400} height={192} sizes="50vw" className="w-full h-48 object-cover" />
                {i === 3 && imgs.length > 4 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="font-body text-white text-[18px] font-medium">+{imgs.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (post.imageUrl) {
    return (
      <div className="border-t border-border-brand">
        <Image loader={imgLoader} src={post.imageUrl} alt={altBase} width={800} height={400} sizes="100vw" className="w-full max-h-100 object-cover" />
      </div>
    )
  }

  if (post.videoUrl) {
    return (
      <div className="border-t border-border-brand p-4">
        <video src={post.videoUrl} controls className="w-full max-h-100" />
      </div>
    )
  }

  if (post.lienUrl) {
    let hostname = ""
    try { hostname = new URL(post.lienUrl).hostname } catch { hostname = post.lienUrl }
    return (
      <div className="border-t border-border-brand mx-5 my-3">
        <a href={post.lienUrl} target="_blank" rel="noopener noreferrer" className="block border border-border-brand hover:border-gold transition-colors overflow-hidden">
          {post.lienImage && <Image loader={imgLoader} src={post.lienImage} alt={`Aperçu du lien de ${post.auteur.prenom}`} width={600} height={160} sizes="100vw" className="w-full h-40 object-cover" />}
          <div className="p-3">
            {post.lienTitre && <p className="font-body text-[13px] font-medium text-text-main line-clamp-2">{post.lienTitre}</p>}
            {post.lienDescription && <p className="font-body text-xs text-text-muted-brand mt-1 line-clamp-2">{post.lienDescription}</p>}
            <div className="flex items-center gap-1 mt-2">
              <ExternalLink size={11} className="text-text-muted-brand" />
              <span className="font-body text-xs text-text-muted-brand truncate">{hostname}</span>
            </div>
          </div>
        </a>
      </div>
    )
  }

  if (post.documentUrl) {
    return (
      <div className="border-t border-border-brand mx-5 my-3">
        <a href={post.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-border-brand hover:border-gold transition-colors">
          <FileText size={24} className="text-gold shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-body text-[12px] font-medium text-text-main truncate">{post.documentNom || "Document"}</p>
            <p className="font-body text-xs text-text-muted-brand">Cliquer pour ouvrir</p>
          </div>
          <ExternalLink size={14} className="text-text-muted-brand shrink-0" />
        </a>
      </div>
    )
  }

  return null
}
