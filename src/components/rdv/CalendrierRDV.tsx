"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Clock, Coffee } from "lucide-react"
import { toast } from "sonner"

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
const JOURS_COMPLETS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
// Abbreviated for landscape/compact views
const JOURS_ABBREV = ["L", "M", "M", "J", "V", "S", "D"]
const MOIS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]

// Plages horaires : matin 08h–12h, après-midi 14h–18h (pause déjeuner 12h–14h)
const CRENEAUX_MATIN = [8, 9, 10, 11]
const CRENEAUX_APRES_MIDI = [14, 15, 16, 17]

interface CalendrierRDVProps {
  soinId: string
  soinDuree?: number // durée du soin en minutes
  creneauxMatin?: number[]    // heures début créneaux matin (depuis AppConfig)
  creneauxApresMidi?: number[] // heures début créneaux après-midi (depuis AppConfig)
  selectedDate: string | null
  selectedHeure: number | null
  onSelectDate: (date: string) => void
  onSelectHeure: (heure: number) => void
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Lundi = 0
}

function formatDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function formatDateHumaine(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  const jourSemaine = JOURS_COMPLETS[d.getDay() === 0 ? 6 : d.getDay() - 1]
  const jour = d.getDate()
  const mois = MOIS[d.getMonth()]
  return `${jourSemaine} ${jour} ${mois}`
}

