"use client";

import { GenerateDocumentButton } from "@/components/documents";
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
import { Badge } from "@/components/ui/badge";
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
    useDeletePhysicalInventory,
    usePaginatedPhysicalInventories,
    useRestorePhysicalInventory,
    useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    PhysicalInventory,
    PhysicalInventoryStatus,
    Warehouse,
} from "@/lib/types";
import { Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    FaCheckCircle,
    FaClipboardCheck,
    FaEdit,
    FaExclamationTriangle,
    FaPlus,
    FaReceipt,
    FaTimes,
    FaTrashRestore,
    FaUndo,
} from "react-icons/fa";
import { toast } from "sonner";

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
    const debouncedSearch = useDebouncedValue(search, 300);
    const [filterOpen, setFilterOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [warehouseFilter, setWarehouseFilter] = useState<string>("");
    const [showTrash, setShowTrash] = useState(false);
    const [toDelete, setToDelete] = useState<PhysicalInventory | null>(null);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data: warehousesList = [] } = useWarehouses(orgId, {
        page_size: "all",
        is_active: "true",
    });
    const warehouses = (warehousesList as unknown as Warehouse[]) ?? [];

    const stableFilters = useMemo(
        () => ({
            search: debouncedSearch || undefined,
            status: (statusFilter as PhysicalInventoryStatus) || undefined,
            warehouse: warehouseFilter || undefined,
            deleted: showTrash ? "true" : undefined,
        }),
        [debouncedSearch, statusFilter, warehouseFilter, showTrash]
    );

    const restoreInventory = useRestorePhysicalInventory();
    const deleteInventory = useDeletePhysicalInventory();

    const {
        data: inventories,
        meta,
        setPage,
        nextPage,
        prevPage,
        isLoading,
        error,
    } = usePaginatedPhysicalInventories(orgId, stableFilters, { pageSize: 15 });

    // Tous les inventaires visibles sont maintenant supprimables (le backend
    // réverse les ajustements si l'inventaire est validé).
    const selectableIds = inventories.map((inv) => inv.id);
    const selection = useBulkSelection(selectableIds);
    useEffect(() => {
        selection.clear();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, statusFilter, warehouseFilter, showTrash, meta.currentPage]);

    const handleRestore = (id: string) => {
        restoreInventory.mutate(
            { orgId, id },
            {
                onSuccess: () => toast.success("Inventaire restauré."),
                onError: (err) =>
                    toast.error("Restauration impossible", {
                        description: getApiErrorMessage(err),
                    }),
            }
        );
    };

    const handleConfirmDelete = () => {
        if (!toDelete) return;
        deleteInventory.mutate(
            { orgId, id: toDelete.id },
            {
                onSuccess: () => {
                    toast.success("Inventaire déplacé dans la corbeille.");
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
                await deleteInventory.mutateAsync({ orgId, id });
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
                `${ok} inventaire${ok > 1 ? "s" : ""} déplacé${ok > 1 ? "s" : ""} dans la corbeille.`
            );
        } else {
            toast.error(`${ok} supprimé${ok > 1 ? "s" : ""}, ${failed} en échec.`, {
                description: "Réessayez pour les éléments restants.",
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
                description: "Nouvel inventaire",
                handler: () =>
                    router.push(
                        `/organisation/${orgId}/inventory/physical-inventories/create`
                    ),
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

    const filtersActive = !!statusFilter || !!warehouseFilter;
    const showSelection = canManage && !showTrash;

    return (
        <>
        <ListPageLayout
            title={showTrash ? "Inventaires — Corbeille" : "Inventaires physiques"}
            icon={showTrash ? FaTrashRestore : FaClipboardCheck}
            description={
                showTrash
                    ? "Inventaires supprimés — restaurez-les si besoin"
                    : "Comptage physique, comparaison et ajustements de stock"
            }
            headerActions={[
                {
                    label: showTrash ? "Voir les actifs" : "Corbeille",
                    icon: showTrash ? FaClipboardCheck : FaTrashRestore,
                    variant: "outline" as const,
                    onClick: () => setShowTrash((v) => !v),
                },
                ...(canManage && !showTrash
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
                    : []),
            ]}
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
                    searchInputRef={searchInputRef}
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
                        showTrash ? (
                            <div className="text-center py-16 bg-muted/20 rounded-lg">
                                <FaTrashRestore className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <p className="text-lg font-medium">Corbeille vide</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Aucun inventaire supprimé.
                                </p>
                            </div>
                        ) : (
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
                        )
                    ) : (
                        <>
                            {showSelection && (
                                <ListSelectionBar
                                    count={selection.count}
                                    label={`${selection.count} inventaire${selection.count > 1 ? "s" : ""} sélectionné${selection.count > 1 ? "s" : ""}`}
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
                                                {({ value: inv }) => (
                                                    <Checkbox
                                                        checked={selection.selected.has(inv.id)}
                                                        onCheckedChange={() =>
                                                            selection.toggleOne(inv.id)
                                                        }
                                                        aria-label={`Sélectionner ${inv.reference}`}
                                                    />
                                                )}
                                            </ListTableColumn>,
                                          ]
                                        : []),
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
                                        header=""
                                        align="right"
                                    >
                                        {({ value: inv }) =>
                                            showTrash ? (
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="text-xs text-right">
                                                        <div className="font-medium">
                                                            {inv.deleted_by_info?.name ||
                                                                inv.deleted_by_info?.email ||
                                                                "—"}
                                                        </div>
                                                        {inv.deleted_at && (
                                                            <div className="text-muted-foreground">
                                                                {new Date(
                                                                    inv.deleted_at
                                                                ).toLocaleDateString("fr-FR")}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {canManage && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={restoreInventory.isPending}
                                                            onClick={() => handleRestore(inv.id)}
                                                        >
                                                            <FaUndo className="h-3.5 w-3.5 mr-1.5" />
                                                            Restaurer
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
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
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        title="Ouvrir l'inventaire"
                                                        aria-label="Ouvrir l'inventaire"
                                                        onClick={() =>
                                                            router.push(
                                                                `/organisation/${orgId}/inventory/physical-inventories/${inv.id}`
                                                            )
                                                        }
                                                    >
                                                        <FaEdit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {canManage && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            title="Supprimer l'inventaire"
                                                            aria-label="Supprimer l'inventaire"
                                                            onClick={() => setToDelete(inv)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            )
                                        }
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

        <ConfirmDeleteDialog
            open={!!toDelete}
            onOpenChange={() => setToDelete(null)}
            title="Supprimer l'inventaire ?"
            description={
                toDelete?.status === "completed" ? (
                    <>
                        <span className="font-semibold text-amber-600">
                            Cet inventaire a été validé.
                        </span>{" "}
                        La suppression annulera les corrections de stock
                        appliquées lors de sa validation. L&apos;inventaire
                        «&nbsp;{toDelete?.reference}&nbsp;» sera déplacé dans
                        la corbeille et pourra être restauré à tout moment.
                    </>
                ) : (
                    <>
                        «&nbsp;{toDelete?.reference}&nbsp;» sera déplacé dans
                        la corbeille. Vous pourrez le restaurer à tout moment.
                    </>
                )
            }
            pending={deleteInventory.isPending}
            onConfirm={handleConfirmDelete}
        />

        <ConfirmDeleteDialog
            open={bulkOpen}
            onOpenChange={setBulkOpen}
            title={`Supprimer ${selection.count} inventaire${selection.count > 1 ? "s" : ""} ?`}
            description={(() => {
                const completedCount = inventories.filter(
                    (inv) =>
                        selection.selected.has(inv.id) &&
                        inv.status === "completed"
                ).length;
                return completedCount > 0 ? (
                    <>
                        <span className="font-semibold text-amber-600">
                            {completedCount} inventaire
                            {completedCount > 1 ? "s validés" : " validé"} dans la sélection.
                        </span>{" "}
                        Les corrections de stock associées seront annulées.
                        Tous les inventaires sélectionnés seront déplacés dans
                        la corbeille et pourront être restaurés à tout moment.
                    </>
                ) : (
                    <>
                        Les inventaires sélectionnés seront déplacés dans la
                        corbeille. Vous pourrez les restaurer à tout moment.
                    </>
                );
            })()}
            pending={bulkDeleting}
            onConfirm={handleBulkDelete}
        />

        <ShortcutsHelpModal
            isOpen={showShortcuts}
            onClose={() => setShowShortcuts(false)}
            shortcuts={shortcuts}
            title="Raccourcis — Inventaires physiques"
        />
        </>
    );
}
