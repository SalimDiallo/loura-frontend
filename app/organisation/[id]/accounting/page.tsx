"use client";

import { Can, PermissionGuard } from "@/components/permissions";
import {
    PeriodFilter,
    defaultPeriod,
    type Period,
} from "@/components/reports/PeriodFilter";
import {
    KPICard,
    ReportEmpty,
    ReportError,
    ReportSection,
} from "@/components/reports/ReportPrimitives";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import { useAccountingOverview } from "@/lib/hooks/accounting";
import { PERMISSIONS } from "@/lib/permissions";
import { accountingService } from "@/lib/services/accounting";
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Coins,
    PiggyBank,
    Receipt,
    TrendingUp,
    Wallet,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";

import {
    PIE_COLORS,
    comparisonSublabel,
    pctToTrend,
    toPieData,
} from "./_components/helpers";
import { PnlTrendChart } from "./_components/PnlTrendChart";
import { ReportPdfButton } from "./_components/ReportPdfModal";
import { WarehouseFilter } from "./_components/WarehouseFilter";

function OverviewPage() {
    const { id: orgId } = useParams<{ id: string }>();
    const [period, setPeriod] = useState<Period>(defaultPeriod());
    const [warehouse, setWarehouse] = useState("");
    const { formatCurrency } = useCurrencyFormatter(orgId);

    const { data, isLoading, isError, refetch } = useAccountingOverview(orgId, {
        from: period.from,
        to: period.to,
        warehouse: warehouse || undefined,
    });

    const comp = data?.comparison;
    const revenuePie = toPieData(data?.revenue_by_category ?? []);
    const expensePie = toPieData(data?.expense_by_category ?? []);

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Coins className="h-5 w-5 text-primary" />
                        Comptabilité
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Synthèse financière consolidée de l&apos;organisation.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <WarehouseFilter
                        orgId={orgId}
                        value={warehouse}
                        onChange={setWarehouse}
                    />
                    <PeriodFilter value={period} onChange={setPeriod} />
                    <Can permission={PERMISSIONS.ACCOUNTING.EXPORT}>
                        <ReportPdfButton
                            title="Compte de résultat"
                            subtitle={`${period.from} → ${period.to}`}
                            fetchHtml={() =>
                                accountingService.reportHtml(orgId, "pnl", {
                                    from: period.from,
                                    to: period.to,
                                    warehouse: warehouse || undefined,
                                })
                            }
                        />
                    </Can>
                </div>
            </div>

            {isError ? (
                <ReportError onRetry={() => refetch()} />
            ) : isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard
                            label="Produits"
                            value={formatCurrency(data?.total_revenue ?? 0)}
                            icon={<ArrowUpCircle className="h-5 w-5" />}
                            accentColor="emerald"
                            trend={pctToTrend(comp?.revenue_change_pct)}
                            sublabel={
                                comparisonSublabel(comp?.revenue_change_pct) ??
                                "Sur la période"
                            }
                        />
                        <KPICard
                            label="Charges"
                            value={formatCurrency(data?.total_expense ?? 0)}
                            icon={<ArrowDownCircle className="h-5 w-5" />}
                            accentColor="red"
                            sublabel={
                                comparisonSublabel(comp?.expense_change_pct) ??
                                "Sur la période"
                            }
                        />
                        <KPICard
                            label="Résultat net"
                            value={formatCurrency(data?.net_result ?? 0)}
                            icon={<TrendingUp className="h-5 w-5" />}
                            accentColor="primary"
                            trend={pctToTrend(comp?.net_result_change_pct)}
                            sublabel={
                                data?.net_margin != null
                                    ? `Marge nette ${Number(data.net_margin).toFixed(1)}%`
                                    : undefined
                            }
                        />
                        <KPICard
                            label="Flux de trésorerie"
                            value={formatCurrency(data?.treasury_net_flow ?? 0)}
                            icon={<Wallet className="h-5 w-5" />}
                            accentColor="primary"
                            sublabel={`Entrées ${formatCurrency(
                                data?.treasury_in ?? 0
                            )} · Sorties ${formatCurrency(data?.treasury_out ?? 0)}`}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <KPICard
                            label="Créances clients"
                            value={formatCurrency(data?.receivables_total ?? 0)}
                            icon={<Receipt className="h-5 w-5" />}
                            accentColor="primary"
                            sublabel={
                                (data?.receivables_overdue_total ?? 0) > 0
                                    ? `Dont ${formatCurrency(
                                          data?.receivables_overdue_total ?? 0
                                      )} en retard`
                                    : "Reste dû sur les ventes"
                            }
                        />
                        <KPICard
                            label="Dettes fournisseurs"
                            value={formatCurrency(data?.payables_total ?? 0)}
                            icon={<PiggyBank className="h-5 w-5" />}
                            accentColor="primary"
                            sublabel={
                                (data?.payables_overdue_total ?? 0) > 0
                                    ? `Dont ${formatCurrency(
                                          data?.payables_overdue_total ?? 0
                                      )} en retard`
                                    : "Reste dû sur les achats"
                            }
                        />
                    </div>

                    <ReportSection
                        title="Évolution produits / charges / résultat"
                        description="Tendance par mois sur la période sélectionnée."
                    >
                        <PnlTrendChart
                            points={data?.trend ?? []}
                            formatCurrency={formatCurrency}
                        />
                    </ReportSection>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ReportSection
                            title="Produits par source"
                            description="Répartition des entrées sur la période."
                        >
                            <CategoryPie
                                data={revenuePie}
                                emptyMessage="Aucun produit sur cette période."
                                emptyIcon={ArrowUpCircle}
                                formatCurrency={formatCurrency}
                            />
                        </ReportSection>
                        <ReportSection
                            title="Charges par catégorie"
                            description="Répartition des sorties sur la période."
                        >
                            <CategoryPie
                                data={expensePie}
                                emptyMessage="Aucune charge sur cette période."
                                emptyIcon={ArrowDownCircle}
                                formatCurrency={formatCurrency}
                            />
                        </ReportSection>
                    </div>
                </>
            )}
        </div>
    );
}

function CategoryPie({
    data,
    emptyMessage,
    emptyIcon,
    formatCurrency,
}: {
    data: { name: string; value: number }[];
    emptyMessage: string;
    emptyIcon: React.ComponentType<{ className?: string }>;
    formatCurrency: (n: number) => string;
}) {
    if (data.length === 0) {
        return <ReportEmpty icon={emptyIcon} message={emptyMessage} />;
    }
    return (
        <ResponsiveContainer width="100%" height={280}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                >
                    {data.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ fontSize: 12 }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

export default function AccountingOverviewPage() {
    return (
        <PermissionGuard permission={PERMISSIONS.ACCOUNTING.VIEW_REPORTS}>
            <OverviewPage />
        </PermissionGuard>
    );
}
