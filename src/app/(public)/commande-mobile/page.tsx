import { redirect } from "next/navigation"

/**
 * /commande-mobile est conservé pour les anciens liens bookmarkés.
 * Le checkout est désormais unifié sur /checkout (responsive).
 */
export default function PageCommandeMobile() {
  redirect("/panier")
}
