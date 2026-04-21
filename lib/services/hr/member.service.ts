/**
 * Service pour les membres (memberships)
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
    DeleteMembershipResponse,
    FilterParams,
    Membership,
    MyMembership,
    PaginatedResponse,
    UpdateMembershipData,
    UpdateMembershipResponse,
} from '@/lib/types';

export interface MemberListParams extends FilterParams {
  // Hérite de search, page, page_size, ordering
}

class MemberService {
  /**
   * Liste les membres d'une organisation
   */
  async list(
    orgId: string,
    params?: MemberListParams
  ): Promise<PaginatedResponse<Membership>> {
    return apiClient.get<PaginatedResponse<Membership>>(
      API_ENDPOINTS.HR.MEMBERS.LIST(orgId),
      { params }
    );
  }

  /**
   * Récupère les détails d'un membre
   */
  async get(orgId: string, memberId: string): Promise<Membership> {
    return apiClient.get<Membership>(
      API_ENDPOINTS.HR.MEMBERS.DETAIL(orgId, memberId)
    );
  }

  /**
   * Met à jour un membre (rôle, permissions, statut)
   */
  async update(
    orgId: string,
    memberId: string,
    data: UpdateMembershipData
  ): Promise<UpdateMembershipResponse> {
    return apiClient.patch<UpdateMembershipResponse>(
      API_ENDPOINTS.HR.MEMBERS.UPDATE(orgId, memberId),
      data
    );
  }

  /**
   * Retire un membre de l'organisation
   */
  async remove(
    orgId: string,
    memberId: string
  ): Promise<DeleteMembershipResponse> {
    return apiClient.delete<DeleteMembershipResponse>(
      API_ENDPOINTS.HR.MEMBERS.DELETE(orgId, memberId)
    );
  }

  /**
   * Récupère tous les memberships de l'utilisateur connecté
   */
  async getMyMemberships(): Promise<MyMembership[]> {
    return apiClient.get<MyMembership[]>(
      API_ENDPOINTS.HR.MEMBERS.MY_MEMBERSHIPS
    );
  }
}

export const memberService = new MemberService();
