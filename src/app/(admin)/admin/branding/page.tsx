"use client"

import { useEffect, useState, useCallback } from "react"
import { 
  Palette, 
  Save, 
  RotateCcw, 
  Upload, 
  Download, 
  Eye,
  Sun,
  Moon,
  Type,
  Layout,
  Image as ImageIcon,
  Mail,
  Check,
  Loader2,
  FileJson
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import Image from "next/image"

// ─── Types ───────────────────────────────────────────────────────

interface BrandingData {
  tenantId: string | null
  appName: string
  logoLight: string | null
  logoDark: string | null
  favicon: string | null
  loaderLogo: string | null
  primaryColor: string
  primaryDarkColor: string
  primaryLightColor: string
  secondaryColor: string
  accentColor: string
  accentLightColor: string
  backgroundColor: string
  foregroundColor: string
  cardColor: string
  borderColor: string
  dangerColor: string
  successColor: string
  fontFamily: string
  fontHeading: string
  buttonRadius: string
  sidebarTheme: string
  loginBackground: string | null
  loginTitle: string | null
  loginSubtitle: string | null
  loginLogoSize: string
  emailLogoUrl: string | null
  emailPrimaryColor: string
  emailFooterText: string | null
  presetName: string | null
  customCss: string | null
}

interface BrandingPreset {
  name: string
  description: string
  settings: Partial<BrandingData>
}

// ─── Composants UI ───────────────────────────────────────────────

function ColorPicker({ 
  label, 
  value, 
  onChange,
  description
}: { 
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-3">
        <div 
          className="relative w-12 h-12 rounded-lg border-2 border-border overflow-hidden cursor-pointer group"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Palette className="w-4 h-4 text-white" />
          </div>
        </div>
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const v = e.target.value
            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
              onChange(v)
            }
          }}
          className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-sm font-mono uppercase"
          placeholder="#000000"
        />
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

function ImageUploader({
  label,
  value,
  onChange,
  description,
  aspectRatio = "auto"
}: {
  label: string
  value: string | null
  onChange: (value: string | null) => void
  description?: string
  aspectRatio?: "auto" | "square" | "wide"
}) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Valider le type
    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptées")
      return
    }

    // Valider la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop grande (max 5MB)")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "branding")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error("Upload échoué")

      const data = await res.json()
      onChange(data.url)
      toast.success("Image uploadée")
    } catch {
      toast.error("Erreur lors de l'upload")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className={cn(
        "relative border-2 border-dashed border-border rounded-xl overflow-hidden",
        aspectRatio === "square" && "aspect-square",
        aspectRatio === "wide" && "aspect-video",
        aspectRatio === "auto" && "min-h-[120px]"
      )}>
        {value ? (
          <>
            <Image
              src={value}
              alt={label}
              fill
              className="object-contain p-2"
            />
            <button
              onClick={() => onChange(null)}
              className="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-lg hover:bg-destructive/90"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </>
        ) : (
          <label className="flex flex-col items-center justify-center h-full min-h-[120px] cursor-pointer hover:bg-muted/50 transition-colors">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Cliquez pour uploader</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
  description
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  description?: string
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  description,
  multiline
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  description?: string
  multiline?: boolean
}) {
  const Component = multiline ? "textarea" : "input"
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <Component
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-3 py-2 bg-card border border-border rounded-lg text-sm",
          multiline && "min-h-[100px] resize-y"
        )}
      />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

// ─── Preview Component ───────────────────────────────────────────

