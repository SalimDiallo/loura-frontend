/**
 * Service API pour la gestion des paiements (module EP)
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  Payment,
  CreatePaymentData,
  UpdatePaymentData,
  CreatePaymentResponse,
  UpdatePaymentResponse,
  DeletePaymentResponse,
} from '@/lib/types/hr';

export const paymentsService = {
  /**
   * Liste tous les paiements d'une organisation
   */
  async getAll(
    orgId: string,
    params?: {
      membership?: string;
      payment_type?: string;
      status?: string;
      page_size?: string | number;
    }
  ) {
    return apiClient.get<Payment[]>(
      API_ENDPOINTS.HR.PAYMENTS.LIST(orgId),
      { params }
    );
  },

  /**
   * Récupère un paiement par son ID
   */
  async getById(orgId: string, id: string) {
    return apiClient.get<Payment>(
      API_ENDPOINTS.HR.PAYMENTS.DETAIL(orgId, id)
    );
  },

  /**
   * Récupère tous les paiements d'un membre
   */
  async getByMember(orgId: string, membershipId: string) {
    return apiClient.get<Payment[]>(
      API_ENDPOINTS.HR.PAYMENTS.BY_MEMBER(orgId, membershipId)
    );
  },

  /**
   * Crée un nouveau paiement
   */
  async create(orgId: string, data: CreatePaymentData) {
    return apiClient.post<CreatePaymentResponse>(
      API_ENDPOINTS.HR.PAYMENTS.CREATE(orgId),
      data
    );
  },

  /**
   * Met à jour un paiement
   */
  async update(orgId: string, id: string, data: UpdatePaymentData) {
    return apiClient.patch<UpdatePaymentResponse>(
      API_ENDPOINTS.HR.PAYMENTS.UPDATE(orgId, id),
      data
    );
  },

  /**
   * Supprime un paiement
   */
  async delete(orgId: string, id: string) {
    return apiClient.delete<DeletePaymentResponse>(
      API_ENDPOINTS.HR.PAYMENTS.DELETE(orgId, id)
    );
  },
};
