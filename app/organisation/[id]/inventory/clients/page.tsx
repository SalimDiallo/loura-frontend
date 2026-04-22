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
import { useCurrencyFormatter } from "@/lib/hooks";
import { usePaginatedCustomers } from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { CustomerType } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FaBuilding,
    FaCheckCircle,
    FaEdit,
    FaEnvelope,
    FaPhone,
    FaPlus,
    FaUser,
    FaUserCheck,
} from "react-icons/fa";

export default function ClientsPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.CUSTOMERS.VIEW}>
            <ClientsPage />
        </PermissionGuard>
    );
}

function ClientsPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.CUSTOMERS.MANAGE);
    const { formatCurrency } = useCurrencyFormatter();

    const [search, setSearch] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [activeOnly, setActiveOnly] = useState(true);

    const stableFilters = useMemo(
        () => ({
            search: search || undefined,
            is_active: activeOnly ? "true" : undefined,
            customer_type: (typeFilter as CustomerType) || undefined,
        }),
        [search, typeFilter, activeOnly]
    );

    const {
        data: customers,
        meta,
        setPage,
        nextPage,
        prevPage,
        isLoading,
        error,
    } = usePaginatedCustomers(orgId, stableFilters, { pageSize: 10 });

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

    const filtersActive = !!typeFilter || !activeOnly;

    return (
        <ListPageLayout
            title="Clients"
            icon={FaUserCheck}
            description="Gérez votre portefeuille de clients et leurs conditions commerciales"
            headerActions={
                canManage
                    ? [
                          {
                              label: "Nouveau client",
                              icon: FaPlus,
                              onClick: () =>
                                  router.push(
                                      `/organisation/${orgId}/inventory/clients/create`
                                  ),
                          },
                      ]
                    : []
            }
            stats={[
                <ListStat
                    key="total"
                    label="Total clients"
                    value={meta.totalItems}
                    icon={<FaUserCheck className="h-4 w-4 text-muted-foreground" />}
                />,
                <ListStat
                    key="active"
                    label="Actifs (page)"
                    value={customers.filter((c) => c.is_active).length}
                    icon={<FaCheckCircle className="h-4 w-4 text-green-600" />}
                />,
            ]}
            searchFilters={
                <ListSearchFilters
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Nom, code, contact, email, téléphone..."
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
                                    <option value="individual">Particulier</option>
                                    <option value="company">Entreprise</option>
                                </select>
                            </div>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={activeOnly}
                                    onChange={(e) => setActiveOnly(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                Uniquement les clients actifs
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
                    ) : customers.length === 0 ? (
                        <div className="text-center py-16 bg-muted/20 rounded-lg">
                            <FaUserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <p className="text-lg font-medium">Aucun client</p>
                            <p className="text-sm text-muted-foreground mt-1 mb-6">
                                Ajoutez votre premier client pour démarrer la facturation.
                            </p>
                            <Can permission={PERMISSIONS.CUSTOMERS.MANAGE}>
                                <Button
                                    onClick={() =>
                                        router.push(
                                            `/organisation/${orgId}/inventory/clients/create`
                                        )
                                    }
                                >
                                    <FaPlus className="mr-2" />
                                    Ajouter un client
                                </Button>
                            </Can>
                        </div>
                    ) : (
                        <>
                            <ListTable
                                columns={[
                                    <ListTableColumn key="name" header="Client">
                                        {({ value: c }) => (
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`h-8 w-8 rounded flex items-center justify-center ${c.customer_type === "company" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}
                                                >
                                                    {c.customer_type === "company" ? (
                                                        <FaBuilding className="h-4 w-4" />
                                                    ) : (
                                                        <FaUser className="h-4 w-4" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">
                                                        {c.name}
                                                    </div>
                                                    {c.code && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {c.code}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="type" header="Type">
                                        {({ value: c }) => (
                                            <Badge
                                                variant="outline"
                                                className={
                                                    c.customer_type === "company"
                                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                                        : "bg-violet-50 text-violet-700 border-violet-200"
                                                }
                                            >
                                                {c.customer_type_display}
                                            </Badge>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="contact" header="Contact">
                                        {({ value: c }) => (
                                            <div className="space-y-0.5">
                                                {c.contact_name && (
                                                    <div className="text-sm">
                                                        {c.contact_name}
                                                    </div>
                                                )}
                                                {c.email && (
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <FaEnvelope className="h-2.5 w-2.5" />
                                                        {c.email}
                                                    </div>
                                                )}
                                                {c.phone && (
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <FaPhone className="h-2.5 w-2.5" />
                                                        {c.phone}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="credit" header="Crédit autorisé">
                                        {({ value: c }) => (
                                            <div className="text-sm">
                                                {Number(c.credit_limit) > 0 ? (
                                                    <>
                                                        <span className="font-semibold">
                                                            {formatCurrency(
                                                                Number(c.credit_limit)
                                                            )}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground ml-1">
                                                            / {c.payment_terms_days}j
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        Comptant
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="status" header="Statut">
                                        {({ value: c }) => (
                                            <BadgeStatus status={c.is_active} />
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="actions"
                                        header="Actions"
                                        align="right"
                                    >
                                        {({ value: c }) => (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    router.push(
                                                        `/organisation/${orgId}/inventory/clients/${c.id}`
                                                    )
                                                }
                                            >
                                                <FaEdit className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </ListTableColumn>,
                                ]}
                                data={customers}
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
