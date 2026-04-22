/**
 * Service API pour la gestion des départements
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  Department,
  DepartmentTree,
  CreateDepartmentData,
  UpdateDepartmentData,
  CreateDepartmentResponse,
  UpdateDepartmentResponse,
  DeleteDepartmentResponse,
} from '@/lib/types/hr';

export const departmentsService = {
  /**
   * Liste tous les départements d'une organisation
   */
  async getAll(orgId: string, params?: { search?: string; page_size?: string | number }) {
    return apiClient.get<Department[]>(
      API_ENDPOINTS.HR.DEPARTMENTS.LIST(orgId),
      params
    );
  },

  /**
   * Récupère la hiérarchie complète des départements
   */
  async getTree(orgId: string) {
    return apiClient.get<DepartmentTree[]>(
      API_ENDPOINTS.HR.DEPARTMENTS.TREE(orgId)
    );
  },

  /**
   * Récupère un département par son ID
   */
  async getById(orgId: string, id: string) {
    return apiClient.get<Department>(
      API_ENDPOINTS.HR.DEPARTMENTS.DETAIL(orgId, id)
    );
  },

  /**
   * Crée un nouveau département
   */
  async create(orgId: string, data: CreateDepartmentData) {
    return apiClient.post<CreateDepartmentResponse>(
      API_ENDPOINTS.HR.DEPARTMENTS.CREATE(orgId),
      data
    );
  },

  /**
   * Met à jour un département
   */
  async update(orgId: string, id: string, data: UpdateDepartmentData) {
    return apiClient.patch<UpdateDepartmentResponse>(
      API_ENDPOINTS.HR.DEPARTMENTS.UPDATE(orgId, id),
      data
    );
  },

  /**
   * Supprime un département
   */
  async delete(orgId: string, id: string) {
    return apiClient.delete<DeleteDepartmentResponse>(
      API_ENDPOINTS.HR.DEPARTMENTS.DELETE(orgId, id)
    );
  },
};
