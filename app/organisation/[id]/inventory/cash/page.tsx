"use client";

import {
    ListPageLayout,
    ListPagination,
    ListStat,
    ListTable,
    ListTableColumn,
} from "@/components/layout/ListPageLayout";
import { PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { CashAdjustmentDialog } from "@/components/services/inventory/cash/CashAdjustmentDialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  QuickSelect,
  type QuickSelectItem,
} from "@/components/ui/quick-select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    useCashSummary,
    usePaginatedCashTransactions,
    useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    CashDirection,
    CashPaymentMethod,
    CashSummary,
    CashTransaction,
} from "@/lib/types/inventory";
import { formatCurrency } from "@/utils/formatters";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FaArrowDown,
    FaArrowUp,
    FaCalendarDays,
    FaFilter,
    FaPlus,
    FaScaleBalanced,
    FaUser,
    FaWallet,
    FaWarehouse,
} from "react-icons/fa6";


/** Formate un montant venant de l'API (string décimale ou number) en devise. */
function money(value: string | number): string {
  return formatCurrency(Number(value) || 0);
}

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

const METHOD_LABELS: Record<string, string> = {
  cash: "Espèces",
  bank_transfer: "Virement",
  mobile_money: "Mobile Money",
  check: "Chèque",
  card: "Carte",
  other: "Autre",
};

const SOURCE_LABELS: Record<string, string> = {
  sale_payment: "Vente",
  po_payment: "Achat",
  expense: "Dépense",
  adjustment: "Caisse",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDay(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function startOfMonthISO(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

interface PeriodState {
  mode: "single" | "range";
  date: string; // mode single
  from: string; // mode range
  to: string; // mode range
}

function periodDescription(p: PeriodState): string {
  if (p.mode === "single") {
    return p.date === todayISO()
      ? "Entrées et sorties de fonds du jour"
      : `Mouvements du ${formatDate(p.date)}`;
  }
  return `Mouvements du ${formatDate(p.from)} au ${formatDate(p.to)}`;
}

export default function CashPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.CASH.VIEW}>
      <CashPage />
    </PermissionGuard>
  );
}

