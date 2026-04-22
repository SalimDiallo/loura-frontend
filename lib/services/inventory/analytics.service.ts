/**
 * Service API pour l'analytique Inventory (BI, rapports).
 *
 * Chaque endpoint renvoie des agrégations calculées côté backend et typées
 * côté frontend. Les montants sont encodés en string (Decimal stringifiable)
 * — utilise `Number(value)` ou `formatCurrency(Number(value))` pour l'affichage.
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";

// ─── Types ──────────────────────────────────────────────────────────────────

export type AnalyticsGranularity = "day" | "week" | "month";
export type TopProductsSortBy = "revenue" | "quantity" | "margin";

export interface AnalyticsPeriodParams {
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
}

export interface AnalyticsOverview {
    total_products: number;
    active_products: number;
    total_warehouses: number;
    total_customers: number;
    total_sales_today: number;
    revenue_today: string;
    pending_outstanding: string;
    stock_alerts_count: number;
    stock_value: string;
}

export interface SalesTrendPoint {
    period: string; // ISO date
    revenue: string;
    count: number;
}

export interface AnalyticsSalesTrend {
    from: string;
    to: string;
    granularity: AnalyticsGranularity;
    points: SalesTrendPoint[];
    total_revenue: string;
    total_count: number;
}

export interface TopProductItem {
    product_id: string;
    name: string;
    sku: string;
    quantity: string;
    revenue: string;
    cost: string;
    margin: string;
}

export interface AnalyticsTopProducts {
    from: string;
    to: string;
    sort_by: TopProductsSortBy;
    items: TopProductItem[];
}

export interface StockValueByWarehouse {
    warehouse_id: string;
    name: string;
    code: string;
    quantity: string;
    value: string;
}

export interface StockValueByCategory {
    category_id: string | null;
    name: string;
    quantity: string;
    value: string;
}

export interface AnalyticsStockValue {
    total_value: string;
    by_warehouse: StockValueByWarehouse[];
    by_category: StockValueByCategory[];
}

export interface StockAlertItem {
    product_id: string;
    name: string;
    sku: string;
    category_name: string | null;
    current_quantity: string;
    min_stock_level: string;
    unit: string;
    unit_display: string;
}

export interface AnalyticsStockAlerts {
    items: StockAlertItem[];
    count: number;
    total_current: string;
}

export interface MarginByCategory {
    category_id: string | null;
    name: string;
    revenue: string;
    cost: string;
    margin: string;
    margin_rate: string;
}

export interface AnalyticsMargin {
    from: string;
    to: string;
    total_revenue: string;
    total_cost: string;
    total_margin: string;
    margin_rate: string;
    by_category: MarginByCategory[];
}

export interface MovementByType {
    movement_type: string;
    label: string;
    count: number;
    quantity: string;
}

export interface AnalyticsMovements {
    from: string;
    to: string;
    total_movements: number;
    by_type: MovementByType[];
}

// ─── Service ────────────────────────────────────────────────────────────────

const toParams = (obj: object): Record<string, string> => {
    const out: Record<string, string> = {};
    Object.entries(obj).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
            out[k] = String(v);
        }
    });
    return out;
};

export const inventoryAnalyticsService = {
    overview(orgId: string) {
        return apiClient.get<AnalyticsOverview>(
            API_ENDPOINTS.INVENTORY.ANALYTICS.OVERVIEW(orgId)
        );
    },
    salesTrend(
        orgId: string,
        params: AnalyticsPeriodParams & { granularity?: AnalyticsGranularity } = {}
    ) {
        return apiClient.get<AnalyticsSalesTrend>(
            API_ENDPOINTS.INVENTORY.ANALYTICS.SALES_TREND(orgId),
            toParams(params)
        );
    },
    topProducts(
        orgId: string,
        params: AnalyticsPeriodParams & {
            limit?: number;
            by?: TopProductsSortBy;
        } = {}
    ) {
        return apiClient.get<AnalyticsTopProducts>(
            API_ENDPOINTS.INVENTORY.ANALYTICS.TOP_PRODUCTS(orgId),
            toParams(params)
        );
    },
    stockValue(orgId: string) {
        return apiClient.get<AnalyticsStockValue>(
            API_ENDPOINTS.INVENTORY.ANALYTICS.STOCK_VALUE(orgId)
        );
    },
    stockAlerts(orgId: string) {
        return apiClient.get<AnalyticsStockAlerts>(
            API_ENDPOINTS.INVENTORY.ANALYTICS.STOCK_ALERTS(orgId)
        );
    },
    margin(orgId: string, params: AnalyticsPeriodParams = {}) {
        return apiClient.get<AnalyticsMargin>(
            API_ENDPOINTS.INVENTORY.ANALYTICS.MARGIN(orgId),
            toParams(params)
        );
    },
    movements(orgId: string, params: AnalyticsPeriodParams = {}) {
        return apiClient.get<AnalyticsMovements>(
            API_ENDPOINTS.INVENTORY.ANALYTICS.MOVEMENTS(orgId),
            toParams(params)
        );
    },
};
