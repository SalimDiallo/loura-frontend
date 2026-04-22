/**
 * Service API pour les fournisseurs.
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
  CreateSupplierData,
  CreateSupplierResponse,
  DeleteSupplierResponse,
  ListSuppliersParams,
  Supplier,
  UpdateSupplierData,
  UpdateSupplierResponse,
} from "@/lib/types/inventory";

export const suppliersService = {
  async getAll(orgId: string, params?: ListSuppliersParams) {
    return apiClient.get<Supplier[]>(
      API_ENDPOINTS.INVENTORY.SUPPLIERS.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async getById(orgId: string, id: string) {
    return apiClient.get<Supplier>(
      API_ENDPOINTS.INVENTORY.SUPPLIERS.DETAIL(orgId, id)
    );
  },

  async create(orgId: string, data: CreateSupplierData) {
    return apiClient.post<CreateSupplierResponse>(
      API_ENDPOINTS.INVENTORY.SUPPLIERS.CREATE(orgId),
      data
    );
  },

  async update(orgId: string, id: string, data: UpdateSupplierData) {
    return apiClient.patch<UpdateSupplierResponse>(
      API_ENDPOINTS.INVENTORY.SUPPLIERS.UPDATE(orgId, id),
      data
    );
  },

  async delete(orgId: string, id: string) {
    return apiClient.delete<DeleteSupplierResponse>(
      API_ENDPOINTS.INVENTORY.SUPPLIERS.DELETE(orgId, id)
    );
  },
};
