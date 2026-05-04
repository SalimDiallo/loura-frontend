/**
 * Service API pour les abonnements et la facturation.
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
    BillingEvent,
    CancelSubscriptionResponse,
    ChangePlanData,
    ChangePlanResponse,
    DjomyTransaction,
    Plan,
    Subscription,
} from "@/lib/types/core";

export const billingService = {
  async listPlans() {
    return apiClient.get<Plan[]>(API_ENDPOINTS.CORE.BILLING.PLANS);
  },

  async getMySubscription() {
    return apiClient.get<Subscription>(
      API_ENDPOINTS.CORE.BILLING.MY_SUBSCRIPTION
    );
  },

  async changePlan(data: ChangePlanData) {
    return apiClient.post<ChangePlanResponse>(
      API_ENDPOINTS.CORE.BILLING.CHANGE_PLAN,
      data
    );
  },

  async cancel() {
    return apiClient.post<CancelSubscriptionResponse>(
      API_ENDPOINTS.CORE.BILLING.CANCEL,
      {}
    );
  },

  /**
   * Active ou désactive l'auto-renouvellement sur l'abonnement courant.
   * Le backend refuse l'activation pour un plan Free ou une sub sans
   * infos de paiement mémorisées (il faut alors repasser par `changePlan`).
   */
  async setAutoRenew(enabled: boolean) {
    return apiClient.patch<Subscription>(
      API_ENDPOINTS.CORE.BILLING.AUTO_RENEW,
      { enabled }
    );
  },

  async listEvents() {
    return apiClient.get<BillingEvent[]>(API_ENDPOINTS.CORE.BILLING.EVENTS);
  },

  async getTransactionStatus(reference: string) {
    return apiClient.get<DjomyTransaction>(
      API_ENDPOINTS.CORE.BILLING.TRANSACTION_STATUS(reference)
    );
  },
};
