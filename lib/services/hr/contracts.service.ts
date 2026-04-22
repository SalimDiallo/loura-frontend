/**
 * Service API pour la gestion des contrats
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
    Contract,
    CreateContractData,
    CreateContractResponse,
    DeleteContractResponse,
    UpdateContractData,
    UpdateContractResponse,
} from '@/lib/types/hr';

export const contractsService = {
  /**
   * Liste tous les contrats d'une organisation
   */
  async getAll(
    orgId: string,
    params?: {
      membership?: string;
      contract_type?: string;
      status?: string;
      page_size?: string | number;
    }
  ) {
    return apiClient.get<Contract[]>(
      API_ENDPOINTS.HR.CONTRACTS.LIST(orgId),
      { params }
    );
  },

  /**
   * Récupère un contrat par son ID
   */
  async getById(orgId: string, id: string) {
    return apiClient.get<Contract>(
      API_ENDPOINTS.HR.CONTRACTS.DETAIL(orgId, id)
    );
  },

  /**
   * Récupère tous les contrats d'un membre
   */
  async getByMember(orgId: string, membershipId: string) {
    return apiClient.get<Contract[]>(
      API_ENDPOINTS.HR.CONTRACTS.BY_MEMBER(orgId, membershipId)
    );
  },

  /**
   * Crée un nouveau contrat
   */
  async create(orgId: string, data: CreateContractData) {
    return apiClient.post<CreateContractResponse>(
      API_ENDPOINTS.HR.CONTRACTS.CREATE(orgId),
      data
    );
  },

  /**
   * Met à jour un contrat
   */
  async update(orgId: string, id: string, data: UpdateContractData) {
    return apiClient.patch<UpdateContractResponse>(
      API_ENDPOINTS.HR.CONTRACTS.UPDATE(orgId, id),
      data
    );
  },

  /**
   * Supprime un contrat
   */
  async delete(orgId: string, id: string) {
    return apiClient.delete<DeleteContractResponse>(
      API_ENDPOINTS.HR.CONTRACTS.DELETE(orgId, id)
    );
  },
};
