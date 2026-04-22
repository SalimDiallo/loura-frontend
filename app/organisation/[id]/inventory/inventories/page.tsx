"use client";

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
import {
    usePaginatedStocks,
    useStockAlerts,
    useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { Warehouse } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FaArrowDown,
    FaArrowUp,
    FaBox,
    FaBoxes,
    FaExchangeAlt,
    FaExclamationTriangle,
    FaPlus,
    FaWarehouse,
} from "react-icons/fa";

export default function InventoriesPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.STOCK.VIEW}>
      <InventoriesPage />
    </PermissionGuard>
  );
}

function InventoriesPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const { can } = useOrgPermissions();
  const canManage = can(PERMISSIONS.STOCK.MANAGE);
  const { formatCurrency } = useCurrencyFormatter();

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  const [lowOnly, setLowOnly] = useState(false);

  const { data: warehousesList = [] } = useWarehouses(orgId, {
    page_size: "all",
  });
  const warehouses = (warehousesList as unknown as Warehouse[]) ?? [];

  const stableFilters = useMemo(
    () => ({
      search: search || undefined,
      warehouse: warehouseFilter || undefined,
      low: lowOnly ? "1" : undefined,
    }),
    [search, warehouseFilter, lowOnly]
  );

  const {
    data: stocks,
    meta,
    setPage,
    nextPage,
    prevPage,
    isLoading,
    error,
  } = usePaginatedStocks(orgId, stableFilters, { pageSize: 15 });

  const { data: alertsData } = useStockAlerts(orgId);

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

  const filtersActive = !!search || !!warehouseFilter || lowOnly;

  return (
    <ListPageLayout
      title="Inventaires"
      icon={FaBoxes}
      description="État actuel du stock par produit et entrepôt"
      headerActions={
        canManage
          ? [
              {
                label: "Mouvement",
                icon: FaPlus,
                onClick: () =>
                  router.push(
                    `/organisation/${orgId}/inventory/movements/create`
                  ),
              },
              {
                label: "Transfert",
                icon: FaExchangeAlt,
                onClick: () =>
                  router.push(
                    `/organisation/${orgId}/inventory/movements/transfer`
                  ),
                variant: "outline",
              },
            ]
          : []
      }
      stats={[
        <ListStat
          key="total"
          label="Lignes de stock"
          value={meta.totalItems}
          icon={<FaBox className="h-4 w-4 text-muted-foreground" />}
        />,
        <ListStat
          key="warehouses"
          label="Entrepôts"
          value={warehouses.length}
          icon={<FaWarehouse className="h-4 w-4 text-blue-600" />}
        />,
        <ListStat
          key="alerts"
          label="Alertes stock bas"
          value={alertsData?.count ?? 0}
          icon={
            <FaExclamationTriangle
              className={`h-4 w-4 ${(alertsData?.count ?? 0) > 0 ? "text-amber-600" : "text-muted-foreground"}`}
            />
          }
        />,
      ]}
      searchFilters={
        <ListSearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Rechercher par nom, SKU ou code-barres..."
          filtersOpen={filterOpen}
          onFiltersOpenChange={setFilterOpen}
          filtersAreActive={filtersActive}
          filters={
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Entrepôt
                </label>
                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Tous les entrepôts</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowOnly}
                  onChange={(e) => setLowOnly(e.target.checked)}
                  className="h-4 w-4"
                />
                Uniquement stock sous le seuil d'alerte
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
          ) : stocks.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-lg">
              <FaBoxes className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun stock</p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                Enregistrez une entrée de stock pour démarrer.
              </p>
              <Can permission={PERMISSIONS.STOCK.MANAGE}>
                <Button
                  onClick={() =>
                    router.push(
                      `/organisation/${orgId}/inventory/movements/create`
                    )
                  }
                >
                  <FaPlus className="mr-2" />
                  Entrée de stock
                </Button>
              </Can>
            </div>
          ) : (
            <>
              <ListTable
                columns={[
                  <ListTableColumn key="product" header="Produit">
                    {({ value: s }) => (
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary/10 flex items-center justify-center text-primary rounded">
                          <FaBox className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {s.product.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            SKU: {s.product.sku}
                          </div>
                        </div>
                      </div>
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="warehouse" header="Entrepôt">
                    {({ value: s }) => (
                      <div className="text-sm">
                        <div>{s.warehouse.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.warehouse.code}
                        </div>
                      </div>
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="qty" header="Quantité">
                    {({ value: s }) => (
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-base font-semibold ${s.is_low ? "text-amber-600" : ""}`}
                        >
                          {Number(s.quantity).toLocaleString("fr-FR")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {s.product.unit_display.toLowerCase()}
                        </span>
                        {s.is_low && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-amber-500 text-amber-700 gap-1"
                          >
                            <FaExclamationTriangle className="h-3 w-3" />
                            Bas
                          </Badge>
                        )}
                      </div>
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="threshold" header="Seuil">
                    {({ value: s }) => (
                      <span className="text-sm text-muted-foreground">
                        {Number(s.product.min_stock_level).toLocaleString(
                          "fr-FR"
                        )}
                      </span>
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="value" header="Valeur">
                    {({ value: s }) => (
                      <span className="text-sm">
                        {formatCurrency(Number(s.stock_value))}
                      </span>
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="actions" header="Actions" align="right">
                    {({ value: s }) => (
                      <div className="flex items-center gap-1.5 justify-end">
                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/organisation/${orgId}/inventory/movements/create?product=${s.product.id}&warehouse=${s.warehouse.id}&type=in`
                                )
                              }
                            >
                              <FaArrowUp className="h-3.5 w-3.5 mr-1 text-green-600" />
                              Entrée
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/organisation/${orgId}/inventory/movements/create?product=${s.product.id}&warehouse=${s.warehouse.id}&type=out`
                                )
                              }
                            >
                              <FaArrowDown className="h-3.5 w-3.5 mr-1 text-red-600" />
                              Sortie
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </ListTableColumn>,
                ]}
                data={stocks}
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
