/**
 * Service pour les rôles
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  CreateRoleData,
  CreateRoleResponse,
  DeleteRoleResponse,
  Role,
  UpdateRoleData,
  UpdateRoleResponse,
} from '@/lib/types';

class RoleService {
  /**
   * Liste les rôles d'une organisation
   */
  async list(orgId: string): Promise<Role[]> {
    return apiClient.get<Role[]>(API_ENDPOINTS.HR.ROLES.LIST(orgId));
  }

  /**
   * Récupère les détails d'un rôle
   */
  async get(orgId: string, roleId: string): Promise<Role> {
    return apiClient.get<Role>(API_ENDPOINTS.HR.ROLES.DETAIL(orgId, roleId));
  }

  /**
   * Crée un nouveau rôle
   */
  async create(orgId: string, data: CreateRoleData): Promise<CreateRoleResponse> {
    return apiClient.post<CreateRoleResponse>(
      API_ENDPOINTS.HR.ROLES.CREATE(orgId),
      data
    );
  }

  /**
   * Met à jour un rôle
   */
  async update(
    orgId: string,
    roleId: string,
    data: UpdateRoleData
  ): Promise<UpdateRoleResponse> {
    return apiClient.patch<UpdateRoleResponse>(
      API_ENDPOINTS.HR.ROLES.UPDATE(orgId, roleId),
      data
    );
  }

  /**
   * Supprime un rôle
   */
  async delete(orgId: string, roleId: string): Promise<DeleteRoleResponse> {
    return apiClient.delete<DeleteRoleResponse>(
      API_ENDPOINTS.HR.ROLES.DELETE(orgId, roleId)
    );
  }
}

export const roleService = new RoleService();
