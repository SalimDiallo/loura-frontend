"use client";

import {
    ListPageLayout,
    ListPagination,
    ListSearchFilters,
    ListStat,
    ListTable,
    ListTableColumn,
} from "@/components/layout/ListPageLayout";
import { PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    usePaginatedStockMovements,
    useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    StockMovementStatus,
    StockMovementType,
    Warehouse,
} from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FaArrowDown,
    FaArrowUp,
    FaBalanceScale,
    FaCheckCircle,
    FaEdit,
    FaExchangeAlt,
    FaHistory,
    FaPlus,
    FaTimes,
} from "react-icons/fa";

export default function MovementsPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.STOCK.VIEW}>
      <MovementsPage />
    </PermissionGuard>
  );
}

const MOVEMENT_TYPE_COLORS: Record<StockMovementType, string> = {
  in: "bg-green-100 text-green-700 border-green-200",
  out: "bg-red-100 text-red-700 border-red-200",
  adjust: "bg-blue-100 text-blue-700 border-blue-200",
  transfer: "bg-purple-100 text-purple-700 border-purple-200",
};

const MOVEMENT_TYPE_ICONS: Record<
  StockMovementType,
  React.ComponentType<{ className?: string }>
> = {
  in: FaArrowUp,
  out: FaArrowDown,
  adjust: FaBalanceScale,
  transfer: FaExchangeAlt,
};

const STATUS_STYLES: Record<
  StockMovementStatus,
  { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  draft: {
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: FaEdit,
  },
  validated: {
    color: "bg-green-100 text-green-700 border-green-200",
    icon: FaCheckCircle,
  },
  cancelled: {
    color: "bg-red-100 text-red-700 border-red-200",
    icon: FaTimes,
  },
};

function MovementsPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const { can } = useOrgPermissions();
  const canManage = can(PERMISSIONS.STOCK.MANAGE);

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: warehousesList = [] } = useWarehouses(orgId, {
    page_size: "all",
  });
  const warehouses = (warehousesList as unknown as Warehouse[]) ?? [];

  const stableFilters = useMemo(
    () => ({
      search: search || undefined,
      warehouse: warehouseFilter || undefined,
      movement_type: (typeFilter as StockMovementType) || undefined,
      status: (statusFilter as StockMovementStatus) || undefined,
    }),
    [search, warehouseFilter, typeFilter, statusFilter]
  );

  const {
    data: movements,
    meta,
    setPage,
    nextPage,
    prevPage,
    isLoading,
    error,
  } = usePaginatedStockMovements(orgId, stableFilters, { pageSize: 15 });

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

  const filtersActive =
    !!search || !!warehouseFilter || !!typeFilter || !!statusFilter;

  return (
    <ListPageLayout
      title="Mouvements de stock"
      icon={FaHistory}
      description="Historique complet des entrées, sorties et ajustements"
      headerActions={
        canManage
          ? [
              {
                label: "Nouveau mouvement",
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
          label="Total mouvements"
          value={meta.totalItems}
          icon={<FaHistory className="h-4 w-4 text-muted-foreground" />}
        />,
      ]}
      searchFilters={
        <ListSearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Rechercher par produit, SKU, référence..."
          filtersOpen={filterOpen}
          onFiltersOpenChange={setFilterOpen}
          filtersAreActive={filtersActive}
          filters={
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium block mb-2">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Tous</option>
                  <option value="in">Entrée</option>
                  <option value="out">Sortie</option>
                  <option value="adjust">Ajustement</option>
                  <option value="transfer">Transfert</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">
                  Statut
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Tous</option>
                  <option value="draft">Brouillon</option>
                  <option value="validated">Validé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">
                  Entrepôt
                </label>
                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Tous</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
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
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-lg">
              <FaHistory className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun mouvement</p>
              <p className="text-sm text-muted-foreground mt-1">
                L'historique s'affichera ici dès le premier enregistrement.
              </p>
            </div>
          ) : (
            <>
              <ListTable
                onRowClick={(m) =>
                  router.push(
                    `/organisation/${orgId}/inventory/movements/${m.id}`
                  )
                }
                columns={[
                  <ListTableColumn key="type" header="Type">
                    {({ value: m }) => {
                      const mvtType = m.movement_type as StockMovementType;
                      const Icon = MOVEMENT_TYPE_ICONS[mvtType];
                      return (
                        <Badge
                          variant="outline"
                          className={`gap-1.5 ${MOVEMENT_TYPE_COLORS[mvtType]}`}
                        >
                          <Icon className="h-3 w-3" />
                          {m.movement_type_display}
                        </Badge>
                      );
                    }}
                  </ListTableColumn>,
                  <ListTableColumn key="status" header="Statut">
                    {({ value: m }) => {
                      const st = m.status as StockMovementStatus;
                      const style = STATUS_STYLES[st];
                      const Icon = style.icon;
                      return (
                        <Badge
                          variant="outline"
                          className={`gap-1.5 ${style.color}`}
                        >
                          <Icon className="h-3 w-3" />
                          {m.status_display}
                        </Badge>
                      );
                    }}
                  </ListTableColumn>,
                  <ListTableColumn key="product" header="Produit">
                    {({ value: m }) => (
                      <div>
                        <div className="font-medium text-sm">
                          {m.product.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {m.product.sku}
                        </div>
                      </div>
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="warehouse" header="Entrepôt">
                    {({ value: m }) => (
                      <span className="text-sm">{m.warehouse.name}</span>
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="qty" header="Quantité">
                    {({ value: m }) => {
                      const qty = Number(m.quantity);
                      const isNegative = qty < 0;
                      return (
                        <span
                          className={`font-semibold ${isNegative ? "text-red-600" : "text-green-600"}`}
                        >
                          {isNegative ? "" : "+"}
                          {qty.toLocaleString("fr-FR")}
                        </span>
                      );
                    }}
                  </ListTableColumn>,
                  <ListTableColumn key="reason" header="Motif">
                    {({ value: m }) => (
                      <span className="text-xs text-muted-foreground">
                        {m.reason_display}
                      </span>
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="reference" header="Réf.">
                    {({ value: m }) =>
                      m.reference ? (
                        <span className="text-xs font-mono">{m.reference}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">
                          —
                        </span>
                      )
                    }
                  </ListTableColumn>,
                  <ListTableColumn key="date" header="Date">
                    {({ value: m }) => (
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </ListTableColumn>,
                ]}
                data={movements}
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
