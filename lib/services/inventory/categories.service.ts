/**
 * Service API pour les catégories produits.
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
  Category,
  CategoryTreeNode,
  CreateCategoryData,
  CreateCategoryResponse,
  DeleteCategoryResponse,
  ListCategoriesParams,
  UpdateCategoryData,
  UpdateCategoryResponse,
} from "@/lib/types/inventory";

export const categoriesService = {
  async getAll(orgId: string, params?: ListCategoriesParams) {
    return apiClient.get<Category[]>(
      API_ENDPOINTS.INVENTORY.CATEGORIES.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async getTree(orgId: string) {
    return apiClient.get<CategoryTreeNode[]>(
      API_ENDPOINTS.INVENTORY.CATEGORIES.TREE(orgId)
    );
  },

  async getById(orgId: string, id: string) {
    return apiClient.get<Category>(
      API_ENDPOINTS.INVENTORY.CATEGORIES.DETAIL(orgId, id)
    );
  },

  async create(orgId: string, data: CreateCategoryData) {
    return apiClient.post<CreateCategoryResponse>(
      API_ENDPOINTS.INVENTORY.CATEGORIES.CREATE(orgId),
      data
    );
  },

  async update(orgId: string, id: string, data: UpdateCategoryData) {
    return apiClient.patch<UpdateCategoryResponse>(
      API_ENDPOINTS.INVENTORY.CATEGORIES.UPDATE(orgId, id),
      data
    );
  },

  async delete(orgId: string, id: string) {
    return apiClient.delete<DeleteCategoryResponse>(
      API_ENDPOINTS.INVENTORY.CATEGORIES.DELETE(orgId, id)
    );
  },
};
