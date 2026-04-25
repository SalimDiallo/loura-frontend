/**
 * Service API pour le stock et ses mouvements.
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
  CreateStockMovementData,
  CreateStockMovementResponse,
  ListStockMovementsParams,
  ListStocksParams,
  Stock,
  StockAlertsResponse,
  StockMovement,
  StockTransferData,
  StockTransferResponse,
  UpdateStockMovementData,
  UpdateStockMovementResponse,
} from "@/lib/types/inventory";

export const stockService = {
  async list(orgId: string, params?: ListStocksParams) {
    return apiClient.get<Stock[]>(
      API_ENDPOINTS.INVENTORY.STOCKS.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async alerts(orgId: string) {
    return apiClient.get<StockAlertsResponse>(
      API_ENDPOINTS.INVENTORY.STOCKS.ALERTS(orgId)
    );
  },
};

export const stockMovementsService = {
  async list(orgId: string, params?: ListStockMovementsParams) {
    return apiClient.get<StockMovement[]>(
      API_ENDPOINTS.INVENTORY.STOCK_MOVEMENTS.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async getById(orgId: string, id: string) {
    return apiClient.get<StockMovement>(
      API_ENDPOINTS.INVENTORY.STOCK_MOVEMENTS.DETAIL(orgId, id)
    );
  },

  async create(orgId: string, data: CreateStockMovementData) {
    return apiClient.post<CreateStockMovementResponse>(
      API_ENDPOINTS.INVENTORY.STOCK_MOVEMENTS.CREATE(orgId),
      data
    );
  },

  async update(orgId: string, id: string, data: UpdateStockMovementData) {
    return apiClient.patch<UpdateStockMovementResponse>(
      API_ENDPOINTS.INVENTORY.STOCK_MOVEMENTS.UPDATE(orgId, id),
      data
    );
  },

  async remove(orgId: string, id: string) {
    return apiClient.delete<void>(
      API_ENDPOINTS.INVENTORY.STOCK_MOVEMENTS.DELETE(orgId, id)
    );
  },

  async validate(orgId: string, id: string) {
    return apiClient.post<UpdateStockMovementResponse>(
      API_ENDPOINTS.INVENTORY.STOCK_MOVEMENTS.VALIDATE(orgId, id),
      {}
    );
  },

  async cancel(orgId: string, id: string) {
    return apiClient.post<UpdateStockMovementResponse>(
      API_ENDPOINTS.INVENTORY.STOCK_MOVEMENTS.CANCEL(orgId, id),
      {}
    );
  },
};

export const stockTransfersService = {
  async create(orgId: string, data: StockTransferData) {
    return apiClient.post<StockTransferResponse>(
      API_ENDPOINTS.INVENTORY.STOCK_TRANSFERS.CREATE(orgId),
      data
    );
  },
};
