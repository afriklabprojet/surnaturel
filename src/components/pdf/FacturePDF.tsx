"use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"

// Enregistrer les polices (fallback sur Helvetica pour PDF)
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica", fontWeight: "normal" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1A1A1A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#B8972A",
  },
  logo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D7A1F",
  },
  logoSub: {
    fontSize: 8,
    color: "#666666",
    marginTop: 4,
  },
  factureInfo: {
    textAlign: "right",
  },
  factureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D7A1F",
  },
  factureNum: {
    fontSize: 10,
    color: "#666666",
    marginTop: 4,
  },
  factureDate: {
    fontSize: 10,
    color: "#666666",
    marginTop: 2,
  },
  parties: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  partyBox: {
    width: "45%",
  },
  partyTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  partyName: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
  },
  partyLine: {
    fontSize: 10,
    color: "#333333",
    marginBottom: 2,
  },
  table: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#FAFAF7",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  tableCell: {
    fontSize: 10,
  },
  colDescription: {
    width: "50%",
  },
  colQty: {
    width: "15%",
    textAlign: "center",
  },
  colPrix: {
    width: "17%",
    textAlign: "right",
  },
  colTotal: {
    width: "18%",
    textAlign: "right",
  },
  totals: {
    marginLeft: "auto",
    width: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  totalLabel: {
    fontSize: 10,
    color: "#666666",
  },
  totalValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    backgroundColor: "#2D7A1F",
    paddingHorizontal: 10,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#666666",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  footerLine: {
    marginBottom: 2,
  },
  paymentInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#FAFAF7",
  },
  paymentTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#2D7A1F",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paymentLine: {
    fontSize: 9,
    marginBottom: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#2D7A1F",
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "bold",
    marginTop: 8,
  },
})

export interface LigneFacture {
  description: string
  quantite: number
  prixUnitaire: number
  total: number
}

export interface FactureData {
  numero: string
  date: string
  client: {
    nom: string
    email: string
    telephone?: string
    adresse?: string
    ville?: string
  }
  lignes: LigneFacture[]
  sousTotal: number
  remise?: number
  fraisLivraison?: number
  total: number
  statut: "PAYEE" | "EN_ATTENTE" | "ANNULEE"
  methodePaiement?: string
}

interface FacturePDFProps {
  data: FactureData
}

export default function FacturePDF({ data }: FacturePDFProps) {
  const formatPrix = (prix: number) =>
    prix.toLocaleString("fr") + " FCFA"

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>Le Surnaturel de Dieu</Text>
            <Text style={styles.logoSub}>Institut de beauté</Text>
          </View>
          <View style={styles.factureInfo}>
            <Text style={styles.factureTitle}>FACTURE</Text>
            <Text style={styles.factureNum}>N° {data.numero}</Text>
            <Text style={styles.factureDate}>Date : {data.date}</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.parties}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Émetteur</Text>
            <Text style={styles.partyName}>Le Surnaturel de Dieu</Text>
            <Text style={styles.partyLine}>Abidjan, Côte d&apos;Ivoire</Text>
            <Text style={styles.partyLine}>contact@surnatureldedieu.com</Text>
            <Text style={styles.partyLine}>+225 XX XX XX XX</Text>
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Client</Text>
            <Text style={styles.partyName}>{data.client.nom}</Text>
            <Text style={styles.partyLine}>{data.client.email}</Text>
            {data.client.telephone && (
              <Text style={styles.partyLine}>{data.client.telephone}</Text>
            )}
            {data.client.adresse && (
              <Text style={styles.partyLine}>{data.client.adresse}</Text>
            )}
            {data.client.ville && (
              <Text style={styles.partyLine}>{data.client.ville}</Text>
            )}
          </View>
        </View>

        {/* Tableau des articles */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrix]}>
              Prix unit.
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>

          {data.lignes.map((ligne, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDescription]}>
                {ligne.description}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>
                {ligne.quantite}
              </Text>
              <Text style={[styles.tableCell, styles.colPrix]}>
                {formatPrix(ligne.prixUnitaire)}
              </Text>
              <Text style={[styles.tableCell, styles.colTotal]}>
                {formatPrix(ligne.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total</Text>
            <Text style={styles.totalValue}>{formatPrix(data.sousTotal)}</Text>
          </View>

          {data.remise && data.remise > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Remise</Text>
              <Text style={styles.totalValue}>-{formatPrix(data.remise)}</Text>
            </View>
          )}

          {data.fraisLivraison && data.fraisLivraison > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Frais de livraison</Text>
              <Text style={styles.totalValue}>
                {formatPrix(data.fraisLivraison)}
              </Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL TTC</Text>
            <Text style={styles.grandTotalValue}>{formatPrix(data.total)}</Text>
          </View>
        </View>

        {/* Informations de paiement */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>Informations de paiement</Text>
          <Text style={styles.paymentLine}>
            Statut :{" "}
            {data.statut === "PAYEE"
              ? "Payée"
              : data.statut === "EN_ATTENTE"
              ? "En attente"
              : "Annulée"}
          </Text>
          {data.methodePaiement && (
            <Text style={styles.paymentLine}>
              Méthode : {data.methodePaiement}
            </Text>
          )}
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text style={styles.footerLine}>
            Le Surnaturel de Dieu - Institut de beauté
          </Text>
          <Text style={styles.footerLine}>
            Merci pour votre confiance !
          </Text>
        </View>
      </Page>
    </Document>
  )
}
