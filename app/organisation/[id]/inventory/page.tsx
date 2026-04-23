"use client";

import { Can } from "@/components/permissions";
import {
    CHART_CSS_VARS,
    chartAxisLine,
    chartAxisTick,
    chartGrid,
    chartTooltipItemStyle,
    chartTooltipLabelStyle,
    chartTooltipStyle,
    compactNumber,
} from "@/components/reports/chartTheme";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import { useOrganization } from "@/lib/hooks/core";
import {
    useAnalyticsOverview,
    useAnalyticsSalesTrend,
    useAnalyticsStockAlerts,
    useAnalyticsTopProducts,
    useSales,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { Sale } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertTriangle, Package, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import type { IconType } from "react-icons";
import {
    FaBox,
    FaClipboardCheck,
    FaDollarSign,
    FaPlus,
    FaReceipt,
    FaShoppingCart,
    FaWarehouse,
} from "react-icons/fa";
import { HiReceiptPercent } from "react-icons/hi2";
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

// ────────────────────────────────────────────────────────────────────────────
// PAGE
// ────────────────────────────────────────────────────────────────────────────

export default function InventoryDashboardPage() {
    const params = useParams();
    const orgId = params.id as string;

    return (
        <div className="container mx-auto p-6 md:p-8 space-y-10">
            <Hero orgId={orgId} />
            <QuickActions orgId={orgId} />

            <Can permission={PERMISSIONS.INVENTORY_REPORTS.VIEW}>
                <KpisRow orgId={orgId} />
                <div className="grid gap-6 lg:grid-cols-3">
                    <SalesTrendWidget orgId={orgId} />
                    <TopProductsWidget orgId={orgId} />
                </div>
                <StockAlertsWidget orgId={orgId} />
            </Can>

            <Can permission={PERMISSIONS.SALES.VIEW}>
                <RecentSalesWidget orgId={orgId} />
            </Can>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// SECTION TITLE (réutilisable interne)
// ────────────────────────────────────────────────────────────────────────────

function SectionTitle({
    title,
    description,
    actions,
}: {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}) {
    return (
        <div className="flex items-end justify-between gap-4 border-b border-border pb-2">
            <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    {title}
                </h2>
                {description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {description}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2 text-xs">{actions}</div>
            )}
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// HERO — indépendant : fetch org
// ────────────────────────────────────────────────────────────────────────────

function Hero({ orgId }: { orgId: string }) {
    const { data: org, isLoading } = useOrganization(orgId);

    if (isLoading) {
        return <Skeleton className="h-16 w-full" />;
    }

    const orgName = org?.name ?? "Organisation";
    const initials = orgName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary text-primary-foreground flex items-center justify-center font-bold">
                {initials}
            </div>
            <div>
                <h1 className="text-2xl font-bold text-foreground">{orgName}</h1>
                <p className="text-sm text-muted-foreground">
                    Inventaire · Tableau de bord
                </p>
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// QUICK ACTIONS — pas de fetch, gated par permissions
// ────────────────────────────────────────────────────────────────────────────

function QuickActions({ orgId }: { orgId: string }) {
    const actions: Array<{
        label: string;
        href: string;
        icon: typeof FaPlus;
        perm: string;
    }> = [
        {
            label: "Nouvelle vente",
            href: `/organisation/${orgId}/inventory/pos`,
            icon: FaShoppingCart,
            perm: PERMISSIONS.SALES.MANAGE,
        },
        {
            label: "Ajouter produit",
            href: `/organisation/${orgId}/inventory/products/create`,
            icon: FaBox,
            perm: PERMISSIONS.PRODUCTS.MANAGE,
        },
        {
            label: "Commande fournisseur",
            href: `/organisation/${orgId}/inventory/purchase-orders/create`,
            icon: HiReceiptPercent,
            perm: PERMISSIONS.PURCHASE_ORDERS.MANAGE,
        },
        {
            label: "Inventaire physique",
            href: `/organisation/${orgId}/inventory/physical-inventories/create`,
            icon: FaClipboardCheck,
            perm: PERMISSIONS.STOCK.MANAGE,
        },
        {
            label: "Rapports",
            href: `/organisation/${orgId}/inventory/reports`,
            icon: TrendingUp,
            perm: PERMISSIONS.INVENTORY_REPORTS.VIEW,
        },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
                <Can key={a.label} permission={a.perm}>
                    <Link
                        href={a.href}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-card text-sm text-card-foreground hover:bg-muted/60 transition-colors"
                    >
                        <a.icon className="h-4 w-4 text-muted-foreground" />
                        {a.label}
                    </Link>
                </Can>
            ))}
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// KPIs — hook dédié (useAnalyticsOverview), 1 call
// ────────────────────────────────────────────────────────────────────────────

function KpisRow({ orgId }: { orgId: string }) {
    const { data, isLoading } = useAnalyticsOverview(orgId);
    const { formatCurrency } = useCurrencyFormatter();

    const kpis = useMemo(() => {
        if (!data) return [];
        return [
            {
                label: "Ventes aujourd'hui",
                value: String(data.total_sales_today),
                sub: formatCurrency(Number(data.revenue_today)),
                icon: FaReceipt,
                tone: "primary" as const,
            },
            {
                label: "Créances clients",
                value: formatCurrency(Number(data.pending_outstanding)),
                sub: "Restant à encaisser",
                icon: FaDollarSign,
                tone: "warning" as const,
            },
            {
                label: "Valeur du stock",
                value: formatCurrency(Number(data.stock_value)),
                sub: `${data.active_products} produit(s) actif(s)`,
                icon: Package,
                tone: "info" as const,
            },
            {
                label: "Alertes stock",
                value: String(data.stock_alerts_count),
                sub:
                    data.stock_alerts_count > 0
                        ? "À réapprovisionner"
                        : "Niveaux OK",
                icon: AlertTriangle,
                tone:
                    data.stock_alerts_count > 0
                        ? ("danger" as const)
                        : ("success" as const),
            },
        ];
    }, [data, formatCurrency]);

    return (
        <section className="space-y-4">
            <SectionTitle
                title="Indicateurs clés"
                description="Vue temps réel"
            />
            {isLoading ? (
                <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="h-24 w-full rounded-none bg-card"
                        />
                    ))}
                </div>
            ) : (
                <div className="grid gap-px bg-border md:grid-cols-2 lg:grid-cols-4">
                    {kpis.map((kpi) => (
                        <KpiTile key={kpi.label} {...kpi} />
                    ))}
                </div>
            )}
        </section>
    );
}

function KpiTile({
    label,
    value,
    sub,
    icon: Icon,
    tone,
}: {
    label: string;
    value: string;
    sub: string;
    icon: IconType | typeof FaPlus;
    tone: "primary" | "warning" | "info" | "success" | "danger";
}) {
    const toneMap: Record<typeof tone, string> = {
        primary: "text-foreground",
        warning: "text-amber-600 dark:text-amber-400",
        info: "text-sky-700 dark:text-sky-300",
        success: "text-emerald-700 dark:text-emerald-400",
        danger: "text-red-700 dark:text-red-400",
    };
    return (
        <div className="bg-card p-5 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    {label}
                </p>
                <p
                    className={cn(
                        "text-2xl font-bold mt-1 truncate",
                        toneMap[tone]
                    )}
                >
                    {value}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                    {sub}
                </p>
            </div>
            <Icon className={cn("h-5 w-5 mt-1 shrink-0", toneMap[tone])} />
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// SALES TREND — hook dédié, 30 jours
// ────────────────────────────────────────────────────────────────────────────

function SalesTrendWidget({ orgId }: { orgId: string }) {
    const { formatCurrency } = useCurrencyFormatter();
    const { from, to } = useMemo(() => last30Days(), []);

    const { data, isLoading } = useAnalyticsSalesTrend(orgId, {
        from,
        to,
        granularity: "day",
    });

    const chartData = useMemo(
        () =>
            (data?.points ?? []).map((p) => ({
                period: formatShortDay(p.period),
                revenue: Number(p.revenue),
            })),
        [data]
    );

    return (
        <section className="space-y-4 lg:col-span-2">
            <SectionTitle
                title="Chiffre d'affaires · 30 jours"
                description={
                    data
                        ? `${data.total_count} vente(s) · ${formatCurrency(
                              Number(data.total_revenue)
                          )}`
                        : undefined
                }
            />
            <div className="bg-card p-5">
                {isLoading ? (
                    <Skeleton className="h-56 rounded-none" />
                ) : chartData.length === 0 ? (
                    <EmptyBlock
                        icon={TrendingUp}
                        message="Aucune vente dans les 30 derniers jours"
                    />
                ) : (
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient
                                        id="trendFill"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor={CHART_CSS_VARS.primary}
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor={CHART_CSS_VARS.primary}
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid {...chartGrid} />
                                <XAxis
                                    dataKey="period"
                                    tick={chartAxisTick}
                                    axisLine={chartAxisLine}
                                    tickLine={false}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    tick={chartAxisTick}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={compactNumber}
                                />
                                <Tooltip
                                    contentStyle={chartTooltipStyle}
                                    labelStyle={chartTooltipLabelStyle}
                                    itemStyle={chartTooltipItemStyle}
                                    formatter={(v) =>
                                        formatCurrency(Number(v))
                                    }
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke={CHART_CSS_VARS.primary}
                                    strokeWidth={2}
                                    fill="url(#trendFill)"
                                    name="CA"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </section>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// TOP PRODUCTS — hook dédié, limit 5
// ────────────────────────────────────────────────────────────────────────────

function TopProductsWidget({ orgId }: { orgId: string }) {
    const { formatCurrency } = useCurrencyFormatter();
    const { from, to } = useMemo(() => last30Days(), []);

    const { data, isLoading } = useAnalyticsTopProducts(orgId, {
        from,
        to,
        limit: 5,
        by: "revenue",
    });

    const chartData = useMemo(
        () =>
            (data?.items ?? []).map((p) => ({
                name: truncate(p.name, 18),
                revenue: Number(p.revenue),
            })),
        [data]
    );

    return (
        <section className="space-y-4">
            <SectionTitle
                title="Top 5 produits"
                description="30 derniers jours · CA"
            />
            <div className="bg-card p-5">
                {isLoading ? (
                    <Skeleton className="h-56 rounded-none" />
                ) : chartData.length === 0 ? (
                    <EmptyBlock
                        icon={Package}
                        message="Aucune vente enregistrée"
                    />
                ) : (
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid
                                    {...chartGrid}
                                    vertical
                                    horizontal={false}
                                />
                                <XAxis
                                    type="number"
                                    tick={chartAxisTick}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={compactNumber}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={chartAxisTick}
                                    axisLine={chartAxisLine}
                                    tickLine={false}
                                    width={110}
                                />
                                <Tooltip
                                    contentStyle={chartTooltipStyle}
                                    labelStyle={chartTooltipLabelStyle}
                                    itemStyle={chartTooltipItemStyle}
                                    formatter={(v) =>
                                        formatCurrency(Number(v))
                                    }
                                    cursor={{
                                        fill: CHART_CSS_VARS.border,
                                        opacity: 0.3,
                                    }}
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill={CHART_CSS_VARS.primary}
                                    name="CA"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </section>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// STOCK ALERTS — hook dédié, limite d'affichage = 5
// ────────────────────────────────────────────────────────────────────────────

function StockAlertsWidget({ orgId }: { orgId: string }) {
    const { data, isLoading } = useAnalyticsStockAlerts(orgId);
    const items = data?.items.slice(0, 5) ?? [];
    const remaining = Math.max(0, (data?.count ?? 0) - items.length);

    const params = useParams();
    const orgIdParam = params.id as string;

    return (
        <section className="space-y-4">
            <SectionTitle
                title="Alertes de stock"
                description="Produits sous leur seuil de réapprovisionnement"
                actions={
                    <Link
                        href={`/organisation/${orgIdParam}/inventory/alerts`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        Voir tout →
                    </Link>
                }
            />
            <div className="bg-card">
                {isLoading ? (
                    <Skeleton className="h-32 rounded-none" />
                ) : items.length === 0 ? (
                    <EmptyBlock
                        icon={FaWarehouse}
                        message="Aucune alerte, tous les niveaux sont au-dessus du seuil"
                    />
                ) : (
                    <div className="divide-y divide-border">
                        {items.map((p) => {
                            const current = Number(p.current_quantity);
                            const min = Number(p.min_stock_level);
                            return (
                                <div
                                    key={p.product_id}
                                    className="flex items-center justify-between gap-4 px-5 py-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {p.name}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground font-mono">
                                            {p.sku}
                                            {p.category_name && (
                                                <span className="ml-2 font-sans">
                                                    · {p.category_name}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                                            {current.toFixed(2)}
                                            <span className="text-[10px] text-muted-foreground font-normal ml-1">
                                                {p.unit_display.toLowerCase()}
                                            </span>
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Seuil : {min.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        {remaining > 0 && (
                            <div className="px-5 py-2 text-[11px] text-muted-foreground">
                                + {remaining} autre(s) en alerte
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// RECENT SALES — hook useSales avec page_size=5
// ────────────────────────────────────────────────────────────────────────────

function RecentSalesWidget({ orgId }: { orgId: string }) {
    const { formatCurrency } = useCurrencyFormatter();
    const { data, isLoading } = useSales(orgId, { page_size: 5 });
    // L'endpoint peut renvoyer soit un tableau direct, soit un objet paginé DRF
    // ({ results, count, ... }). On normalise ici.
    const sales = useMemo<Sale[]>(() => {
        if (!data) return [];
        if (Array.isArray(data)) return data.slice(0, 5);
        const results = (data as { results?: unknown }).results;
        return Array.isArray(results) ? (results as Sale[]).slice(0, 5) : [];
    }, [data]);

    return (
        <section className="space-y-4">
            <SectionTitle
                title="Ventes récentes"
                description="Les 5 dernières opérations"
                actions={
                    <Link
                        href={`/organisation/${orgId}/inventory/sales`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        Voir toutes →
                    </Link>
                }
            />
            <div className="bg-card">
                {isLoading ? (
                    <Skeleton className="h-32 rounded-none" />
                ) : sales.length === 0 ? (
                    <EmptyBlock
                        icon={FaReceipt}
                        message="Aucune vente enregistrée"
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                                    <th className="font-medium px-5 py-2">
                                        N°
                                    </th>
                                    <th className="font-medium px-5 py-2">
                                        Client
                                    </th>
                                    <th className="font-medium px-5 py-2">
                                        Date
                                    </th>
                                    <th className="font-medium px-5 py-2">
                                        Statut
                                    </th>
                                    <th className="font-medium px-5 py-2 text-right">
                                        Montant
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {sales.map((s) => (
                                    <tr
                                        key={s.id}
                                        className="hover:bg-muted/40 transition-colors"
                                    >
                                        <td className="px-5 py-3 font-mono text-xs">
                                            <Link
                                                href={`/organisation/${orgId}/inventory/sales/${s.id}`}
                                                className="text-foreground hover:text-primary"
                                            >
                                                {s.sale_number}
                                            </Link>
                                        </td>
                                        <td className="px-5 py-3 text-xs">
                                            {s.customer?.name ?? (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-xs text-muted-foreground">
                                            {formatDate(s.sale_date)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <SaleStatusBadge
                                                status={s.status}
                                                label={s.status_display}
                                            />
                                        </td>
                                        <td className="px-5 py-3 text-right font-semibold text-sm">
                                            {formatCurrency(Number(s.total))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}

function SaleStatusBadge({ status, label }: { status: string; label: string }) {
    const variant =
        status === "completed"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
            : status === "cancelled"
              ? "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
              : "bg-muted text-muted-foreground border-border";
    return (
        <Badge
            variant="outline"
            className={cn(
                "font-normal border text-[10px] uppercase tracking-wide rounded-none",
                variant
            )}
        >
            {label}
        </Badge>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function EmptyBlock({
    icon: Icon,
    message,
}: {
    icon: React.ComponentType<{ className?: string }>;
    message: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <Icon className="h-8 w-8 opacity-40" />
            <p className="text-xs">{message}</p>
        </div>
    );
}

function last30Days() {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    return {
        from: toIso(from),
        to: toIso(to),
    };
}

function toIso(d: Date): string {
    return d.toISOString().split("T")[0];
}

function formatShortDay(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
    });
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function truncate(s: string, n: number): string {
    return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
