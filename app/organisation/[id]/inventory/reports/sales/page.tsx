"use client";

import { PermissionGuard } from "@/components/permissions";
import { PeriodFilter, defaultPeriod, type Period } from "@/components/reports/PeriodFilter";
import {
    CsvExportButton,
    KPICard,
    ReportEmpty,
    ReportSection,
} from "@/components/reports/ReportPrimitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
    useAnalyticsMargin,
    useAnalyticsSalesTrend,
    useAnalyticsTopProducts,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    AnalyticsGranularity,
    TopProductsSortBy,
} from "@/lib/services/inventory";
import {
    ArrowLeft,
    DollarSign,
    LineChart as LineChartIcon,
    Package,
    Receipt,
    TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

export default function SalesReportPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.INVENTORY_REPORTS.VIEW}>
            <SalesReportPage />
        </PermissionGuard>
    );
}

function SalesReportPage() {
    const params = useParams();
    const orgId = params.id as string;
    const { formatCurrency } = useCurrencyFormatter();

    const [period, setPeriod] = useState<Period>(defaultPeriod());
    const [granularity, setGranularity] =
        useState<AnalyticsGranularity>("day");
    const [sortBy, setSortBy] = useState<TopProductsSortBy>("revenue");

    const trend = useAnalyticsSalesTrend(orgId, {
        from: period.from,
        to: period.to,
        granularity,
    });
    const margin = useAnalyticsMargin(orgId, {
        from: period.from,
        to: period.to,
    });
    const topProducts = useAnalyticsTopProducts(orgId, {
        from: period.from,
        to: period.to,
        limit: 20,
        by: sortBy,
    });

    const trendData = useMemo(
        () =>
            (trend.data?.points ?? []).map((p) => ({
                period: formatChartDate(p.period, granularity),
                revenue: Number(p.revenue),
                count: p.count,
            })),
        [trend.data, granularity]
    );

    const avgTicket = useMemo(() => {
        if (!trend.data || trend.data.total_count === 0) return 0;
        return Number(trend.data.total_revenue) / trend.data.total_count;
    }, [trend.data]);

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/organisation/${orgId}/inventory/reports`}
                        className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <TrendingUp className="h-6 w-6 text-primary" />
                            Rapport des ventes
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Analyse détaillée du chiffre d'affaires, des marges et des top
                            produits
                        </p>
                    </div>
                </div>
                <PeriodFilter value={period} onChange={setPeriod} />
            </div>

            {/* KPIs */}
            {trend.isLoading || margin.isLoading ? (
                <div className="grid gap-4 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-md" />
                    ))}
                </div>
            ) : trend.data && margin.data ? (
                <div className="grid gap-4 md:grid-cols-4">
                    <KPICard
                        label="Chiffre d'affaires"
                        value={formatCurrency(Number(trend.data.total_revenue))}
                        sublabel={period.label}
                        icon={<DollarSign className="h-5 w-5" />}
                        accentColor="primary"
                    />
                    <KPICard
                        label="Nombre de ventes"
                        value={trend.data.total_count}
                        sublabel={`${(trend.data.total_count / Math.max(1, daysBetween(period.from, period.to))).toFixed(1)} / jour`}
                        icon={<Receipt className="h-5 w-5" />}
                        accentColor="blue"
                    />
                    <KPICard
                        label="Panier moyen"
                        value={formatCurrency(avgTicket)}
                        sublabel="Par transaction"
                        icon={<Package className="h-5 w-5" />}
                        accentColor="purple"
                    />
                    <KPICard
                        label="Marge brute"
                        value={`${Number(margin.data.margin_rate).toFixed(1)}%`}
                        sublabel={formatCurrency(Number(margin.data.total_margin))}
                        icon={<TrendingUp className="h-5 w-5" />}
                        accentColor="emerald"
                    />
                </div>
            ) : null}

            {/* Tendance détaillée */}
            <ReportSection
                title="Évolution du chiffre d'affaires"
                description={`${period.label} · ${trendData.length} point(s)`}
                actions={
                    <>
                        <div className="flex gap-0.5 bg-muted/50 p-0.5 rounded">
                            {(["day", "week", "month"] as const).map((g) => (
                                <Button
                                    key={g}
                                    variant={granularity === g ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setGranularity(g)}
                                    className="h-7 px-2 text-[11px]"
                                >
                                    {g === "day"
                                        ? "Jour"
                                        : g === "week"
                                          ? "Semaine"
                                          : "Mois"}
                                </Button>
                            ))}
                        </div>
                        <CsvExportButton
                            filename={`ventes-tendance-${period.from}-${period.to}`}
                            rows={
                                trend.data?.points.map((p) => ({
                                    Période: p.period,
                                    "CA": p.revenue,
                                    "Nombre": p.count,
                                })) ?? []
                            }
                        />
                    </>
                }
            >
                {trend.isLoading ? (
                    <Skeleton className="h-72" />
                ) : trendData.length === 0 ? (
                    <ReportEmpty
                        icon={LineChartIcon}
                        message="Aucune vente dans cette période"
                    />
                ) : (
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient
                                        id="caGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#ffd15d"
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#ffd15d"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="period"
                                    tick={{ fontSize: 11 }}
                                    stroke="#94a3b8"
                                />
                                <YAxis
                                    tick={{ fontSize: 11 }}
                                    stroke="#94a3b8"
                                    tickFormatter={(v) =>
                                        new Intl.NumberFormat("fr-FR", {
                                            notation: "compact",
                                            maximumFractionDigits: 1,
                                        }).format(v)
                                    }
                                />
                                <Tooltip
                                    formatter={(v) => formatCurrency(Number(v))}
                                    contentStyle={{
                                        fontSize: 12,
                                        borderRadius: 6,
                                        border: "1px solid #e5e7eb",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#ffd15d"
                                    strokeWidth={2}
                                    fill="url(#caGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </ReportSection>

            {/* Marge par catégorie */}
            <ReportSection
                title="Marge par catégorie"
                description="Contribution au résultat brut"
                actions={
                    <CsvExportButton
                        filename={`marge-categories-${period.from}-${period.to}`}
                        rows={
                            margin.data?.by_category.map((c) => ({
                                Catégorie: c.name,
                                "CA": c.revenue,
                                "Coût": c.cost,
                                "Marge": c.margin,
                                "Taux %": c.margin_rate,
                            })) ?? []
                        }
                    />
                }
            >
                {margin.isLoading ? (
                    <Skeleton className="h-48" />
                ) : !margin.data || margin.data.by_category.length === 0 ? (
                    <ReportEmpty
                        icon={DollarSign}
                        message="Aucune donnée de marge dans cette période"
                    />
                ) : (
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={margin.data.by_category.map((c) => ({
                                    name: c.name,
                                    revenue: Number(c.revenue),
                                    cost: Number(c.cost),
                                    margin: Number(c.margin),
                                }))}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11 }}
                                    stroke="#94a3b8"
                                />
                                <YAxis
                                    tick={{ fontSize: 11 }}
                                    stroke="#94a3b8"
                                    tickFormatter={(v) =>
                                        new Intl.NumberFormat("fr-FR", {
                                            notation: "compact",
                                            maximumFractionDigits: 1,
                                        }).format(v)
                                    }
                                />
                                <Tooltip
                                    formatter={(v) => formatCurrency(Number(v))}
                                    contentStyle={{
                                        fontSize: 12,
                                        borderRadius: 6,
                                        border: "1px solid #e5e7eb",
                                    }}
                                />
                                <Bar
                                    dataKey="cost"
                                    fill="#f59e0b"
                                    name="Coût"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="margin"
                                    fill="#10b981"
                                    name="Marge"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </ReportSection>

            {/* Top produits — tableau */}
            <ReportSection
                title="Classement des produits"
                description={`Top 20 · Trié par ${
                    sortBy === "revenue"
                        ? "chiffre d'affaires"
                        : sortBy === "quantity"
                          ? "quantité vendue"
                          : "marge"
                }`}
                actions={
                    <>
                        <div className="flex gap-0.5 bg-muted/50 p-0.5 rounded">
                            {(
                                [
                                    { key: "revenue", label: "CA" },
                                    { key: "quantity", label: "Qté" },
                                    { key: "margin", label: "Marge" },
                                ] as const
                            ).map((opt) => (
                                <Button
                                    key={opt.key}
                                    variant={sortBy === opt.key ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setSortBy(opt.key)}
                                    className="h-7 px-2 text-[11px]"
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                        <CsvExportButton
                            filename={`top-produits-${period.from}-${period.to}`}
                            rows={
                                topProducts.data?.items.map((p, i) => ({
                                    Rang: i + 1,
                                    Produit: p.name,
                                    SKU: p.sku,
                                    "Qté vendue": p.quantity,
                                    "CA": p.revenue,
                                    "Coût": p.cost,
                                    "Marge": p.margin,
                                })) ?? []
                            }
                        />
                    </>
                }
            >
                {topProducts.isLoading ? (
                    <Skeleton className="h-48" />
                ) : !topProducts.data ||
                  topProducts.data.items.length === 0 ? (
                    <ReportEmpty icon={Package} message="Aucun produit vendu" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b text-xs text-muted-foreground">
                                <tr className="text-left">
                                    <th className="py-2 pr-4 font-medium w-8">#</th>
                                    <th className="py-2 pr-4 font-medium">Produit</th>
                                    <th className="py-2 pr-4 font-medium text-right">Qté</th>
                                    <th className="py-2 pr-4 font-medium text-right">CA</th>
                                    <th className="py-2 pr-4 font-medium text-right">Coût</th>
                                    <th className="py-2 pr-4 font-medium text-right">Marge</th>
                                    <th className="py-2 font-medium text-right">Taux</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.data.items.map((p, i) => {
                                    const revenue = Number(p.revenue);
                                    const marginN = Number(p.margin);
                                    const rate =
                                        revenue > 0
                                            ? (marginN / revenue) * 100
                                            : 0;
                                    return (
                                        <tr key={p.product_id} className="border-b">
                                            <td className="py-2 pr-4 text-xs text-muted-foreground">
                                                {i + 1}
                                            </td>
                                            <td className="py-2 pr-4">
                                                <div className="font-medium text-xs">
                                                    {p.name}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-mono">
                                                    {p.sku}
                                                </div>
                                            </td>
                                            <td className="py-2 pr-4 text-right text-xs">
                                                {Number(p.quantity).toLocaleString("fr-FR")}
                                            </td>
                                            <td className="py-2 pr-4 text-right text-xs font-medium">
                                                {formatCurrency(revenue)}
                                            </td>
                                            <td className="py-2 pr-4 text-right text-xs text-muted-foreground">
                                                {formatCurrency(Number(p.cost))}
                                            </td>
                                            <td className="py-2 pr-4 text-right text-xs font-medium text-emerald-700">
                                                {formatCurrency(marginN)}
                                            </td>
                                            <td className="py-2 text-right text-xs text-muted-foreground">
                                                {rate.toFixed(1)}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </ReportSection>
        </div>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysBetween(from: string, to: string): number {
    const f = new Date(from).getTime();
    const t = new Date(to).getTime();
    return Math.max(1, Math.round((t - f) / 86_400_000) + 1);
}

function formatChartDate(iso: string, granularity: AnalyticsGranularity): string {
    const d = new Date(iso);
    if (granularity === "month") {
        return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    }
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
