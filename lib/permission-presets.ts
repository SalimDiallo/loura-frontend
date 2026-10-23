/**
 * Profils métier (presets de permissions).
 *
 * Objectif : simplicité. Plutôt que de cocher une à une des dizaines de
 * permissions, l'utilisateur clique sur un profil (« Caisse / Vente »,
 * « Ressources humaines »…) qui active d'un coup un ensemble cohérent.
 * On peut en **combiner plusieurs** (chaque profil s'ajoute à la sélection).
 *
 * Ces profils ne listent que les permissions "de tête" : les dépendances
 * (ex. `view` requis par un `manage`) sont ajoutées automatiquement par
 * `resolvePermissionSelection`. Inutile donc de lister les `view_*` associés.
 *
 * Purement côté front : aucun impact backend. Les codenames doivent
 * correspondre au `PermissionRegistry`.
 */

import { PERMISSIONS } from "./permissions";
import type { Permission } from "./types";

export interface PermissionPreset {
  /** Identifiant stable (sert aussi de clé d'icône/couleur dans l'UI). */
  id: string;
  label: string;
  /** Phrase courte : ce que ce profil permet concrètement. */
  description: string;
  /** Permissions "de tête" ; les dépendances sont résolues ensuite. */
  codenames: readonly string[];
}

export const PERMISSION_PRESETS: readonly PermissionPreset[] = [
  {
    id: "pos",
    label: "Caisse / Vente",
    description: "Encaisser des ventes, voir le stock et gérer les clients.",
    codenames: [
      PERMISSIONS.SALES.MANAGE,
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.STOCK.VIEW,
      PERMISSIONS.CUSTOMERS.MANAGE,
      PERMISSIONS.CASH.CASHIER,
      PERMISSIONS.WAREHOUSES.VIEW,
    ],
  },
  {
    id: "stock",
    label: "Gestion de stock",
    description:
      "Gérer produits, catégories, entrepôts, mouvements et approvisionnements.",
    codenames: [
      PERMISSIONS.PRODUCTS.MANAGE,
      PERMISSIONS.PRODUCT_CATEGORIES.MANAGE,
      PERMISSIONS.WAREHOUSES.MANAGE,
      PERMISSIONS.STOCK.MANAGE,
      PERMISSIONS.SUPPLIERS.MANAGE,
      PERMISSIONS.PURCHASE_ORDERS.MANAGE,
    ],
  },
  {
    id: "accounting",
    label: "Comptabilité",
    description:
      "Consulter les rapports financiers, la trésorerie et les créances.",
    codenames: [
      PERMISSIONS.ACCOUNTING.VIEW_REPORTS,
      PERMISSIONS.ACCOUNTING.VIEW_PNL,
      PERMISSIONS.ACCOUNTING.VIEW_TREASURY,
      PERMISSIONS.ACCOUNTING.VIEW_RECEIVABLES,
      PERMISSIONS.ACCOUNTING.EXPORT,
      PERMISSIONS.EXPENSES.VIEW,
      PERMISSIONS.CASH.VIEW,
      PERMISSIONS.SALES.VIEW,
      PERMISSIONS.INVENTORY_REPORTS.VIEW,
    ],
  },
  {
    id: "hr",
    label: "Ressources humaines",
    description:
      "Gérer les employés, contrats, paies, avances et congés.",
    codenames: [
      PERMISSIONS.HR.MANAGE_EMPLOYEES,
      PERMISSIONS.HR.INVITE_EMPLOYEES,
      PERMISSIONS.CONTRACTS.MANAGE,
      PERMISSIONS.PAYMENTS.MANAGE,
      PERMISSIONS.PAYMENTS.APPROVE,
      PERMISSIONS.ADVANCES.REVIEW,
      PERMISSIONS.LEAVES.REVIEW,
      PERMISSIONS.LEAVES.MANAGE_BALANCES,
    ],
  },
  {
    id: "services",
    label: "Prestations / Services",
    description:
      "Gérer le catalogue de services, les inscriptions et leurs paiements.",
    codenames: [
      PERMISSIONS.SERVICE_CATEGORIES.MANAGE,
      PERMISSIONS.SERVICES.MANAGE,
      PERMISSIONS.SERVICE_MODULES.MANAGE,
      PERMISSIONS.SERVICE_ENROLLMENTS.MANAGE,
      PERMISSIONS.SERVICE_ENROLLMENTS.ASSIGN_MODULES,
      PERMISSIONS.SERVICE_ENROLLMENTS.UPDATE_MODULE_STATUS,
      PERMISSIONS.SERVICE_TRANSACTIONS.MANAGE,
      PERMISSIONS.SERVICE_TRANSACTIONS.CONFIRM,
      PERMISSIONS.SERVICE_REPORTS.VIEW,
    ],
  },
  {
    id: "readonly",
    label: "Observateur",
    description: "Lecture seule des principaux modules, sans rien modifier.",
    codenames: [
      PERMISSIONS.CORE.VIEW_ORGANIZATION,
      PERMISSIONS.HR.VIEW_EMPLOYEES,
      PERMISSIONS.PRODUCTS.VIEW,
      PERMISSIONS.STOCK.VIEW,
      PERMISSIONS.SALES.VIEW,
      PERMISSIONS.CUSTOMERS.VIEW,
      PERMISSIONS.SERVICES.VIEW,
      PERMISSIONS.SERVICE_ENROLLMENTS.VIEW,
      PERMISSIONS.ACCOUNTING.VIEW_REPORTS,
    ],
  },
] as const;

/**
 * Convertit les codenames d'un profil en ids présents dans la liste fournie
 * (ignore ceux qui n'existent pas dans l'organisation courante).
 */
export function presetPermissionIds(
  preset: PermissionPreset,
  permissions: Permission[]
): string[] {
  const codeToId = new Map(permissions.map((p) => [p.codename, p.id]));
  return preset.codenames
    .map((c) => codeToId.get(c))
    .filter((id): id is string => Boolean(id));
}

/**
 * État d'un profil vis-à-vis de la sélection courante :
 *   - "full"    : toutes ses permissions sont déjà actives
 *   - "partial" : certaines seulement
 *   - "none"    : aucune
 */
export function presetState(
  preset: PermissionPreset,
  selectedIds: string[],
  permissions: Permission[]
): "full" | "partial" | "none" {
  const ids = presetPermissionIds(preset, permissions);
  if (ids.length === 0) return "none";
  const sel = new Set(selectedIds);
  const active = ids.filter((id) => sel.has(id)).length;
  if (active === 0) return "none";
  if (active === ids.length) return "full";
  return "partial";
}
