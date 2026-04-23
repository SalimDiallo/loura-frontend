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
import {
    usePaginatedPhysicalInventories,
    useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    PhysicalInventoryStatus,
    Warehouse,
} from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FaCheckCircle,
    FaClipboardCheck,
    FaEdit,
    FaExclamationTriangle,
    FaPlus,
    FaReceipt,
    FaTimes,
} from "react-icons/fa";

export default function PhysicalInventoriesPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.STOCK.VIEW}>
            <PhysicalInventoriesPage />
        </PermissionGuard>
    );
}

const STATUS_STYLES: Record<
    PhysicalInventoryStatus,
    { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
    draft: {
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: FaEdit,
    },
    completed: {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: FaCheckCircle,
    },
    cancelled: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: FaTimes,
    },
};

function PhysicalInventoriesPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.STOCK.MANAGE);

    const [search, setSearch] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [warehouseFilter, setWarehouseFilter] = useState<string>("");

    const { data: warehousesList = [] } = useWarehouses(orgId, {
        page_size: "all",
        is_active: "true",
    });
    const warehouses = (warehousesList as unknown as Warehouse[]) ?? [];

    const stableFilters = useMemo(
        () => ({
            search: search || undefined,
            status: (statusFilter as PhysicalInventoryStatus) || undefined,
            warehouse: warehouseFilter || undefined,
        }),
        [search, statusFilter, warehouseFilter]
    );

    const {
        data: inventories,
        meta,
        setPage,
        nextPage,
        prevPage,
        isLoading,
        error,
    } = usePaginatedPhysicalInventories(orgId, stableFilters, { pageSize: 15 });

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

    const filtersActive = !!statusFilter || !!warehouseFilter;

    return (
        <ListPageLayout
            title="Inventaires physiques"
            icon={FaClipboardCheck}
            description="Comptage physique, comparaison et ajustements de stock"
            headerActions={
                canManage
                    ? [
                          {
                              label: "Nouvel inventaire",
                              icon: FaPlus,
                              onClick: () =>
                                  router.push(
                                      `/organisation/${orgId}/inventory/physical-inventories/create`
                                  ),
                          },
                      ]
                    : []
            }
            stats={[
                <ListStat
                    key="total"
                    label="Inventaires"
                    value={meta.totalItems}
                    icon={
                        <FaClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    }
                />,
            ]}
            searchFilters={
                <ListSearchFilters
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Référence, entrepôt, notes..."
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
                                    onChange={(e) =>
                                        setStatusFilter(e.target.value)
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Tous</option>
                                    <option value="draft">Brouillon</option>
                                    <option value="completed">Validé</option>
                                    <option value="cancelled">Annulé</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Entrepôt
                                </label>
                                <select
                                    value={warehouseFilter}
                                    onChange={(e) =>
                                        setWarehouseFilter(e.target.value)
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Tous</option>
                                    {warehouses.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.name}
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
                    ) : inventories.length === 0 ? (
                        <div className="text-center py-16 bg-muted/20 rounded-lg">
                            <FaClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <p className="text-lg font-medium">
                                Aucun inventaire physique
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 mb-6">
                                Créez une session de comptage pour détecter les
                                écarts entre le physique et le système.
                            </p>
                            <Can permission={PERMISSIONS.STOCK.MANAGE}>
                                <Button
                                    onClick={() =>
                                        router.push(
                                            `/organisation/${orgId}/inventory/physical-inventories/create`
                                        )
                                    }
                                >
                                    <FaPlus className="mr-2" />
                                    Nouvel inventaire
                                </Button>
                            </Can>
                        </div>
                    ) : (
                        <>
                            <ListTable
                                columns={[
                                    <ListTableColumn
                                        key="reference"
                                        header="Référence"
                                    >
                                        {({ value: inv }) => (
                                            <div>
                                                <div className="font-mono text-sm font-semibold">
                                                    {inv.reference}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(
                                                        inv.count_date
                                                    ).toLocaleDateString("fr-FR")}
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="warehouse"
                                        header="Entrepôt"
                                    >
                                        {({ value: inv }) => (
                                            <div className="text-sm">
                                                {inv.warehouse.name}
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="status"
                                        header="Statut"
                                    >
                                        {({ value: inv }) => {
                                            const st =
                                                inv.status as PhysicalInventoryStatus;
                                            const Icon = STATUS_STYLES[st].icon;
                                            return (
                                                <Badge
                                                    variant="outline"
                                                    className={`gap-1.5 ${STATUS_STYLES[st].color}`}
                                                >
                                                    <Icon className="h-3 w-3" />
                                                    {inv.status_display}
                                                </Badge>
                                            );
                                        }}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="counts"
                                        header="Comptage"
                                    >
                                        {({ value: inv }) => (
                                            <div className="text-sm">
                                                <span className="font-medium">
                                                    {inv.totals.counted_items}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {" "}
                                                    / {inv.totals.total_items}
                                                </span>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="discrepancies"
                                        header="Écarts"
                                        align="right"
                                    >
                                        {({ value: inv }) => {
                                            const diff =
                                                inv.totals.discrepancy_items;
                                            return (
                                                <div className="text-right">
                                                    {diff > 0 ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="gap-1 bg-amber-50 text-amber-700 border-amber-200"
                                                        >
                                                            <FaExclamationTriangle className="h-3 w-3" />
                                                            {diff}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            Aucun
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        }}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="actions"
                                        header="Actions"
                                        align="right"
                                    >
                                        {({ value: inv }) => (
                                            <div className="flex items-center justify-end gap-1">
                                                {inv.status !== "draft" && (
                                                    <GenerateDocumentButton
                                                        orgId={orgId}
                                                        docType="physical_inventory"
                                                        objectId={inv.id}
                                                        modalTitle={`Inventaire · ${inv.reference}`}
                                                        modalSubtitle={
                                                            inv.warehouse?.name
                                                        }
                                                        variant="ghost"
                                                        size="sm"
                                                        hideIcon
                                                        aria-label="Imprimer le rapport d'inventaire"
                                                    >
                                                        <FaReceipt className="h-3.5 w-3.5" />
                                                    </GenerateDocumentButton>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.push(
                                                            `/organisation/${orgId}/inventory/physical-inventories/${inv.id}`
                                                        )
                                                    }
                                                >
                                                    <FaEdit className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                ]}
                                data={inventories}
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
