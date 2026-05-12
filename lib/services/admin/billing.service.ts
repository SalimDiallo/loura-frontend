/**
 * Service API pour l'administration des abonnements (superadmin uniquement).
 *
 * Les endpoints exigent ``is_superuser=True`` côté backend ; un user normal
 * obtient un 403 — le layout ``/admin`` redirige déjà côté frontend, mais
 * le check serveur reste la source de vérité.
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
  AdminCancelSubPayload,
  AdminChangePlanPayload,
  AdminUserBillingDetail,
  AdminUserBillingRow,
  AdminUsersBillingListFilters,
  GrantMonthsPayload,
  PaginatedResponse,
} from "@/lib/types/admin";

function buildQuery(filters: AdminUsersBillingListFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.plan_code) params.set("plan_code", filters.plan_code);
  if (filters.status) params.set("status", filters.status);
  if (filters.has_sub) params.set("has_sub", filters.has_sub);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.page_size) params.set("page_size", String(filters.page_size));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const adminBillingService = {
  async listUsersBilling(filters: AdminUsersBillingListFilters = {}) {
    return apiClient.get<PaginatedResponse<AdminUserBillingRow>>(
      `${API_ENDPOINTS.CORE.ADMIN_BILLING.USERS_LIST}${buildQuery(filters)}`
    );
  },

  async getUserBilling(userId: string) {
    return apiClient.get<AdminUserBillingDetail>(
      API_ENDPOINTS.CORE.ADMIN_BILLING.USER_DETAIL(userId)
    );
  },

  async changePlan(userId: string, payload: AdminChangePlanPayload) {
    return apiClient.post<AdminUserBillingDetail>(
      API_ENDPOINTS.CORE.ADMIN_BILLING.CHANGE_PLAN(userId),
      payload
    );
  },

  async grantMonths(userId: string, payload: GrantMonthsPayload) {
    return apiClient.post<AdminUserBillingDetail>(
      API_ENDPOINTS.CORE.ADMIN_BILLING.GRANT_MONTHS(userId),
      payload
    );
  },

  async cancel(userId: string, payload: AdminCancelSubPayload = {}) {
    return apiClient.post<AdminUserBillingDetail>(
      API_ENDPOINTS.CORE.ADMIN_BILLING.CANCEL(userId),
      payload
    );
  },
};
