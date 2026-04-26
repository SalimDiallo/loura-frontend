/**
 * Service pour les invitations d'employés
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  AcceptInvitationResponse,
  CreateInvitationData,
  CreateInvitationResponse,
  DeclineInvitationResponse,
  Invitation,
  InvitationByToken,
} from '@/lib/types';

class InvitationService {
  /**
   * Envoie une invitation à rejoindre une organisation
   */
  async send(
    orgId: string,
    data: CreateInvitationData
  ): Promise<CreateInvitationResponse> {
    return apiClient.post<CreateInvitationResponse>(
      API_ENDPOINTS.HR.INVITATIONS.SEND(orgId),
      data
    );
  }

  /**
   * Liste les invitations envoyées par une organisation
   */
  async list(orgId: string): Promise<Invitation[]> {
    return apiClient.get<Invitation[]>(
      API_ENDPOINTS.HR.INVITATIONS.LIST(orgId)
    );
  }

  /**
   * Liste les invitations en attente pour l'utilisateur connecté
   */
  async getPending(): Promise<Invitation[]> {
    return apiClient.get<Invitation[]>(API_ENDPOINTS.HR.INVITATIONS.PENDING);
  }

  /**
   * Accepte une invitation
   */
  async accept(invitationId: string): Promise<AcceptInvitationResponse> {
    return apiClient.post<AcceptInvitationResponse>(
      API_ENDPOINTS.HR.INVITATIONS.ACCEPT(invitationId)
    );
  }

  /**
   * Refuse une invitation
   */
  async decline(invitationId: string): Promise<DeclineInvitationResponse> {
    return apiClient.post<DeclineInvitationResponse>(
      API_ENDPOINTS.HR.INVITATIONS.DECLINE(invitationId)
    );
  }

  /**
   * Récupère une invitation à partir du token reçu par email.
   *
   * Endpoint **public** (pas d'authentification requise) : la page de landing
   * `/auth/invitation` l'utilise pour afficher l'invitation avant que
   * l'utilisateur ne se connecte.
   */
  async getByToken(token: string): Promise<InvitationByToken> {
    return apiClient.get<InvitationByToken>(
      API_ENDPOINTS.HR.INVITATIONS.BY_TOKEN(token),
      { requiresAuth: false }
    );
  }

  /**
   * Accepte une invitation à partir du token reçu par email.
   * L'utilisateur doit être authentifié avec une adresse correspondant
   * au destinataire de l'invitation (sinon HTTP 403 + code email_mismatch).
   */
  async acceptByToken(token: string): Promise<AcceptInvitationResponse> {
    return apiClient.post<AcceptInvitationResponse>(
      API_ENDPOINTS.HR.INVITATIONS.ACCEPT_BY_TOKEN(token)
    );
  }
}

export const invitationService = new InvitationService();
