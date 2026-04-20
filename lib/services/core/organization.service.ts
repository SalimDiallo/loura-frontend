/**
 * Service pour la gestion des organisations.
 * Utilise ActivatableService pour le CRUD + activate/deactivate.
 */

import { ActivatableService, type ActivatableEndpoints } from '@/lib/api/base-service';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Category, CreateOrganizationData, Organization, UpdateOrganizationData } from '@/lib/types/core';

class OrganizationService extends ActivatableService<
  Organization,
  CreateOrganizationData,
  UpdateOrganizationData
> {
  protected readonly endpoints: ActivatableEndpoints = {
    LIST: API_ENDPOINTS.CORE.ORGANIZATIONS.LIST,
    CREATE: API_ENDPOINTS.CORE.ORGANIZATIONS.CREATE,
    DETAIL: (id: string) => API_ENDPOINTS.CORE.ORGANIZATIONS.DETAIL(id),
    UPDATE: (id: string) => API_ENDPOINTS.CORE.ORGANIZATIONS.UPDATE(id),
    DELETE: (id: string) => API_ENDPOINTS.CORE.ORGANIZATIONS.DELETE(id),
    ACTIVATE: (id: string) => API_ENDPOINTS.CORE.ORGANIZATIONS.ACTIVATE(id),
    DEACTIVATE: (id: string) => API_ENDPOINTS.CORE.ORGANIZATIONS.DEACTIVATE(id),
  };

  /**
   * Création d'organisation (onboarding).
   * Retourne la réponse wrappée { message, data }.
   */
  async createOrganization(data: CreateOrganizationData): Promise<Organization> {
    const response = await apiClient.post<{ message: string; data: Organization }>(
      this.endpoints.CREATE,
      data,
    );
    return response.data;
  }

  /**
   * Upload du logo d'une organisation.
   */
  async uploadLogo(id: string, file: File): Promise<Organization> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await apiClient.post<{ message: string; data: Organization }>(
      API_ENDPOINTS.CORE.ORGANIZATIONS.UPLOAD_LOGO(id),
      formData,
    );
    return response.data;
  }

  /**
   * Supprimer le logo d'une organisation.
   */
  async deleteLogo(id: string): Promise<Organization> {
    const response = await apiClient.delete<{ message: string; data: Organization }>(
      API_ENDPOINTS.CORE.ORGANIZATIONS.UPLOAD_LOGO(id),
    );
    return response.data;
  }
}

export const organizationService = new OrganizationService();

// ============================================================================
// Category Service (simple, pas de CRUD complet)
// ============================================================================

class CategoryService {
  /**
   * Récupère toutes les catégories (pas de pagination).
   */
  async getAll(): Promise<Category[]> {
    return apiClient.get<Category[]>(API_ENDPOINTS.CORE.CATEGORIES.LIST);
  }
}

export const categoryService = new CategoryService();
