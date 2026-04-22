/**
 * Hooks React Query pour les analytics Inventory (BI / rapports).
 *
 * Chaque endpoint est indépendant pour permettre un chargement lazy par
 * widget, un `refetchInterval` personnalisable, ou un partage de clé de
 * cache entre pages.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
    inventoryAnalyticsService,
    type AnalyticsMargin,
    type AnalyticsMovements,
    type AnalyticsOverview,
    type AnalyticsPeriodParams,
    type AnalyticsSalesTrend,
    type AnalyticsStockAlerts,
    type AnalyticsStockValue,
    type AnalyticsTopProducts,
    type AnalyticsGranularity,
    type TopProductsSortBy,
} from "@/lib/services/inventory";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const inventoryAnalyticsKeys = {
    all: (orgId: string) => ["inventory", "analytics", orgId] as const,
    overview: (orgId: string) =>
        [...inventoryAnalyticsKeys.all(orgId), "overview"] as const,
    salesTrend: (orgId: string, params: object) =>
        [...inventoryAnalyticsKeys.all(orgId), "sales-trend", params] as const,
    topProducts: (orgId: string, params: object) =>
        [...inventoryAnalyticsKeys.all(orgId), "top-products", params] as const,
    stockValue: (orgId: string) =>
        [...inventoryAnalyticsKeys.all(orgId), "stock-value"] as const,
    stockAlerts: (orgId: string) =>
        [...inventoryAnalyticsKeys.all(orgId), "stock-alerts"] as const,
    margin: (orgId: string, params: object) =>
        [...inventoryAnalyticsKeys.all(orgId), "margin", params] as const,
    movements: (orgId: string, params: object) =>
        [...inventoryAnalyticsKeys.all(orgId), "movements", params] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useAnalyticsOverview(
    orgId: string,
    options?: { enabled?: boolean }
): UseQueryResult<AnalyticsOverview, Error> {
    return useQuery({
        queryKey: inventoryAnalyticsKeys.overview(orgId),
        queryFn: () => inventoryAnalyticsService.overview(orgId),
        enabled: options?.enabled !== false && !!orgId,
    });
}

export function useAnalyticsSalesTrend(
    orgId: string,
    params: AnalyticsPeriodParams & { granularity?: AnalyticsGranularity } = {},
    options?: { enabled?: boolean }
): UseQueryResult<AnalyticsSalesTrend, Error> {
    return useQuery({
        queryKey: inventoryAnalyticsKeys.salesTrend(orgId, params),
        queryFn: () => inventoryAnalyticsService.salesTrend(orgId, params),
        enabled: options?.enabled !== false && !!orgId,
    });
}

export function useAnalyticsTopProducts(
    orgId: string,
    params: AnalyticsPeriodParams & {
        limit?: number;
        by?: TopProductsSortBy;
    } = {},
    options?: { enabled?: boolean }
): UseQueryResult<AnalyticsTopProducts, Error> {
    return useQuery({
        queryKey: inventoryAnalyticsKeys.topProducts(orgId, params),
        queryFn: () => inventoryAnalyticsService.topProducts(orgId, params),
        enabled: options?.enabled !== false && !!orgId,
    });
}

export function useAnalyticsStockValue(
    orgId: string,
    options?: { enabled?: boolean }
): UseQueryResult<AnalyticsStockValue, Error> {
    return useQuery({
        queryKey: inventoryAnalyticsKeys.stockValue(orgId),
        queryFn: () => inventoryAnalyticsService.stockValue(orgId),
        enabled: options?.enabled !== false && !!orgId,
    });
}

export function useAnalyticsStockAlerts(
    orgId: string,
    options?: { enabled?: boolean }
): UseQueryResult<AnalyticsStockAlerts, Error> {
    return useQuery({
        queryKey: inventoryAnalyticsKeys.stockAlerts(orgId),
        queryFn: () => inventoryAnalyticsService.stockAlerts(orgId),
        enabled: options?.enabled !== false && !!orgId,
    });
}

export function useAnalyticsMargin(
    orgId: string,
    params: AnalyticsPeriodParams = {},
    options?: { enabled?: boolean }
): UseQueryResult<AnalyticsMargin, Error> {
    return useQuery({
        queryKey: inventoryAnalyticsKeys.margin(orgId, params),
        queryFn: () => inventoryAnalyticsService.margin(orgId, params),
        enabled: options?.enabled !== false && !!orgId,
    });
}

export function useAnalyticsMovements(
    orgId: string,
    params: AnalyticsPeriodParams = {},
    options?: { enabled?: boolean }
): UseQueryResult<AnalyticsMovements, Error> {
    return useQuery({
        queryKey: inventoryAnalyticsKeys.movements(orgId, params),
        queryFn: () => inventoryAnalyticsService.movements(orgId, params),
        enabled: options?.enabled !== false && !!orgId,
    });
}
