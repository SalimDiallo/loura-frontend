/**
 * Service API pour la Caisse / Trésorerie (module Inventory).
 *
 * Le backend consolide à la volée les flux (ventes, achats, dépenses) + les
 * apports/retraits (CashAdjustment). Ce service expose :
 * - la liste consolidée des transactions et le résumé (entrées/sorties/solde) ;
 * - le CRUD des apports/retraits.
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
  CashAdjustment,
  CashSummary,
  CashTransaction,
  CreateCashAdjustmentData,
  ListCashAdjustmentsParams,
  ListCashTransactionsParams,
  UpdateCashAdjustmentData,
} from "@/lib/types/inventory";

interface PaginatedResponse<T> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export const cashService = {
  // ── Vue consolidée ──────────────────────────────────────────────────────
  async transactions(orgId: string, params?: ListCashTransactionsParams) {
    return apiClient.get<PaginatedResponse<CashTransaction>>(
      API_ENDPOINTS.INVENTORY.CASH.TRANSACTIONS(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async summary(orgId: string, params?: ListCashTransactionsParams) {
    return apiClient.get<CashSummary>(
      API_ENDPOINTS.INVENTORY.CASH.SUMMARY(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  // ── Apports / retraits ────────────────────────────────────────────────────
  async listAdjustments(orgId: string, params?: ListCashAdjustmentsParams) {
    return apiClient.get<PaginatedResponse<CashAdjustment> | CashAdjustment[]>(
      API_ENDPOINTS.INVENTORY.CASH.ADJUSTMENTS(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async getAdjustment(orgId: string, id: string) {
    return apiClient.get<CashAdjustment>(
      API_ENDPOINTS.INVENTORY.CASH.ADJUSTMENT_DETAIL(orgId, id)
    );
  },

  async createAdjustment(orgId: string, data: CreateCashAdjustmentData) {
    return apiClient.post<{ message: string; data: CashAdjustment }>(
      API_ENDPOINTS.INVENTORY.CASH.ADJUSTMENTS(orgId),
      data
    );
  },

  async updateAdjustment(
    orgId: string,
    id: string,
    data: UpdateCashAdjustmentData
  ) {
    return apiClient.patch<{ message: string; data: CashAdjustment }>(
      API_ENDPOINTS.INVENTORY.CASH.ADJUSTMENT_DETAIL(orgId, id),
      data
    );
  },

  async deleteAdjustment(orgId: string, id: string) {
    return apiClient.delete<{ message: string }>(
      API_ENDPOINTS.INVENTORY.CASH.ADJUSTMENT_DETAIL(orgId, id)
    );
  },
};
