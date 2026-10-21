"use client";

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
import {
    Can,
    PermissionGuard,
    useOrgPermissions,
} from "@/components/permissions";
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
    useDeleteExpense,
    usePaginatedExpenses,
    useRestoreExpense,
    useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { Expense } from "@/lib/types";
import { formatCurrency } from "@/utils/formatters";
import { Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    FaCalendarAlt,
    FaCoins,
    FaPlus,
    FaTrashRestore,
    FaUndo,
    FaWarehouse,
} from "react-icons/fa";
import { toast } from "sonner";


function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function ExpensesPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.EXPENSES.VIEW}>
      <ExpensesPage />
    </PermissionGuard>
  );
}

function ExpensesPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const { can } = useOrgPermissions();
  const canManage = can(PERMISSIONS.EXPENSES.MANAGE);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filterOpen, setFilterOpen] = useState(false);
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  const [showTrash, setShowTrash] = useState(false);
  const [toDelete, setToDelete] = useState<Expense | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: warehouses = [] } = useWarehouses(orgId, {
    page_size: "all",
    is_active: true,
  });

  const stableFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      warehouse: warehouseFilter || undefined,
      deleted: showTrash ? "true" : undefined,
    }),
    [debouncedSearch, warehouseFilter, showTrash]
  );

  const restoreExpense = useRestoreExpense();
  const deleteExpense = useDeleteExpense();

  const {
    data: expenses,
    meta,
    setPage,
    nextPage,
    prevPage,
    isLoading,
    error,
  } = usePaginatedExpenses(orgId, stableFilters, { pageSize: 10 });

  const selection = useBulkSelection(expenses.map((e) => e.id));
  useEffect(() => {
    selection.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, warehouseFilter, showTrash, meta.currentPage]);

  const handleRestore = (id: string) => {
    restoreExpense.mutate(
      { orgId, id },
      {
        onSuccess: () => toast.success("Dépense restaurée."),
        onError: (err) =>
          toast.error("Restauration impossible", {
            description: getApiErrorMessage(err),
          }),
      }
    );
  };

  const handleConfirmDelete = () => {
    if (!toDelete) return;
    deleteExpense.mutate(
      { orgId, id: toDelete.id },
      {
        onSuccess: () => {
          toast.success("Dépense déplacée dans la corbeille.");
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
            await deleteExpense.mutateAsync({ orgId, id });
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
        `${ok} dépense${ok > 1 ? "s" : ""} déplacée${ok > 1 ? "s" : ""} dans la corbeille.`
      );
    } else {
      toast.error(`${ok} supprimée${ok > 1 ? "s" : ""}, ${failed} en échec.`, {
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
        description: "Nouvelle dépense",
        handler: () =>
          router.push(`/organisation/${orgId}/inventory/expenses/create`),
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

  const totalPage = expenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );
  const showSelection = canManage && !showTrash;

  return (
    <>
    <ListPageLayout
      title={showTrash ? "Dépenses — Corbeille" : "Dépenses"}
      icon={showTrash ? FaTrashRestore : FaCoins}
      description={
        showTrash
          ? "Dépenses supprimées — restaurez-les si besoin"
          : "Suivez les dépenses engagées par entrepôt"
      }
      headerActions={[
        {
          label: showTrash ? "Voir les actives" : "Corbeille",
          icon: showTrash ? FaCoins : FaTrashRestore,
          variant: "outline" as const,
          onClick: () => setShowTrash((v) => !v),
        },
        ...(canManage && !showTrash
          ? [
              {
                label: "Nouvelle dépense",
                icon: FaPlus,
                onClick: () =>
                  router.push(
                    `/organisation/${orgId}/inventory/expenses/create`
                  ),
              },
            ]
          : []),
      ]}
      stats={[
        <ListStat
          key="total"
          label="Total dépenses"
          value={meta.totalItems}
          icon={<FaCoins className="h-4 w-4 text-muted-foreground" />}
        />,
        <ListStat
          key="amount"
          label="Montant (page)"
          value={formatCurrency(totalPage)}
          icon={<FaCoins className="h-4 w-4 text-amber-600" />}
        />,
      ]}
      searchFilters={
        <ListSearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchInputRef={searchInputRef}
          searchPlaceholder="Rechercher dans description, motif, notes..."
          filtersOpen={filterOpen}
          onFiltersOpenChange={setFilterOpen}
          filtersAreActive={!!warehouseFilter}
          filters={
            <div className="space-y-3 mt-4">
              <label className="block text-sm font-medium mb-1">
                Entrepôt
              </label>
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">Tous les entrepôts</option>
                {(warehouses as { id: string; name: string }[]).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
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
          ) : expenses.length === 0 ? (
            showTrash ? (
              <div className="text-center py-16 bg-muted/20 rounded-lg">
                <FaTrashRestore className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg font-medium">Corbeille vide</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Aucune dépense supprimée.
                </p>
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/20 rounded-lg">
                <FaCoins className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg font-medium">Aucune dépense</p>
                <p className="text-sm text-muted-foreground mt-1 mb-6">
                  Enregistrez vos premières dépenses pour suivre vos charges par
                  entrepôt.
                </p>
                <Can permission={PERMISSIONS.EXPENSES.MANAGE}>
                  <Button
                    onClick={() =>
                      router.push(
                        `/organisation/${orgId}/inventory/expenses/create`
                      )
                    }
                  >
                    <FaPlus className="mr-2" />
                    Ajouter une dépense
                  </Button>
                </Can>
              </div>
            )
          ) : (
            <>
            {showSelection && (
              <ListSelectionBar
                count={selection.count}
                label={`${selection.count} dépense${selection.count > 1 ? "s" : ""} sélectionnée${selection.count > 1 ? "s" : ""}`}
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
                        {({ value: e }) => (
                          <div onClick={(ev) => ev.stopPropagation()}>
                            <Checkbox
                              checked={selection.selected.has(e.id)}
                              onCheckedChange={() => selection.toggleOne(e.id)}
                              aria-label="Sélectionner la dépense"
                            />
                          </div>
                        )}
                      </ListTableColumn>,
                    ]
                  : []),
                <ListTableColumn key="desc" header="Description">
                  {({ value: e }) => (
                    <div>
                      <div className="font-medium text-sm">{e.description}</div>
                      {e.reason && (
                        <div className="text-xs text-muted-foreground">
                          {e.reason}
                        </div>
                      )}
                    </div>
                  )}
                </ListTableColumn>,
                <ListTableColumn key="amount" header="Montant" align="right">
                  {({ value: e }) => (
                    <span className="font-mono tabular-nums font-medium">
                      {formatCurrency(e.amount)}
                    </span>
                  )}
                </ListTableColumn>,
                <ListTableColumn key="warehouse" header="Entrepôt">
                  {({ value: e }) =>
                    e.warehouse ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <FaWarehouse className="h-3 w-3 text-muted-foreground" />
                        {e.warehouse.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )
                  }
                </ListTableColumn>,
                <ListTableColumn key="date" header="Date">
                  {({ value: e }) => (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <FaCalendarAlt className="h-3 w-3" />
                      {formatDate(e.expense_date)}
                    </span>
                  )}
                </ListTableColumn>,
                <ListTableColumn key="author" header="Créée par">
                  {({ value: e }) => (
                    <div className="flex flex-col text-xs">
                      <span
                        className="font-medium truncate"
                        title={e.created_by_info?.email ?? ""}
                      >
                        {e.created_by_info?.name ||
                          e.created_by_info?.email ||
                          "—"}
                      </span>
                      {e.updated_by_info &&
                      e.updated_by_info.id !==
                        e.created_by_info?.id ? (
                        <span
                          className="text-muted-foreground truncate"
                          title={e.updated_by_info.email ?? ""}
                        >
                          modif. par{" "}
                          {e.updated_by_info.name ||
                            e.updated_by_info.email}
                        </span>
                      ) : null}
                    </div>
                  )}
                </ListTableColumn>,
                ...(showTrash
                  ? [
                      <ListTableColumn
                        key="actions"
                        header="Actions"
                        align="right"
                      >
                        {({ value: e }) => (
                          <div className="flex items-center justify-end gap-3">
                            <div className="text-xs text-right">
                              <div className="font-medium">
                                {e.deleted_by_info?.name ||
                                  e.deleted_by_info?.email ||
                                  "—"}
                              </div>
                              {e.deleted_at && (
                                <div className="text-muted-foreground">
                                  {new Date(e.deleted_at).toLocaleDateString(
                                    "fr-FR"
                                  )}
                                </div>
                              )}
                            </div>
                            {canManage && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={restoreExpense.isPending}
                                onClick={() => handleRestore(e.id)}
                              >
                                <FaUndo className="h-3.5 w-3.5 mr-1.5" />
                                Restaurer
                              </Button>
                            )}
                          </div>
                        )
                        }
                      </ListTableColumn>,
                    ]
                  : canManage
                  ? [
                      <ListTableColumn key="actions" header="" align="right">
                        {({ value: e }) => (
                          <div
                            className="flex items-center justify-end"
                            onClick={(ev) => ev.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              title="Supprimer la dépense"
                              aria-label="Supprimer la dépense"
                              onClick={() => setToDelete(e)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </ListTableColumn>,
                    ]
                  : []),
              ]}
              data={expenses}
              onRowClick={
                showTrash
                  ? undefined
                  : (e) =>
                      router.push(
                        `/organisation/${orgId}/inventory/expenses/${e.id}`
                      )
              }
            />
            <ListPagination
              meta={meta}
              onPageChange={setPage}
              onNext={nextPage}
              onPrev={prevPage}
            />
            </>
          )}
        </>
      }
    />

      <ConfirmDeleteDialog
        open={!!toDelete}
        onOpenChange={() => setToDelete(null)}
        title="Supprimer la dépense ?"
        description={
          <>
            «&nbsp;{toDelete?.description}&nbsp;» sera déplacée dans la
            corbeille. Vous pourrez la restaurer à tout moment.
          </>
        }
        pending={deleteExpense.isPending}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDeleteDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title={`Supprimer ${selection.count} dépense${selection.count > 1 ? "s" : ""} ?`}
        description="Les dépenses sélectionnées seront déplacées dans la corbeille. Vous pourrez les restaurer à tout moment."
        pending={bulkDeleting}
        onConfirm={handleBulkDelete}
      />

      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
        title="Raccourcis — Dépenses"
      />
    </>
  );
}
