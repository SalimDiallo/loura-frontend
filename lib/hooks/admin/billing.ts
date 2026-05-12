/**
 * Hooks TanStack Query pour l'administration des abonnements (superadmin).
 *
 * Tous ces hooks tapent sur les endpoints ``/core/admin/users-billing/...``
 * qui exigent ``is_superuser=True``. À utiliser uniquement dans les pages
 * sous ``/admin``.
 */

import { adminBillingService } from "@/lib/services/admin";
import type {
  AdminChangePlanPayload,
  AdminCancelSubPayload,
  AdminUsersBillingListFilters,
  GrantMonthsPayload,
} from "@/lib/types/admin";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const adminBillingKeys = {
  all: ["admin", "users-billing"] as const,
  list: (filters: AdminUsersBillingListFilters) =>
    ["admin", "users-billing", "list", filters] as const,
  detail: (userId: string) =>
    ["admin", "users-billing", "detail", userId] as const,
};

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Liste paginée des users + leur sub active. Réactif aux filtres. */
export function useAdminUsersBilling(filters: AdminUsersBillingListFilters = {}) {
  return useQuery({
    queryKey: adminBillingKeys.list(filters),
    queryFn: () => adminBillingService.listUsersBilling(filters),
    // Garde le résultat pendant 30 s : utile quand on ouvre/ferme le drawer.
    staleTime: 30_000,
  });
}

/** Détail consolidé d'un user (sub + 30 derniers events). */
export function useAdminUserBilling(userId: string | null | undefined) {
  return useQuery({
    queryKey: adminBillingKeys.detail(userId ?? ""),
    queryFn: () => adminBillingService.getUserBilling(userId as string),
    enabled: !!userId,
    staleTime: 10_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

function useInvalidateAdminBilling() {
  const qc = useQueryClient();
  return (userId?: string) => {
    qc.invalidateQueries({ queryKey: adminBillingKeys.all });
    if (userId) {
      qc.invalidateQueries({ queryKey: adminBillingKeys.detail(userId) });
    }
  };
}

/** Change le plan d'un user sans paiement Djomy (faveur admin). */
export function useAdminChangePlan(userId: string) {
  const invalidate = useInvalidateAdminBilling();
  return useMutation({
    mutationFn: (payload: AdminChangePlanPayload) =>
      adminBillingService.changePlan(userId, payload),
    onSuccess: () => invalidate(userId),
  });
}

/** Offre N mois gratuits en prolongeant la sub courante. */
export function useAdminGrantMonths(userId: string) {
  const invalidate = useInvalidateAdminBilling();
  return useMutation({
    mutationFn: (payload: GrantMonthsPayload) =>
      adminBillingService.grantMonths(userId, payload),
    onSuccess: () => invalidate(userId),
  });
}

/** Annule la sub courante au nom de l'admin. */
export function useAdminCancelSub(userId: string) {
  const invalidate = useInvalidateAdminBilling();
  return useMutation({
    mutationFn: (payload: AdminCancelSubPayload = {}) =>
      adminBillingService.cancel(userId, payload),
    onSuccess: () => invalidate(userId),
  });
}
