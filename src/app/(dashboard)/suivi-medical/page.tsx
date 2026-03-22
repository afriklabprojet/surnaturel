"use client"

import { Suspense, useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Shield, Lock, Loader2, FileText, Stethoscope, MessageSquare, Activity, FolderOpen } from "lucide-react"
import DossierMedical from "@/components/medical/DossierMedical"
import MesConsultations from "@/components/medical/MesConsultations"
import MessagerieMedicale from "@/components/medical/MessagerieMedicale"
import MesuresSante from "@/components/medical/MesuresSante"
import DocumentsMedicaux from "@/components/medical/DocumentsMedicaux"

const ALLOWED_ROLES = ["CLIENT", "ACCOMPAGNATEUR_MEDICAL"]

const TABS = [
  { id: "dossier", label: "Mon dossier", icon: FileText },
  { id: "mesures", label: "Mesures", icon: Activity },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "consultations", label: "Consultations", icon: Stethoscope },
  { id: "messagerie", label: "Messagerie", icon: MessageSquare },
] as const

type TabId = (typeof TABS)[number]["id"]

export default function PageSuiviMedical() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center"><Loader2 size={24} className="animate-spin text-gold" /></div>}>
      <SuiviMedicalContent />
    </Suspense>
  )
}

function SuiviMedicalContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get("tab") as TabId) || "dossier"
  const [activeTab, setActiveTab] = useState<TabId>(
    TABS.some((t) => t.id === initialTab) ? initialTab : "dossier"
  )

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/connexion?callbackUrl=/suivi-medical")
    }
    if (status === "authenticated" && !ALLOWED_ROLES.includes(session.user.role)) {
      router.push("/connexion")
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gold" />
      </div>
    )
  }

  if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Security header */}
      <div className="bg-yellow-50 border border-gold/20 p-4">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-gold shrink-0" />
          <div>
            <p className="font-body text-[11px] font-medium uppercase tracking-[0.15em] text-gold">
              Espace confidentiel
            </p>
            <p className="font-body text-[11px] text-text-muted-brand">
              Vos données sont chiffrées et sécurisées (AES-256)
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border-brand">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 font-body text-[12px] uppercase tracking-[0.15em] transition-colors ${
                isActive
                  ? "border-b-2 border-gold text-text-main"
                  : "text-text-muted-brand hover:text-text-mid"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content with gold top border card */}
      <div className="bg-white border border-border-brand border-t-2 border-t-gold p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={14} className="text-gold" />
          <span className="font-body text-[10px] uppercase tracking-[0.1em] text-text-muted-brand">
            Confidentiel
          </span>
        </div>
        {activeTab === "dossier" && <DossierMedical />}
        {activeTab === "mesures" && <MesuresSante />}
        {activeTab === "documents" && <DocumentsMedicaux />}
        {activeTab === "consultations" && <MesConsultations />}
        {activeTab === "messagerie" && (
          <MessagerieMedicale currentUserId={session.user.id} />
        )}
      </div>
    </div>
  )
}
