"use client";

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
    usePaginatedPurchaseOrders,
    useSuppliers,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    PurchaseOrderPaymentStatus,
    PurchaseOrderStatus,
    Supplier,
} from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FaCheckCircle,
    FaClock,
    FaEdit,
    FaExclamationCircle,
    FaHourglassHalf,
    FaPlus,
    FaTimes,
    FaTruck,
} from "react-icons/fa";

export default function PurchaseOrdersPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.PURCHASE_ORDERS.VIEW}>
            <PurchaseOrdersPage />
        </PermissionGuard>
    );
}

const STATUS_STYLES: Record<
    PurchaseOrderStatus,
    { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
    draft: {
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: FaEdit,
    },
    sent: {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: FaClock,
    },
    partial: {
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: FaHourglassHalf,
    },
    received: {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: FaCheckCircle,
    },
    cancelled: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: FaTimes,
    },
};

const PAYMENT_STATUS_STYLES: Record<
    PurchaseOrderPaymentStatus,
    { color: string; label: string }
> = {
    unpaid: { color: "bg-red-50 text-red-700 border-red-200", label: "Non payé" },
    partial: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Partiel",
    },
    paid: {
        color: "bg-green-50 text-green-700 border-green-200",
        label: "Payé",
    },
};

function PurchaseOrdersPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.PURCHASE_ORDERS.MANAGE);
    const { formatCurrency } = useCurrencyFormatter();

    const [search, setSearch] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [supplierFilter, setSupplierFilter] = useState<string>("");
    const [paymentFilter, setPaymentFilter] = useState<string>("");

    const { data: suppliersList = [] } = useSuppliers(orgId, {
        page_size: "all",
        is_active: "true",
    });
    const suppliers = (suppliersList as unknown as Supplier[]) ?? [];

    const stableFilters = useMemo(
        () => ({
            search: search || undefined,
            status: (statusFilter as PurchaseOrderStatus) || undefined,
            supplier: supplierFilter || undefined,
            payment_status:
                (paymentFilter as PurchaseOrderPaymentStatus) || undefined,
        }),
        [search, statusFilter, supplierFilter, paymentFilter]
    );

    const {
        data: orders,
        meta,
        setPage,
        nextPage,
        prevPage,
        isLoading,
        error,
    } = usePaginatedPurchaseOrders(orgId, stableFilters, { pageSize: 15 });

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

    const filtersActive = !!statusFilter || !!supplierFilter || !!paymentFilter;

    return (
        <ListPageLayout
            title="Approvisionnements"
            icon={FaTruck}
            description="Commandes fournisseur, réceptions et règlements"
            headerActions={
                canManage
                    ? [
                          {
                              label: "Nouvelle commande",
                              icon: FaPlus,
                              onClick: () =>
                                  router.push(
                                      `/organisation/${orgId}/inventory/purchase-orders/create`
                                  ),
                          },
                      ]
                    : []
            }
            stats={[
                <ListStat
                    key="total"
                    label="Commandes"
                    value={meta.totalItems}
                    icon={<FaTruck className="h-4 w-4 text-muted-foreground" />}
                />,
            ]}
            searchFilters={
                <ListSearchFilters
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="N° de commande, fournisseur, notes..."
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
                                    <option value="sent">Envoyé</option>
                                    <option value="partial">Réception partielle</option>
                                    <option value="received">Réceptionné</option>
                                    <option value="cancelled">Annulé</option>
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
                                    <option value="unpaid">Non payé</option>
                                    <option value="partial">Partiellement payé</option>
                                    <option value="paid">Payé</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Fournisseur
                                </label>
                                <select
                                    value={supplierFilter}
                                    onChange={(e) => setSupplierFilter(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Tous</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
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
                    ) : orders.length === 0 ? (
                        <div className="text-center py-16 bg-muted/20 rounded-lg">
                            <FaTruck className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <p className="text-lg font-medium">Aucune commande</p>
                            <p className="text-sm text-muted-foreground mt-1 mb-6">
                                Créez votre premier bon de commande fournisseur.
                            </p>
                            <Can permission={PERMISSIONS.PURCHASE_ORDERS.MANAGE}>
                                <Button
                                    onClick={() =>
                                        router.push(
                                            `/organisation/${orgId}/inventory/purchase-orders/create`
                                        )
                                    }
                                >
                                    <FaPlus className="mr-2" />
                                    Nouvelle commande
                                </Button>
                            </Can>
                        </div>
                    ) : (
                        <>
                            <ListTable
                                columns={[
                                    <ListTableColumn key="number" header="N°">
                                        {({ value: po }) => (
                                            <div>
                                                <div className="font-mono text-sm font-semibold">
                                                    {po.order_number}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(po.order_date).toLocaleDateString(
                                                        "fr-FR"
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="supplier" header="Fournisseur">
                                        {({ value: po }) => (
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {po.supplier.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {po.warehouse.name}
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="status" header="Statut">
                                        {({ value: po }) => {
                                            const st = po.status as PurchaseOrderStatus;
                                            const Icon = STATUS_STYLES[st].icon;
                                            return (
                                                <Badge
                                                    variant="outline"
                                                    className={`gap-1.5 ${STATUS_STYLES[st].color}`}
                                                >
                                                    <Icon className="h-3 w-3" />
                                                    {po.status_display}
                                                </Badge>
                                            );
                                        }}
                                    </ListTableColumn>,
                                    <ListTableColumn key="payment" header="Paiement">
                                        {({ value: po }) => {
                                            const st = po.payment_status as PurchaseOrderPaymentStatus;
                                            return (
                                                <Badge
                                                    variant="outline"
                                                    className={PAYMENT_STATUS_STYLES[st].color}
                                                >
                                                    {PAYMENT_STATUS_STYLES[st].label}
                                                </Badge>
                                            );
                                        }}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="total"
                                        header="Total"
                                        align="right"
                                    >
                                        {({ value: po }) => (
                                            <div className="text-right">
                                                <div className="text-sm font-semibold">
                                                    {formatCurrency(Number(po.total))}
                                                </div>
                                                {Number(po.outstanding_amount) > 0 && (
                                                    <div className="text-xs text-red-600">
                                                        Reste {formatCurrency(
                                                            Number(po.outstanding_amount)
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
                                        {({ value: po }) => (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    router.push(
                                                        `/organisation/${orgId}/inventory/purchase-orders/${po.id}`
                                                    )
                                                }
                                            >
                                                <FaEdit className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </ListTableColumn>,
                                ]}
                                data={orders}
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
