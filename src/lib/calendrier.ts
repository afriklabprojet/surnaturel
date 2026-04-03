// Génération de liens calendrier (Google Calendar, Apple Calendar .ics)
import { getConfig } from "@/lib/config"

interface RDVCalendrier {
  id: string
  soin: string
  date: Date
  duree: number // en minutes
  adresse?: string
}

const ADRESSE_CENTRE = `Le Surnaturel de Dieu, Abidjan, Côte d'Ivoire`

function formatDateICS(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")
}

export async function genererLienGoogle(rdv: RDVCalendrier): Promise<string> {
  const { nomCentre, ville, pays } = await getConfig()
  const adresseCentre = `${nomCentre}, ${ville}, ${pays}`
  const debut = formatDateICS(rdv.date)
  const fin = formatDateICS(new Date(rdv.date.getTime() + rdv.duree * 60000))
  const adresse = rdv.adresse || adresseCentre

  const titre = encodeURIComponent(`Soin : ${rdv.soin} — Le Surnaturel de Dieu`)
  const details = encodeURIComponent(
    "Rendez-vous au centre de bien-être Le Surnaturel de Dieu.\n\n" +
    "N'oubliez pas de présenter votre QR code à l'arrivée."
  )
  const location = encodeURIComponent(adresse)

  return (
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${titre}` +
    `&dates=${debut}/${fin}` +
    `&details=${details}` +
    `&location=${location}`
  )
}

export async function genererFichierICS(rdv: RDVCalendrier): Promise<string> {
  const { nomCentre, ville, pays } = await getConfig()
  const adresseCentre = `${nomCentre}, ${ville}, ${pays}`
  const debut = formatDateICS(rdv.date)
  const fin = formatDateICS(new Date(rdv.date.getTime() + rdv.duree * 60000))
  const maintenant = formatDateICS(new Date())
  const adresse = rdv.adresse || adresseCentre

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Le Surnaturel de Dieu//RDV//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${rdv.id}@lesurnatureldedieu.com`,
    `DTSTAMP:${maintenant}`,
    `DTSTART:${debut}`,
    `DTEND:${fin}`,
    `SUMMARY:${rdv.soin} — Le Surnaturel de Dieu`,
    `LOCATION:${adresse}`,
    `DESCRIPTION:Rendez-vous au centre de bien-être Le Surnaturel de Dieu.\\nN'oubliez pas de présenter votre QR code à l'arrivée.`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

export async function genererLienOutlook(rdv: RDVCalendrier): Promise<string> {
  const { nomCentre, ville, pays } = await getConfig()
  const adresseCentre = `${nomCentre}, ${ville}, ${pays}`
  const debut = rdv.date.toISOString()
  const fin = new Date(rdv.date.getTime() + rdv.duree * 60000).toISOString()
  const adresse = rdv.adresse || adresseCentre

  const titre = encodeURIComponent(`Soin : ${rdv.soin} — Le Surnaturel de Dieu`)
  const details = encodeURIComponent(
    "Rendez-vous au centre de bien-être Le Surnaturel de Dieu."
  )
  const location = encodeURIComponent(adresse)

  return (
    `https://outlook.live.com/calendar/0/deeplink/compose?` +
    `subject=${titre}` +
    `&startdt=${debut}` +
    `&enddt=${fin}` +
    `&body=${details}` +
    `&location=${location}`
  )
}
