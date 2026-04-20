/**
 * Constantes partagées pour le module Core (pays, devises)
 * Format compatible QuickSelect.
 */

import type { QuickSelectItem } from "@/components/ui/quick-select";

// ============================================================================
// COUNTRIES
// ============================================================================

export const COUNTRIES: QuickSelectItem[] = [
  { id: "Guinée", name: "Guinée", subtitle: "Afrique de l'Ouest" },
  { id: "Sénégal", name: "Sénégal", subtitle: "Afrique de l'Ouest" },
  { id: "Mali", name: "Mali", subtitle: "Afrique de l'Ouest" },
  { id: "Côte d'Ivoire", name: "Côte d'Ivoire", subtitle: "Afrique de l'Ouest" },
  { id: "Burkina Faso", name: "Burkina Faso", subtitle: "Afrique de l'Ouest" },
  { id: "Niger", name: "Niger", subtitle: "Afrique de l'Ouest" },
  { id: "Togo", name: "Togo", subtitle: "Afrique de l'Ouest" },
  { id: "Bénin", name: "Bénin", subtitle: "Afrique de l'Ouest" },
  { id: "Cameroun", name: "Cameroun", subtitle: "Afrique Centrale" },
  { id: "Gabon", name: "Gabon", subtitle: "Afrique Centrale" },
  { id: "France", name: "France", subtitle: "Europe" },
  { id: "Belgique", name: "Belgique", subtitle: "Europe" },
  { id: "Canada", name: "Canada", subtitle: "Amérique du Nord" },
  { id: "Suisse", name: "Suisse", subtitle: "Europe" },
  { id: "Autre", name: "Autre" },
];

// ============================================================================
// CURRENCIES
// ============================================================================

export const CURRENCIES: QuickSelectItem[] = [
  { id: "GNF", name: "Franc guinéen", subtitle: "GNF" },
  { id: "XOF", name: "Franc CFA (UEMOA)", subtitle: "XOF" },
  { id: "XAF", name: "Franc CFA (CEMAC)", subtitle: "XAF" },
  { id: "EUR", name: "Euro", subtitle: "EUR" },
  { id: "USD", name: "Dollar américain", subtitle: "USD" },
  { id: "CAD", name: "Dollar canadien", subtitle: "CAD" },
  { id: "CHF", name: "Franc suisse", subtitle: "CHF" },
];
