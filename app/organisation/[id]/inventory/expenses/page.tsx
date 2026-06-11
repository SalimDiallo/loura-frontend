"use client";

import {
    ListPageLayout,
    ListPagination,
    ListSearchFilters,
    ListStat,
    ListTable,
    ListTableColumn,
} from "@/components/layout/ListPageLayout";
import {
    Can,
    PermissionGuard,
    useOrgPermissions,
} from "@/components/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginatedExpenses, useWarehouses } from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import { formatCurrency } from "@/utils/formatters";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FaCalendarAlt,
    FaCoins,
    FaPlus,
    FaWarehouse,
} from "react-icons/fa";


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
  const [filterOpen, setFilterOpen] = useState(false);
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");

  const { data: warehouses = [] } = useWarehouses(orgId, {
    page_size: "all",
    is_active: true,
  });

  const stableFilters = useMemo(
    () => ({
      search: search || undefined,
      warehouse: warehouseFilter || undefined,
    }),
    [search, warehouseFilter]
  );

  const {
    data: expenses,
    meta,
    setPage,
    nextPage,
    prevPage,
    isLoading,
    error,
  } = usePaginatedExpenses(orgId, stableFilters, { pageSize: 10 });

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

  return (
    <ListPageLayout
      title="Dépenses"
      icon={FaCoins}
      description="Suivez les dépenses engagées par entrepôt"
      headerActions={
        canManage
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
          : []
      }
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
          ) : (
            <>
            <ListTable
              columns={[
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
              ]}
              data={expenses}
              onRowClick={(e) =>
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
  );
}
