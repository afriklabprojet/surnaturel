"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
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

// Créneaux 08h–18h
const CRENEAUX = Array.from({ length: 11 }, (_, i) => 8 + i)

interface CalendrierRDVProps {
  soinId: string
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

export default function CalendrierRDV({
  soinId,
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

  function isPrevDisabled(): boolean {
    return (
      currentYear === today.getFullYear() && currentMonth <= today.getMonth()
    )
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  return (
    <div className="space-y-6">
      {/* Calendrier mensuel */}
      <div
        className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
        style={{ borderRadius: "12px" }}
      >
        {/* Header mois */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={prevMonth}
            disabled={isPrevDisabled()}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-primary-light disabled:opacity-30"
            aria-label="Mois précédent"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="font-heading text-lg font-semibold text-gray-800">
            {MOIS[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-primary-light"
            aria-label="Mois suivant"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Jours de la semaine */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {JOURS.map((jour) => (
            <div
              key={jour}
              className="py-1 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              {jour}
            </div>
          ))}
        </div>

        {/* Grille jours */}
        <div className="grid grid-cols-7 gap-1">
          {/* Cases vides avant le premier jour */}
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dateStr = formatDateISO(currentYear, currentMonth, day)
            const past = isDatePast(day)
            const isSelected = selectedDate === dateStr
            const isSunday =
              new Date(currentYear, currentMonth, day).getDay() === 0

            return (
              <button
                key={day}
                disabled={past || isSunday}
                onClick={() => onSelectDate(dateStr)}
                className={`flex h-9 w-full items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 ${
                  isSelected
                    ? "bg-primary-brand text-white shadow-sm"
                    : past || isSunday
                      ? "cursor-not-allowed text-gray-200"
                      : "text-gray-800 hover:bg-primary-light hover:text-primary-brand"
                }`}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>

      {/* Créneaux horaires */}
      {selectedDate && (
        <div
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
          style={{ borderRadius: "12px" }}
        >
          <h3 className="mb-4 font-heading text-base font-semibold text-gray-800">
            Créneaux disponibles
          </h3>

          {loadingCreneaux ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-brand border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {CRENEAUX.map((heure) => {
                const reserve = heuresReservees.includes(heure)
                const isSelected = selectedHeure === heure
                const heureStr = `${String(heure).padStart(2, "0")}:00`

                return (
                  <button
                    key={heure}
                    disabled={reserve}
                    onClick={() => onSelectHeure(heure)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? "border-primary-brand bg-primary-brand text-white"
                        : reserve
                          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-200 line-through"
                          : "border-gray-200 bg-white text-gray-800 hover:border-primary-brand hover:text-primary-brand"
                    }`}
                  >
                    {heureStr}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
