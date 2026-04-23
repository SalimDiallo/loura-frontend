/**
 * Service API pour les inventaires physiques (stocktaking).
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
  CreatePhysicalInventoryData,
  ListPhysicalInventoriesParams,
  PhysicalInventory,
  PhysicalInventoryResponse,
  PopulatePhysicalInventoryData,
  UpdatePhysicalInventoryData,
  UpdatePhysicalInventoryItemsData,
} from "@/lib/types/inventory";

export const physicalInventoriesService = {
  async getAll(orgId: string, params?: ListPhysicalInventoriesParams) {
    return apiClient.get<PhysicalInventory[]>(
      API_ENDPOINTS.INVENTORY.PHYSICAL_INVENTORIES.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async getById(orgId: string, id: string) {
    return apiClient.get<PhysicalInventory>(
      API_ENDPOINTS.INVENTORY.PHYSICAL_INVENTORIES.DETAIL(orgId, id)
    );
  },

  async create(orgId: string, data: CreatePhysicalInventoryData) {
    return apiClient.post<PhysicalInventoryResponse>(
      API_ENDPOINTS.INVENTORY.PHYSICAL_INVENTORIES.CREATE(orgId),
      data
    );
  },

  async update(orgId: string, id: string, data: UpdatePhysicalInventoryData) {
    return apiClient.patch<PhysicalInventoryResponse>(
      API_ENDPOINTS.INVENTORY.PHYSICAL_INVENTORIES.UPDATE(orgId, id),
      data
    );
  },

  async delete(orgId: string, id: string) {
    return apiClient.delete<{ message: string }>(
      API_ENDPOINTS.INVENTORY.PHYSICAL_INVENTORIES.DELETE(orgId, id)
    );
  },

  async populate(
    orgId: string,
    id: string,
    data: PopulatePhysicalInventoryData = {}
  ) {
    return apiClient.post<PhysicalInventoryResponse>(
      API_ENDPOINTS.INVENTORY.PHYSICAL_INVENTORIES.POPULATE(orgId, id),
      data
    );
  },

  async updateItems(
    orgId: string,
    id: string,
    data: UpdatePhysicalInventoryItemsData
  ) {
    return apiClient.patch<PhysicalInventoryResponse>(
      API_ENDPOINTS.INVENTORY.PHYSICAL_INVENTORIES.ITEMS(orgId, id),
      data
    );
  },

  async complete(orgId: string, id: string) {
    return apiClient.post<PhysicalInventoryResponse>(
      API_ENDPOINTS.INVENTORY.PHYSICAL_INVENTORIES.COMPLETE(orgId, id),
      {}
    );
  },

  async cancel(orgId: string, id: string) {
    return apiClient.post<PhysicalInventoryResponse>(
      API_ENDPOINTS.INVENTORY.PHYSICAL_INVENTORIES.CANCEL(orgId, id),
      {}
    );
  },
};
