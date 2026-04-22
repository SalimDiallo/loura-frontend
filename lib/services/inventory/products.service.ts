/**
 * Service API pour les produits.
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
  CreateProductData,
  CreateProductResponse,
  DeleteProductResponse,
  ListProductsParams,
  Product,
  UpdateProductData,
  UpdateProductResponse,
} from "@/lib/types/inventory";

export const productsService = {
  async getAll(orgId: string, params?: ListProductsParams) {
    return apiClient.get<Product[]>(
      API_ENDPOINTS.INVENTORY.PRODUCTS.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async getById(orgId: string, id: string) {
    return apiClient.get<Product>(
      API_ENDPOINTS.INVENTORY.PRODUCTS.DETAIL(orgId, id)
    );
  },

  async create(orgId: string, data: CreateProductData) {
    return apiClient.post<CreateProductResponse>(
      API_ENDPOINTS.INVENTORY.PRODUCTS.CREATE(orgId),
      data
    );
  },

  async update(orgId: string, id: string, data: UpdateProductData) {
    return apiClient.patch<UpdateProductResponse>(
      API_ENDPOINTS.INVENTORY.PRODUCTS.UPDATE(orgId, id),
      data
    );
  },

  async delete(orgId: string, id: string) {
    return apiClient.delete<DeleteProductResponse>(
      API_ENDPOINTS.INVENTORY.PRODUCTS.DELETE(orgId, id)
    );
  },

  async uploadImage(orgId: string, id: string, file: File) {
    const formData = new FormData();
    formData.append("image", file);
    return apiClient.post<UpdateProductResponse>(
      API_ENDPOINTS.INVENTORY.PRODUCTS.IMAGE(orgId, id),
      formData
    );
  },

  async deleteImage(orgId: string, id: string) {
    return apiClient.delete<DeleteProductResponse>(
      API_ENDPOINTS.INVENTORY.PRODUCTS.IMAGE(orgId, id)
    );
  },
};