function CashPage() {
  const params = useParams();
  const orgId = params.id as string;
  const { can } = useOrgPermissions();
  const canManage = can(PERMISSIONS.CASH.MANAGE);
  // Caissier : ne voit que ses propres transactions (forcé côté backend). Le
  // filtre "par utilisateur" et le panneau de ventilation par auteur n'ont
  // alors aucun intérêt (il n'y a que lui) → on les masque.
  const isCashier = can(PERMISSIONS.CASH.CASHIER);

  // Période : mode "jour unique" (par défaut) ou "intervalle" (from → to).
  const [period, setPeriod] = useState<PeriodState>({
    mode: "single",
    date: todayISO(),
    from: todayISO(),
    to: todayISO(),
  });
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  const [directionFilter, setDirectionFilter] = useState<CashDirection | "">("");
  const [methodFilter, setMethodFilter] = useState<CashPaymentMethod | "">("");
  const [userFilter, setUserFilter] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: warehouses = [] } = useWarehouses(orgId, {
    page_size: "all",
    is_active: true,
  });

  // Bornes de date envoyées au backend selon le mode.
  const dateParams = useMemo(() => {
    if (period.mode === "single") return { date: period.date || undefined };
    return { from: period.from || undefined, to: period.to || undefined };
  }, [period]);

  const filters = useMemo(
    () => ({
      ...dateParams,
      warehouse: warehouseFilter || undefined,
      direction: directionFilter || undefined,
      method: methodFilter || undefined,
      user: userFilter || undefined,
    }),
    [dateParams, warehouseFilter, directionFilter, methodFilter, userFilter]
  );

  const {
    data: transactions,
    meta,
    setPage,
    nextPage,
    prevPage,
    isLoading,
    error,
  } = usePaginatedCashTransactions(orgId, filters, { pageSize: 15 });

  const { data: summary } = useCashSummary(orgId, filters);

  // Acteurs de la période (pour le filtre "par utilisateur"), dérivés du
  // résumé : pas de requête supplémentaire, et limité aux personnes ayant
  // réellement une activité de caisse sur la période.
  const userOptions = useMemo<QuickSelectItem[]>(() => {
    const byUser = summary?.by_user ?? {};
    return Object.entries(byUser)
      .filter(([id]) => id !== "unknown")
      .map(([id, row]) => ({
        id,
        name: row.name || row.email || "—",
        subtitle: `${row.count} mouvement(s) · ${money(row.in)} in / ${money(row.out)} out`,
      }));
  }, [summary]);

  const filtersAreActive =
    !!warehouseFilter || !!directionFilter || !!methodFilter || !!userFilter;

  const isToday = period.mode === "single" && period.date === todayISO();

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

  const balance = Number(summary?.balance ?? 0);

  return (
    <>
      <ListPageLayout
        title={isCashier ? "Ma caisse" : "Caisse"}
        icon={FaWallet}
        description={`${isCashier ? "Mes mouvements · " : ""}${periodDescription(
          period
        )}`}
        headerActions={
          canManage
            ? [
                {
                  label: "Nouveau mouvement",
                  icon: FaPlus,
                  onClick: () => setDialogOpen(true),
                },
              ]
            : []
        }
        stats={[
          <ListStat
            key="in"
            label="Entrées"
            value={money(summary?.total_in ?? 0)}
            icon={<FaArrowDown className="h-4 w-4 text-emerald-600" />}
          />,
          <ListStat
            key="out"
            label="Sorties"
            value={money(summary?.total_out ?? 0)}
            icon={<FaArrowUp className="h-4 w-4 text-red-600" />}
          />,
          <ListStat
            key="balance"
            label="Solde"
            value={
              <span
                className={
                  balance >= 0 ? "text-emerald-600" : "text-red-600"
                }
              >
                {money(summary?.balance ?? 0)}
              </span>
            }
            icon={
              <FaScaleBalanced className="h-4 w-4 text-muted-foreground" />
            }
          />,
          <ListStat
            key="count"
            label="Transactions"
            value={summary?.count ?? meta.totalItems}
            icon={<FaWallet className="h-4 w-4 text-muted-foreground" />}
          />,
        ]}
        searchFilters={
          <div className="w-full space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <PeriodBar period={period} onChange={setPeriod} />
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                className={`inline-flex items-center gap-2 self-start rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  filtersAreActive
                    ? "border-primary/40 text-primary bg-primary/10"
                    : "border-border text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <FaFilter className="h-3.5 w-3.5" />
                Filtres
                {filtersAreActive && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            </div>
            {filterOpen && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 bg-popover border rounded-md p-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Caisse
                  </label>
                  <select
                    value={warehouseFilter}
                    onChange={(e) => setWarehouseFilter(e.target.value)}
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="">Toutes les caisses</option>
                    {(warehouses as { id: string; name: string }[]).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sens</label>
                  <select
                    value={directionFilter}
                    onChange={(e) =>
                      setDirectionFilter(e.target.value as CashDirection | "")
                    }
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="">Tous</option>
                    <option value="in">Entrées</option>
                    <option value="out">Sorties</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Méthode
                  </label>
                  <select
                    value={methodFilter}
                    onChange={(e) =>
                      setMethodFilter(e.target.value as CashPaymentMethod | "")
                    }
                    className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="">Toutes</option>
                    {Object.entries(METHOD_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                {!isCashier && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Utilisateur
                    </label>
                    <QuickSelect
                      label="Utilisateur"
                      items={userOptions}
                      selectedId={userFilter}
                      onSelect={setUserFilter}
                      placeholder="Filtrer par auteur..."
                      icon={FaUser}
                      accentColor="primary"
                      canCreate={false}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        }
        content={
          <>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16 bg-muted/20 rounded-lg">
                <FaWallet className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  Aucun mouvement {isToday ? "aujourd'hui" : "ce jour-là"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Les ventes, achats, dépenses et apports/retraits du jour
                  apparaîtront ici.
                </p>
              </div>
            ) : (
              <>
                <ListTable
                  columns={[
                    <ListTableColumn key="dir" header="">
                      {({ value: t }: { value: CashTransaction }) => (
                        <DirectionBadge direction={t.direction} />
                      )}
                    </ListTableColumn>,
                    <ListTableColumn key="label" header="Libellé">
                      {({ value: t }: { value: CashTransaction }) => (
                        <div>
                          <div className="font-medium text-sm">
                            {t.label || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {SOURCE_LABELS[t.source_type] ?? t.source_type}
                            {t.reference ? ` · ${t.reference}` : ""}
                          </div>
                        </div>
                      )}
                    </ListTableColumn>,
                    <ListTableColumn key="amount" header="Montant" align="right">
                      {({ value: t }: { value: CashTransaction }) => (
                        <span
                          className={`font-mono tabular-nums font-semibold ${
                            t.direction === "in"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {t.direction === "in" ? "+" : "−"}
                          {money(t.amount)}
                        </span>
                      )}
                    </ListTableColumn>,
                    <ListTableColumn key="method" header="Méthode">
                      {({ value: t }: { value: CashTransaction }) =>
                        t.method ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            {METHOD_LABELS[t.method] ?? t.method}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )
                      }
                    </ListTableColumn>,
                    <ListTableColumn key="warehouse" header="Caisse">
                      {({ value: t }: { value: CashTransaction }) =>
                        t.warehouse_name ? (
                          <span className="inline-flex items-center gap-1 text-xs">
                            <FaWarehouse className="h-3 w-3 text-muted-foreground" />
                            {t.warehouse_name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )
                      }
                    </ListTableColumn>,
                    <ListTableColumn key="date" header="Date">
                      {({ value: t }: { value: CashTransaction }) => (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <FaCalendarDays className="h-3 w-3" />
                          {formatDate(t.date)}
                        </span>
                      )}
                    </ListTableColumn>,
                    <ListTableColumn key="author" header="Par">
                      {({ value: t }: { value: CashTransaction }) => (
                        <span
                          className="text-xs font-medium truncate"
                          title={t.created_by_info?.email ?? ""}
                        >
                          {t.created_by_info?.name ||
                            t.created_by_info?.email ||
                            "—"}
                        </span>
                      )}
                    </ListTableColumn>,
                  ]}
                  data={transactions}
                />
                <ListPagination
                  meta={meta}
                  onPageChange={setPage}
                  onNext={nextPage}
                  onPrev={prevPage}
                />

                {!isCashier && (
                  <ByUserPanel
                    summary={summary}
                    activeUserId={userFilter}
                    onSelectUser={setUserFilter}
                  />
                )}
              </>
            )}
          </>
        }
      />

      <CashAdjustmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        orgId={orgId}
        warehouses={warehouses as { id: string; name: string }[]}
        defaultWarehouseId={warehouseFilter || undefined}
      />
    </>
  );
}

