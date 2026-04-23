/**
 * Thème Recharts aligné sur les design tokens CSS (dark/light aware).
 *
 * Usage :
 *   <CartesianGrid {...chartGrid} />
 *   <XAxis {...chartAxis} />
 *   <Tooltip {...chartTooltip(formatCurrency)} />
 */

import type { CSSProperties } from "react";

export const CHART_CSS_VARS = {
    primary: "var(--primary)",
    muted: "var(--muted-foreground)",
    border: "var(--border)",
    card: "var(--card)",
    cardFg: "var(--card-foreground)",
    c1: "var(--chart-1)",
    c2: "var(--chart-2)",
    c3: "var(--chart-3)",
    c4: "var(--chart-4)",
    c5: "var(--chart-5)",
} as const;

export const CHART_SERIES_COLORS = [
    CHART_CSS_VARS.primary,
    CHART_CSS_VARS.c1,
    CHART_CSS_VARS.c3,
    CHART_CSS_VARS.c4,
    CHART_CSS_VARS.c2,
    CHART_CSS_VARS.c5,
];

export const chartGrid = {
    strokeDasharray: "3 3",
    stroke: CHART_CSS_VARS.border,
    vertical: false as const,
};

export const chartAxisTick = {
    fontSize: 11,
    fill: CHART_CSS_VARS.muted,
};

export const chartAxisLine = {
    stroke: CHART_CSS_VARS.border,
};

export const chartTooltipStyle: CSSProperties = {
    fontSize: 12,
    backgroundColor: CHART_CSS_VARS.card,
    border: `1px solid ${CHART_CSS_VARS.border}`,
    color: CHART_CSS_VARS.cardFg,
    padding: "6px 10px",
};

export const chartTooltipLabelStyle: CSSProperties = {
    color: CHART_CSS_VARS.muted,
    fontSize: 10,
    marginBottom: 2,
};

export const chartTooltipItemStyle: CSSProperties = {
    color: CHART_CSS_VARS.cardFg,
};

/** Helper : formater les valeurs numériques en notation compacte. */
export function compactNumber(v: number): string {
    return new Intl.NumberFormat("fr-FR", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(v);
}
