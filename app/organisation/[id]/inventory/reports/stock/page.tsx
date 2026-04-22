"use client";

import { PermissionGuard } from "@/components/permissions";
import { PeriodFilter, defaultPeriod, type Period } from "@/components/reports/PeriodFilter";
import {
    CsvExportButton,
    KPICard,
    ReportEmpty,
    ReportSection,
} from "@/components/reports/ReportPrimitives";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
    useAnalyticsMovements,
    useAnalyticsStockAlerts,
    useAnalyticsStockValue,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import {
    AlertTriangle,
    ArrowLeft,
    Boxes,
    Building,
    DollarSign,
    Move,
    Warehouse as WarehouseIcon
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

export default function StockReportPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.INVENTORY_REPORTS.VIEW}>
            <StockReportPage />
        </PermissionGuard>
    );
}

const CHART_COLORS = [
    "#ffd15d",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#3b82f6",
    "#14b8a6",
    "#ec4899",
];

function StockReportPage() {
    const params = useParams();
    const orgId = params.id as string;
    const { formatCurrency } = useCurrencyFormatter();

    const [period, setPeriod] = useState<Period>(defaultPeriod());

    const stockValue = useAnalyticsStockValue(orgId);
    const stockAlerts = useAnalyticsStockAlerts(orgId);
    const movements = useAnalyticsMovements(orgId, {
        from: period.from,
        to: period.to,
    });

    const warehouseChart = useMemo(
        () =>
            (stockValue.data?.by_warehouse ?? []).map((w, i) => ({
                name: w.name,
                value: Number(w.value),
                fill: CHART_COLORS[i % CHART_COLORS.length],
            })),
        [stockValue.data]
    );

    const categoryChart = useMemo(
        () =>
            (stockValue.data?.by_category ?? [])
                .filter((c) => Number(c.value) > 0)
                .map((c, i) => ({
                    name: c.name,
                    value: Number(c.value),
                    fill: CHART_COLORS[i % CHART_COLORS.length],
                })),
        [stockValue.data]
    );

    const movementsChart = useMemo(
        () =>
            (movements.data?.by_type ?? []).map((m) => ({
                name: m.label,
                count: m.count,
                quantity: Number(m.quantity),
            })),
        [movements.data]
    );

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
                            <WarehouseIcon className="h-6 w-6 text-primary" />
                            Rapport du stock
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Valorisation, mouvements et alertes de stock
                        </p>
                    </div>
                </div>
                <PeriodFilter value={period} onChange={setPeriod} />
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-4">
                {stockValue.isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-md" />
                    ))
                ) : stockValue.data ? (
                    <>
                        <KPICard
                            label="Valeur totale"
                            value={formatCurrency(
                                Number(stockValue.data.total_value)
                            )}
                            sublabel="Prix d'achat"
                            icon={<DollarSign className="h-5 w-5" />}
                            accentColor="primary"
                        />
                        <KPICard
                            label="Entrepôts"
                            value={stockValue.data.by_warehouse.length}
                            sublabel="Avec stock"
                            icon={<Building className="h-5 w-5" />}
                            accentColor="blue"
                        />
                        <KPICard
                            label="Alertes"
                            value={stockAlerts.data?.count ?? 0}
                            sublabel={
                                (stockAlerts.data?.count ?? 0) > 0
                                    ? "Sous le seuil"
                                    : "Tout OK"
                            }
                            icon={<AlertTriangle className="h-5 w-5" />}
                            accentColor={
                                (stockAlerts.data?.count ?? 0) > 0 ? "red" : "emerald"
                            }
                        />
                        <KPICard
                            label="Mouvements"
                            value={movements.data?.total_movements ?? 0}
                            sublabel={period.label}
                            icon={<Move className="h-5 w-5" />}
                            accentColor="purple"
                        />
                    </>
                ) : null}
            </div>

            {/* Valeur par entrepôt + par catégorie */}
            <div className="grid gap-4 lg:grid-cols-2">
                <ReportSection
                    title="Valeur par entrepôt"
                    description="Répartition de la valorisation du stock"
                    actions={
                        <CsvExportButton
                            filename="stock-par-entrepot"
                            rows={
                                stockValue.data?.by_warehouse.map((w) => ({
                                    Entrepôt: w.name,
                                    Code: w.code,
                                    Quantité: w.quantity,
                                    Valeur: w.value,
                                })) ?? []
                            }
                        />
                    }
                >
                    {stockValue.isLoading ? (
                        <Skeleton className="h-64" />
                    ) : warehouseChart.length === 0 ? (
                        <ReportEmpty icon={Building} message="Aucun stock" />
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={warehouseChart} layout="vertical">
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
                                        dataKey="value"
                                        radius={[0, 4, 4, 0]}
                                    >
                                        {warehouseChart.map((d, i) => (
                                            <Cell key={i} fill={d.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ReportSection>

                <ReportSection
                    title="Valeur par catégorie"
                    description="Contribution de chaque famille"
                    actions={
                        <CsvExportButton
                            filename="stock-par-categorie"
                            rows={
                                stockValue.data?.by_category.map((c) => ({
                                    Catégorie: c.name,
                                    Quantité: c.quantity,
                                    Valeur: c.value,
                                })) ?? []
                            }
                        />
                    }
                >
                    {stockValue.isLoading ? (
                        <Skeleton className="h-64" />
                    ) : categoryChart.length === 0 ? (
                        <ReportEmpty icon={Boxes} message="Aucune donnée" />
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryChart}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={50}
                                        outerRadius={90}
                                        paddingAngle={2}
                                    >
                                        {categoryChart.map((d, i) => (
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
                        </div>
                    )}
                </ReportSection>
            </div>

            {/* Mouvements */}
            <ReportSection
                title="Mouvements de stock"
                description={`${period.label} · Répartition par type`}
                actions={
                    <CsvExportButton
                        filename={`mouvements-${period.from}-${period.to}`}
                        rows={
                            movements.data?.by_type.map((m) => ({
                                Type: m.label,
                                "Code": m.movement_type,
                                "Nombre": m.count,
                                "Quantité cumulée": m.quantity,
                            })) ?? []
                        }
                    />
                }
            >
                {movements.isLoading ? (
                    <Skeleton className="h-56" />
                ) : movementsChart.length === 0 ? (
                    <ReportEmpty
                        icon={Move}
                        message="Aucun mouvement dans cette période"
                    />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={movementsChart}>
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
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            fontSize: 12,
                                            borderRadius: 6,
                                            border: "1px solid #e5e7eb",
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="#ffd15d"
                                        name="Nombre"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                            {movements.data?.by_type.map((m) => (
                                <div
                                    key={m.movement_type}
                                    className="flex items-center justify-between p-3 border rounded-md"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{m.label}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono">
                                            {m.movement_type}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold">{m.count}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Qté : {Number(m.quantity).toLocaleString("fr-FR")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </ReportSection>

            {/* Alertes */}
            <ReportSection
                title="Produits sous le seuil d'alerte"
                description="À réapprovisionner en priorité"
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
                                    <th className="py-2 pr-4 font-medium text-right">
                                        Seuil
                                    </th>
                                    <th className="py-2 font-medium text-right">
                                        Écart
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockAlerts.data.items.map((p) => {
                                    const current = Number(p.current_quantity);
                                    const min = Number(p.min_stock_level);
                                    const gap = current - min;
                                    return (
                                        <tr key={p.product_id} className="border-b">
                                            <td className="py-2 pr-4">
                                                <div className="font-medium text-xs">
                                                    {p.name}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-mono">
                                                    {p.sku}
                                                </div>
                                            </td>
                                            <td className="py-2 pr-4">
                                                {p.category_name ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] font-normal"
                                                    >
                                                        {p.category_name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/50">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-2 pr-4 text-right text-xs font-semibold text-red-700">
                                                {current.toFixed(2)}{" "}
                                                <span className="text-[10px] text-muted-foreground">
                                                    {p.unit_display.toLowerCase()}
                                                </span>
                                            </td>
                                            <td className="py-2 pr-4 text-right text-xs">
                                                {min.toFixed(2)}
                                            </td>
                                            <td className="py-2 text-right text-xs text-red-700 font-medium">
                                                {gap.toFixed(2)}
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
