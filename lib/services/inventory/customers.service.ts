/**
 * Service API pour les clients.
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
  CreateCustomerData,
  CreateCustomerResponse,
  Customer,
  DeleteCustomerResponse,
  ListCustomersParams,
  UpdateCustomerData,
  UpdateCustomerResponse,
} from "@/lib/types/inventory";

export const customersService = {
  async getAll(orgId: string, params?: ListCustomersParams) {
    return apiClient.get<Customer[]>(
      API_ENDPOINTS.INVENTORY.CUSTOMERS.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async getById(orgId: string, id: string) {
    return apiClient.get<Customer>(
      API_ENDPOINTS.INVENTORY.CUSTOMERS.DETAIL(orgId, id)
    );
  },

  async create(orgId: string, data: CreateCustomerData) {
    return apiClient.post<CreateCustomerResponse>(
      API_ENDPOINTS.INVENTORY.CUSTOMERS.CREATE(orgId),
      data
    );
  },

  async update(orgId: string, id: string, data: UpdateCustomerData) {
    return apiClient.patch<UpdateCustomerResponse>(
      API_ENDPOINTS.INVENTORY.CUSTOMERS.UPDATE(orgId, id),
      data
    );
  },

  async delete(orgId: string, id: string) {
    return apiClient.delete<DeleteCustomerResponse>(
      API_ENDPOINTS.INVENTORY.CUSTOMERS.DELETE(orgId, id)
    );
  },
};
