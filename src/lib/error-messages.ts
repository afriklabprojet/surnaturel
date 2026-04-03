// ─── Dictionnaire de messages d'erreur humanisés ─────────────────
// Remplace les messages techniques par des variantes chaleureuses et brand-consistent.

export const ERREURS = {
  // ─── Authentification ──────────────────────────────────────────
  NON_AUTHENTIFIE: "Connectez-vous pour accéder à cette fonctionnalité.",
  SESSION_EXPIREE: "Votre session a expiré. Reconnectez-vous pour continuer.",
  ACCES_REFUSE: "Vous n'avez pas accès à cette section.",
  IDENTIFIANTS_INVALIDES: "Email ou mot de passe incorrect. Vérifiez vos informations.",
  COMPTE_DESACTIVE: "Votre compte est désactivé. Contactez-nous pour en savoir plus.",

  // ─── Profil / Compte ──────────────────────────────────────────
  TELEPHONE_MANQUANT: "Ajoutez votre numéro de téléphone dans votre profil avant de continuer.",
  TELEPHONE_INVALIDE: "Numéro de téléphone non reconnu. Vérifiez votre numéro (ex : 07 00 00 00 00).",
  EMAIL_DEJA_UTILISE: "Cet email est déjà associé à un compte. Essayez de vous connecter.",
  PROFIL_INCOMPLET: "Complétez votre profil pour accéder à toutes les fonctionnalités.",

  // ─── Rendez-vous ──────────────────────────────────────────────
  RDV_CRENEAU_INDISPONIBLE: "Ce créneau n'est plus disponible. Choisissez un autre horaire.",
  RDV_DEJA_ANNULE: "Ce rendez-vous a déjà été annulé.",
  RDV_INTROUVABLE: "Rendez-vous introuvable. Il a peut-être été modifié.",
  RDV_ANNULATION_TARDIVE: "L'annulation n'est plus possible à moins de 24h du rendez-vous.",
  RDV_LIMITE_ATTEINTE: "Vous avez atteint le nombre maximum de rendez-vous en attente.",

  // ─── Boutique / Commandes ─────────────────────────────────────
  PRODUIT_INTROUVABLE: "Ce produit n'est plus disponible.",
  STOCK_INSUFFISANT: "Stock insuffisant pour cette quantité. Réduisez la quantité ou choisissez un autre produit.",
  PANIER_VIDE: "Votre panier est vide. Ajoutez des produits avant de commander.",
  COMMANDE_INTROUVABLE: "Commande introuvable. Vérifiez votre historique de commandes.",
  MONTANT_MINIMUM: "Le montant minimum de commande n'est pas atteint.",

  // ─── Paiement ─────────────────────────────────────────────────
  PAIEMENT_ECHOUE: "Le paiement n'a pas abouti. Vérifiez vos informations et réessayez.",
  PAIEMENT_EXPIRE: "La session de paiement a expiré. Relancez votre commande.",
  PAIEMENT_DEJA_EFFECTUE: "Ce paiement a déjà été effectué.",

  // ─── Avis ─────────────────────────────────────────────────────
  AVIS_DEJA_LAISSE: "Vous avez déjà donné votre avis pour ce soin.",
  AVIS_NOTE_REQUISE: "Veuillez attribuer une note entre 1 et 5.",

  // ─── Communication ────────────────────────────────────────────
  MESSAGE_VIDE: "Votre message est vide. Écrivez quelque chose avant d'envoyer.",
  DESTINATAIRE_INTROUVABLE: "Ce destinataire n'existe pas.",

  // ─── Générique ────────────────────────────────────────────────
  REQUETE_INVALIDE: "Quelque chose ne va pas avec votre demande. Réessayez.",
  ERREUR_INTERNE: "Un souci technique est survenu. Réessayez dans quelques instants.",
  TROP_DE_REQUETES: "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
  DONNEES_INVALIDES: "Certaines informations sont incorrectes. Vérifiez et réessayez.",
  RESSOURCE_INTROUVABLE: "Cette page ou ressource n'existe pas.",
} as const

export type ErreurCode = keyof typeof ERREURS

export function getErreur(code: ErreurCode): string {
  return ERREURS[code]
}
