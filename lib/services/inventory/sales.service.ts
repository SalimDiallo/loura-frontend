/**
 * Service API pour les ventes (Sales).
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
  CreateSaleData,
  CreateSalePaymentData,
  CreateSalePaymentResponse,
  ListSalesParams,
  Sale,
  SaleInstallment,
  SalePayment,
  SaleResponse,
  UpdateSaleData,
} from "@/lib/types/inventory";

export const salesService = {
  async getAll(orgId: string, params?: ListSalesParams) {
    return apiClient.get<Sale[]>(API_ENDPOINTS.INVENTORY.SALES.LIST(orgId), {
      params: params as Record<string, unknown> | undefined,
    });
  },

  async getById(orgId: string, id: string) {
    return apiClient.get<Sale>(API_ENDPOINTS.INVENTORY.SALES.DETAIL(orgId, id));
  },

  async create(orgId: string, data: CreateSaleData) {
    return apiClient.post<SaleResponse>(
      API_ENDPOINTS.INVENTORY.SALES.CREATE(orgId),
      data
    );
  },

  async update(orgId: string, id: string, data: UpdateSaleData) {
    return apiClient.patch<SaleResponse>(
      API_ENDPOINTS.INVENTORY.SALES.UPDATE(orgId, id),
      data
    );
  },

  async delete(orgId: string, id: string) {
    return apiClient.delete<{ message: string }>(
      API_ENDPOINTS.INVENTORY.SALES.DELETE(orgId, id)
    );
  },

  async complete(orgId: string, id: string) {
    return apiClient.post<SaleResponse>(
      API_ENDPOINTS.INVENTORY.SALES.COMPLETE(orgId, id),
      {}
    );
  },

  async cancel(orgId: string, id: string) {
    return apiClient.post<SaleResponse>(
      API_ENDPOINTS.INVENTORY.SALES.CANCEL(orgId, id),
      {}
    );
  },

  async listPayments(orgId: string, id: string) {
    return apiClient.get<SalePayment[]>(
      API_ENDPOINTS.INVENTORY.SALES.PAYMENTS(orgId, id)
    );
  },

  async createPayment(orgId: string, id: string, data: CreateSalePaymentData) {
    return apiClient.post<CreateSalePaymentResponse>(
      API_ENDPOINTS.INVENTORY.SALES.PAYMENTS(orgId, id),
      data
    );
  },

  async deletePayment(orgId: string, id: string, paymentId: string) {
    return apiClient.delete<{ message: string }>(
      API_ENDPOINTS.INVENTORY.SALES.PAYMENT_DETAIL(orgId, id, paymentId)
    );
  },

  async listInstallments(orgId: string, id: string) {
    return apiClient.get<SaleInstallment[]>(
      API_ENDPOINTS.INVENTORY.SALES.INSTALLMENTS(orgId, id)
    );
  },
};
