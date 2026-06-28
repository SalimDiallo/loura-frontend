"use client";

import { Can, PermissionGuard } from "@/components/permissions";
import {
    PeriodFilter,
    defaultPeriod,
    type Period,
} from "@/components/reports/PeriodFilter";
import {
    CsvExportButton,
    KPICard,
    ReportEmpty,
    ReportError,
    ReportSection,
} from "@/components/reports/ReportPrimitives";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import { useAccountingPnl } from "@/lib/hooks/accounting";
import { PERMISSIONS } from "@/lib/permissions";
import { accountingService } from "@/lib/services/accounting";
import { ACCOUNTING_CATEGORY_LABELS } from "@/lib/types/accounting";
import { ArrowDownCircle, ArrowUpCircle, ScrollText, TrendingUp } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
    CATEGORY_TO_SOURCE,
    comparisonSublabel,
    pctToTrend,
} from "../_components/helpers";
import { ReportPdfButton } from "../_components/ReportPdfModal";
import { WarehouseFilter } from "../_components/WarehouseFilter";

interface Row {
    category: string;
    label: string;
    amount: number;
}

function PnlPage() {
    const { id: orgId } = useParams<{ id: string }>();
    const router = useRouter();
    const [period, setPeriod] = useState<Period>(defaultPeriod());
    const [warehouse, setWarehouse] = useState("");
    const { formatCurrency } = useCurrencyFormatter(orgId);

    const { data, isLoading, isError, refetch } = useAccountingPnl(orgId, {
        from: period.from,
        to: period.to,
        warehouse: warehouse || undefined,
    });

    const revenueRows = useMemo<Row[]>(
        () =>
            Object.entries(data?.revenue_by_category ?? {}).map(([cat, val]) => ({
                category: cat,
                label: ACCOUNTING_CATEGORY_LABELS[cat] ?? cat,
                amount: Number(val),
            })),
        [data]
    );
    const expenseRows = useMemo<Row[]>(
        () =>
            Object.entries(data?.expense_by_category ?? {}).map(([cat, val]) => ({
                category: cat,
                label: ACCOUNTING_CATEGORY_LABELS[cat] ?? cat,
                amount: Number(val),
            })),
        [data]
    );

    /** Drill-down : ouvre le journal de trésorerie filtré sur la catégorie. */
    const drillDown = (category: string) => {
        const source = CATEGORY_TO_SOURCE[category];
        const params = new URLSearchParams();
        if (source) params.set("source", source);
        const qs = params.toString();
        router.push(
            `/organisation/${orgId}/accounting/treasury${qs ? `?${qs}` : ""}`
        );
    };

    const csvRows = [
        ...revenueRows.map((r) => ({ type: "Produit", poste: r.label, montant: r.amount })),
        ...expenseRows.map((r) => ({ type: "Charge", poste: r.label, montant: r.amount })),
    ];

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <ScrollText className="h-5 w-5 text-primary" />
                        Compte de résultat
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Produits, charges et résultat net sur la période.
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
                        <CsvExportButton
                            filename="compte-resultat"
                            rows={csvRows}
                            headers={[
                                { key: "type", label: "Type" },
                                { key: "poste", label: "Poste" },
                                { key: "montant", label: "Montant" },
                            ]}
                        />
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
                <Skeleton className="h-64 rounded-xl" />
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <KPICard
                            label="Produits"
                            value={formatCurrency(Number(data?.total_revenue ?? 0))}
                            icon={<ArrowUpCircle className="h-5 w-5" />}
                            accentColor="emerald"
                            trend={pctToTrend(data?.comparison?.revenue_change_pct)}
                            sublabel={comparisonSublabel(
                                data?.comparison?.revenue_change_pct
                            )}
                        />
                        <KPICard
                            label="Charges"
                            value={formatCurrency(Number(data?.total_expense ?? 0))}
                            icon={<ArrowDownCircle className="h-5 w-5" />}
                            accentColor="red"
                            sublabel={comparisonSublabel(
                                data?.comparison?.expense_change_pct
                            )}
                        />
                        <KPICard
                            label="Résultat net"
                            value={formatCurrency(Number(data?.net_result ?? 0))}
                            icon={<TrendingUp className="h-5 w-5" />}
                            accentColor="primary"
                            trend={pctToTrend(data?.comparison?.net_result_change_pct)}
                            sublabel={
                                data?.net_margin != null
                                    ? `Marge nette ${Number(data.net_margin).toFixed(1)}%`
                                    : undefined
                            }
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <ReportSection title="Produits" description="Par catégorie">
                            {revenueRows.length === 0 ? (
                                <ReportEmpty
                                    icon={ArrowUpCircle}
                                    message="Aucun produit sur cette période."
                                />
                            ) : (
                                <BreakdownTable
                                    rows={revenueRows}
                                    formatCurrency={formatCurrency}
                                    total={Number(data?.total_revenue ?? 0)}
                                    onRowClick={drillDown}
                                />
                            )}
                        </ReportSection>
                        <ReportSection title="Charges" description="Par catégorie">
                            {expenseRows.length === 0 ? (
                                <ReportEmpty
                                    icon={ArrowDownCircle}
                                    message="Aucune charge sur cette période."
                                />
                            ) : (
                                <BreakdownTable
                                    rows={expenseRows}
                                    formatCurrency={formatCurrency}
                                    total={Number(data?.total_expense ?? 0)}
                                    onRowClick={drillDown}
                                />
                            )}
                        </ReportSection>
                    </div>
                </>
            )}
        </div>
    );
}

function BreakdownTable({
    rows,
    formatCurrency,
    total,
    onRowClick,
}: {
    rows: Row[];
    formatCurrency: (n: number) => string;
    total: number;
    onRowClick?: (category: string) => void;
}) {
    return (
        <div className="divide-y text-sm">
            {rows.map((r) => (
                <button
                    key={r.category}
                    type="button"
                    onClick={() => onRowClick?.(r.category)}
                    className="flex w-full justify-between py-2 text-left hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
                    title="Voir le détail dans le journal"
                >
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-medium tabular-nums">
                        {formatCurrency(r.amount)}
                    </span>
                </button>
            ))}
            <div className="flex justify-between py-2 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(total)}</span>
            </div>
        </div>
    );
}

export default function PnlPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.ACCOUNTING.VIEW_PNL}>
            <PnlPage />
        </PermissionGuard>
    );
}
