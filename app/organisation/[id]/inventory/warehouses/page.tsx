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
import { useBulkSelection } from "@/lib/hooks/use-bulk-selection";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
    type KeyboardShortcut,
    useKeyboardShortcuts,
} from "@/lib/hooks/use-keyboard-shortcuts";
import {
    useDeleteWarehouse,
    usePaginatedWarehouses,
    useRestoreWarehouse,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { Warehouse } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaCheckCircle, FaMapMarkerAlt, FaPlus, FaTrashRestore, FaUndo, FaWarehouse } from "react-icons/fa";
import { toast } from "sonner";

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
    const debouncedSearch = useDebouncedValue(search, 300);
    const [filterOpen, setFilterOpen] = useState(false);
    const [showTrash, setShowTrash] = useState(false);
    const [toDelete, setToDelete] = useState<Warehouse | null>(null);
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

    const restoreWarehouse = useRestoreWarehouse();
    const deleteWarehouse = useDeleteWarehouse();

    const {
        data: warehouses,
        meta,
        setPage,
        nextPage,
        prevPage,
        isLoading,
        error,
    } = usePaginatedWarehouses(orgId, stableFilters, { pageSize: 10 });

    // Sélection multiple — l'entrepôt par défaut n'est jamais sélectionnable.
    const selectableIds = warehouses.filter((w) => !w.is_default).map((w) => w.id);
    const selection = useBulkSelection(selectableIds);
    useEffect(() => {
        selection.clear();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, showTrash, meta.currentPage]);

    const handleRestore = (warehouseId: string) => {
        restoreWarehouse.mutate(
            { orgId, warehouseId },
            {
                onSuccess: () => toast.success("Entrepôt restauré."),
                onError: (err) =>
                    toast.error("Restauration impossible", {
                        description: getApiErrorMessage(err),
                    }),
            }
        );
    };

    const handleConfirmDelete = () => {
        if (!toDelete) return;
        deleteWarehouse.mutate(
            { orgId, warehouseId: toDelete.id },
            {
                onSuccess: () => {
                    toast.success("Entrepôt déplacé dans la corbeille.");
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
        for (const warehouseId of ids) {
            try {
                await deleteWarehouse.mutateAsync({ orgId, warehouseId });
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
                `${ok} entrepôt${ok > 1 ? "s" : ""} déplacé${ok > 1 ? "s" : ""} dans la corbeille.`
            );
        } else {
            toast.error(`${ok} supprimé${ok > 1 ? "s" : ""}, ${failed} en échec.`, {
                description:
                    "Un entrepôt contenant du stock ne peut pas être supprimé.",
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
                description: "Nouvel entrepôt",
                handler: () =>
                    router.push(`/organisation/${orgId}/inventory/warehouses/create`),
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
                title={showTrash ? "Entrepôts — Corbeille" : "Entrepôts"}
                icon={showTrash ? FaTrashRestore : FaWarehouse}
                description={
                    showTrash
                        ? "Entrepôts supprimés — restaurez-les si besoin"
                        : "Gérez les emplacements physiques de votre stock"
                }
                headerActions={[
                    {
                        label: showTrash ? "Voir les actifs" : "Corbeille",
                        icon: showTrash ? FaWarehouse : FaTrashRestore,
                        variant: "outline" as const,
                        onClick: () => setShowTrash((v) => !v),
                    },
                    ...(canManage && !showTrash
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
                        : []),
                ]}
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
                        searchInputRef={searchInputRef}
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
                            showTrash ? (
                                <div className="text-center py-16 bg-muted/20 rounded-lg">
                                    <FaTrashRestore className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                    <p className="text-lg font-medium">Corbeille vide</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Aucun entrepôt supprimé.
                                    </p>
                                </div>
                            ) : (
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
                            )
                        ) : (
                            <>
                                {showSelection && (
                                    <ListSelectionBar
                                        count={selection.count}
                                        label={`${selection.count} entrepôt${selection.count > 1 ? "s" : ""} sélectionné${selection.count > 1 ? "s" : ""}`}
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
                                                    {({ value: w }) =>
                                                        w.is_default ? (
                                                            <span className="inline-block w-4.5" />
                                                        ) : (
                                                            <Checkbox
                                                                checked={selection.selected.has(
                                                                    w.id
                                                                )}
                                                                onCheckedChange={() =>
                                                                    selection.toggleOne(w.id)
                                                                }
                                                                aria-label={`Sélectionner ${w.name}`}
                                                            />
                                                        )
                                                    }
                                                </ListTableColumn>,
                                              ]
                                            : []),
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
                                        ...(showTrash
                                            ? [
                                                <ListTableColumn
                                                    key="deleted_by"
                                                    header="Supprimé par"
                                                >
                                                    {({ value: w }) => (
                                                        <div className="text-xs">
                                                            <div className="font-medium">
                                                                {w.deleted_by_info?.name ||
                                                                    w.deleted_by_info?.email ||
                                                                    "—"}
                                                            </div>
                                                            {w.deleted_at && (
                                                                <div className="text-muted-foreground">
                                                                    {new Date(
                                                                        w.deleted_at
                                                                    ).toLocaleDateString("fr-FR")}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </ListTableColumn>,
                                              ]
                                            : [
                                                <ListTableColumn key="status" header="Statut">
                                                    {({ value: w }) => (
                                                        <BadgeStatus status={w.is_active} />
                                                    )}
                                                </ListTableColumn>,
                                              ]),
                                        <ListTableColumn
                                            key="actions"
                                            header=""
                                            align="right"
                                        >
                                            {({ value: w }) => (
                                                <div className="flex items-center justify-end">
                                                    {canManage && showTrash && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={restoreWarehouse.isPending}
                                                            onClick={() => handleRestore(w.id)}
                                                        >
                                                            <FaUndo className="h-4 w-4 mr-1.5" />
                                                            Restaurer
                                                        </Button>
                                                    )}
                                                    {canManage && !showTrash && (
                                                        <RowActionsMenu
                                                            onEdit={() =>
                                                                router.push(
                                                                    `/organisation/${orgId}/inventory/warehouses/${w.id}`
                                                                )
                                                            }
                                                            onDelete={
                                                                w.is_default
                                                                    ? undefined
                                                                    : () => setToDelete(w)
                                                            }
                                                        />
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

            <ConfirmDeleteDialog
                open={!!toDelete}
                onOpenChange={() => setToDelete(null)}
                title="Supprimer l'entrepôt ?"
                description={
                    <>
                        «&nbsp;{toDelete?.name}&nbsp;» sera déplacé dans la corbeille. Le
                        stock et l&apos;historique de mouvements rattachés à cet entrepôt
                        resteront en base mais ne seront plus accessibles depuis la liste.
                        Vous pourrez le restaurer à tout moment.
                    </>
                }
                pending={deleteWarehouse.isPending}
                onConfirm={handleConfirmDelete}
            />

            <ConfirmDeleteDialog
                open={bulkOpen}
                onOpenChange={setBulkOpen}
                title={`Supprimer ${selection.count} entrepôt${selection.count > 1 ? "s" : ""} ?`}
                description="Les entrepôts sélectionnés seront déplacés dans la corbeille. Un entrepôt contenant du stock ne pourra pas être supprimé. Vous pourrez restaurer les autres à tout moment."
                pending={bulkDeleting}
                onConfirm={handleBulkDelete}
            />

            <ShortcutsHelpModal
                isOpen={showShortcuts}
                onClose={() => setShowShortcuts(false)}
                shortcuts={shortcuts}
                title="Raccourcis — Entrepôts"
            />
        </>
    );
}
