/**
 * Types du module Comptabilité (accounting) — phase 1 (reporting).
 *
 * Les montants sont encodés en string (Decimal côté backend) sauf certains
 * agrégats sérialisés en number par DRF. On normalise à l'affichage via
 * `Number(value)`. Voir `lib/services/accounting`.
 */

// ─── Catégories P&L (clés stables côté backend) ───────────────────────────────

export type AccountingCategory =
    | "sales"
    | "services"
    | "capital"
    | "suppliers"
    | "expenses"
    | "service_expenses"
    | "payroll"
    | "withdrawal"
    | (string & {});

/** Libellés FR des catégories (le backend ne renvoie que la clé). */
export const ACCOUNTING_CATEGORY_LABELS: Record<string, string> = {
    sales: "Ventes",
    services: "Services",
    capital: "Apport de capital",
    suppliers: "Fournisseurs",
    expenses: "Dépenses",
    service_expenses: "Charges services",
    payroll: "Salaires",
    withdrawal: "Retrait de fonds",
};

export type AccountingSourceType =
    | "sale_payment"
    | "adjustment"
    | "po_payment"
    | "expense"
    | "service_transaction"
    | "payroll"
    | (string & {});

export type FlowDirection = "in" | "out";

// ─── Paramètres ───────────────────────────────────────────────────────────────

export interface AccountingPeriodParams {
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
    /** Filtre par entrepôt/caisse (UUID). Vide = toutes. */
    warehouse?: string;
}

export interface PnlTrendParams extends AccountingPeriodParams {
    granularity?: "month" | "week" | "day";
}

export interface TreasuryJournalParams extends AccountingPeriodParams {
    warehouse?: string;
    direction?: FlowDirection;
    source?: AccountingSourceType;
    method?: string;
    page?: number;
    page_size?: number | "all";
}

// ─── Réponses ─────────────────────────────────────────────────────────────────

export interface PeriodInfo {
    from: string | null;
    to: string | null;
}

export interface CategoryBreakdown {
    category: AccountingCategory;
    total: string;
    count: number;
}

/**
 * Comparaison à la période précédente (même durée juste avant).
 * Les `*_change_pct` sont `null` si la base N-1 est nulle (variation
 * "infinie" → afficher « nouveau ») ; tout est `null` si la fenêtre courante
 * n'a pas deux bornes.
 */
export interface ComparisonBlock {
    previous_period: PeriodInfo;
    previous_revenue: string | null;
    previous_expense: string | null;
    previous_net_result: string | null;
    revenue_change_pct: string | null;
    expense_change_pct: string | null;
    net_result_change_pct: string | null;
}

export interface PnlTrendPoint {
    period: string; // "YYYY-MM" | "YYYY-Www" | "YYYY-MM-DD"
    revenue: string;
    expense: string;
    net: string;
}

export interface PnlTrendResponse {
    period: PeriodInfo;
    granularity: "month" | "week" | "day";
    results: PnlTrendPoint[];
}

export interface AccountingOverview {
    period: PeriodInfo;
    total_revenue: number;
    total_expense: number;
    net_result: number;
    net_margin: string | null;
    treasury_in: number;
    treasury_out: number;
    treasury_net_flow: number;
    receivables_total: number;
    receivables_overdue_total: number;
    payables_total: number;
    payables_overdue_total: number;
    comparison: ComparisonBlock;
    trend: PnlTrendPoint[];
    revenue_by_category: CategoryBreakdown[];
    expense_by_category: CategoryBreakdown[];
    top_expenses: CategoryBreakdown[];
}

export interface Pnl {
    period: PeriodInfo;
    total_revenue: string;
    total_expense: string;
    net_result: string;
    net_margin: string | null;
    comparison: ComparisonBlock;
    revenue_by_category: Record<string, string>;
    expense_by_category: Record<string, string>;
}

export interface TreasuryLine {
    id: string;
    source_type: AccountingSourceType;
    direction: FlowDirection;
    category: AccountingCategory;
    amount: string;
    method: string;
    label: string;
    reference: string;
    date: string;
    warehouse_id: string | null;
    warehouse_name: string;
    created_by_info: { id: string; name?: string; email?: string } | null;
}

export interface CategoryBreakdownResponse {
    period: PeriodInfo;
    results: CategoryBreakdown[];
}

export interface OutstandingItem {
    id: string;
    reference: string;
    party: string;
    total: string;
    paid: string;
    outstanding: string;
    date: string;
    due_date: string | null;
    days_overdue: number | null;
    is_overdue: boolean;
    warehouse_id: string | null;
}

export interface OutstandingResponse {
    total: string;
    overdue_total: string;
    results: OutstandingItem[];
}
