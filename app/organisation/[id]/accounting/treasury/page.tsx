"use client";

import { Can, PermissionGuard } from "@/components/permissions";
import {
    PeriodFilter,
    defaultPeriod,
    type Period,
} from "@/components/reports/PeriodFilter";
import {
    CsvExportButton,
    ReportEmpty,
    ReportError,
    ReportSection,
} from "@/components/reports/ReportPrimitives";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import { useTreasuryJournal } from "@/lib/hooks/accounting";
import { PERMISSIONS } from "@/lib/permissions";
import { accountingService } from "@/lib/services/accounting";
import {
    ACCOUNTING_CATEGORY_LABELS,
    type FlowDirection,
    type TreasuryLine,
} from "@/lib/types/accounting";
import { Wallet } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { ReportPdfButton } from "../_components/ReportPdfModal";
import { WarehouseFilter } from "../_components/WarehouseFilter";

const SOURCE_LABELS: Record<string, string> = {
    sale_payment: "Vente",
    adjustment: "Caisse",
    po_payment: "Achat",
    expense: "Dépense",
    service_transaction: "Service",
    payroll: "Salaire",
};

function TreasuryPage() {
    const { id: orgId } = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const [period, setPeriod] = useState<Period>(defaultPeriod());
    const [direction, setDirection] = useState<FlowDirection | "all">("all");
    const [warehouse, setWarehouse] = useState("");
    // Source initiale depuis le drill-down du P&L (?source=...).
    const [source, setSource] = useState<string>(
        () => searchParams.get("source") ?? "all"
    );
    const { formatCurrency } = useCurrencyFormatter(orgId);

    const { data, isLoading, isError, refetch } = useTreasuryJournal(orgId, {
        from: period.from,
        to: period.to,
        direction: direction === "all" ? undefined : direction,
        source: source === "all" ? undefined : source,
        warehouse: warehouse || undefined,
        page_size: "all",
    });

    // page_size=all → tableau brut ; sinon réponse paginée.
    const lines = useMemo<TreasuryLine[]>(
        () => (Array.isArray(data) ? data : (data?.results ?? [])),
        [data]
    );

    const csvRows = lines.map((l) => ({
        date: l.date,
        source: SOURCE_LABELS[l.source_type] ?? l.source_type,
        sens: l.direction === "in" ? "Entrée" : "Sortie",
        categorie: ACCOUNTING_CATEGORY_LABELS[l.category] ?? l.category,
        libelle: l.label,
        reference: l.reference,
        entrepot: l.warehouse_name,
        montant: Number(l.amount),
    }));

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-primary" />
                        Journal de trésorerie
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Flux consolidés de toutes les sources sur la période.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Select
                        value={direction}
                        onValueChange={(v) => setDirection(v as FlowDirection | "all")}
                    >
                        <SelectTrigger className="h-8 w-[130px] text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les sens</SelectItem>
                            <SelectItem value="in">Entrées</SelectItem>
                            <SelectItem value="out">Sorties</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={source} onValueChange={setSource}>
                        <SelectTrigger className="h-8 w-[140px] text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes sources</SelectItem>
                            {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <WarehouseFilter
                        orgId={orgId}
                        value={warehouse}
                        onChange={setWarehouse}
                    />
                    <PeriodFilter value={period} onChange={setPeriod} />
                    <Can permission={PERMISSIONS.ACCOUNTING.EXPORT}>
                        <CsvExportButton
                            filename="journal-tresorerie"
                            rows={csvRows}
                            headers={[
                                { key: "date", label: "Date" },
                                { key: "source", label: "Source" },
                                { key: "sens", label: "Sens" },
                                { key: "categorie", label: "Catégorie" },
                                { key: "libelle", label: "Libellé" },
                                { key: "reference", label: "Référence" },
                                { key: "entrepot", label: "Entrepôt" },
                                { key: "montant", label: "Montant" },
                            ]}
                        />
                        <ReportPdfButton
                            title="Journal de trésorerie"
                            subtitle={`${period.from} → ${period.to}`}
                            fetchHtml={() =>
                                accountingService.reportHtml(orgId, "treasury", {
                                    from: period.from,
                                    to: period.to,
                                    warehouse: warehouse || undefined,
                                })
                            }
                        />
                    </Can>
                </div>
            </div>

            <ReportSection
                title={`${lines.length} mouvement${lines.length > 1 ? "s" : ""}`}
                description="Trié par date décroissante."
            >
                {isError ? (
                    <ReportError onRetry={() => refetch()} />
                ) : isLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 rounded" />
                        ))}
                    </div>
                ) : lines.length === 0 ? (
                    <ReportEmpty
                        icon={Wallet}
                        message="Aucun mouvement sur cette période."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-muted-foreground border-b">
                                    <th className="py-2 pr-3 font-medium">Date</th>
                                    <th className="py-2 pr-3 font-medium">Source</th>
                                    <th className="py-2 pr-3 font-medium">Libellé</th>
                                    <th className="py-2 pr-3 font-medium">Entrepôt</th>
                                    <th className="py-2 pl-3 font-medium text-right">
                                        Montant
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {lines.map((l) => (
                                    <tr key={l.id}>
                                        <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                                            {l.date}
                                        </td>
                                        <td className="py-2 pr-3">
                                            <Badge variant="outline" className="text-xs">
                                                {SOURCE_LABELS[l.source_type] ??
                                                    l.source_type}
                                            </Badge>
                                        </td>
                                        <td className="py-2 pr-3 max-w-[280px] truncate">
                                            {l.label}
                                        </td>
                                        <td className="py-2 pr-3 text-muted-foreground">
                                            {l.warehouse_name || "—"}
                                        </td>
                                        <td
                                            className={
                                                "py-2 pl-3 text-right font-medium tabular-nums " +
                                                (l.direction === "in"
                                                    ? "text-emerald-700"
                                                    : "text-red-700")
                                            }
                                        >
                                            {l.direction === "in" ? "+" : "−"}
                                            {formatCurrency(Number(l.amount))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </ReportSection>
        </div>
    );
}

export default function TreasuryPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.ACCOUNTING.VIEW_TREASURY}>
            <TreasuryPage />
        </PermissionGuard>
    );
}
