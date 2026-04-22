/**
 * Service API pour l'analytique RH (dashboard /hr).
 *
 * Chaque endpoint est protégé par une permission côté backend, et est
 * consommé indépendamment côté frontend pour permettre un chargement par
 * widget via Suspense.
 */

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HROverviewAnalytics {
  active_members: number;
  total_members: number;
  departments: number;
  active_contracts: number | null;
  pending_leaves: number | null;
}

export interface HeadcountBucket {
  id: string | null;
  label: string;
  count: number;
}

export interface HRHeadcountAnalytics {
  total_active: number;
  by_role: HeadcountBucket[];
  by_department: HeadcountBucket[];
}

export interface LeaveStatusBucket {
  status: string;
  label: string;
  count: number;
}

export interface LeaveTypeBucket {
  type: string;
  label: string;
  count: number;
}

export interface LeaveMonthlyPoint {
  month: string; // 'YYYY-MM'
  requests: number;
  approved: number;
  days: number;
}

export interface HRLeavesAnalytics {
  by_status: LeaveStatusBucket[];
  by_type: LeaveTypeBucket[];
  monthly: LeaveMonthlyPoint[];
  balance_summary: {
    year: number;
    total_days: number;
    used_days: number;
    remaining_days: number;
  };
}

export interface PayrollMonthlyPoint {
  month: string; // 'YYYY-MM'
  total: number;
  count: number;
}

export interface PayrollTypeBucket {
  type: string;
  label: string;
  total: number;
}

export interface HRPayrollAnalytics {
  current_month: number;
  previous_month: number;
  monthly: PayrollMonthlyPoint[];
  by_type: PayrollTypeBucket[];
  pending_amount: number;
  pending_count: number;
  pending_advances: number;
}

export interface ContractTypeBucket {
  type: string;
  label: string;
  count: number;
}

export interface ContractStatusBucket {
  status: string;
  label: string;
  count: number;
}

export interface ContractEnding {
  id: string;
  membership_id: string;
  employee_name: string;
  employee_email: string;
  contract_type: string;
  end_date: string | null;
  days_until_end: number | null;
}

export interface HRContractsAnalytics {
  by_type: ContractTypeBucket[];
  by_status: ContractStatusBucket[];
  ending_soon: ContractEnding[];
  total_active: number;
}

export interface HRPendingActions {
  leaves_to_review?: number;
  advances_to_review?: number;
  payments_to_approve?: number;
  contracts_ending?: number;
  my_pending_leaves?: number;
  my_pending_advances?: number;
}

// ─── Service ────────────────────────────────────────────────────────────────

export const hrAnalyticsService = {
  overview(orgId: string) {
    return apiClient.get<HROverviewAnalytics>(
      API_ENDPOINTS.HR.ANALYTICS.OVERVIEW(orgId),
    );
  },
  headcount(orgId: string) {
    return apiClient.get<HRHeadcountAnalytics>(
      API_ENDPOINTS.HR.ANALYTICS.HEADCOUNT(orgId),
    );
  },
  leaves(orgId: string) {
    return apiClient.get<HRLeavesAnalytics>(
      API_ENDPOINTS.HR.ANALYTICS.LEAVES(orgId),
    );
  },
  payroll(orgId: string) {
    return apiClient.get<HRPayrollAnalytics>(
      API_ENDPOINTS.HR.ANALYTICS.PAYROLL(orgId),
    );
  },
  contracts(orgId: string) {
    return apiClient.get<HRContractsAnalytics>(
      API_ENDPOINTS.HR.ANALYTICS.CONTRACTS(orgId),
    );
  },
  pendingActions(orgId: string) {
    return apiClient.get<HRPendingActions>(
      API_ENDPOINTS.HR.ANALYTICS.PENDING_ACTIONS(orgId),
    );
  },
};
