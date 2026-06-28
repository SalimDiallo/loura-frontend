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
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useCurrencyFormatter } from "@/lib/hooks";
import { usePaginatedProducts, useRestoreProduct } from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FaBox, FaBoxes, FaEdit, FaPlus, FaTag, FaTrashRestore, FaUndo } from "react-icons/fa";
import { toast } from "sonner";

export default function ProductsPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.PRODUCTS.VIEW}>
            <ProductsPage />
        </PermissionGuard>
    );
}

function ProductsPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.PRODUCTS.MANAGE);
    const { formatCurrency } = useCurrencyFormatter();

    const [search, setSearch] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [showTrash, setShowTrash] = useState(false);

    const stableFilters = useMemo(
        () => ({
            search: search || undefined,
            deleted: showTrash ? "true" : undefined,
        }),
        [search, showTrash]
    );

    const restoreProduct = useRestoreProduct();

    const handleRestore = (productId: string) => {
        restoreProduct.mutate(
            { orgId, productId },
            {
                onSuccess: () => toast.success("Produit restauré."),
                onError: (err) =>
                    toast.error("Restauration impossible", {
                        description: getApiErrorMessage(err),
                    }),
            }
        );
    };

    const {
        data: products,
        meta,
        setPage,
        nextPage,
        prevPage,
        isLoading,
        error,
    } = usePaginatedProducts(orgId, stableFilters, { pageSize: 10 });

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
            title={showTrash ? "Produits — Corbeille" : "Produits"}
            icon={showTrash ? FaTrashRestore : FaBox}
            description={
                showTrash
                    ? "Produits supprimés — restaurez-les si besoin"
                    : "Catalogue des produits et services de votre organisation"
            }
            headerActions={[
                {
                    label: showTrash ? "Voir les produits actifs" : "Corbeille",
                    icon: showTrash ? FaBox : FaTrashRestore,
                    variant: "outline" as const,
                    onClick: () => setShowTrash((v) => !v),
                },
                ...(canManage && !showTrash
                    ? [
                        {
                            label: "Nouveau produit",
                            icon: FaPlus,
                            onClick: () =>
                                router.push(
                                    `/organisation/${orgId}/inventory/products/create`
                                ),
                        },
                    ]
                    : []),
            ]}
            stats={[
                <ListStat
                    key="total"
                    label="Total produits"
                    value={meta.totalItems}
                    icon={<FaBoxes className="h-4 w-4 text-muted-foreground" />}
                />,
                <ListStat
                    key="page"
                    label="Sur cette page"
                    value={products.length}
                    icon={<FaTag className="h-4 w-4 text-blue-600" />}
                />,
            ]}
            searchFilters={
                <ListSearchFilters
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Rechercher par nom, SKU, code-barres..."
                    filtersOpen={filterOpen}
                    onFiltersOpenChange={setFilterOpen}
                    filtersAreActive={!!search}
                    filters={
                        <div className="text-sm text-muted-foreground mt-4">
                            Recherche sur nom, SKU, code-barres et description.
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
                    ) : products.length === 0 ? (
                        showTrash ? (
                            <div className="text-center py-16 bg-muted/20 rounded-lg">
                                <FaTrashRestore className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <p className="text-lg font-medium">Corbeille vide</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Aucun produit supprimé.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-muted/20 rounded-lg">
                                <FaBox className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <p className="text-lg font-medium">Aucun produit</p>
                                <p className="text-sm text-muted-foreground mt-1 mb-6">
                                    Commencez par créer votre premier produit.
                                </p>
                                <Can permission={PERMISSIONS.PRODUCTS.MANAGE}>
                                    <Button
                                        onClick={() =>
                                            router.push(
                                                `/organisation/${orgId}/inventory/products/create`
                                            )
                                        }
                                    >
                                        <FaPlus className="mr-2" />
                                        Créer un produit
                                    </Button>
                                </Can>
                            </div>
                        )
                    ) : (
                        <>
                            <ListTable
                                columns={[
                                    <ListTableColumn key="name" header="Produit">
                                        {({ value: p }) => (
                                            <div className="flex items-center gap-3">
                                                {p.image_url ? (
                                                    <img
                                                        src={p.image_url}
                                                        alt={p.name}
                                                        className="h-10 w-10 rounded object-cover border"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 bg-primary/10 flex items-center justify-center text-primary rounded">
                                                        <FaBox className="h-4 w-4" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-sm">
                                                        {p.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                        <span>SKU: {p.sku}</span>
                                                        {p.barcode && (
                                                            <>
                                                                <span>·</span>
                                                                <span>{p.barcode}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="category" header="Catégorie">
                                        {({ value: p }) =>
                                            p.category ? (
                                                <Badge variant="outline" className="font-normal">
                                                    {p.category.name}
                                                </Badge>
                                            ) : (
                                                <span className="text-sm text-muted-foreground/50 italic">
                                                    Aucune
                                                </span>
                                            )
                                        }
                                    </ListTableColumn>,
                                    <ListTableColumn key="price" header="Prix de vente">
                                        {({ value: p }) => (
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {formatCurrency(Number(p.selling_price))}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    / {p.unit_display.toLowerCase()}
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="stock" header="Suivi stock">
                                        {({ value: p }) =>
                                            p.track_stock ? (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px]"
                                                >
                                                    Suivi actif
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    Non suivi
                                                </span>
                                            )
                                        }
                                    </ListTableColumn>,
                                    ...(showTrash
                                        ? [
                                            <ListTableColumn
                                                key="deleted_by"
                                                header="Supprimé par"
                                            >
                                                {({ value: p }) => (
                                                    <div className="text-xs">
                                                        <div className="font-medium">
                                                            {p.deleted_by_info?.name ||
                                                                p.deleted_by_info?.email ||
                                                                "—"}
                                                        </div>
                                                        {p.deleted_at && (
                                                            <div className="text-muted-foreground">
                                                                {new Date(
                                                                    p.deleted_at
                                                                ).toLocaleDateString("fr-FR")}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </ListTableColumn>,
                                          ]
                                        : [
                                            <ListTableColumn key="status" header="Statut">
                                                {({ value: p }) => (
                                                    <BadgeStatus status={p.is_active} />
                                                )}
                                            </ListTableColumn>,
                                          ]),
                                    <ListTableColumn
                                        key="actions"
                                        header="Actions"
                                        align="right"
                                    >
                                        {({ value: p }) => (
                                            <div className="flex items-center gap-2 justify-end">
                                                {canManage && showTrash && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={restoreProduct.isPending}
                                                        onClick={() => handleRestore(p.id)}
                                                    >
                                                        <FaUndo className="h-4 w-4 mr-1.5" />
                                                        Restaurer
                                                    </Button>
                                                )}
                                                {canManage && !showTrash && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.push(
                                                                `/organisation/${orgId}/inventory/products/${p.id}`
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
                                data={products}
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
