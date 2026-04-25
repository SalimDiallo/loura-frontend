"use client";

import { GenerateDocumentButton } from "@/components/documents";
import {
    ListPageLayout,
    ListPagination,
    ListSearchFilters,
    ListStat,
    ListTable,
    ListTableColumn,
} from "@/components/layout/ListPageLayout";
import { Can, PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
    useCustomers,
    usePaginatedQuotes,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { Customer, QuoteStatus, QuoteType } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FaCheckCircle,
    FaClock,
    FaEdit,
    FaEye,
    FaFileAlt,
    FaFileInvoice,
    FaHourglassEnd,
    FaPaperPlane,
    FaPlus,
    FaReceipt,
    FaRegHandshake,
    FaTimes,
} from "react-icons/fa";

export default function QuotesPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.SALES.VIEW}>
            <QuotesPage />
        </PermissionGuard>
    );
}

const STATUS_STYLES: Record<
    QuoteStatus,
    { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
    draft: {
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: FaEdit,
    },
    sent: {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: FaPaperPlane,
    },
    accepted: {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: FaRegHandshake,
    },
    rejected: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: FaTimes,
    },
    expired: {
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: FaHourglassEnd,
    },
    converted: {
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: FaCheckCircle,
    },
};

function QuotesPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.SALES.MANAGE);
    const { formatCurrency } = useCurrencyFormatter();

    const [search, setSearch] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [customerFilter, setCustomerFilter] = useState<string>("");

    const { data: customersList = [] } = useCustomers(orgId, {
        page_size: "all",
        is_active: "true",
    });
    const customers = (customersList as unknown as Customer[]) ?? [];

    const stableFilters = useMemo(
        () => ({
            search: search || undefined,
            status: (statusFilter as QuoteStatus) || undefined,
            quote_type: (typeFilter as QuoteType) || undefined,
            customer: customerFilter || undefined,
        }),
        [search, statusFilter, typeFilter, customerFilter]
    );

    const {
        data: quotes,
        meta,
        setPage,
        nextPage,
        prevPage,
        isLoading,
        error,
    } = usePaginatedQuotes(orgId, stableFilters, { pageSize: 15 });

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-destructive">Erreur : {error.message}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const filtersActive = !!statusFilter || !!typeFilter || !!customerFilter;

    return (
        <ListPageLayout
            title="Devis & Pro forma"
            icon={FaFileInvoice}
            description="Offres commerciales, conversion en vente 1-clic"
            headerActions={
                canManage
                    ? [
                          {
                              label: "Nouveau document",
                              icon: FaPlus,
                              onClick: () =>
                                  router.push(
                                      `/organisation/${orgId}/inventory/quotes/create`
                                  ),
                          },
                      ]
                    : []
            }
            stats={[
                <ListStat
                    key="total"
                    label="Documents"
                    value={meta.totalItems}
                    icon={
                        <FaFileAlt className="h-4 w-4 text-muted-foreground" />
                    }
                />,
            ]}
            searchFilters={
                <ListSearchFilters
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="N°, client, notes…"
                    filtersOpen={filterOpen}
                    onFiltersOpenChange={setFilterOpen}
                    filtersAreActive={filtersActive}
                    filters={
                        <div className="space-y-4 mt-4">
                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Type
                                </label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Tous</option>
                                    <option value="quote">Devis</option>
                                    <option value="proforma">Pro forma</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Statut
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(e.target.value)
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Tous</option>
                                    <option value="draft">Brouillon</option>
                                    <option value="sent">Envoyé</option>
                                    <option value="accepted">Accepté</option>
                                    <option value="rejected">Refusé</option>
                                    <option value="expired">Expiré</option>
                                    <option value="converted">Converti</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Client
                                </label>
                                <select
                                    value={customerFilter}
                                    onChange={(e) =>
                                        setCustomerFilter(e.target.value)
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Tous</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    }
                />
            }
            content={
                <>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton
                                    key={i}
                                    className="h-14 w-full rounded-lg"
                                />
                            ))}
                        </div>
                    ) : quotes.length === 0 ? (
                        <div className="text-center py-16 bg-muted/20 rounded-lg">
                            <FaFileInvoice className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <p className="text-lg font-medium">Aucun document</p>
                            <p className="text-sm text-muted-foreground mt-1 mb-6">
                                Créez votre premier devis ou pro forma.
                            </p>
                            <Can permission={PERMISSIONS.SALES.MANAGE}>
                                <Button
                                    onClick={() =>
                                        router.push(
                                            `/organisation/${orgId}/inventory/quotes/create`
                                        )
                                    }
                                >
                                    <FaPlus className="mr-2" />
                                    Nouveau document
                                </Button>
                            </Can>
                        </div>
                    ) : (
                        <>
                            <ListTable
                                columns={[
                                    <ListTableColumn key="num" header="N°">
                                        {({ value: q }) => (
                                            <div>
                                                <div className="font-mono text-sm font-semibold">
                                                    {q.quote_number}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(
                                                        q.issue_date
                                                    ).toLocaleDateString(
                                                        "fr-FR"
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="type" header="Type">
                                        {({ value: q }) => (
                                            <Badge variant="outline">
                                                {q.quote_type_display}
                                            </Badge>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="customer"
                                        header="Client"
                                    >
                                        {({ value: q }) => (
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {q.customer?.name ??
                                                        q.customer_name_snapshot ??
                                                        "—"}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {q.warehouse.name}
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="status"
                                        header="Statut"
                                    >
                                        {({ value: q }) => {
                                            const st = q.status as QuoteStatus;
                                            const Icon = STATUS_STYLES[st].icon;
                                            return (
                                                <Badge
                                                    variant="outline"
                                                    className={`gap-1.5 ${STATUS_STYLES[st].color}`}
                                                >
                                                    <Icon className="h-3 w-3" />
                                                    {q.status_display}
                                                </Badge>
                                            );
                                        }}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="valid"
                                        header="Validité"
                                    >
                                        {({ value: q }) =>
                                            q.valid_until ? (
                                                <span
                                                    className={`text-xs ${
                                                        q.is_expired_by_date
                                                            ? "text-red-600"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    <FaClock className="inline h-3 w-3 mr-1" />
                                                    {new Date(
                                                        q.valid_until
                                                    ).toLocaleDateString(
                                                        "fr-FR"
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    —
                                                </span>
                                            )
                                        }
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="total"
                                        header="Total"
                                        align="right"
                                    >
                                        {({ value: q }) => (
                                            <div className="text-sm font-semibold">
                                                {formatCurrency(
                                                    Number(q.total)
                                                )}
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="actions"
                                        header="Actions"
                                        align="right"
                                    >
                                        {({ value: q }) => (
                                            <div className="flex items-center justify-end gap-1">
                                                <GenerateDocumentButton
                                                    orgId={orgId}
                                                    docType={
                                                        q.quote_type ===
                                                        "proforma"
                                                            ? "proforma"
                                                            : "quote"
                                                    }
                                                    objectId={q.id}
                                                    modalTitle={`${q.quote_type_display} · ${q.quote_number}`}
                                                    modalSubtitle={
                                                        q.customer?.name ??
                                                        q.customer_name_snapshot
                                                    }
                                                    variant="ghost"
                                                    size="sm"
                                                    hideIcon
                                                    aria-label="Imprimer le document"
                                                >
                                                    <FaReceipt className="h-3.5 w-3.5" />
                                                </GenerateDocumentButton>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.push(
                                                            `/organisation/${orgId}/inventory/quotes/${q.id}`
                                                        )
                                                    }
                                                >
                                                    <FaEye className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                ]}
                                data={quotes}
                            />
                            <div className="mt-4">
                                <ListPagination
                                    meta={meta}
                                    onPageChange={setPage}
                                    onNext={nextPage}
                                    onPrev={prevPage}
                                />
                            </div>
                        </>
                    )}
                </>
            }
        />
    );
}
