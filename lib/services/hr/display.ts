/**
 * Helpers d'affichage partagés pour les objets HR.
 *
 * Rassemble les petites fonctions de formatage réutilisées dans plusieurs
 * pages (listes, détails, widgets) — notamment pour harmoniser l'affichage
 * du reviewer/approbateur d'une demande (congé, avance, paiement) lorsque
 * celui-ci peut être ``null`` (cas du propriétaire AdminUser qui n'a pas
 * de Membership dans l'organisation).
 */

import type { Membership, ReviewerInfo } from "@/lib/types";

/**
 * Retourne le nom lisible d'un membership (prénom + nom, email en fallback).
 */
export function getMemberName(m?: Membership | null): string {
  if (!m) return "";
  const first = m.employee?.user?.first_name ?? "";
  const last = m.employee?.user?.last_name ?? "";
  const full = `${first} ${last}`.trim();
  if (full) return full;
  return m.employee?.user?.email ?? "";
}

/**
 * Retourne le libellé à afficher pour un reviewer / approbateur (texte seul).
 *
 * Priorités :
 * 1. Si ``reviewer`` (``ReviewerInfo``, côté API unifié) est fourni → son
 *    ``name`` est utilisé (membre OU propriétaire).
 * 2. Sinon, si un Membership legacy est passé → son nom.
 * 3. Sinon, si ``reviewedAt`` est renseigné → "Propriétaire" (fallback pour
 *    les endpoints n'ayant pas encore le champ ``reviewer``).
 * 4. Sinon : ``null``.
 *
 * Pour un affichage riche avec tooltip, préférer ``<ReviewerBadge />``.
 */
export function getReviewerLabel(
  reviewer: Membership | ReviewerInfo | null | undefined,
  reviewedAt: string | null | undefined,
): string | null {
  if (reviewer && typeof reviewer === "object") {
    // ReviewerInfo : possède les clés `type` + `name`
    if ("type" in reviewer && typeof reviewer.name === "string") {
      return reviewer.name || (reviewer.is_owner ? "Propriétaire" : null);
    }
    // Membership legacy
    if ("employee" in reviewer) {
      const name = getMemberName(reviewer as Membership);
      return name || null;
    }
  }
  if (reviewedAt) return "Propriétaire";
  return null;
}
