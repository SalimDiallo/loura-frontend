/**
 * Service API pour les commandes fournisseur (Purchase Orders).
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
  CreatePurchaseOrderData,
  CreatePurchaseOrderPaymentData,
  CreatePurchaseOrderPaymentResponse,
  ListPurchaseOrdersParams,
  PurchaseOrder,
  PurchaseOrderPayment,
  PurchaseOrderResponse,
  ReceivePurchaseOrderData,
  UpdatePurchaseOrderData,
} from "@/lib/types/inventory";

export const purchaseOrdersService = {
  async getAll(orgId: string, params?: ListPurchaseOrdersParams) {
    return apiClient.get<PurchaseOrder[]>(
      API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async getById(orgId: string, id: string) {
    return apiClient.get<PurchaseOrder>(
      API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS.DETAIL(orgId, id)
    );
  },

  async create(orgId: string, data: CreatePurchaseOrderData) {
    return apiClient.post<PurchaseOrderResponse>(
      API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS.CREATE(orgId),
      data
    );
  },

  async update(orgId: string, id: string, data: UpdatePurchaseOrderData) {
    return apiClient.patch<PurchaseOrderResponse>(
      API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS.UPDATE(orgId, id),
      data
    );
  },

  async delete(orgId: string, id: string) {
    return apiClient.delete<{ message: string }>(
      API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS.DELETE(orgId, id)
    );
  },

  async send(orgId: string, id: string) {
    return apiClient.post<PurchaseOrderResponse>(
      API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS.SEND(orgId, id),
      {}
    );
  },

  async cancel(orgId: string, id: string) {
    return apiClient.post<PurchaseOrderResponse>(
      API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS.CANCEL(orgId, id),
      {}
    );
  },

  async receive(orgId: string, id: string, data: ReceivePurchaseOrderData) {
    return apiClient.post<PurchaseOrderResponse>(
      API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS.RECEIVE(orgId, id),
      data
    );
  },

  async listPayments(orgId: string, id: string) {
    return apiClient.get<PurchaseOrderPayment[]>(
      API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS.PAYMENTS(orgId, id)
    );
  },

  async createPayment(
    orgId: string,
    id: string,
    data: CreatePurchaseOrderPaymentData
  ) {
    return apiClient.post<CreatePurchaseOrderPaymentResponse>(
      API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS.PAYMENTS(orgId, id),
      data
    );
  },

  async deletePayment(orgId: string, id: string, paymentId: string) {
    return apiClient.delete<{ message: string }>(
      API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS.PAYMENT_DETAIL(
        orgId,
        id,
        paymentId
      )
    );
  },
};
