/**
 * Hooks React Query du module Comptabilité (reporting financier).
 *
 * Chaque endpoint est exposé indépendamment pour un chargement lazy par
 * widget et un partage de clé de cache par page.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { accountingService } from "@/lib/services/accounting";
import type {
    AccountingOverview,
    AccountingPeriodParams,
    CategoryBreakdownResponse,
    OutstandingResponse,
    Pnl,
    PnlTrendParams,
    PnlTrendResponse,
    TreasuryJournalParams,
    TreasuryLine,
} from "@/lib/types/accounting";
import type { PaginatedResponse } from "@/lib/types/shared";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const accountingKeys = {
    all: (orgId: string) => ["accounting", orgId] as const,
    overview: (orgId: string, params: object) =>
        [...accountingKeys.all(orgId), "overview", params] as const,
    pnl: (orgId: string, params: object) =>
        [...accountingKeys.all(orgId), "pnl", params] as const,
    pnlTrend: (orgId: string, params: object) =>
        [...accountingKeys.all(orgId), "pnl-trend", params] as const,
    treasuryJournal: (orgId: string, params: object) =>
        [...accountingKeys.all(orgId), "treasury-journal", params] as const,
    expensesByCategory: (orgId: string, params: object) =>
        [...accountingKeys.all(orgId), "expenses-by-category", params] as const,
    revenueBySource: (orgId: string, params: object) =>
        [...accountingKeys.all(orgId), "revenue-by-source", params] as const,
    receivables: (orgId: string) =>
        [...accountingKeys.all(orgId), "receivables"] as const,
    payables: (orgId: string) =>
        [...accountingKeys.all(orgId), "payables"] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useAccountingOverview(
    orgId: string,
    params: AccountingPeriodParams = {},
    options?: { enabled?: boolean }
): UseQueryResult<AccountingOverview, Error> {
    return useQuery({
        queryKey: accountingKeys.overview(orgId, params),
        queryFn: () => accountingService.overview(orgId, params),
        enabled: options?.enabled !== false && !!orgId,
    });
}

export function useAccountingPnl(
    orgId: string,
    params: AccountingPeriodParams = {},
    options?: { enabled?: boolean }
): UseQueryResult<Pnl, Error> {
    return useQuery({
        queryKey: accountingKeys.pnl(orgId, params),
        queryFn: () => accountingService.pnl(orgId, params),
        enabled: options?.enabled !== false && !!orgId,
    });
}

export function usePnlTrend(
    orgId: string,
    params: PnlTrendParams = {},
    options?: { enabled?: boolean }
): UseQueryResult<PnlTrendResponse, Error> {
    return useQuery({
        queryKey: accountingKeys.pnlTrend(orgId, params),
        queryFn: () => accountingService.pnlTrend(orgId, params),
        enabled: options?.enabled !== false && !!orgId,
    });
}

export function useTreasuryJournal(
    orgId: string,
    params: TreasuryJournalParams = {},
    options?: { enabled?: boolean }
): UseQueryResult<PaginatedResponse<TreasuryLine> | TreasuryLine[], Error> {
    return useQuery({
        queryKey: accountingKeys.treasuryJournal(orgId, params),
        queryFn: () => accountingService.treasuryJournal(orgId, params),
        enabled: options?.enabled !== false && !!orgId,
    });
}

export function useExpensesByCategory(
    orgId: string,
    params: AccountingPeriodParams = {},
    options?: { enabled?: boolean }
): UseQueryResult<CategoryBreakdownResponse, Error> {
    return useQuery({
        queryKey: accountingKeys.expensesByCategory(orgId, params),
        queryFn: () => accountingService.expensesByCategory(orgId, params),
        enabled: options?.enabled !== false && !!orgId,
    });
}

export function useRevenueBySource(
    orgId: string,
    params: AccountingPeriodParams = {},
    options?: { enabled?: boolean }
): UseQueryResult<CategoryBreakdownResponse, Error> {
    return useQuery({
        queryKey: accountingKeys.revenueBySource(orgId, params),
        queryFn: () => accountingService.revenueBySource(orgId, params),
        enabled: options?.enabled !== false && !!orgId,
    });
}

export function useReceivables(
    orgId: string,
    options?: { enabled?: boolean }
): UseQueryResult<OutstandingResponse, Error> {
    return useQuery({
        queryKey: accountingKeys.receivables(orgId),
        queryFn: () => accountingService.receivables(orgId),
        enabled: options?.enabled !== false && !!orgId,
    });
}

export function usePayables(
    orgId: string,
    options?: { enabled?: boolean }
): UseQueryResult<OutstandingResponse, Error> {
    return useQuery({
        queryKey: accountingKeys.payables(orgId),
        queryFn: () => accountingService.payables(orgId),
        enabled: options?.enabled !== false && !!orgId,
    });
}
