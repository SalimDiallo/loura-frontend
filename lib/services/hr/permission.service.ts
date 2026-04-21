/**
 * Service pour les permissions
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Permission } from '@/lib/types';

class PermissionService {
  /**
   * Liste toutes les permissions disponibles
   */
  async getAll(): Promise<Permission[]> {
    return apiClient.get<Permission[]>(API_ENDPOINTS.HR.PERMISSIONS.LIST);
  }
}

export const permissionService = new PermissionService();