export default function CalendrierRDV({
  soinId,
  soinDuree = 60,
  creneauxMatin: creneauxMatinProp,
  creneauxApresMidi: creneauxApresMidiProp,
  selectedDate,
  selectedHeure,
  onSelectDate,
  onSelectHeure,
}: CalendrierRDVProps) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [heuresReservees, setHeuresReservees] = useState<number[]>([])
  const [loadingCreneaux, setLoadingCreneaux] = useState(false)

  // Filtrer les créneaux selon la durée du soin
  const creneauxDisponibles = useCallback(() => {
    const dureeHeures = Math.ceil(soinDuree / 60)
    const matin = (creneauxMatinProp ?? CRENEAUX_MATIN).filter((h) => h + dureeHeures <= 12)
    const apresMidi = (creneauxApresMidiProp ?? CRENEAUX_APRES_MIDI).filter((h) => h + dureeHeures <= 18)
    return { matin, apresMidi }
  }, [soinDuree, creneauxMatinProp, creneauxApresMidiProp])

  const fetchDisponibilites = useCallback(
    async (date: string) => {
      setLoadingCreneaux(true)
      try {
        const res = await fetch(
          `/api/rdv/disponibilites?soinId=${encodeURIComponent(soinId)}&date=${encodeURIComponent(date)}`
        )
        if (res.ok) {
          const data: { heuresReservees: number[] } = await res.json()
          setHeuresReservees(data.heuresReservees)
        }
      } catch {
        setHeuresReservees([])
        toast.error("Impossible de charger les créneaux. Veuillez réessayer.")
      } finally {
        setLoadingCreneaux(false)
      }
    },
    [soinId]
  )

  useEffect(() => {
    if (selectedDate) {
      fetchDisponibilites(selectedDate)
    }
  }, [selectedDate, fetchDisponibilites])

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  function isDatePast(day: number): boolean {
    const d = new Date(currentYear, currentMonth, day)
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
    return d < todayStart
  }

  function isToday(day: number): boolean {
    return (
      currentYear === today.getFullYear() &&
      currentMonth === today.getMonth() &&
      day === today.getDate()
    )
  }

  function isPrevDisabled(): boolean {
    return (
      currentYear === today.getFullYear() && currentMonth <= today.getMonth()
    )
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  const { matin, apresMidi } = creneauxDisponibles()
  const totalCreneaux = matin.length + apresMidi.length
  const creneauxLibres = totalCreneaux - heuresReservees.filter(
    (h) => matin.includes(h) || apresMidi.includes(h)
  ).length

  return (
    <div className="space-y-4 landscape:space-y-3 landscape:md:space-y-6">
      {/* Calendrier mensuel */}
      <div className="border border-border-brand bg-white p-3 landscape:p-2 sm:p-5">
        {/* Header mois */}
        <div className="mb-3 landscape:mb-2 flex items-center justify-between">
          <button
            onClick={prevMonth}
            disabled={isPrevDisabled()}
            className="flex h-10 w-10 landscape:h-9 landscape:w-9 items-center justify-center transition-colors duration-200 hover:bg-primary-light disabled:opacity-30"
            aria-label="Mois précédent"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="font-display text-base landscape:text-sm sm:text-lg font-light text-text-main">
            {MOIS[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={nextMonth}
            className="flex h-10 w-10 landscape:h-9 landscape:w-9 items-center justify-center transition-colors duration-200 hover:bg-primary-light"
            aria-label="Mois suivant"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Jours de la semaine — abbrevié en landscape mobile */}
        <div className="mb-1.5 landscape:mb-1 grid grid-cols-7 gap-0.5 landscape:gap-0">
          {JOURS.map((jour, idx) => (
            <div
              key={jour}
              className="py-1 landscape:py-0.5 text-center font-body text-[10px] landscape:text-[9px] sm:text-xs font-medium uppercase tracking-[0.1em] text-text-muted-brand"
            >
              <span className="hidden landscape:inline sm:hidden">{JOURS_ABBREV[idx]}</span>
              <span className="landscape:hidden sm:inline">{jour}</span>
            </div>
          ))}
        </div>

        {/* Grille jours — taille tactile 44px min, réduite en landscape */}
        <div className="grid grid-cols-7 gap-0.5 landscape:gap-0">
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = formatDateISO(currentYear, currentMonth, day)
            const past = isDatePast(day)
            const isSelected = selectedDate === dateStr
            const todayDay = isToday(day)
            const isSunday =
              new Date(currentYear, currentMonth, day).getDay() === 0

            return (
              <button
                key={day}
                disabled={past || isSunday}
                onClick={() => onSelectDate(dateStr)}
                className={`flex h-10 landscape:h-8 sm:h-11 w-full items-center justify-center font-body text-[12px] landscape:text-[11px] sm:text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? "bg-primary-brand text-white"
                    : todayDay
                      ? "border border-gold bg-gold-light text-gold-dark"
                      : past || isSunday
                        ? "cursor-not-allowed text-text-muted-brand/30"
                        : "text-text-main hover:bg-primary-light hover:text-primary-brand"
                }`}
                aria-label={`${day} ${MOIS[currentMonth]} ${currentYear}${isSunday ? " (fermé)" : ""}`}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Créneaux horaires */}
      {selectedDate && (
        <div className="border border-border-brand bg-white p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-base font-light text-text-main">
                {formatDateHumaine(selectedDate)}
              </h3>
              <div className="mt-1 flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-body text-xs text-text-muted-brand">
                  <Clock size={12} />
                  Durée : {soinDuree} min
                </span>
                {!loadingCreneaux && (
                  <span className="font-body text-xs text-primary-brand">
                    {creneauxLibres} créneau{creneauxLibres > 1 ? "x" : ""} disponible{creneauxLibres > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {loadingCreneaux ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin border-2 border-primary-brand border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-4 landscape:space-y-2">
              {/* Matin */}
              {matin.length > 0 && (
                <div>
                  <p className="mb-1.5 landscape:mb-1 font-body text-[11px] landscape:text-[10px] sm:text-xs font-medium uppercase tracking-[0.12em] text-text-muted-brand">
                    Matin
                  </p>
                  <div className="grid grid-cols-2 landscape:grid-cols-4 gap-1.5 landscape:gap-1 sm:grid-cols-4 sm:gap-2">
                    {matin.map((heure) => {
                      const reserve = heuresReservees.includes(heure)
                      const isSelected = selectedHeure === heure
                      const heureStr = `${String(heure).padStart(2, "0")}:00`
                      const finMin = (heure * 60 + soinDuree)
                      const finH = Math.floor(finMin / 60)
                      const finM = finMin % 60
                      const finStr = `${String(finH).padStart(2, "0")}:${String(finM).padStart(2, "0")}`

                      return (
                        <button
                          key={heure}
                          disabled={reserve}
                          onClick={() => onSelectHeure(heure)}
                          className={`flex flex-col items-center gap-0.5 border px-3 py-3 font-body transition-all duration-200 ${
                            isSelected
                              ? "border-primary-brand bg-primary-brand text-white"
                              : reserve
                                ? "cursor-not-allowed border-border-brand bg-bg-page text-text-muted-brand/40 line-through"
                                : "border-border-brand bg-white text-text-main hover:border-primary-brand hover:text-primary-brand"
                          }`}
                          aria-label={`Créneau de ${heureStr} à ${finStr}${reserve ? " — réservé" : ""}`}
                        >
                          <span className="text-[14px] font-medium">{heureStr}</span>
                          <span className={`text-xs ${isSelected ? "text-white/70" : "text-text-muted-brand"}`}>
                            → {finStr}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Pause déjeuner */}
              <div className="flex items-center gap-2 landscape:gap-1.5 py-0.5">
                <div className="h-px flex-1 bg-border-brand" />
                <span className="flex items-center gap-1 font-body text-[10px] landscape:text-[9px] sm:text-xs uppercase tracking-[0.12em] text-text-muted-brand">
                  <Coffee size={10} className="text-gold landscape:hidden sm:block" />
                  <span className="hidden landscape:inline">12h–14h</span>
                  <span className="landscape:hidden">Pause 12h — 14h</span>
                </span>
                <div className="h-px flex-1 bg-border-brand" />
              </div>

              {/* Après-midi */}
              {apresMidi.length > 0 && (
                <div>
                  <p className="mb-1.5 landscape:mb-1 font-body text-[11px] landscape:text-[10px] sm:text-xs font-medium uppercase tracking-[0.12em] text-text-muted-brand">
                    Après-midi
                  </p>
                  <div className="grid grid-cols-2 landscape:grid-cols-4 gap-1.5 landscape:gap-1 sm:grid-cols-4 sm:gap-2">
                    {apresMidi.map((heure) => {
                      const reserve = heuresReservees.includes(heure)
                      const isSelected = selectedHeure === heure
                      const heureStr = `${String(heure).padStart(2, "0")}:00`
                      const finMin = (heure * 60 + soinDuree)
                      const finH = Math.floor(finMin / 60)
                      const finM = finMin % 60
                      const finStr = `${String(finH).padStart(2, "0")}:${String(finM).padStart(2, "0")}`

                      return (
                        <button
                          key={heure}
                          disabled={reserve}
                          onClick={() => onSelectHeure(heure)}
                          className={`flex flex-col items-center gap-0.5 border px-2 py-2.5 landscape:py-1.5 sm:px-3 sm:py-3 font-body transition-all duration-200 ${
                            isSelected
                              ? "border-primary-brand bg-primary-brand text-white"
                              : reserve
                                ? "cursor-not-allowed border-border-brand bg-bg-page text-text-muted-brand/40 line-through"
                                : "border-border-brand bg-white text-text-main hover:border-primary-brand hover:text-primary-brand"
                          }`}
                          aria-label={`Créneau de ${heureStr} à ${finStr}${reserve ? " — réservé" : ""}`}
                        >
                          <span className="text-[13px] landscape:text-[12px] sm:text-[14px] font-medium">{heureStr}</span>
                          <span className={`text-[10px] landscape:text-[9px] sm:text-xs ${isSelected ? "text-white/70" : "text-text-muted-brand"}`}>
                            → {finStr}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Aucun créneau */}
              {creneauxLibres === 0 && (
                <div className="py-6 text-center">
                  <p className="font-body text-[14px] text-text-muted-brand">
                    Aucun créneau disponible ce jour.
                  </p>
                  <p className="mt-1 font-body text-[12px] text-text-muted-brand">
                    Essayez un autre jour ou contactez-nous.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
