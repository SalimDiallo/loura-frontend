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
    useAnalyticsOverview,
    useAnalyticsSalesTrend,
    useAnalyticsStockAlerts,
    useAnalyticsStockValue,
    useAnalyticsTopProducts,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { AnalyticsGranularity } from "@/lib/services/inventory";
import {
    AlertTriangle,
    ArrowRight,
    Boxes,
    DollarSign,
    LineChart as LineChartIcon,
    Package,
    Receipt,
    TrendingUp,
    Warehouse
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

export default function ReportsHubPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.INVENTORY_REPORTS.VIEW}>
            <ReportsHubPage />
        </PermissionGuard>
    );
}

const CHART_COLORS = [
    "#C3600B",
    "#10b981",
    "#9E9990",
    "#ef4444",
    "#8b5cf6",
    "#3b82f6",
    "#14b8a6",
    "#ec4899",
];

function ReportsHubPage() {
    const params = useParams();
    const orgId = params.id as string;
    const { formatCurrency } = useCurrencyFormatter();

    const [period, setPeriod] = useState<Period>(defaultPeriod());
    const [granularity, setGranularity] =
        useState<AnalyticsGranularity>("day");

    const overview = useAnalyticsOverview(orgId);
    const trend = useAnalyticsSalesTrend(orgId, {
        from: period.from,
        to: period.to,
        granularity,
    });
    const topProducts = useAnalyticsTopProducts(orgId, {
        from: period.from,
        to: period.to,
        limit: 10,
        by: "revenue",
    });
    const margin = useAnalyticsMargin(orgId, {
        from: period.from,
        to: period.to,
    });
    const stockValue = useAnalyticsStockValue(orgId);
    const stockAlerts = useAnalyticsStockAlerts(orgId);

    // Formatage série temporelle
    const trendChartData = useMemo(() => {
        return (trend.data?.points ?? []).map((p) => ({
            period: formatChartDate(p.period, granularity),
            revenue: Number(p.revenue),
            count: p.count,
        }));
    }, [trend.data, granularity]);

    // Formatage top produits
    const topProductsChartData = useMemo(() => {
        return (topProducts.data?.items ?? []).slice(0, 5).map((p) => ({
            name: truncate(p.name, 14),
            revenue: Number(p.revenue),
            margin: Number(p.margin),
        }));
    }, [topProducts.data]);

    // Répartition stock par catégorie (pie)
    const stockByCategoryData = useMemo(() => {
        const items = (stockValue.data?.by_category ?? []).filter(
            (c) => Number(c.value) > 0
        );
        return items.map((c, idx) => ({
            name: c.name,
            value: Number(c.value),
            fill: CHART_COLORS[idx % CHART_COLORS.length],
        }));
    }, [stockValue.data]);

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <LineChartIcon className="h-6 w-6 text-primary" />
                        Rapports & Analytique
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Vue d'ensemble des indicateurs clés de votre activité
                    </p>
                </div>
                <PeriodFilter value={period} onChange={setPeriod} />
            </div>

            {/* KPIs globaux (live, indépendants de la période) */}
            {overview.isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-md" />
                    ))}
                </div>
            ) : overview.data ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KPICard
                        label="Ventes aujourd'hui"
                        value={overview.data.total_sales_today}
                        sublabel={`CA : ${formatCurrency(Number(overview.data.revenue_today))}`}
                        icon={<Receipt className="h-5 w-5" />}
                        accentColor="primary"
                    />
                    <KPICard
                        label="Créances clients"
                        value={formatCurrency(Number(overview.data.pending_outstanding))}
                        sublabel="Restant à encaisser"
                        icon={<DollarSign className="h-5 w-5" />}
                        accentColor="amber"
                    />
                    <KPICard
                        label="Valeur stock"
                        value={formatCurrency(Number(overview.data.stock_value))}
                        sublabel={`${overview.data.active_products} produit(s) actif(s)`}
                        icon={<Boxes className="h-5 w-5" />}
                        accentColor="blue"
                    />
                    <KPICard
                        label="Alertes stock"
                        value={overview.data.stock_alerts_count}
                        sublabel={overview.data.stock_alerts_count > 0 ? "À réapprovisionner" : "Tout est OK"}
                        icon={<AlertTriangle className="h-5 w-5" />}
                        accentColor={
                            overview.data.stock_alerts_count > 0 ? "red" : "emerald"
                        }
                    />
                </div>
            ) : null}

            {/* Ligne 1 : Tendance CA + Marge */}
            <div className="grid gap-4 lg:grid-cols-3">
                <ReportSection
                    title="Tendance du chiffre d'affaires"
                    description={`${period.label} · ${trend.data?.total_count ?? 0} vente(s)`}
                    className="lg:col-span-2"
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
                                              ? "Sem."
                                              : "Mois"}
                                    </Button>
                                ))}
                            </div>
                            <CsvExportButton
                                filename={`tendance-ca-${period.from}-${period.to}`}
                                rows={
                                    trend.data?.points.map((p) => ({
                                        Période: p.period,
                                        "Chiffre d'affaires": p.revenue,
                                        "Nombre de ventes": p.count,
                                    })) ?? []
                                }
                            />
                        </>
                    }
                >
                    {trend.isLoading ? (
                        <Skeleton className="h-64 w-full" />
                    ) : trendChartData.length === 0 ? (
                        <ReportEmpty
                            icon={LineChartIcon}
                            message="Aucune vente dans cette période"
                        />
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendChartData}>
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
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#ffd15d"
                                        strokeWidth={2}
                                        dot={{ r: 3 }}
                                        activeDot={{ r: 5 }}
                                        name="CA"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ReportSection>

                <ReportSection
                    title="Marge sur la période"
                    description={period.label}
                >
                    {margin.isLoading ? (
                        <Skeleton className="h-48" />
                    ) : margin.data ? (
                        <div className="space-y-3">
                            <KpiMini
                                label="Chiffre d'affaires"
                                value={formatCurrency(Number(margin.data.total_revenue))}
                            />
                            <KpiMini
                                label="Coût des ventes"
                                value={formatCurrency(Number(margin.data.total_cost))}
                            />
                            <div className="pt-3 border-t space-y-2">
                                <KpiMini
                                    label="Marge brute"
                                    value={formatCurrency(Number(margin.data.total_margin))}
                                    strong
                                />
                                <KpiMini
                                    label="Taux de marge"
                                    value={`${Number(margin.data.margin_rate).toFixed(2)}%`}
                                    accent
                                />
                            </div>
                        </div>
                    ) : null}
                </ReportSection>
            </div>

            {/* Ligne 2 : Top produits + Stock par catégorie */}
            <div className="grid gap-4 lg:grid-cols-3">
                <ReportSection
                    title="Top 5 produits (CA)"
                    description="Meilleurs contributeurs au chiffre d'affaires"
                    className="lg:col-span-2"
                    actions={
                        <CsvExportButton
                            filename={`top-produits-${period.from}-${period.to}`}
                            rows={
                                topProducts.data?.items.map((p) => ({
                                    Produit: p.name,
                                    SKU: p.sku,
                                    Quantité: p.quantity,
                                    "Chiffre d'affaires": p.revenue,
                                    Coût: p.cost,
                                    Marge: p.margin,
                                })) ?? []
                            }
                        />
                    }
                >
                    {topProducts.isLoading ? (
                        <Skeleton className="h-64 w-full" />
                    ) : topProductsChartData.length === 0 ? (
                        <ReportEmpty
                            icon={Package}
                            message="Aucune vente dans cette période"
                        />
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={topProductsChartData}
                                    layout="vertical"
                                    margin={{ left: 0 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e5e7eb"
                                        horizontal={false}
                                    />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 11 }}
                                        stroke="#94a3b8"
                                        tickFormatter={(v) =>
                                            new Intl.NumberFormat("fr-FR", {
                                                notation: "compact",
                                                maximumFractionDigits: 1,
                                            }).format(v)
                                        }
                                    />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        tick={{ fontSize: 11 }}
                                        stroke="#94a3b8"
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
                                        dataKey="revenue"
                                        fill="#ffd15d"
                                        name="CA"
                                        radius={[0, 4, 4, 0]}
                                    />
                                    <Bar
                                        dataKey="margin"
                                        fill="#10b981"
                                        name="Marge"
                                        radius={[0, 4, 4, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ReportSection>

                <ReportSection
                    title="Stock par catégorie"
                    description="Répartition de la valeur du stock"
                >
                    {stockValue.isLoading ? (
                        <Skeleton className="h-64 w-full" />
                    ) : stockByCategoryData.length === 0 ? (
                        <ReportEmpty icon={Boxes} message="Stock vide" />
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stockByCategoryData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={45}
                                        outerRadius={75}
                                        paddingAngle={2}
                                    >
                                        {stockByCategoryData.map((d, i) => (
                                            <Cell key={i} fill={d.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(v) => formatCurrency(Number(v))}
                                        contentStyle={{
                                            fontSize: 12,
                                            borderRadius: 6,
                                            border: "1px solid #e5e7eb",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {stockByCategoryData.map((d) => (
                                    <div
                                        key={d.name}
                                        className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                                    >
                                        <span
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: d.fill }}
                                        />
                                        {d.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </ReportSection>
            </div>

            {/* Ligne 3 : Alertes + raccourcis vers sous-rapports */}
            <div className="grid gap-4 lg:grid-cols-3">
                <ReportSection
                    title="Alertes de stock"
                    description="Produits sous le seuil de réapprovisionnement"
                    className="lg:col-span-2"
                    actions={
                        <CsvExportButton
                            filename="alertes-stock"
                            rows={
                                stockAlerts.data?.items.map((p) => ({
                                    Produit: p.name,
                                    SKU: p.sku,
                                    Catégorie: p.category_name || "",
                                    "Stock actuel": p.current_quantity,
                                    Seuil: p.min_stock_level,
                                    Unité: p.unit_display,
                                })) ?? []
                            }
                        />
                    }
                >
                    {stockAlerts.isLoading ? (
                        <Skeleton className="h-32" />
                    ) : !stockAlerts.data ||
                      stockAlerts.data.items.length === 0 ? (
                        <ReportEmpty
                            icon={AlertTriangle}
                            message="Aucune alerte, tous les niveaux sont au-dessus du seuil"
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b text-xs text-muted-foreground">
                                    <tr className="text-left">
                                        <th className="py-2 pr-4 font-medium">Produit</th>
                                        <th className="py-2 pr-4 font-medium">Catégorie</th>
                                        <th className="py-2 pr-4 font-medium text-right">
                                            Stock
                                        </th>
                                        <th className="py-2 font-medium text-right">Seuil</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockAlerts.data.items.slice(0, 8).map((p) => (
                                        <tr key={p.product_id} className="border-b">
                                            <td className="py-2 pr-4">
                                                <div className="font-medium text-xs">
                                                    {p.name}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-mono">
                                                    {p.sku}
                                                </div>
                                            </td>
                                            <td className="py-2 pr-4 text-xs text-muted-foreground">
                                                {p.category_name ?? "—"}
                                            </td>
                                            <td className="py-2 pr-4 text-right text-xs font-semibold text-red-700">
                                                {Number(p.current_quantity).toFixed(2)}
                                            </td>
                                            <td className="py-2 text-right text-xs">
                                                {Number(p.min_stock_level).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {stockAlerts.data.items.length > 8 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    + {stockAlerts.data.items.length - 8} autre(s)
                                </p>
                            )}
                        </div>
                    )}
                </ReportSection>

                <ReportSection
                    title="Rapports détaillés"
                    description="Accéder aux vues approfondies"
                >
                    <div className="space-y-2">
                        {[
                            {
                                label: "Ventes & tendances",
                                desc: "CA, marges, top produits",
                                href: `/organisation/${orgId}/inventory/reports/sales`,
                                icon: TrendingUp,
                            },
                            {
                                label: "Stock & mouvements",
                                desc: "Valeur, entrées/sorties, alertes",
                                href: `/organisation/${orgId}/inventory/reports/stock`,
                                icon: Warehouse,
                            },
                        ].map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="group flex items-center gap-3 p-3 border rounded-md hover:border-primary hover:bg-muted/30 transition-colors"
                            >
                                <div className="h-9 w-9 bg-primary/10 text-primary rounded flex items-center justify-center">
                                    <link.icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{link.label}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {link.desc}
                                    </p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                            </Link>
                        ))}
                    </div>
                </ReportSection>
            </div>
        </div>
    );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function KpiMini({
    label,
    value,
    strong,
    accent,
}: {
    label: string;
    value: string;
    strong?: boolean;
    accent?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span
                className={
                    accent
                        ? "text-lg font-bold text-primary"
                        : strong
                          ? "font-semibold"
                          : "text-sm"
                }
            >
                {value}
            </span>
        </div>
    );
}

function truncate(s: string, n: number) {
    return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function formatChartDate(iso: string, granularity: AnalyticsGranularity): string {
    const d = new Date(iso);
    if (granularity === "month") {
        return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    }
    if (granularity === "week") {
        return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    }
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
