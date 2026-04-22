/**
 * Hooks d'analytique RH pour le dashboard /hr.
 *
 * Chaque hook expose un endpoint indépendant afin que chaque widget
 * puisse charger ses données seul (Suspense / skeleton) en fonction des
 * permissions de l'utilisateur.
 */

'use client';

import {
  hrAnalyticsService,
  type HRContractsAnalytics,
  type HRHeadcountAnalytics,
  type HRLeavesAnalytics,
  type HROverviewAnalytics,
  type HRPayrollAnalytics,
  type HRPendingActions,
} from '@/lib/services/hr/analytics.service';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

// ─── Query keys ─────────────────────────────────────────────────────────────

export const hrAnalyticsKeys = {
  overview: (orgId: string) => ['hr', 'analytics', 'overview', orgId] as const,
  headcount: (orgId: string) => ['hr', 'analytics', 'headcount', orgId] as const,
  leaves: (orgId: string) => ['hr', 'analytics', 'leaves', orgId] as const,
  payroll: (orgId: string) => ['hr', 'analytics', 'payroll', orgId] as const,
  contracts: (orgId: string) => ['hr', 'analytics', 'contracts', orgId] as const,
  pendingActions: (orgId: string) =>
    ['hr', 'analytics', 'pending-actions', orgId] as const,
};

const STALE_MS = 60_000; // 1 min

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useHROverviewAnalytics(
  orgId: string,
  options: { enabled?: boolean } = {},
): UseQueryResult<HROverviewAnalytics, Error> {
  return useQuery({
    queryKey: hrAnalyticsKeys.overview(orgId),
    queryFn: () => hrAnalyticsService.overview(orgId),
    enabled: !!orgId && options.enabled !== false,
    staleTime: STALE_MS,
  });
}

export function useHRHeadcountAnalytics(
  orgId: string,
  options: { enabled?: boolean } = {},
): UseQueryResult<HRHeadcountAnalytics, Error> {
  return useQuery({
    queryKey: hrAnalyticsKeys.headcount(orgId),
    queryFn: () => hrAnalyticsService.headcount(orgId),
    enabled: !!orgId && options.enabled !== false,
    staleTime: STALE_MS,
  });
}

export function useHRLeavesAnalytics(
  orgId: string,
  options: { enabled?: boolean } = {},
): UseQueryResult<HRLeavesAnalytics, Error> {
  return useQuery({
    queryKey: hrAnalyticsKeys.leaves(orgId),
    queryFn: () => hrAnalyticsService.leaves(orgId),
    enabled: !!orgId && options.enabled !== false,
    staleTime: STALE_MS,
  });
}

export function useHRPayrollAnalytics(
  orgId: string,
  options: { enabled?: boolean } = {},
): UseQueryResult<HRPayrollAnalytics, Error> {
  return useQuery({
    queryKey: hrAnalyticsKeys.payroll(orgId),
    queryFn: () => hrAnalyticsService.payroll(orgId),
    enabled: !!orgId && options.enabled !== false,
    staleTime: STALE_MS,
  });
}

export function useHRContractsAnalytics(
  orgId: string,
  options: { enabled?: boolean } = {},
): UseQueryResult<HRContractsAnalytics, Error> {
  return useQuery({
    queryKey: hrAnalyticsKeys.contracts(orgId),
    queryFn: () => hrAnalyticsService.contracts(orgId),
    enabled: !!orgId && options.enabled !== false,
    staleTime: STALE_MS,
  });
}

export function useHRPendingActions(
  orgId: string,
  options: { enabled?: boolean } = {},
): UseQueryResult<HRPendingActions, Error> {
  return useQuery({
    queryKey: hrAnalyticsKeys.pendingActions(orgId),
    queryFn: () => hrAnalyticsService.pendingActions(orgId),
    enabled: !!orgId && options.enabled !== false,
    staleTime: STALE_MS,
  });
}
