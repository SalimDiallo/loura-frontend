"use client";

import { BadgeStatus } from "@/components/BadgeStatus";
import { GenerateDocumentButton } from "@/components/documents";
import {
    ListPageLayout,
    ListPagination,
    ListSearchFilters,
    ListStat,
    ListTable,
    ListTableColumn,
} from "@/components/layout/ListPageLayout";
import { Can, useOrgPermissions } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import { useCustomers, usePaginatedSales } from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { Customer, SalePaymentStatus, SaleStatus, SaleType } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FaCreditCard,
    FaEye,
    FaMoneyBillWave,
    FaPlus,
    FaReceipt
} from "react-icons/fa";

interface SalesPageProps {
    creditOnly?: boolean;
}

export function SalesPage({ creditOnly = false }: SalesPageProps = {}) {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.SALES.MANAGE);
    const { formatCurrency } = useCurrencyFormatter();

    const [search, setSearch] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [paymentFilter, setPaymentFilter] = useState<string>("");
    const [customerFilter, setCustomerFilter] = useState<string>("");

    const { data: customersList = [] } = useCustomers(orgId, {
        page_size: "all",
        is_active: "true",
    });
    const customers = (customersList as unknown as Customer[]) ?? [];

    const stableFilters = useMemo(
        () => ({
            search: search || undefined,
            status: (statusFilter as SaleStatus) || undefined,
            payment_status: (paymentFilter as SalePaymentStatus) || undefined,
            customer: customerFilter || undefined,
            sale_type: creditOnly ? ("credit" as SaleType) : undefined,
        }),
        [search, statusFilter, paymentFilter, customerFilter, creditOnly]
    );

    const {
        data: sales,
        meta,
        setPage,
        nextPage,
        prevPage,
        isLoading,
        error,
    } = usePaginatedSales(orgId, stableFilters, { pageSize: 15 });

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

    const filtersActive = !!statusFilter || !!paymentFilter || !!customerFilter;

    return (
        <ListPageLayout
            title={creditOnly ? "Créances clients" : "Ventes"}
            icon={creditOnly ? FaCreditCard : FaReceipt}
            description={
                creditOnly
                    ? "Ventes à crédit et encours clients"
                    : "Ventes au comptant et à crédit"
            }
            headerActions={
                canManage
                    ? [
                          {
                              label: "Nouvelle vente",
                              icon: FaPlus,
                              onClick: () =>
                                  router.push(
                                      `/organisation/${orgId}/inventory/sales/create${creditOnly ? "?mode=credit" : ""}`
                                  ),
                          },
                      ]
                    : []
            }
            stats={[
                <ListStat
                    key="total"
                    label={creditOnly ? "Créances" : "Ventes"}
                    value={meta.totalItems}
                    icon={<FaReceipt className="h-4 w-4 text-muted-foreground" />}
                />,
            ]}
            searchFilters={
                <ListSearchFilters
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="N° de vente, client, notes..."
                    filtersOpen={filterOpen}
                    onFiltersOpenChange={setFilterOpen}
                    filtersAreActive={filtersActive}
                    filters={
                        <div className="space-y-4 mt-4">
                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Statut
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Tous</option>
                                    <option value="draft">Brouillon</option>
                                    <option value="completed">Finalisée</option>
                                    <option value="cancelled">Annulée</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Paiement
                                </label>
                                <select
                                    value={paymentFilter}
                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Tous</option>
                                    <option value="unpaid">Non payée</option>
                                    <option value="partial">Partielle</option>
                                    <option value="paid">Payée</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Client
                                </label>
                                <select
                                    value={customerFilter}
                                    onChange={(e) => setCustomerFilter(e.target.value)}
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
                                <Skeleton key={i} className="h-14 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : sales.length === 0 ? (
                        <div className="text-center py-16 bg-muted/20 rounded-lg">
                            <FaReceipt className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <p className="text-lg font-medium">
                                Aucune {creditOnly ? "créance" : "vente"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 mb-6">
                                Enregistrez votre première vente pour démarrer.
                            </p>
                            <Can permission={PERMISSIONS.SALES.MANAGE}>
                                <Button
                                    onClick={() =>
                                        router.push(
                                            `/organisation/${orgId}/inventory/sales/create`
                                        )
                                    }
                                >
                                    <FaPlus className="mr-2" />
                                    Nouvelle vente
                                </Button>
                            </Can>
                        </div>
                    ) : (
                        <>
                            <ListTable
                                columns={[
                                    <ListTableColumn key="number" header="N°">
                                        {({ value: s }) => (
                                            <div>
                                                <div className="font-mono text-sm font-semibold">
                                                    {s.sale_number}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(s.sale_date).toLocaleDateString(
                                                        "fr-FR"
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="customer" header="Client">
                                        {({ value: s }) => (
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {s.customer?.name ?? (
                                                        <span className="italic text-muted-foreground">
                                                            Comptoir
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    {s.sale_type === "credit" ? (
                                                        <>
                                                            <FaCreditCard className="h-2.5 w-2.5" />
                                                            Crédit
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaMoneyBillWave className="h-2.5 w-2.5" />
                                                            Comptant
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="status" header="Statut">
                                        {({ value: s }) => {
                                            const st = s.status as SaleStatus;
                                            return (
                                                <BadgeStatus
                                                  status={st} />
                                            );
                                        }}
                                    </ListTableColumn>,
                                    <ListTableColumn key="payment" header="Paiement">
                                        {({ value: s }) => {
                                            const st = s.payment_status as SalePaymentStatus;
                                            return (
                                                <BadgeStatus status={st} />
                                            );
                                        }}
                                    </ListTableColumn>,
                                    <ListTableColumn key="total" header="Total" align="right">
                                        {({ value: s }) => (
                                            <div className="text-right">
                                                <div className="text-sm font-semibold">
                                                    {formatCurrency(Number(s.total))}
                                                </div>
                                                {Number(s.discount_amount) > 0 && (
                                                    <div className="text-xs text-emerald-600">
                                                        -{formatCurrency(Number(s.discount_amount))}
                                                    </div>
                                                )}
                                                {Number(s.outstanding_amount) > 0 && (
                                                    <div className="text-xs text-red-600">
                                                        Reste{" "}
                                                        {formatCurrency(
                                                            Number(s.outstanding_amount)
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="actions"
                                        header="Actions"
                                        align="right"
                                    >
                                        {({ value: s }) => (
                                            <div className="flex items-center justify-end gap-1">
                                                <GenerateDocumentButton
                                                    orgId={orgId}
                                                    docType="sale_invoice"
                                                    objectId={s.id}
                                                    modalTitle={`Facture · ${s.sale_number}`}
                                                    modalSubtitle={s.customer?.name ?? "Comptoir"}
                                                    variant="ghost"
                                                    size="sm"
                                                    hideIcon
                                                    aria-label="Imprimer la facture"
                                                >
                                                    <FaReceipt className="h-3.5 w-3.5" />
                                                </GenerateDocumentButton>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.push(
                                                            `/organisation/${orgId}/inventory/sales/${s.id}`
                                                        )
                                                    }
                                                >
                                                    <FaEye className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                ]}
                                data={sales}
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
