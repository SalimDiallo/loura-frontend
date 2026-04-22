"use client";

import { BadgeStatus } from "@/components/BadgeStatus";
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
import { usePaginatedWarehouses } from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FaCheckCircle, FaEdit, FaMapMarkerAlt, FaPlus, FaWarehouse } from "react-icons/fa";

export default function WarehousesPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.WAREHOUSES.VIEW}>
            <WarehousesPage />
        </PermissionGuard>
    );
}

function WarehousesPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.WAREHOUSES.MANAGE);

    const [search, setSearch] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);

    const stableFilters = useMemo(
        () => ({ search: search || undefined }),
        [search]
    );

    const {
        data: warehouses,
        meta,
        setPage,
        nextPage,
        prevPage,
        isLoading,
        error,
    } = usePaginatedWarehouses(orgId, stableFilters, { pageSize: 10 });

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

    return (
        <ListPageLayout
            title="Entrepôts"
            icon={FaWarehouse}
            description="Gérez les emplacements physiques de votre stock"
            headerActions={
                canManage
                    ? [
                        {
                            label: "Nouvel entrepôt",
                            icon: FaPlus,
                            onClick: () =>
                                router.push(
                                    `/organisation/${orgId}/inventory/warehouses/create`
                                ),
                        },
                    ]
                    : []
            }
            stats={[
                <ListStat
                    key="total"
                    label="Total entrepôts"
                    value={meta.totalItems}
                    icon={<FaWarehouse className="h-4 w-4 text-muted-foreground" />}
                />,
                <ListStat
                    key="page"
                    label="Sur cette page"
                    value={warehouses.length}
                    icon={<FaMapMarkerAlt className="h-4 w-4 text-blue-600" />}
                />,
            ]}
            searchFilters={
                <ListSearchFilters
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Rechercher un entrepôt..."
                    filtersOpen={filterOpen}
                    onFiltersOpenChange={setFilterOpen}
                    filtersAreActive={!!search}
                    filters={
                        <div className="text-sm text-muted-foreground mt-4">
                            Recherche par nom, code ou ville.
                        </div>
                    }
                />
            }
            content={
                <>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : warehouses.length === 0 ? (
                        <div className="text-center py-16 bg-muted/20 rounded-lg">
                            <FaWarehouse className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <p className="text-lg font-medium">Aucun entrepôt</p>
                            <p className="text-sm text-muted-foreground mt-1 mb-6">
                                Commencez par créer votre premier entrepôt.
                            </p>
                            <Can permission={PERMISSIONS.WAREHOUSES.MANAGE}>
                                <Button
                                    onClick={() =>
                                        router.push(
                                            `/organisation/${orgId}/inventory/warehouses/create`
                                        )
                                    }
                                >
                                    <FaPlus className="mr-2" />
                                    Créer un entrepôt
                                </Button>
                            </Can>
                        </div>
                    ) : (
                        <>
                            <ListTable
                                columns={[
                                    <ListTableColumn key="name" header="Entrepôt">
                                        {({ value: w }) => (
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-primary/10 flex items-center justify-center text-primary">
                                                    <FaWarehouse className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm flex items-center gap-2">
                                                        {w.name}
                                                        {w.is_default && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="gap-1 text-[10px]"
                                                            >
                                                                <FaCheckCircle className="h-3 w-3" />
                                                                Par défaut
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {w.code}
                                                        {w.city ? ` · ${w.city}` : ""}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="manager" header="Manager">
                                        {({ value: w }) =>
                                            w.manager ? (
                                                <span className="text-sm">
                                                    {w.manager.first_name} {w.manager.last_name}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground/50 italic">
                                                    Aucun
                                                </span>
                                            )
                                        }
                                    </ListTableColumn>,
                                    <ListTableColumn key="location" header="Localisation">
                                        {({ value: w }) => (
                                            <span className="text-sm text-muted-foreground">
                                                {[w.city, w.country].filter(Boolean).join(", ") ||
                                                    "—"}
                                            </span>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="status" header="Statut">
                                        {({ value: w }) => <BadgeStatus status={w.is_active} />}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="actions"
                                        header="Actions"
                                        align="right"
                                    >
                                        {({ value: w }) => (
                                            <div className="flex items-center gap-2 justify-end">
                                                {canManage && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.push(
                                                                `/organisation/${orgId}/inventory/warehouses/${w.id}`
                                                            )
                                                        }
                                                    >
                                                        <FaEdit className="h-4 w-4 mr-1.5" />
                                                        Modifier
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                ]}
                                data={warehouses}
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
