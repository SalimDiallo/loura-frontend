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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginatedSuppliers } from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FaCheckCircle,
    FaEdit,
    FaEnvelope,
    FaMapMarkerAlt,
    FaPhone,
    FaPlus,
    FaTruck,
} from "react-icons/fa";

export default function SuppliersPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.SUPPLIERS.VIEW}>
            <SuppliersPage />
        </PermissionGuard>
    );
}

function SuppliersPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.SUPPLIERS.MANAGE);

    const [search, setSearch] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [activeOnly, setActiveOnly] = useState(true);

    const stableFilters = useMemo(
        () => ({
            search: search || undefined,
            is_active: activeOnly ? "true" : undefined,
        }),
        [search, activeOnly]
    );

    const {
        data: suppliers,
        meta,
        setPage,
        nextPage,
        prevPage,
        isLoading,
        error,
    } = usePaginatedSuppliers(orgId, stableFilters, { pageSize: 10 });

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

    const activeCount = suppliers.filter((s) => s.is_active).length;

    return (
        <ListPageLayout
            title="Fournisseurs"
            icon={FaTruck}
            description="Gérez vos sources d'approvisionnement et leurs conditions commerciales"
            headerActions={
                canManage
                    ? [
                          {
                              label: "Nouveau fournisseur",
                              icon: FaPlus,
                              onClick: () =>
                                  router.push(
                                      `/organisation/${orgId}/inventory/suppliers/create`
                                  ),
                          },
                      ]
                    : []
            }
            stats={[
                <ListStat
                    key="total"
                    label="Total fournisseurs"
                    value={meta.totalItems}
                    icon={<FaTruck className="h-4 w-4 text-muted-foreground" />}
                />,
                <ListStat
                    key="active"
                    label="Actifs (page)"
                    value={activeCount}
                    icon={<FaCheckCircle className="h-4 w-4 text-green-600" />}
                />,
            ]}
            searchFilters={
                <ListSearchFilters
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Rechercher par nom, code, contact, ville..."
                    filtersOpen={filterOpen}
                    onFiltersOpenChange={setFilterOpen}
                    filtersAreActive={!activeOnly}
                    filters={
                        <div className="space-y-3 mt-4">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={activeOnly}
                                    onChange={(e) => setActiveOnly(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                Uniquement les fournisseurs actifs
                            </label>
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
                    ) : suppliers.length === 0 ? (
                        <div className="text-center py-16 bg-muted/20 rounded-lg">
                            <FaTruck className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <p className="text-lg font-medium">Aucun fournisseur</p>
                            <p className="text-sm text-muted-foreground mt-1 mb-6">
                                Ajoutez vos partenaires d'approvisionnement pour tracer vos
                                achats.
                            </p>
                            <Can permission={PERMISSIONS.SUPPLIERS.MANAGE}>
                                <Button
                                    onClick={() =>
                                        router.push(
                                            `/organisation/${orgId}/inventory/suppliers/create`
                                        )
                                    }
                                >
                                    <FaPlus className="mr-2" />
                                    Ajouter un fournisseur
                                </Button>
                            </Can>
                        </div>
                    ) : (
                        <>
                            <ListTable
                                columns={[
                                    <ListTableColumn key="name" header="Fournisseur">
                                        {({ value: s }) => (
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-orange-100 text-orange-700 rounded flex items-center justify-center">
                                                    <FaTruck className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">
                                                        {s.name}
                                                    </div>
                                                    {s.code && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {s.code}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="contact" header="Contact">
                                        {({ value: s }) => (
                                            <div className="space-y-0.5">
                                                {s.contact_name && (
                                                    <div className="text-sm">
                                                        {s.contact_name}
                                                    </div>
                                                )}
                                                {s.email && (
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <FaEnvelope className="h-2.5 w-2.5" />
                                                        {s.email}
                                                    </div>
                                                )}
                                                {s.phone && (
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <FaPhone className="h-2.5 w-2.5" />
                                                        {s.phone}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="location" header="Localisation">
                                        {({ value: s }) =>
                                            s.city || s.country ? (
                                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <FaMapMarkerAlt className="h-3 w-3" />
                                                    {[s.city, s.country]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground/50">
                                                    —
                                                </span>
                                            )
                                        }
                                    </ListTableColumn>,
                                    <ListTableColumn key="terms" header="Délai">
                                        {({ value: s }) => (
                                            <span className="text-sm">
                                                {s.payment_terms_days} jours
                                            </span>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="status" header="Statut">
                                        {({ value: s }) => (
                                            <BadgeStatus status={s.is_active} />
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="actions"
                                        header="Actions"
                                        align="right"
                                    >
                                        {({ value: s }) => (
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.push(
                                                            `/organisation/${orgId}/inventory/suppliers/${s.id}`
                                                        )
                                                    }
                                                >
                                                    <FaEdit className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                ]}
                                data={suppliers}
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
