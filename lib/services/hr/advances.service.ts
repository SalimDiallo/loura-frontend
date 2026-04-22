/**
 * Service API pour la gestion des demandes d'avance (module EP)
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  AdvanceRequest,
  CreateAdvanceRequestData,
  ReviewAdvanceRequestData,
  CreateAdvanceRequestResponse,
  ReviewAdvanceRequestResponse,
} from '@/lib/types/hr';

export const advancesService = {
  /**
   * Liste toutes les demandes d'avance d'une organisation
   */
  async getAll(
    orgId: string,
    params?: {
      membership?: string;
      status?: string;
      page_size?: string | number;
    }
  ) {
    return apiClient.get<AdvanceRequest[]>(
      API_ENDPOINTS.HR.ADVANCES.LIST(orgId),
      { params }
    );
  },

  /**
   * Récupère une demande d'avance par son ID
   */
  async getById(orgId: string, id: string) {
    return apiClient.get<AdvanceRequest>(
      API_ENDPOINTS.HR.ADVANCES.DETAIL(orgId, id)
    );
  },

  /**
   * Récupère toutes les demandes d'un membre
   */
  async getByMember(orgId: string, membershipId: string) {
    return apiClient.get<AdvanceRequest[]>(
      API_ENDPOINTS.HR.ADVANCES.BY_MEMBER(orgId, membershipId)
    );
  },

  /**
   * Crée une nouvelle demande d'avance
   */
  async create(orgId: string, data: CreateAdvanceRequestData) {
    return apiClient.post<CreateAdvanceRequestResponse>(
      API_ENDPOINTS.HR.ADVANCES.CREATE(orgId),
      data
    );
  },

  /**
   * Approuve ou rejette une demande d'avance
   */
  async review(orgId: string, id: string, data: ReviewAdvanceRequestData) {
    return apiClient.post<ReviewAdvanceRequestResponse>(
      API_ENDPOINTS.HR.ADVANCES.REVIEW(orgId, id),
      data
    );
  },
};
