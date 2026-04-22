/**
 * Service API pour la gestion des congés (soldes + demandes)
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
    CancelLeaveRequestResponse,
    CreateLeaveBalanceData,
    CreateLeaveBalanceResponse,
    CreateLeaveRequestData,
    CreateLeaveRequestResponse,
    DeleteLeaveBalanceResponse,
    LeaveBalance,
    LeaveRequest,
    ReviewLeaveRequestData,
    ReviewLeaveRequestResponse,
    UpdateLeaveBalanceData,
    UpdateLeaveBalanceResponse,
} from '@/lib/types/hr';
import type { PaginatedResponse } from '@/lib/types/shared';

// Le backend renvoie :
//   - un array brut quand ?page_size=all
//   - une PaginatedResponse sinon
export type LeavesListParams = {
  membership?: string;
  exclude_membership?: string;
  status?: string;
  leave_type?: string;
  search?: string;
  page?: number;
  page_size?: number | string;
};

export type LeaveBalancesListParams = {
  membership?: string;
  year?: number | string;
  search?: string;
  page?: number;
  page_size?: number | string;
};

// ─── Leave Balances ──────────────────────────────────────────────────────────

export const leaveBalancesService = {
  async getAll(
    orgId: string,
    params?: LeaveBalancesListParams,
  ): Promise<PaginatedResponse<LeaveBalance> | LeaveBalance[]> {
    return apiClient.get<PaginatedResponse<LeaveBalance> | LeaveBalance[]>(
      API_ENDPOINTS.HR.LEAVE_BALANCES.LIST(orgId),
      { params },
    );
  },

  async getById(orgId: string, id: string) {
    return apiClient.get<LeaveBalance>(
      API_ENDPOINTS.HR.LEAVE_BALANCES.DETAIL(orgId, id),
    );
  },

  async getByMember(orgId: string, membershipId: string) {
    return apiClient.get<LeaveBalance[]>(
      API_ENDPOINTS.HR.LEAVE_BALANCES.BY_MEMBER(orgId, membershipId),
    );
  },

  async create(orgId: string, data: CreateLeaveBalanceData) {
    return apiClient.post<CreateLeaveBalanceResponse>(
      API_ENDPOINTS.HR.LEAVE_BALANCES.CREATE(orgId),
      data,
    );
  },

  async update(orgId: string, id: string, data: UpdateLeaveBalanceData) {
    return apiClient.patch<UpdateLeaveBalanceResponse>(
      API_ENDPOINTS.HR.LEAVE_BALANCES.UPDATE(orgId, id),
      data,
    );
  },

  async delete(orgId: string, id: string) {
    return apiClient.delete<DeleteLeaveBalanceResponse>(
      API_ENDPOINTS.HR.LEAVE_BALANCES.DELETE(orgId, id),
    );
  },
};

// ─── Leave Requests ──────────────────────────────────────────────────────────

export const leavesService = {
  async getAll(
    orgId: string,
    params?: LeavesListParams,
  ): Promise<PaginatedResponse<LeaveRequest> | LeaveRequest[]> {
    return apiClient.get<PaginatedResponse<LeaveRequest> | LeaveRequest[]>(
      API_ENDPOINTS.HR.LEAVES.LIST(orgId),
      { params },
    );
  },

  async getById(orgId: string, id: string) {
    return apiClient.get<LeaveRequest>(
      API_ENDPOINTS.HR.LEAVES.DETAIL(orgId, id),
    );
  },

  async getByMember(orgId: string, membershipId: string) {
    return apiClient.get<LeaveRequest[]>(
      API_ENDPOINTS.HR.LEAVES.BY_MEMBER(orgId, membershipId),
    );
  },

  async create(orgId: string, data: CreateLeaveRequestData) {
    return apiClient.post<CreateLeaveRequestResponse>(
      API_ENDPOINTS.HR.LEAVES.CREATE(orgId),
      data,
    );
  },

  async review(orgId: string, id: string, data: ReviewLeaveRequestData) {
    return apiClient.post<ReviewLeaveRequestResponse>(
      API_ENDPOINTS.HR.LEAVES.REVIEW(orgId, id),
      data,
    );
  },

  async cancel(orgId: string, id: string) {
    return apiClient.post<CancelLeaveRequestResponse>(
      API_ENDPOINTS.HR.LEAVES.CANCEL(orgId, id),
      {},
    );
  },
};
