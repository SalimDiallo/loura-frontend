"use client";

import { ReportEmpty } from "@/components/reports/ReportPrimitives";
import type { PnlTrendPoint } from "@/lib/types/accounting";
import { LineChart as LineChartIcon } from "lucide-react";
import {
    Area,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

/**
 * Courbe d'évolution produits / charges / résultat net.
 * Le résultat net est tracé en aire (positif/négatif visible), produits et
 * charges en lignes superposées.
 */
export function PnlTrendChart({
    points,
    formatCurrency,
}: {
    points: PnlTrendPoint[];
    formatCurrency: (n: number) => string;
}) {
    if (points.length === 0) {
        return (
            <ReportEmpty
                icon={LineChartIcon}
                message="Pas assez de données pour tracer une tendance."
            />
        );
    }

    const data = points.map((p) => ({
        period: p.period,
        revenue: Number(p.revenue),
        expense: Number(p.expense),
        net: Number(p.net),
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" fontSize={11} />
                <YAxis fontSize={11} width={70} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                    type="monotone"
                    dataKey="net"
                    name="Résultat net"
                    fill="hsl(var(--primary) / 0.15)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                />
                <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Produits"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                />
                <Line
                    type="monotone"
                    dataKey="expense"
                    name="Charges"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