function LivePreview({ branding }: { branding: BrandingData }) {
  return (
    <div 
      className="rounded-xl border-2 border-border overflow-hidden"
      style={{ backgroundColor: branding.backgroundColor }}
    >
      {/* Header */}
      <div 
        className="p-4 flex items-center gap-3"
        style={{ backgroundColor: branding.primaryColor }}
      >
        {branding.logoLight ? (
          <Image src={branding.logoLight} alt="Logo" width={32} height={32} className="object-contain" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-white/20" />
        )}
        <span className="text-white font-medium">{branding.appName}</span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <div 
          className="p-4 rounded-lg"
          style={{ 
            backgroundColor: branding.cardColor,
            borderColor: branding.borderColor,
            borderWidth: 1
          }}
        >
          <h3 
            className="font-semibold mb-2"
            style={{ 
              color: branding.foregroundColor,
              fontFamily: branding.fontHeading
            }}
          >
            Aperçu carte
          </h3>
          <p 
            className="text-sm opacity-70 mb-3"
            style={{ 
              color: branding.foregroundColor,
              fontFamily: branding.fontFamily
            }}
          >
            Voici un exemple de carte avec votre thème.
          </p>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 text-white text-sm font-medium"
              style={{ 
                backgroundColor: branding.primaryColor,
                borderRadius: branding.buttonRadius === "full" ? "9999px" : 
                             branding.buttonRadius === "lg" ? "0.75rem" :
                             branding.buttonRadius === "sm" ? "0.25rem" : "0.5rem"
              }}
            >
              Principal
            </button>
            <button
              className="px-4 py-2 text-sm font-medium"
              style={{ 
                backgroundColor: branding.secondaryColor,
                color: branding.primaryDarkColor,
                borderRadius: branding.buttonRadius === "full" ? "9999px" : 
                             branding.buttonRadius === "lg" ? "0.75rem" :
                             branding.buttonRadius === "sm" ? "0.25rem" : "0.5rem"
              }}
            >
              Secondaire
            </button>
            <button
              className="px-4 py-2 text-white text-sm font-medium"
              style={{ 
                backgroundColor: branding.accentColor,
                borderRadius: branding.buttonRadius === "full" ? "9999px" : 
                             branding.buttonRadius === "lg" ? "0.75rem" :
                             branding.buttonRadius === "sm" ? "0.25rem" : "0.5rem"
              }}
            >
              Accent
            </button>
          </div>
        </div>

        {/* Color swatches */}
        <div className="flex gap-2 flex-wrap">
          <div 
            className="w-8 h-8 rounded-lg border"
            style={{ backgroundColor: branding.primaryColor }}
            title="Primary"
          />
          <div 
            className="w-8 h-8 rounded-lg border"
            style={{ backgroundColor: branding.primaryDarkColor }}
            title="Primary Dark"
          />
          <div 
            className="w-8 h-8 rounded-lg border"
            style={{ backgroundColor: branding.secondaryColor }}
            title="Secondary"
          />
          <div 
            className="w-8 h-8 rounded-lg border"
            style={{ backgroundColor: branding.accentColor }}
            title="Accent"
          />
          <div 
            className="w-8 h-8 rounded-lg border"
            style={{ backgroundColor: branding.successColor }}
            title="Success"
          />
          <div 
            className="w-8 h-8 rounded-lg border"
            style={{ backgroundColor: branding.dangerColor }}
            title="Danger"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Page principale ─────────────────────────────────────────────

export default function AdminBrandingPage() {
  const [activeTab, setActiveTab] = useState<"colors" | "identity" | "typography" | "ui" | "login" | "email" | "advanced">("colors")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [presets, setPresets] = useState<BrandingPreset[]>([])
  const [showPreview, setShowPreview] = useState(true)
  
  const [branding, setBranding] = useState<BrandingData>({
    tenantId: null,
    appName: "Le Surnaturel de Dieu",
    logoLight: null,
    logoDark: null,
    favicon: null,
    loaderLogo: null,
    primaryColor: "#2D7A1F",
    primaryDarkColor: "#1A5C10",
    primaryLightColor: "#E8F5E3",
    secondaryColor: "#E8F5E3",
    accentColor: "#9A7B22",
    accentLightColor: "#F5EDD6",
    backgroundColor: "#FAFAF7",
    foregroundColor: "#1C1C1C",
    cardColor: "#FFFFFF",
    borderColor: "#E8E4DC",
    dangerColor: "#DC2626",
    successColor: "#16A34A",
    fontFamily: "Jost",
    fontHeading: "Cormorant Garamond",
    buttonRadius: "md",
    sidebarTheme: "light",
    loginBackground: null,
    loginTitle: null,
    loginSubtitle: null,
    loginLogoSize: "md",
    emailLogoUrl: null,
    emailPrimaryColor: "#2D7A1F",
    emailFooterText: null,
    presetName: null,
    customCss: null,
  })

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      try {
        const [brandingRes, presetsRes] = await Promise.all([
          fetch("/api/admin/branding"),
          fetch("/api/admin/branding/presets"),
        ])
        
        if (brandingRes.ok) {
          const data = await brandingRes.json()
          setBranding(data)
        }
        
        if (presetsRes.ok) {
          const data = await presetsRes.json()
          setPresets(data)
        }
      } catch (error) {
        console.error("Erreur chargement branding:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Sauvegarde
  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      })
      
      if (res.ok) {
        toast.success("Branding sauvegardé ! Rechargez la page pour voir les changements.")
      } else {
        const data = await res.json()
        toast.error(data.error || "Erreur lors de la sauvegarde")
      }
    } catch {
      toast.error("Erreur de connexion")
    } finally {
      setSaving(false)
    }
  }

  // Appliquer un preset
  const handleApplyPreset = async (presetName: string) => {
    const preset = presets.find(p => p.name === presetName)
    if (!preset) return

    setBranding(prev => ({
      ...prev,
      ...preset.settings,
      presetName,
    }))
    toast.success(`Preset "${presetName}" appliqué`)
  }

  // Réinitialiser
  const handleReset = async () => {
    if (!confirm("Réinitialiser toutes les valeurs par défaut ?")) return
    
    try {
      const res = await fetch("/api/admin/branding/reset", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setBranding(data)
        toast.success("Branding réinitialisé")
      }
    } catch {
      toast.error("Erreur lors de la réinitialisation")
    }
  }

  // Exporter
  const handleExport = () => {
    const json = JSON.stringify(branding, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "branding-config.json"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Configuration exportée")
  }

  // Importer
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        setBranding(prev => ({ ...prev, ...data }))
        toast.success("Configuration importée")
      } catch {
        toast.error("Fichier JSON invalide")
      }
    }
    reader.readAsText(file)
  }

  const updateField = useCallback(<K extends keyof BrandingData>(key: K, value: BrandingData[K]) => {
    setBranding(prev => ({ ...prev, [key]: value }))
  }, [])

  const tabs = [
    { id: "colors" as const, label: "Couleurs", icon: Palette },
    { id: "identity" as const, label: "Identité", icon: ImageIcon },
    { id: "typography" as const, label: "Typographie", icon: Type },
    { id: "ui" as const, label: "Interface", icon: Layout },
    { id: "login" as const, label: "Connexion", icon: Sun },
    { id: "email" as const, label: "Emails", icon: Mail },
    { id: "advanced" as const, label: "Avancé", icon: FileJson },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-6 h-6 text-primary" />
            Personnalisation du Branding
          </h1>
          <p className="text-muted-foreground mt-1">
            Personnalisez l&apos;apparence de votre plateforme sans déploiement
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              "p-2 rounded-lg border transition-colors",
              showPreview ? "bg-primary text-white" : "bg-card hover:bg-muted"
            )}
            title="Aperçu"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          <label className="p-2 rounded-lg border bg-card hover:bg-muted cursor-pointer transition-colors" title="Importer">
            <Download className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          
          <button
            onClick={handleExport}
            className="p-2 rounded-lg border bg-card hover:bg-muted transition-colors"
            title="Exporter"
          >
            <Upload className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleReset}
            className="p-2 rounded-lg border bg-card hover:bg-muted transition-colors text-destructive"
            title="Réinitialiser"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Presets */}
      {presets.length > 0 && (
        <div className="bg-card rounded-xl border p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Thèmes prédéfinis</h3>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleApplyPreset(preset.name)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
                  branding.presetName === preset.name 
                    ? "bg-primary text-white border-primary" 
                    : "bg-card hover:bg-muted"
                )}
              >
                {branding.presetName === preset.name && <Check className="w-4 h-4" />}
                <span className="font-medium">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 bg-muted/50 p-2 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.id 
                    ? "bg-card shadow text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-card rounded-xl border p-6 space-y-6">
            {/* Couleurs */}
            {activeTab === "colors" && (
              <>
                <h3 className="text-lg font-semibold text-foreground">Palette de couleurs</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <ColorPicker
                    label="Couleur principale"
                    value={branding.primaryColor}
                    onChange={(v) => updateField("primaryColor", v)}
                    description="Couleur dominante de l'interface"
                  />
                  <ColorPicker
                    label="Principale sombre"
                    value={branding.primaryDarkColor}
                    onChange={(v) => updateField("primaryDarkColor", v)}
                    description="Variante sombre pour le hover"
                  />
                  <ColorPicker
                    label="Principale claire"
                    value={branding.primaryLightColor}
                    onChange={(v) => updateField("primaryLightColor", v)}
                    description="Variante claire pour les backgrounds"
                  />
                  <ColorPicker
                    label="Secondaire"
                    value={branding.secondaryColor}
                    onChange={(v) => updateField("secondaryColor", v)}
                    description="Couleur secondaire"
                  />
                  <ColorPicker
                    label="Accent (Or)"
                    value={branding.accentColor}
                    onChange={(v) => updateField("accentColor", v)}
                    description="Couleur d'accent pour les CTA"
                  />
                  <ColorPicker
                    label="Accent claire"
                    value={branding.accentLightColor}
                    onChange={(v) => updateField("accentLightColor", v)}
                    description="Variante claire de l'accent"
                  />
                  <ColorPicker
                    label="Fond de page"
                    value={branding.backgroundColor}
                    onChange={(v) => updateField("backgroundColor", v)}
                    description="Couleur de fond générale"
                  />
                  <ColorPicker
                    label="Texte principal"
                    value={branding.foregroundColor}
                    onChange={(v) => updateField("foregroundColor", v)}
                    description="Couleur du texte"
                  />
                  <ColorPicker
                    label="Fond de carte"
                    value={branding.cardColor}
                    onChange={(v) => updateField("cardColor", v)}
                    description="Fond des éléments de carte"
                  />
                  <ColorPicker
                    label="Bordures"
                    value={branding.borderColor}
                    onChange={(v) => updateField("borderColor", v)}
                    description="Couleur des bordures"
                  />
                  <ColorPicker
                    label="Succès"
                    value={branding.successColor}
                    onChange={(v) => updateField("successColor", v)}
                    description="Messages de succès"
                  />
                  <ColorPicker
                    label="Danger"
                    value={branding.dangerColor}
                    onChange={(v) => updateField("dangerColor", v)}
                    description="Messages d'erreur"
                  />
                </div>
              </>
            )}

            {/* Identité */}
            {activeTab === "identity" && (
              <>
                <h3 className="text-lg font-semibold text-foreground">Identité visuelle</h3>
                <div className="space-y-6">
                  <TextField
                    label="Nom de l'application"
                    value={branding.appName}
                    onChange={(v) => updateField("appName", v)}
                    placeholder="Le Surnaturel de Dieu"
                    description="Affiché dans le header et les emails"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <ImageUploader
                      label="Logo (fond clair)"
                      value={branding.logoLight}
                      onChange={(v) => updateField("logoLight", v)}
                      description="Logo pour les fonds clairs"
                    />
                    <ImageUploader
                      label="Logo (fond sombre)"
                      value={branding.logoDark}
                      onChange={(v) => updateField("logoDark", v)}
                      description="Logo pour les fonds sombres"
                    />
                    <ImageUploader
                      label="Favicon"
                      value={branding.favicon}
                      onChange={(v) => updateField("favicon", v)}
                      description="Icône dans l'onglet du navigateur"
                      aspectRatio="square"
                    />
                    <ImageUploader
                      label="Logo loader"
                      value={branding.loaderLogo}
                      onChange={(v) => updateField("loaderLogo", v)}
                      description="Logo sur l'écran de chargement"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Typographie */}
            {activeTab === "typography" && (
              <>
                <h3 className="text-lg font-semibold text-foreground">Typographie</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <SelectField
                    label="Police du corps"
                    value={branding.fontFamily}
                    onChange={(v) => updateField("fontFamily", v)}
                    options={[
                      { value: "Jost", label: "Jost" },
                      { value: "Inter", label: "Inter" },
                      { value: "Poppins", label: "Poppins" },
                      { value: "Roboto", label: "Roboto" },
                      { value: "Open Sans", label: "Open Sans" },
                      { value: "Lato", label: "Lato" },
                      { value: "Montserrat", label: "Montserrat" },
                    ]}
                    description="Police pour le texte courant"
                  />
                  <SelectField
                    label="Police des titres"
                    value={branding.fontHeading}
                    onChange={(v) => updateField("fontHeading", v)}
                    options={[
                      { value: "Cormorant Garamond", label: "Cormorant Garamond" },
                      { value: "Playfair Display", label: "Playfair Display" },
                      { value: "Merriweather", label: "Merriweather" },
                      { value: "Lora", label: "Lora" },
                      { value: "Georgia", label: "Georgia" },
                      { value: "Inter", label: "Inter" },
                      { value: "Poppins", label: "Poppins" },
                    ]}
                    description="Police pour les titres"
                  />
                </div>
              </>
            )}

            {/* Interface */}
            {activeTab === "ui" && (
              <>
                <h3 className="text-lg font-semibold text-foreground">Interface utilisateur</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <SelectField
                    label="Rayon des boutons"
                    value={branding.buttonRadius}
                    onChange={(v) => updateField("buttonRadius", v)}
                    options={[
                      { value: "sm", label: "Petit (0.25rem)" },
                      { value: "md", label: "Moyen (0.5rem)" },
                      { value: "lg", label: "Grand (0.75rem)" },
                      { value: "full", label: "Rond (pilule)" },
                    ]}
                    description="Arrondi des boutons et cartes"
                  />
                  <SelectField
                    label="Thème sidebar"
                    value={branding.sidebarTheme}
                    onChange={(v) => updateField("sidebarTheme", v)}
                    options={[
                      { value: "light", label: "Clair" },
                      { value: "dark", label: "Sombre" },
                    ]}
                    description="Couleur de la barre latérale admin"
                  />
                </div>
              </>
            )}

            {/* Connexion */}
            {activeTab === "login" && (
              <>
                <h3 className="text-lg font-semibold text-foreground">Page de connexion</h3>
                <div className="space-y-6">
                  <ImageUploader
                    label="Image de fond"
                    value={branding.loginBackground}
                    onChange={(v) => updateField("loginBackground", v)}
                    description="Image de fond de la page de connexion"
                    aspectRatio="wide"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <TextField
                      label="Titre"
                      value={branding.loginTitle || ""}
                      onChange={(v) => updateField("loginTitle", v || null)}
                      placeholder="Bienvenue"
                      description="Titre sur la page de connexion"
                    />
                    <TextField
                      label="Sous-titre"
                      value={branding.loginSubtitle || ""}
                      onChange={(v) => updateField("loginSubtitle", v || null)}
                      placeholder="Connectez-vous à votre espace"
                      description="Texte sous le titre"
                    />
                    <SelectField
                      label="Taille du logo"
                      value={branding.loginLogoSize}
                      onChange={(v) => updateField("loginLogoSize", v)}
                      options={[
                        { value: "sm", label: "Petit" },
                        { value: "md", label: "Moyen" },
                        { value: "lg", label: "Grand" },
                      ]}
                      description="Taille du logo sur la page de connexion"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Emails */}
            {activeTab === "email" && (
              <>
                <h3 className="text-lg font-semibold text-foreground">Branding des emails</h3>
                <div className="space-y-6">
                  <ImageUploader
                    label="Logo pour les emails"
                    value={branding.emailLogoUrl}
                    onChange={(v) => updateField("emailLogoUrl", v)}
                    description="Logo affiché dans l'en-tête des emails"
                  />
                  <ColorPicker
                    label="Couleur principale des emails"
                    value={branding.emailPrimaryColor}
                    onChange={(v) => updateField("emailPrimaryColor", v)}
                    description="Couleur des liens et boutons dans les emails"
                  />
                  <TextField
                    label="Texte de pied de page"
                    value={branding.emailFooterText || ""}
                    onChange={(v) => updateField("emailFooterText", v || null)}
                    placeholder="© 2024 Le Surnaturel de Dieu. Tous droits réservés."
                    description="Texte affiché en bas des emails"
                    multiline
                  />
                </div>
              </>
            )}

            {/* Avancé */}
            {activeTab === "advanced" && (
              <>
                <h3 className="text-lg font-semibold text-foreground">Options avancées</h3>
                <div className="space-y-6">
                  <TextField
                    label="CSS personnalisé"
                    value={branding.customCss || ""}
                    onChange={(v) => updateField("customCss", v || null)}
                    placeholder=".custom-class { color: red; }"
                    description="CSS additionnel injecté globalement (utiliser avec précaution)"
                    multiline
                  />
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Export / Import</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Exportez votre configuration pour la sauvegarder ou l&apos;importer sur un autre environnement.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm hover:bg-muted"
                      >
                        <Upload className="w-4 h-4" />
                        Exporter JSON
                      </button>
                      <label className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm hover:bg-muted cursor-pointer">
                        <Download className="w-4 h-4" />
                        Importer JSON
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Aperçu en direct
              </h3>
              <LivePreview branding={branding} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
