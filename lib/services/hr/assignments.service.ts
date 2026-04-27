/**
 * Service API pour la gestion des assignations de postes
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  CreatePositionAssignmentData,
  CreatePositionAssignmentResponse,
  DeletePositionAssignmentResponse,
  PositionAssignment,
  UpdatePositionAssignmentData,
  UpdatePositionAssignmentResponse,
} from '@/lib/types/hr';

export const assignmentsService = {
  /**
   * Liste toutes les assignations d'une organisation
   */
  async getAll(
    orgId: string,
    params?: {
      membership?: string;
      position?: string;
      department?: string;
      is_active?: boolean;
      page_size?: string | number;
    }
  ) {
    return apiClient.get<PositionAssignment[]>(
      API_ENDPOINTS.HR.ASSIGNMENTS.LIST(orgId),
      { params }
    );
  },

  /**
   * Récupère une assignation par son ID
   */
  async getById(orgId: string, id: string) {
    return apiClient.get<PositionAssignment>(
      API_ENDPOINTS.HR.ASSIGNMENTS.DETAIL(orgId, id)
    );
  },

  /**
   * Récupère toutes les assignations d'un membre
   */
  async getByMember(orgId: string, membershipId: string) {
    return apiClient.get<PositionAssignment[]>(
      API_ENDPOINTS.HR.ASSIGNMENTS.BY_MEMBER(orgId, membershipId)
    );
  },

  /**
   * Crée une nouvelle assignation
   */
  async create(orgId: string, data: CreatePositionAssignmentData) {
    return apiClient.post<CreatePositionAssignmentResponse>(
      API_ENDPOINTS.HR.ASSIGNMENTS.CREATE(orgId),
      data
    );
  },

  /**
   * Met à jour une assignation
   */
  async update(orgId: string, id: string, data: UpdatePositionAssignmentData) {
    return apiClient.patch<UpdatePositionAssignmentResponse>(
      API_ENDPOINTS.HR.ASSIGNMENTS.UPDATE(orgId, id),
      data
    );
  },

  /**
   * Supprime une assignation
   */
  async delete(orgId: string, id: string) {
    return apiClient.delete<DeletePositionAssignmentResponse>(
      API_ENDPOINTS.HR.ASSIGNMENTS.DELETE(orgId, id)
    );
  },
};
