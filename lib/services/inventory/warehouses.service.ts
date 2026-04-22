/**
 * Service API pour les entrepôts.
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
  CreateWarehouseData,
  CreateWarehouseResponse,
  DeleteWarehouseResponse,
  ListWarehousesParams,
  UpdateWarehouseData,
  UpdateWarehouseResponse,
  Warehouse,
} from "@/lib/types/inventory";

export const warehousesService = {
  async getAll(orgId: string, params?: ListWarehousesParams) {
    return apiClient.get<Warehouse[]>(
      API_ENDPOINTS.INVENTORY.WAREHOUSES.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async getById(orgId: string, id: string) {
    return apiClient.get<Warehouse>(
      API_ENDPOINTS.INVENTORY.WAREHOUSES.DETAIL(orgId, id)
    );
  },

  async create(orgId: string, data: CreateWarehouseData) {
    return apiClient.post<CreateWarehouseResponse>(
      API_ENDPOINTS.INVENTORY.WAREHOUSES.CREATE(orgId),
      data
    );
  },

  async update(orgId: string, id: string, data: UpdateWarehouseData) {
    return apiClient.patch<UpdateWarehouseResponse>(
      API_ENDPOINTS.INVENTORY.WAREHOUSES.UPDATE(orgId, id),
      data
    );
  },

  async delete(orgId: string, id: string) {
    return apiClient.delete<DeleteWarehouseResponse>(
      API_ENDPOINTS.INVENTORY.WAREHOUSES.DELETE(orgId, id)
    );
  },
};
