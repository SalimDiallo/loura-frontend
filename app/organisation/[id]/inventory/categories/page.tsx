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
import { usePaginatedCategories } from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FaBoxOpen, FaEdit, FaLayerGroup, FaPlus, FaTags } from "react-icons/fa";

export default function CategoriesPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.PRODUCT_CATEGORIES.VIEW}>
            <CategoriesPage />
        </PermissionGuard>
    );
}

function CategoriesPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.PRODUCT_CATEGORIES.MANAGE);

    const [search, setSearch] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);

    const stableFilters = useMemo(
        () => ({ search: search || undefined }),
        [search]
    );

    const {
        data: categories,
        meta,
        setPage,
        nextPage,
        prevPage,
        isLoading,
        error,
    } = usePaginatedCategories(orgId, stableFilters, { pageSize: 10 });

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-destructive">
                            Erreur : {error.message}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <ListPageLayout
            title="Catégories produits"
            icon={FaTags}
            description="Organisez votre catalogue avec une hiérarchie de catégories"
            headerActions={
                canManage
                    ? [
                        {
                            label: "Nouvelle catégorie",
                            icon: FaPlus,
                            onClick: () =>
                                router.push(
                                    `/organisation/${orgId}/inventory/categories/create`
                                ),
                        },
                    ]
                    : []
            }
            stats={[
                <ListStat
                    key="total"
                    label="Total catégories"
                    value={meta.totalItems}
                    icon={<FaLayerGroup className="h-4 w-4 text-muted-foreground" />}
                />,
                <ListStat
                    key="page"
                    label="Sur cette page"
                    value={categories.length}
                    icon={<FaBoxOpen className="h-4 w-4 text-green-600" />}
                />,
            ]}
            searchFilters={
                <ListSearchFilters
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Rechercher une catégorie..."
                    filtersOpen={filterOpen}
                    onFiltersOpenChange={setFilterOpen}
                    filtersAreActive={!!search}
                    filters={
                        <div className="text-sm text-muted-foreground mt-4">
                            La recherche s'applique au nom et à la description.
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
                    ) : categories.length === 0 ? (
                        <div className="text-center py-16 bg-muted/20 rounded-lg">
                            <FaTags className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <p className="text-lg font-medium">Aucune catégorie</p>
                            <p className="text-sm text-muted-foreground mt-1 mb-6">
                                Créez votre première catégorie pour structurer le catalogue.
                            </p>
                            <Can permission={PERMISSIONS.PRODUCT_CATEGORIES.MANAGE}>
                                <Button
                                    onClick={() =>
                                        router.push(
                                            `/organisation/${orgId}/inventory/categories/create`
                                        )
                                    }
                                >
                                    <FaPlus className="mr-2" />
                                    Créer une catégorie
                                </Button>
                            </Can>
                        </div>
                    ) : (
                        <>
                            <ListTable
                                columns={[
                                    <ListTableColumn key="name" header="Catégorie">
                                        {({ value: cat }) => (
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="h-8 w-8 flex items-center justify-center text-primary"
                                                    style={{
                                                        backgroundColor: cat.color
                                                            ? `${cat.color}22`
                                                            : undefined,
                                                    }}
                                                >
                                                    <FaTags className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">
                                                        {cat.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {cat.full_path !== cat.name
                                                            ? cat.full_path
                                                            : cat.description || "Racine"}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="products" header="Produits">
                                        {({ value: cat }) => (
                                            <span className="text-sm">
                                                {cat.products_count} produit
                                                {cat.products_count > 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="children" header="Sous-catégories">
                                        {({ value: cat }) => (
                                            <span className="text-sm text-muted-foreground">
                                                {cat.children_count}
                                            </span>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="status" header="Statut">
                                        {({ value: cat }) => (
                                            <BadgeStatus status={cat.is_active} />
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="actions"
                                        header="Actions"
                                        align="right"
                                    >
                                        {({ value: cat }) => (
                                            <div className="flex items-center gap-2 justify-end">
                                                {canManage && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.push(
                                                                `/organisation/${orgId}/inventory/categories/${cat.id}`
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
                                data={categories}
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