function DirectionBadge({ direction }: { direction: CashDirection }) {
  if (direction === "in") {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50"
        title="Entrée"
      >
        <FaArrowDown className="h-3 w-3" />
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/50"
      title="Sortie"
    >
      <FaArrowUp className="h-3 w-3" />
    </span>
  );
}

/**
 * Sélecteur de période : presets rapides (Aujourd'hui / 7 jours / Ce mois) +
 * mode jour unique (navigation ‹ ›) ou intervalle (deux champs date).
 */
function PeriodBar({
  period,
  onChange,
}: {
  period: PeriodState;
  onChange: (p: PeriodState) => void;
}) {
  const today = todayISO();

  const setSingle = (date: string) =>
    onChange({ ...period, mode: "single", date });
  const setRange = (from: string, to: string) =>
    onChange({ ...period, mode: "range", from, to });

  const presets: { label: string; active: boolean; apply: () => void }[] = [
    {
      label: "Aujourd'hui",
      active: period.mode === "single" && period.date === today,
      apply: () => setSingle(today),
    },
    {
      label: "7 jours",
      active:
        period.mode === "range" &&
        period.from === shiftDay(today, -6) &&
        period.to === today,
      apply: () => setRange(shiftDay(today, -6), today),
    },
    {
      label: "Ce mois",
      active:
        period.mode === "range" &&
        period.from === startOfMonthISO() &&
        period.to === today,
      apply: () => setRange(startOfMonthISO(), today),
    },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Presets */}
      <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={p.apply}
            className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${
              p.active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period.mode === "single" ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSingle(shiftDay(period.date, -1))}
            className="px-2 py-1.5 rounded-md border border-border text-sm hover:bg-muted/50"
            title="Jour précédent"
          >
            ‹
          </button>
          <input
            type="date"
            value={period.date}
            max={today}
            onChange={(e) => setSingle(e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm bg-background"
          />
          <button
            type="button"
            onClick={() => setSingle(shiftDay(period.date, 1))}
            disabled={period.date >= today}
            className="px-2 py-1.5 rounded-md border border-border text-sm hover:bg-muted/50 disabled:opacity-40"
            title="Jour suivant"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => setRange(period.date, period.date)}
            className="px-2.5 py-1.5 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted/50"
            title="Passer en intervalle"
          >
            Intervalle…
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 flex-wrap">
          <input
            type="date"
            value={period.from}
            max={period.to || today}
            onChange={(e) => setRange(e.target.value, period.to)}
            className="border border-border rounded-md px-3 py-1.5 text-sm bg-background"
          />
          <span className="text-muted-foreground text-sm">→</span>
          <input
            type="date"
            value={period.to}
            min={period.from}
            max={today}
            onChange={(e) => setRange(period.from, e.target.value)}
            className="border border-border rounded-md px-3 py-1.5 text-sm bg-background"
          />
          <button
            type="button"
            onClick={() => setSingle(today)}
            className="px-2.5 py-1.5 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted/50"
            title="Revenir à un jour unique"
          >
            Jour unique
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Panneau « performance par utilisateur » : qui a fait combien d'entrées /
 * sorties sur la période. Cliquable pour filtrer la liste sur un auteur.
 */
function ByUserPanel({
  summary,
  activeUserId,
  onSelectUser,
}: {
  summary?: CashSummary;
  activeUserId: string;
  onSelectUser: (id: string) => void;
}) {
  const rows = useMemo(() => {
    const byUser = summary?.by_user ?? {};
    return Object.entries(byUser)
      .map(([id, row]) => ({ id, ...row }))
      .sort(
        (a, b) =>
          Number(b.in) + Number(b.out) - (Number(a.in) + Number(a.out))
      );
  }, [summary]);

  if (rows.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <FaUser className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Activité par utilisateur</h3>
        <span className="text-xs text-muted-foreground">
          sur la période sélectionnée
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((r) => {
          const isActive = activeUserId === r.id;
          const isUnknown = r.id === "unknown";
          return (
            <button
              key={r.id}
              type="button"
              disabled={isUnknown}
              onClick={() => onSelectUser(isActive ? "" : r.id)}
              className={`text-left rounded-lg border p-3 transition-colors ${
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/40"
              } ${isUnknown ? "opacity-70 cursor-default" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate" title={r.email}>
                  {r.name || r.email || "—"}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {r.count} mvt
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <FaArrowDown className="h-3 w-3" />
                  {money(r.in)}
                  <span className="text-muted-foreground">({r.count_in})</span>
                </span>
                <span className="inline-flex items-center gap-1 text-red-600">
                  <FaArrowUp className="h-3 w-3" />
                  {money(r.out)}
                  <span className="text-muted-foreground">({r.count_out})</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
