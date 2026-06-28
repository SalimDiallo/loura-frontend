import { ACCOUNTING_CATEGORY_LABELS, type CategoryBreakdown } from "@/lib/types/accounting";

/**
 * Convertit une variation % (string | null venant du backend) en prop `trend`
 * pour `KPICard`. `null` (base N-1 nulle ou comparaison impossible) → pas de
 * trend affiché.
 */
export function pctToTrend(
    pct: string | null | undefined
): { value: number } | undefined {
    if (pct === null || pct === undefined) return undefined;
    const n = Number(pct);
    if (Number.isNaN(n)) return undefined;
    return { value: n };
}

/** Sous-libellé "vs période précédente" lisible, ou undefined si pas de compa. */
export function comparisonSublabel(
    pct: string | null | undefined
): string | undefined {
    if (pct === null || pct === undefined) return undefined;
    const n = Number(pct);
    if (Number.isNaN(n)) return undefined;
    const sign = n >= 0 ? "+" : "";
    return `${sign}${n.toFixed(1)}% vs période précédente`;
}

/** Palette stable pour les camemberts (réutilisée entre produits/charges). */
export const PIE_COLORS = [
    "hsl(var(--primary))",
    "#10b981",
    "#f59e0b",
    "#6366f1",
    "#ef4444",
    "#14b8a6",
    "#a855f7",
    "#64748b",
];

/**
 * Mappe une catégorie P&L vers le `source` du journal de trésorerie, pour le
 * drill-down (cliquer une catégorie → journal filtré). `null` = pas de
 * filtrage source pertinent (catégorie hors trésorerie).
 */
export const CATEGORY_TO_SOURCE: Record<string, string | null> = {
    sales: "sale_payment",
    services: "service_transaction",
    suppliers: "po_payment",
    expenses: "expense",
    service_expenses: "service_transaction",
    payroll: "payroll",
    capital: "adjustment",
    withdrawal: "adjustment",
};

/** Transforme une ventilation backend en data prête pour recharts Pie. */
export function toPieData(
    rows: CategoryBreakdown[]
): { name: string; value: number }[] {
    return rows
        .map((r) => ({
            name: ACCOUNTING_CATEGORY_LABELS[r.category] ?? r.category,
            value: Number(r.total),
        }))
        .filter((d) => d.value > 0);
}
