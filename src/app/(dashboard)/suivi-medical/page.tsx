"use client"

import { Suspense, useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Shield, Lock, FileText, Stethoscope, MessageSquare, Activity, FolderOpen, BookHeart, Baby, ClipboardList, Share2 } from "lucide-react"
import { SkeletonSuiviMedical } from "@/components/ui/skeletons"
import DossierMedical from "@/components/medical/DossierMedical"
import MesConsultations from "@/components/medical/MesConsultations"
import MessagerieMedicale from "@/components/medical/MessagerieMedicale"
import MesuresSante from "@/components/medical/MesuresSante"
import DocumentsMedicaux from "@/components/medical/DocumentsMedicaux"
import CarnetSante from "@/components/medical/CarnetSante"
import SuiviSpecialise from "@/components/medical/SuiviSpecialise"
import CompteRendus from "@/components/medical/CompteRendus"
import QuestionnairePreConsultation from "@/components/medical/QuestionnairePreConsultation"

const ALLOWED_ROLES = ["CLIENT", "ACCOMPAGNATEUR_MEDICAL", "ADMIN"]

const TABS = [
  { id: "dossier", label: "Mon dossier", icon: FileText },
  { id: "carnet", label: "Carnet", icon: BookHeart },
  { id: "mesures", label: "Mesures", icon: Activity },
  { id: "documents", label: "Documents", icon: FolderOpen },
  { id: "consultations", label: "Consultations", icon: Stethoscope },
  { id: "messagerie", label: "Messagerie", icon: MessageSquare },
  { id: "suivi", label: "Suivi spécialisé", icon: Baby },
  { id: "comptes-rendus", label: "Comptes-rendus", icon: Share2 },
  { id: "questionnaire", label: "Questionnaire", icon: ClipboardList },
] as const

type TabId = (typeof TABS)[number]["id"]

export default function PageSuiviMedical() {
  return (
    <Suspense fallback={<SkeletonSuiviMedical />}>
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
    return <SkeletonSuiviMedical />
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
            <p className="font-body text-xs font-medium uppercase tracking-[0.15em] text-gold">
              Espace confidentiel
            </p>
            <p className="font-body text-xs text-text-muted-brand">
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
          <span className="font-body text-xs uppercase tracking-widest text-text-muted-brand">
            Confidentiel
          </span>
        </div>
        {activeTab === "dossier" && <DossierMedical />}
        {activeTab === "carnet" && <CarnetSante />}
        {activeTab === "mesures" && <MesuresSante />}
        {activeTab === "documents" && <DocumentsMedicaux />}
        {activeTab === "consultations" && <MesConsultations />}
        {activeTab === "messagerie" && (
          <MessagerieMedicale currentUserId={session.user.id} />
        )}
        {activeTab === "suivi" && <SuiviSpecialise />}
        {activeTab === "comptes-rendus" && <CompteRendus />}
        {activeTab === "questionnaire" && <QuestionnairePreConsultation />}
      </div>
    </div>
  )
}
