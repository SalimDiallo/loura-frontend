"use client";

import { BadgeStatus } from "@/components/BadgeStatus";
import { ConfirmDeleteDialog } from "@/components/layout/ConfirmDeleteDialog";
import {
    ListPageLayout,
    ListPagination,
    ListSearchFilters,
    ListStat,
    ListTable,
    ListTableColumn,
} from "@/components/layout/ListPageLayout";
import { ListSelectionBar } from "@/components/layout/ListSelectionBar";
import { RowActionsMenu } from "@/components/layout/RowActionsMenu";
import { Can, PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ShortcutsHelpModal } from "@/components/ui/shortcuts-help";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useCurrencyFormatter } from "@/lib/hooks";
import { useBulkSelection } from "@/lib/hooks/use-bulk-selection";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
    type KeyboardShortcut,
    useKeyboardShortcuts,
} from "@/lib/hooks/use-keyboard-shortcuts";
import {
    useDeleteProduct,
    usePaginatedProducts,
    useRestoreProduct,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { Product } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaBox, FaBoxes, FaPlus, FaTag, FaTrashRestore, FaUndo } from "react-icons/fa";
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
    const debouncedSearch = useDebouncedValue(search, 300);
    const [filterOpen, setFilterOpen] = useState(false);
    const [showTrash, setShowTrash] = useState(false);
    const [toDelete, setToDelete] = useState<Product | null>(null);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const stableFilters = useMemo(
        () => ({
            search: debouncedSearch || undefined,
            deleted: showTrash ? "true" : undefined,
        }),
        [debouncedSearch, showTrash]
    );

    const restoreProduct = useRestoreProduct();
    const deleteProduct = useDeleteProduct();

    const {
        data: products,
        meta,
        setPage,
        nextPage,
        prevPage,
        isLoading,
        error,
    } = usePaginatedProducts(orgId, stableFilters, { pageSize: 10 });

    // ── Sélection multiple (limitée à la page visible) ────────────────────────
    const selection = useBulkSelection(products.map((p) => p.id));
    // On vide la sélection dès qu'on change de page / recherche / corbeille.
    useEffect(() => {
        selection.clear();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, showTrash, meta.currentPage]);

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

    const handleConfirmDelete = () => {
        if (!toDelete) return;
        deleteProduct.mutate(
            { orgId, productId: toDelete.id },
            {
                onSuccess: () => {
                    toast.success("Produit déplacé dans la corbeille.");
                    setToDelete(null);
                },
                onError: (err) =>
                    toast.error("Suppression impossible", {
                        description: getApiErrorMessage(err),
                    }),
            }
        );
    };

    const handleBulkDelete = async () => {
        const ids = selection.ids;
        if (ids.length === 0) return;
        setBulkDeleting(true);
        const results: PromiseSettledResult<unknown>[] = [];
        for (const productId of ids) {
            try {
                await deleteProduct.mutateAsync({ orgId, productId });
                results.push({ status: "fulfilled", value: undefined });
            } catch (e) {
                results.push({ status: "rejected", reason: e });
            }
        }
        const ok = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.length - ok;
        setBulkDeleting(false);
        setBulkOpen(false);
        selection.clear();
        if (failed === 0) {
            toast.success(
                `${ok} produit${ok > 1 ? "s" : ""} déplacé${ok > 1 ? "s" : ""} dans la corbeille.`
            );
        } else {
            toast.error(`${ok} supprimé${ok > 1 ? "s" : ""}, ${failed} en échec.`, {
                description: "Réessayez pour les éléments restants.",
            });
        }
    };

    // ── Raccourcis clavier (sobres, par page) ────────────────────────────────
    const shortcuts = useMemo<KeyboardShortcut[]>(() => {
        const list: KeyboardShortcut[] = [
            {
                key: "/",
                description: "Aller à la recherche",
                handler: () => searchInputRef.current?.focus(),
            },
            {
                key: "?",
                shift: true,
                description: "Afficher l'aide des raccourcis",
                handler: () => setShowShortcuts((v) => !v),
            },
        ];
        if (canManage && !showTrash) {
            list.unshift({
                key: "n",
                description: "Nouveau produit",
                handler: () =>
                    router.push(`/organisation/${orgId}/inventory/products/create`),
            });
        }
        return list;
    }, [canManage, showTrash, orgId, router]);

    useKeyboardShortcuts(shortcuts);

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

    const showSelection = canManage && !showTrash;

    return (
        <>
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
                        searchInputRef={searchInputRef}
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
                                {showSelection && (
                                    <ListSelectionBar
                                        count={selection.count}
                                        label={`${selection.count} produit${selection.count > 1 ? "s" : ""} sélectionné${selection.count > 1 ? "s" : ""}`}
                                        onClear={selection.clear}
                                        onDelete={() => setBulkOpen(true)}
                                    />
                                )}
                                <ListTable
                                    columns={[
                                        ...(showSelection
                                            ? [
                                                <ListTableColumn
                                                    key="select"
                                                    header={
                                                        <Checkbox
                                                            checked={selection.allSelected}
                                                            onCheckedChange={selection.toggleAll}
                                                            aria-label="Tout sélectionner"
                                                        />
                                                    }
                                                >
                                                    {({ value: p }) => (
                                                        <Checkbox
                                                            checked={selection.selected.has(p.id)}
                                                            onCheckedChange={() =>
                                                                selection.toggleOne(p.id)
                                                            }
                                                            aria-label={`Sélectionner ${p.name}`}
                                                        />
                                                    )}
                                                </ListTableColumn>,
                                              ]
                                            : []),
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
                                            header=""
                                            align="right"
                                        >
                                            {({ value: p }) => (
                                                <div className="flex items-center justify-end">
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
                                                        <RowActionsMenu
                                                            onEdit={() =>
                                                                router.push(
                                                                    `/organisation/${orgId}/inventory/products/${p.id}`
                                                                )
                                                            }
                                                            onDelete={() => setToDelete(p)}
                                                        />
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

            <ConfirmDeleteDialog
                open={!!toDelete}
                onOpenChange={() => setToDelete(null)}
                title="Supprimer le produit ?"
                description={
                    <>
                        «&nbsp;{toDelete?.name}&nbsp;» sera déplacé dans la corbeille.
                        Vous pourrez le restaurer à tout moment.
                    </>
                }
                pending={deleteProduct.isPending}
                onConfirm={handleConfirmDelete}
            />

            <ConfirmDeleteDialog
                open={bulkOpen}
                onOpenChange={setBulkOpen}
                title={`Supprimer ${selection.count} produit${selection.count > 1 ? "s" : ""} ?`}
                description="Les produits sélectionnés seront déplacés dans la corbeille. Vous pourrez les restaurer à tout moment."
                pending={bulkDeleting}
                onConfirm={handleBulkDelete}
            />

            <ShortcutsHelpModal
                isOpen={showShortcuts}
                onClose={() => setShowShortcuts(false)}
                shortcuts={shortcuts}
                title="Raccourcis — Produits"
            />
        </>
    );
}
