/**
 * Service API pour la gestion des postes
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  Position,
  PositionAssignment,
  CreatePositionData,
  UpdatePositionData,
  CreatePositionResponse,
  UpdatePositionResponse,
  DeletePositionResponse,
  PositionLevel,
} from '@/lib/types/hr';

export const positionsService = {
  /**
   * Liste tous les postes d'une organisation
   */
  async getAll(
    orgId: string,
    params?: {
      search?: string;
      department?: string;
      level?: PositionLevel;
      page_size?: string | number;
    }
  ) {
    return apiClient.get<Position[]>(
      API_ENDPOINTS.HR.POSITIONS.LIST(orgId),
      params
    );
  },

  /**
   * Récupère un poste par son ID
   */
  async getById(orgId: string, id: string) {
    return apiClient.get<Position>(
      API_ENDPOINTS.HR.POSITIONS.DETAIL(orgId, id)
    );
  },

  /**
   * Crée un nouveau poste
   */
  async create(orgId: string, data: CreatePositionData) {
    return apiClient.post<CreatePositionResponse>(
      API_ENDPOINTS.HR.POSITIONS.CREATE(orgId),
      data
    );
  },

  /**
   * Met à jour un poste
   */
  async update(orgId: string, id: string, data: UpdatePositionData) {
    return apiClient.patch<UpdatePositionResponse>(
      API_ENDPOINTS.HR.POSITIONS.UPDATE(orgId, id),
      data
    );
  },

  /**
   * Supprime un poste
   */
  async delete(orgId: string, id: string) {
    return apiClient.delete<DeletePositionResponse>(
      API_ENDPOINTS.HR.POSITIONS.DELETE(orgId, id)
    );
  },

  /**
   * Récupère tous les membres assignés à un poste
   */
  async getMembers(orgId: string, positionId: string) {
    return apiClient.get<PositionAssignment[]>(
      API_ENDPOINTS.HR.POSITIONS.MEMBERS(orgId, positionId)
    );
  },
};
