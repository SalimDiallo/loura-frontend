/**
 * Constantes partagées pour le module Core (pays, devises)
 * Format compatible SmartSelector.
 */

import type { SmartSelectorItem } from "@/components/ui/smart-selector";

// ============================================================================
// COUNTRIES
// ============================================================================

export const COUNTRIES: SmartSelectorItem[] = [
  { id: "Guinée", name: "Guinée", subtitle: "Afrique de l'Ouest", group: "Afrique" },
  { id: "Sénégal", name: "Sénégal", subtitle: "Afrique de l'Ouest", group: "Afrique" },
  { id: "Mali", name: "Mali", subtitle: "Afrique de l'Ouest", group: "Afrique" },
  { id: "Côte d'Ivoire", name: "Côte d'Ivoire", subtitle: "Afrique de l'Ouest", group: "Afrique" },
  { id: "Burkina Faso", name: "Burkina Faso", subtitle: "Afrique de l'Ouest", group: "Afrique" },
  { id: "Niger", name: "Niger", subtitle: "Afrique de l'Ouest", group: "Afrique" },
  { id: "Togo", name: "Togo", subtitle: "Afrique de l'Ouest", group: "Afrique" },
  { id: "Bénin", name: "Bénin", subtitle: "Afrique de l'Ouest", group: "Afrique" },
  { id: "Cameroun", name: "Cameroun", subtitle: "Afrique Centrale", group: "Afrique" },
  { id: "Gabon", name: "Gabon", subtitle: "Afrique Centrale", group: "Afrique" },
  { id: "France", name: "France", subtitle: "Europe", group: "Europe" },
  { id: "Belgique", name: "Belgique", subtitle: "Europe", group: "Europe" },
  { id: "Canada", name: "Canada", subtitle: "Amérique du Nord", group: "Amérique" },
  { id: "Suisse", name: "Suisse", subtitle: "Europe", group: "Europe" },
  { id: "Autre", name: "Autre" },
];

// ============================================================================
// CURRENCIES
// ============================================================================

export const CURRENCIES: SmartSelectorItem[] = [
  { id: "GNF", name: "Franc guinéen", subtitle: "GNF" },
  { id: "XOF", name: "Franc CFA (UEMOA)", subtitle: "XOF" },
  { id: "XAF", name: "Franc CFA (CEMAC)", subtitle: "XAF" },
  { id: "EUR", name: "Euro", subtitle: "EUR" },
  { id: "USD", name: "Dollar américain", subtitle: "USD" },
  { id: "CAD", name: "Dollar canadien", subtitle: "CAD" },
  { id: "CHF", name: "Franc suisse", subtitle: "CHF" },
];
