"use client";

import { Can } from "@/components/permissions";
import {
    CsvExportButton,
    KPICard,
    ReportEmpty,
    ReportError,
    ReportSection,
} from "@/components/reports/ReportPrimitives";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import { PERMISSIONS } from "@/lib/permissions";
import type { OutstandingResponse } from "@/lib/types/accounting";
import type { UseQueryResult } from "@tanstack/react-query";
import { AlertTriangle, type LucideIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

interface OutstandingViewProps {
    title: string;
    description: string;
    partyLabel: string; // "Client" | "Fournisseur"
    icon: LucideIcon;
    csvFilename: string;
    query: UseQueryResult<OutstandingResponse, Error>;
}

/**
 * Vue partagée créances/dettes : KPIs (total + en retard) + table d'encours
 * avec âge/échéance, recherche, et tri serveur (retards en tête).
 */
export function OutstandingView({
    title,
    description,
    partyLabel,
    icon: Icon,
    csvFilename,
    query,
}: OutstandingViewProps) {
    const { id: orgId } = useParams<{ id: string }>();
    const { formatCurrency } = useCurrencyFormatter(orgId);
    const { data, isLoading, isError, refetch } = query;
    const [search, setSearch] = useState("");

    const allItems = useMemo(() => data?.results ?? [], [data?.results]);
    const items = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return allItems;
        return allItems.filter(
            (i) =>
                i.reference.toLowerCase().includes(q) ||
                i.party.toLowerCase().includes(q)
        );
    }, [allItems, search]);

    const overdueTotal = Number(data?.overdue_total ?? 0);
    const csvRows = items.map((i) => ({
        reference: i.reference,
        party: i.party,
        total: Number(i.total),
        paid: Number(i.paid),
        outstanding: Number(i.outstanding),
        date: i.date,
        due_date: i.due_date ?? "",
        days_overdue: i.days_overdue ?? "",
    }));

    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        {title}
                    </h1>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Can permission={PERMISSIONS.ACCOUNTING.EXPORT}>
                    <CsvExportButton
                        filename={csvFilename}
                        rows={csvRows}
                        headers={[
                            { key: "reference", label: "Référence" },
                            { key: "party", label: partyLabel },
                            { key: "total", label: "Total" },
                            { key: "paid", label: "Payé" },
                            { key: "outstanding", label: "Reste dû" },
                            { key: "date", label: "Date" },
                            { key: "due_date", label: "Échéance" },
                            { key: "days_overdue", label: "Retard (j)" },
                        ]}
                    />
                </Can>
            </div>

            {isError ? (
                <ReportError onRetry={() => refetch()} />
            ) : isLoading ? (
                <Skeleton className="h-64 rounded-xl" />
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <KPICard
                            label={`Total ${title.toLowerCase()}`}
                            value={formatCurrency(Number(data?.total ?? 0))}
                            icon={<Icon className="h-5 w-5" />}
                            accentColor="primary"
                            sublabel={`${allItems.length} pièce${
                                allItems.length > 1 ? "s" : ""
                            }`}
                        />
                        <KPICard
                            label="Dont en retard"
                            value={formatCurrency(overdueTotal)}
                            icon={<AlertTriangle className="h-5 w-5" />}
                            accentColor={overdueTotal > 0 ? "red" : "primary"}
                            sublabel="Échéance dépassée"
                        />
                    </div>

                    <ReportSection
                        title="Détail des encours"
                        actions={
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher…"
                                className="h-8 w-[200px] text-xs"
                            />
                        }
                    >
                        {items.length === 0 ? (
                            <ReportEmpty
                                icon={Icon}
                                message={
                                    search
                                        ? "Aucun résultat pour cette recherche."
                                        : "Aucun encours."
                                }
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs text-muted-foreground border-b">
                                            <th className="py-2 pr-3 font-medium">
                                                Référence
                                            </th>
                                            <th className="py-2 pr-3 font-medium">
                                                {partyLabel}
                                            </th>
                                            <th className="py-2 pr-3 font-medium">
                                                Échéance
                                            </th>
                                            <th className="py-2 pr-3 font-medium text-right">
                                                Total
                                            </th>
                                            <th className="py-2 pl-3 font-medium text-right">
                                                Reste dû
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {items.map((i) => (
                                            <tr key={i.id}>
                                                <td className="py-2 pr-3 whitespace-nowrap font-medium">
                                                    {i.reference}
                                                </td>
                                                <td className="py-2 pr-3 max-w-[200px] truncate">
                                                    {i.party}
                                                </td>
                                                <td className="py-2 pr-3 whitespace-nowrap">
                                                    {i.is_overdue ? (
                                                        <Badge
                                                            variant="destructive"
                                                            className="text-xs"
                                                        >
                                                            +{i.days_overdue}j retard
                                                        </Badge>
                                                    ) : i.due_date ? (
                                                        <span className="text-muted-foreground">
                                                            {i.due_date}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">
                                                    {formatCurrency(Number(i.total))}
                                                </td>
                                                <td className="py-2 pl-3 text-right tabular-nums font-semibold">
                                                    {formatCurrency(
                                                        Number(i.outstanding)
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </ReportSection>
                </>
            )}
        </div>
    );
}
