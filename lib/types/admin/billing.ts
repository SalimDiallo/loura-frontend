/**
 * Types pour l'administration des abonnements (superadmin only).
 *
 * Ces types sont alignés sur les serializers
 * ``core.serializers.admin_billing_serializer``.
 */

import type {
  BillingEvent,
  PlanCode,
  Subscription,
  SubscriptionCycle,
  SubscriptionStatus,
} from "@/lib/types/core";

/**
 * Ligne de la liste ``/admin/users-billing/``. Pas de Plan/Subscription
 * complet ici — uniquement les champs nécessaires à l'affichage du tableau.
 */
export interface AdminUserBillingRow {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  last_login: string | null;
  /** Code du plan de la sub active courante (null si pas de sub active). */
  plan_code: PlanCode | string | null;
  plan_name: string | null;
  sub_status: SubscriptionStatus | null;
  cycle: SubscriptionCycle | null;
  current_period_end: string | null;
  auto_renew: boolean;
  has_active_sub: boolean;
}

/** Détail user retourné par ``GET /admin/users-billing/{id}/``. */
export interface AdminUserBillingDetail {
  user: {
    id: string;
    email: string;
    full_name: string;
    is_active: boolean;
    is_superuser: boolean;
    created_at: string;
    last_login: string | null;
  };
  subscription: Subscription | null;
  events: BillingEvent[];
}

/** Payload pour POST .../change-plan/ (admin, sans paiement). */
export interface AdminChangePlanPayload {
  plan_code: PlanCode | string;
  cycle: SubscriptionCycle;
  reason?: string;
}

/** Payload pour POST .../grant-months/ — N mois offerts (1..24). */
export interface GrantMonthsPayload {
  months: number;
  reason?: string;
}

/** Payload pour POST .../cancel/ (admin force l'annulation). */
export interface AdminCancelSubPayload {
  reason?: string;
}

/** Filtres de la liste ``/admin/users-billing/``. */
export interface AdminUsersBillingListFilters {
  search?: string;
  plan_code?: PlanCode | string;
  status?: SubscriptionStatus;
  has_sub?: "true" | "false";
  page?: number;
  page_size?: number | "all";
}

/** Réponse paginée standard du backend (cf. ``loura.pagination``). */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  total_pages: number;
  current_page: number;
  results: T[];
}
