/**
 * Service API pour les dépenses (module Inventory).
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
  CreateExpenseData,
  Expense,
  ExpensesAnalyticsResponse,
  ListExpensesParams,
  UpdateExpenseData,
} from "@/lib/types/inventory";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const expensesService = {
  async list(orgId: string, params?: ListExpensesParams) {
    return apiClient.get<PaginatedResponse<Expense> | Expense[]>(
      API_ENDPOINTS.INVENTORY.EXPENSES.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async getById(orgId: string, id: string) {
    return apiClient.get<Expense>(
      API_ENDPOINTS.INVENTORY.EXPENSES.DETAIL(orgId, id)
    );
  },

  async create(orgId: string, data: CreateExpenseData) {
    return apiClient.post<{ message: string; data: Expense }>(
      API_ENDPOINTS.INVENTORY.EXPENSES.CREATE(orgId),
      data
    );
  },

  async update(orgId: string, id: string, data: UpdateExpenseData) {
    return apiClient.patch<{ message: string; data: Expense }>(
      API_ENDPOINTS.INVENTORY.EXPENSES.UPDATE(orgId, id),
      data
    );
  },

  async delete(orgId: string, id: string) {
    return apiClient.delete<{ message: string }>(
      API_ENDPOINTS.INVENTORY.EXPENSES.DELETE(orgId, id)
    );
  },

  async analytics(
    orgId: string,
    params?: { from?: string; to?: string }
  ) {
    return apiClient.get<ExpensesAnalyticsResponse>(
      API_ENDPOINTS.INVENTORY.ANALYTICS.EXPENSES(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },
};
