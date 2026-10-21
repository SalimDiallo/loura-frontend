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
import { Can, PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ShortcutsHelpModal } from "@/components/ui/shortcuts-help";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useBulkSelection } from "@/lib/hooks/use-bulk-selection";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
    type KeyboardShortcut,
    useKeyboardShortcuts,
} from "@/lib/hooks/use-keyboard-shortcuts";
import {
    useDeleteSupplier,
    usePaginatedSuppliers,
    useRestoreSupplier,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { Supplier } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    FaCheckCircle,
    FaEdit,
    FaEnvelope,
    FaMapMarkerAlt,
    FaPhone,
    FaPlus,
    FaTrashRestore,
    FaTruck,
    FaUndo,
} from "react-icons/fa";
import { toast } from "sonner";

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
    const canViewPurchaseOrders = can(PERMISSIONS.PURCHASE_ORDERS.VIEW);

    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 300);
    const [filterOpen, setFilterOpen] = useState(false);
    const [activeOnly, setActiveOnly] = useState(true);
    const [showTrash, setShowTrash] = useState(false);
    const [toDelete, setToDelete] = useState<Supplier | null>(null);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const stableFilters = useMemo(
        () => ({
            search: debouncedSearch || undefined,
            is_active: showTrash ? undefined : activeOnly ? "true" : undefined,
            deleted: showTrash ? "true" : undefined,
        }),
        [debouncedSearch, activeOnly, showTrash]
    );

    const restoreSupplier = useRestoreSupplier();
    const deleteSupplier = useDeleteSupplier();

    const {
        data: suppliers,
        meta,
        setPage,
        nextPage,
        prevPage,
        isLoading,
        error,
    } = usePaginatedSuppliers(orgId, stableFilters, { pageSize: 10 });

    const selection = useBulkSelection(suppliers.map((s) => s.id));
    useEffect(() => {
        selection.clear();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, activeOnly, showTrash, meta.currentPage]);

    const handleRestore = (id: string) => {
        restoreSupplier.mutate(
            { orgId, id },
            {
                onSuccess: () => toast.success("Fournisseur restauré."),
                onError: (err) =>
                    toast.error("Restauration impossible", {
                        description: getApiErrorMessage(err),
                    }),
            }
        );
    };

    const handleConfirmDelete = () => {
        if (!toDelete) return;
        deleteSupplier.mutate(
            { orgId, id: toDelete.id },
            {
                onSuccess: () => {
                    toast.success("Fournisseur déplacé dans la corbeille.");
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
        for (const id of ids) {
            try {
                await deleteSupplier.mutateAsync({ orgId, id });
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
                `${ok} fournisseur${ok > 1 ? "s" : ""} déplacé${ok > 1 ? "s" : ""} dans la corbeille.`
            );
        } else {
            toast.error(`${ok} supprimé${ok > 1 ? "s" : ""}, ${failed} en échec.`, {
                description:
                    "Certains fournisseurs n'ont pas pu être supprimés (contraintes).",
            });
        }
    };

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
                description: "Nouveau fournisseur",
                handler: () =>
                    router.push(`/organisation/${orgId}/inventory/suppliers/create`),
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

    const activeCount = suppliers.filter((s) => s.is_active).length;
    const showSelection = canManage && !showTrash;

    return (
        <>
            <ListPageLayout
                title={showTrash ? "Fournisseurs — Corbeille" : "Fournisseurs"}
                icon={showTrash ? FaTrashRestore : FaTruck}
                description={
                    showTrash
                        ? "Fournisseurs supprimés — restaurez-les si besoin"
                        : "Gérez vos sources d'approvisionnement et leurs conditions commerciales"
                }
                headerActions={[
                    {
                        label: showTrash ? "Voir les actifs" : "Corbeille",
                        icon: showTrash ? FaTruck : FaTrashRestore,
                        variant: "outline" as const,
                        onClick: () => setShowTrash((v) => !v),
                    },
                    ...(canManage && !showTrash
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
                        : []),
                ]}
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
                        searchInputRef={searchInputRef}
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
                            showTrash ? (
                                <div className="text-center py-16 bg-muted/20 rounded-lg">
                                    <FaTrashRestore className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                    <p className="text-lg font-medium">Corbeille vide</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Aucun fournisseur supprimé.
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-muted/20 rounded-lg">
                                    <FaTruck className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                    <p className="text-lg font-medium">Aucun fournisseur</p>
                                    <p className="text-sm text-muted-foreground mt-1 mb-6">
                                        Ajoutez vos partenaires d&apos;approvisionnement pour tracer
                                        vos achats.
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
                            )
                        ) : (
                            <>
                                {showSelection && (
                                    <ListSelectionBar
                                        count={selection.count}
                                        label={`${selection.count} fournisseur${selection.count > 1 ? "s" : ""} sélectionné${selection.count > 1 ? "s" : ""}`}
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
                                                    {({ value: s }) => (
                                                        <Checkbox
                                                            checked={selection.selected.has(s.id)}
                                                            onCheckedChange={() =>
                                                                selection.toggleOne(s.id)
                                                            }
                                                            aria-label={`Sélectionner ${s.name}`}
                                                        />
                                                    )}
                                                </ListTableColumn>,
                                              ]
                                            : []),
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
                                        ...(showTrash
                                            ? [
                                                <ListTableColumn
                                                    key="deleted_by"
                                                    header="Supprimé par"
                                                >
                                                    {({ value: s }) => (
                                                        <div className="text-xs">
                                                            <div className="font-medium">
                                                                {s.deleted_by_info?.name ||
                                                                    s.deleted_by_info?.email ||
                                                                    "—"}
                                                            </div>
                                                            {s.deleted_at && (
                                                                <div className="text-muted-foreground">
                                                                    {new Date(
                                                                        s.deleted_at
                                                                    ).toLocaleDateString("fr-FR")}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </ListTableColumn>,
                                              ]
                                            : [
                                                <ListTableColumn key="status" header="Statut">
                                                    {({ value: s }) => (
                                                        <BadgeStatus status={s.is_active} />
                                                    )}
                                                </ListTableColumn>,
                                              ]),
                                        <ListTableColumn
                                            key="actions"
                                            header=""
                                            align="right"
                                        >
                                            {({ value: s }) =>
                                                showTrash ? (
                                                    <div className="flex items-center gap-1.5 justify-end">
                                                        {canManage && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={restoreSupplier.isPending}
                                                                onClick={() => handleRestore(s.id)}
                                                            >
                                                                <FaUndo className="h-3.5 w-3.5 mr-1.5" />
                                                                Restaurer
                                                            </Button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 justify-end">
                                                        {canViewPurchaseOrders && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                title="Voir les approvisionnements"
                                                                aria-label="Voir les approvisionnements"
                                                                onClick={() =>
                                                                    router.push(
                                                                        `/organisation/${orgId}/inventory/suppliers/${s.id}/purchase-orders`
                                                                    )
                                                                }
                                                            >
                                                                <FaTruck className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                        {canManage && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                    title="Modifier le fournisseur"
                                                                    aria-label="Modifier le fournisseur"
                                                                    onClick={() =>
                                                                        router.push(
                                                                            `/organisation/${orgId}/inventory/suppliers/${s.id}`
                                                                        )
                                                                    }
                                                                >
                                                                    <FaEdit className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                    title="Supprimer le fournisseur"
                                                                    aria-label="Supprimer le fournisseur"
                                                                    onClick={() => setToDelete(s)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                )
                                            }
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

            <ConfirmDeleteDialog
                open={!!toDelete}
                onOpenChange={() => setToDelete(null)}
                title="Supprimer le fournisseur ?"
                description={
                    <>
                        «&nbsp;{toDelete?.name}&nbsp;» sera déplacé dans la corbeille.
                        {!!toDelete?.purchase_orders_count &&
                            toDelete.purchase_orders_count > 0 && (
                                <>
                                    {" "}
                                    Il est lié à {toDelete.purchase_orders_count} commande
                                    {toDelete.purchase_orders_count > 1 ? "s" : ""}
                                    fournisseur.
                                </>
                            )}{" "}
                        Vous pourrez le restaurer à tout moment.
                    </>
                }
                pending={deleteSupplier.isPending}
                onConfirm={handleConfirmDelete}
            />

            <ConfirmDeleteDialog
                open={bulkOpen}
                onOpenChange={setBulkOpen}
                title={`Supprimer ${selection.count} fournisseur${selection.count > 1 ? "s" : ""} ?`}
                description="Les fournisseurs sélectionnés seront déplacés dans la corbeille. Vous pourrez les restaurer à tout moment."
                pending={bulkDeleting}
                onConfirm={handleBulkDelete}
            />

            <ShortcutsHelpModal
                isOpen={showShortcuts}
                onClose={() => setShowShortcuts(false)}
                shortcuts={shortcuts}
                title="Raccourcis — Fournisseurs"
            />
        </>
    );
}
