"use client";

import {
  ListPageLayout,
  ListPagination,
  ListSearchFilters,
  ListTable,
  ListTableColumn,
} from "@/components/layout/ListPageLayout";
import { Can, PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { AddTransactionDialog } from "@/components/services/services/AddTransactionDialog";
import { AuditLine } from "@/components/services/services/AuditLine";
import { ConfirmActionDialog } from "@/components/services/services/ConfirmActionDialog";
import {
  TransactionStatusBadge,
  TransactionTypeBadge,
} from "@/components/services/services/ServiceStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  QuickSelect,
  type QuickSelectItem,
} from "@/components/ui/quick-select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
  useCancelServiceTransaction,
  useConfirmServiceTransaction,
  usePaginatedServiceTransactions,
  useServicesAnalyticsSummary,
} from "@/lib/hooks/services";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  ServiceTransaction,
  ServiceTransactionDirection,
  ServiceTransactionStatus,
  ServiceTransactionType,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { X as XIcon } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  FaBan,
  FaCheckCircle,
  FaHandHoldingUsd,
  FaMoneyBillWave,
  FaPlus,
  FaTimesCircle,
} from "react-icons/fa";
import { toast } from "sonner";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ServiceTransactionStatus | ""; label: string }[] =
  [
    { value: "", label: "Tous" },
    { value: "pending", label: "En attente" },
    { value: "confirmed", label: "Validée" },
    { value: "cancelled", label: "Annulée" },
  ];

const TYPE_OPTIONS: { value: ServiceTransactionType | ""; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "client_payment", label: "Paiement client" },
  { value: "internal_expense", label: "Dépense interne" },
  { value: "revenue", label: "Revenu" },
  { value: "refund", label: "Remboursement" },
];

const DIRECTION_OPTIONS: {
  value: ServiceTransactionDirection | "";
  label: string;
}[] = [
  { value: "", label: "Tous" },
  { value: "in", label: "Entrées (revenus)" },
  { value: "out", label: "Sorties (dépenses)" },
];

const TX_STATUS_ITEMS: QuickSelectItem[] = STATUS_OPTIONS.filter(
  (o) => o.value !== ""
).map((o) => ({ id: o.value, name: o.label }));

const TX_TYPE_ITEMS: QuickSelectItem[] = TYPE_OPTIONS.filter(
  (o) => o.value !== ""
).map((o) => ({ id: o.value, name: o.label }));

const TX_DIRECTION_ITEMS: QuickSelectItem[] = DIRECTION_OPTIONS.filter(
  (o) => o.value !== ""
).map((o) => ({ id: o.value, name: o.label }));

// ─── Date helpers : presets de période ───────────────────────────────────────

type PeriodPreset = "today" | "7d" | "30d" | "month" | "year" | "all" | "custom";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rangeForPreset(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = isoDate(today);
  switch (preset) {
    case "today":
      return { from: to, to };
    case "7d": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { from: isoDate(d), to };
    }
    case "30d": {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return { from: isoDate(d), to };
    }
    case "month": {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: isoDate(d), to };
    }
    case "year": {
      const d = new Date(now.getFullYear(), 0, 1);
      return { from: isoDate(d), to };
    }
    case "all": {
      // Le backend a une fenêtre par défaut de 90 jours quand `from` est
      // absent (cf. analytics_view.py). Pour réellement tout englober on
      // envoie une borne très ancienne — couvre toute la durée de vie
      // raisonnable d'une organisation.
      return { from: "1970-01-01", to };
    }
    case "custom":
    default:
      return { from: "", to: "" };
  }
}

const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "month", label: "Ce mois" },
  { value: "year", label: "Cette année" },
  { value: "all", label: "Toute la période" },
];

// ─── Wrapper ─────────────────────────────────────────────────────────────────

export default function TransactionsPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.SERVICE_TRANSACTIONS.VIEW}>
      <TransactionsPage />
    </PermissionGuard>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function TransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = params.id as string;
  const { can } = useOrgPermissions();
  const canManage = can(PERMISSIONS.SERVICE_TRANSACTIONS.MANAGE);
  const canConfirm = can(PERMISSIONS.SERVICE_TRANSACTIONS.CONFIRM);
  const { formatCurrency } = useCurrencyFormatter();

  const initialStatus = searchParams.get("status") || "";

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [status, setStatus] = useState<string>(initialStatus);
  const [type, setType] = useState<string>("");
  const [direction, setDirection] = useState<string>("");
  // Par défaut : toute la période. Sans cela, le backend applique sa
  // fenêtre par défaut de 90 jours et les KPIs montrent 0 alors que la
  // liste, elle, n'est pas filtrée — incohérence visible. La liste suit
  // la même borne (transactions sans date <= aujourd'hui).
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("all");
  const [dateFrom, setDateFrom] = useState<string>(rangeForPreset("all").from);
  const [dateTo, setDateTo] = useState<string>(rangeForPreset("all").to);
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingConfirmTx, setPendingConfirmTx] = useState<ServiceTransaction | null>(null);
  const [pendingCancelTx, setPendingCancelTx] = useState<ServiceTransaction | null>(null);

  // Quand un preset est cliqué : on aligne dateFrom/dateTo automatiquement.
  const applyPreset = (preset: PeriodPreset) => {
    setPeriodPreset(preset);
    const r = rangeForPreset(preset);
    setDateFrom(r.from);
    setDateTo(r.to);
  };

  // Quand l'utilisateur édite manuellement les dates : on bascule en "custom".
  const onDateFromChange = (v: string) => {
    setDateFrom(v);
    setPeriodPreset("custom");
  };
  const onDateToChange = (v: string) => {
    setDateTo(v);
    setPeriodPreset("custom");
  };

  // Filtres pour la liste paginée.
  const listFilters = useMemo(
    () => ({
      search: search || undefined,
      status: (status as ServiceTransactionStatus) || undefined,
      transaction_type: (type as ServiceTransactionType) || undefined,
      direction: (direction as ServiceTransactionDirection) || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [search, status, type, direction, dateFrom, dateTo]
  );

  // Filtres pour les KPIs (analytics summary). On ne passe que la période :
  // les KPIs reflètent l'agrégat global de la fenêtre temporelle, pas les
  // filtres status/type qui sont propres à la liste.
  const analyticsParams = useMemo(
    () => ({
      from: dateFrom || undefined,
      to: dateTo || undefined,
    }),
    [dateFrom, dateTo]
  );

  const {
    data,
    meta,
    setPage,
    nextPage,
    prevPage,
    isLoading,
  } = usePaginatedServiceTransactions(orgId, listFilters, { pageSize: 15 });

  const {
    data: analytics,
    isLoading: analyticsLoading,
  } = useServicesAnalyticsSummary(orgId, analyticsParams);

  const confirm = useConfirmServiceTransaction(orgId);
  const cancel = useCancelServiceTransaction(orgId);

  const filtersActive =
    !!status || !!type || !!direction || !!dateFrom || !!dateTo;
  const periodLabel =
    PERIOD_PRESETS.find((p) => p.value === periodPreset)?.label ??
    (dateFrom && dateTo
      ? `${dateFrom} → ${dateTo}`
      : "Toute la période");

  // Compteur de filtres "secondaires" (hors période) actifs — pour le bouton
  // "Filtres" dans la barre.
  const secondaryFilterCount =
    (status ? 1 : 0) + (type ? 1 : 0) + (direction ? 1 : 0);

  // ── KPIs ───────────────────────────────────────────────────────────────
  const kpis = analytics?.kpis;
  const totalRevenue = kpis ? Number(kpis.revenue) + Number(kpis.other_revenue) : 0;
  const totalExpense = kpis ? Number(kpis.expense) : 0;
  const net = kpis ? Number(kpis.net) : 0;
  const isProfit = net >= 0;

  // Détecte le cas où les KPIs sont à 0 alors que la liste contient des
  // transactions : typiquement parce qu'aucune n'est encore *validée*
  // (le backend agrège uniquement `status=confirmed`).
  const allKpisZero =
    kpis !== undefined &&
    totalRevenue === 0 &&
    totalExpense === 0 &&
    net === 0;
  const showPendingOnlyHint =
    !analyticsLoading &&
    !isLoading &&
    allKpisZero &&
    meta.totalItems > 0;

  return (
    <>
      <ListPageLayout
        title="Transactions"
        icon={FaMoneyBillWave}
        description="Tous les mouvements financiers liés à vos services."
        headerActions={
          canManage
            ? [
                {
                  label: "Nouvelle transaction",
                  icon: FaPlus,
                  onClick: () => setCreateOpen(true),
                },
              ]
            : []
        }
        stats={[]}
        searchFilters={
          <div className="space-y-3">
            {/* ── KPI cards (sobres, sans couleur) ───────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <KpiCard
                label="Revenus"
                hint={`Total des entrées · ${periodLabel.toLowerCase()}`}
                value={formatCurrency(totalRevenue)}
                sign="+"
                isLoading={analyticsLoading}
              />
              <KpiCard
                label="Dépenses"
                hint={`Sorties + remboursements · ${periodLabel.toLowerCase()}`}
                value={formatCurrency(totalExpense)}
                sign="−"
                isLoading={analyticsLoading}
              />
              <KpiCard
                label={isProfit ? "Bénéfice" : "Déficit"}
                hint={`Revenus − dépenses · ${periodLabel.toLowerCase()}`}
                value={formatCurrency(Math.abs(net))}
                sign={isProfit ? undefined : "−"}
                emphasis
                isLoading={analyticsLoading}
              />
            </div>

            {/* Hint : explique pourquoi les KPIs peuvent rester à 0 */}
            {showPendingOnlyHint && (
              <p className="text-[11px] text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2 leading-snug">
                Les totaux ci-dessus ne comptent que les transactions{" "}
                <span className="font-medium text-foreground">validées</span>.
                Vos {meta.totalItems} transaction{meta.totalItems > 1 ? "s" : ""}{" "}
                semble{meta.totalItems > 1 ? "nt" : ""} encore en attente de
                validation — utilisez le bouton{" "}
                <span className="inline-flex items-center gap-1 px-1 rounded bg-background border border-border text-foreground font-medium">
                  ✓
                </span>{" "}
                sur chaque ligne pour les valider et les inclure aux KPIs.
              </p>
            )}

            {/* ── Presets de période (toujours visibles, accès rapide) ── */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1">
                Période
              </span>
              {PERIOD_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => applyPreset(p.value)}
                  className={cn(
                    "h-7 px-2.5 rounded-full text-[11px] font-medium transition-colors border",
                    periodPreset === p.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
              {periodPreset === "custom" && (
                <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                  Personnalisée
                </span>
              )}
            </div>

            {/* ── Search + filter trigger ─────────────────────────────── */}
            <ListSearchFilters
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Référence, description, inscription..."
              filtersOpen={filterOpen}
              onFiltersOpenChange={setFilterOpen}
              filtersAreActive={secondaryFilterCount > 0}
              filters={
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      Statut
                    </label>
                    <QuickSelect
                      label="Statut"
                      items={TX_STATUS_ITEMS}
                      selectedId={status}
                      onSelect={setStatus}
                      placeholder="Tous les statuts"
                      canCreate={false}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      Type
                    </label>
                    <QuickSelect
                      label="Type"
                      items={TX_TYPE_ITEMS}
                      selectedId={type}
                      onSelect={setType}
                      placeholder="Tous les types"
                      canCreate={false}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      Sens
                    </label>
                    <QuickSelect
                      label="Sens"
                      items={TX_DIRECTION_ITEMS}
                      selectedId={direction}
                      onSelect={setDirection}
                      placeholder="Tous les sens"
                      canCreate={false}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:col-span-1">
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Du
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => onDateFromChange(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        Au
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => onDateToChange(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      />
                    </div>
                  </div>
                  {filtersActive && (
                    <div className="sm:col-span-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setStatus("");
                          setType("");
                          setDirection("");
                          applyPreset("all");
                        }}
                        className="text-xs"
                      >
                        <XIcon className="h-3.5 w-3.5 mr-1.5" />
                        Tout réinitialiser
                      </Button>
                    </div>
                  )}
                </div>
              }
            />

            {/* ── Chips des filtres actifs (hors période, déjà visible) ── */}
            {(status || type || direction) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1">
                  Filtres actifs
                </span>
                {status && (
                  <FilterChip
                    label={
                      STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
                    }
                    onRemove={() => setStatus("")}
                  />
                )}
                {type && (
                  <FilterChip
                    label={
                      TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
                    }
                    onRemove={() => setType("")}
                  />
                )}
                {direction && (
                  <FilterChip
                    label={
                      DIRECTION_OPTIONS.find((o) => o.value === direction)?.label ??
                      direction
                    }
                    onRemove={() => setDirection("")}
                  />
                )}
              </div>
            )}
          </div>
        }
        content={
          isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <FaMoneyBillWave className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="font-medium">Aucune transaction</p>
              <p className="text-sm text-muted-foreground mt-1">
                {filtersActive
                  ? "Aucune transaction ne correspond à vos filtres."
                  : "Les paiements et dépenses des services apparaîtront ici."}
              </p>
              {filtersActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStatus("");
                    setType("");
                    setDirection("");
                    applyPreset("all");
                  }}
                  className="mt-3 text-xs"
                >
                  <XIcon className="h-3.5 w-3.5 mr-1.5" />
                  Effacer les filtres
                </Button>
              )}
            </div>
          ) : (
            <>
              <ListTable
                onRowClick={(t: ServiceTransaction) =>
                  router.push(
                    `/organisation/${orgId}/services/transactions/${t.id}`
                  )
                }
                columns={[
                  <ListTableColumn key="date" header="Date">
                    {({ value: t }) => (
                      <span className="text-sm">
                        {new Date(t.transaction_date).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="ref" header="Référence">
                    {({ value: t }) => (
                      <div className="min-w-0 space-y-1">
                        <div className="text-sm font-medium truncate">
                          {t.reference || t.description || "—"}
                        </div>
                        {t.enrollment_reference && (
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline block"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/organisation/${orgId}/services/enrollments/${t.enrollment}`
                              );
                            }}
                          >
                            {t.enrollment_reference}
                          </button>
                        )}
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          <AuditLine
                            verb="Créée par"
                            user={t.created_by_info}
                            at={t.created_at}
                            icon={<FaHandHoldingUsd className="h-3 w-3" />}
                          />
                          <AuditLine
                            verb="Validée par"
                            user={t.confirmed_by_info}
                            at={t.confirmed_at}
                            icon={
                              <FaCheckCircle className="h-3 w-3 text-green-600" />
                            }
                          />
                          <AuditLine
                            verb="Annulée par"
                            user={t.cancelled_by_info}
                            at={t.cancelled_at}
                            icon={<FaBan className="h-3 w-3 text-red-600" />}
                          />
                        </div>
                      </div>
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="type" header="Type">
                    {({ value: t }) => (
                      <TransactionTypeBadge type={t.transaction_type} />
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="method" header="Mode">
                    {({ value: t }) => (
                      <span className="text-xs">{t.payment_method_display}</span>
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="amount" header="Montant" align="right">
                    {({ value: t }) => (
                      <span
                        className={`text-sm font-semibold ${
                          t.direction === "in" ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {t.direction === "in" ? "+" : "−"}
                        {formatCurrency(Number(t.amount))}
                      </span>
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="status" header="Statut">
                    {({ value: t }) => (
                      <TransactionStatusBadge status={t.status} />
                    )}
                  </ListTableColumn>,
                  <ListTableColumn
                    key="actions"
                    header="Actions"
                    align="right"
                  >
                    {({ value: t }) => (
                      <Can permission={PERMISSIONS.SERVICE_TRANSACTIONS.CONFIRM}>
                        <div
                          className="flex justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {t.status === "pending" && canConfirm && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPendingConfirmTx(t)}
                              aria-label="Valider"
                            >
                              <FaCheckCircle className="h-3.5 w-3.5 text-green-700" />
                            </Button>
                          )}
                          {t.status !== "cancelled" && canConfirm && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPendingCancelTx(t)}
                              aria-label="Annuler"
                            >
                              <FaTimesCircle className="h-3.5 w-3.5 text-red-700" />
                            </Button>
                          )}
                        </div>
                      </Can>
                    )}
                  </ListTableColumn>,
                ]}
                data={data}
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
          )
        }
      />

      <AddTransactionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        orgId={orgId}
      />

      {/* ── Confirmation : valider ─────────────────────────────────────── */}
      <ConfirmActionDialog
        open={!!pendingConfirmTx}
        onOpenChange={(o) => !o && setPendingConfirmTx(null)}
        title="Valider la transaction ?"
        description="La transaction sera comptabilisée immédiatement et affectera les soldes liés."
        icon={<FaCheckCircle className="h-4 w-4 text-green-600" />}
        confirmLabel="Valider l'encaissement"
        tone="success"
        details={
          pendingConfirmTx ? (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">
                  {pendingConfirmTx.transaction_type_display}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode</span>
                <span>{pendingConfirmTx.payment_method_display}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-bold text-base">
                  {formatCurrency(Number(pendingConfirmTx.amount))}
                </span>
              </div>
              {pendingConfirmTx.enrollment_reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inscription</span>
                  <span className="font-mono text-xs">
                    {pendingConfirmTx.enrollment_reference}
                  </span>
                </div>
              )}
            </div>
          ) : null
        }
        onConfirm={async () => {
          if (!pendingConfirmTx) return;
          try {
            await confirm.mutateAsync(pendingConfirmTx.id);
            toast.success("Transaction validée.");
          } catch (err: unknown) {
            const e = err as { data?: { detail?: string }; message?: string };
            toast.error("Échec", {
              description: e?.data?.detail || e?.message,
            });
            throw err;
          }
        }}
      />

      {/* ── Confirmation : annuler ─────────────────────────────────────── */}
      <ConfirmActionDialog
        open={!!pendingCancelTx}
        onOpenChange={(o) => !o && setPendingCancelTx(null)}
        title="Annuler cette transaction ?"
        description="La transaction sera marquée comme annulée et exclue des soldes. Action irréversible."
        icon={<FaBan className="h-4 w-4 text-red-600" />}
        confirmLabel="Confirmer l'annulation"
        tone="danger"
        details={
          pendingCancelTx ? (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">
                  {pendingCancelTx.transaction_type_display}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant</span>
                <span className="font-bold">
                  {formatCurrency(Number(pendingCancelTx.amount))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut actuel</span>
                <TransactionStatusBadge status={pendingCancelTx.status} />
              </div>
            </div>
          ) : null
        }
        onConfirm={async () => {
          if (!pendingCancelTx) return;
          try {
            await cancel.mutateAsync(pendingCancelTx.id);
            toast.success("Transaction annulée.");
          } catch (err: unknown) {
            const e = err as { data?: { detail?: string }; message?: string };
            toast.error("Échec", {
              description: e?.data?.detail || e?.message,
            });
            throw err;
          }
        }}
      />
    </>
  );
}

// ─── KPI Card (sobre, mono-couleur) ──────────────────────────────────────────

function KpiCard({
  label,
  hint,
  value,
  sign,
  emphasis = false,
  isLoading,
}: {
  label: string;
  hint: string;
  value: string;
  /** Signe préfixé devant la valeur (+ / −). Optionnel pour les valeurs neutres. */
  sign?: "+" | "−";
  /** Met la card légèrement en avant — réservé au KPI principal (bénéfice/déficit). */
  emphasis?: boolean;
  isLoading?: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-4 transition-shadow hover:shadow-sm",
        emphasis && "bg-muted/30",
      )}
    >
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {isLoading ? (
        <Skeleton className="h-7 w-32 mt-2" />
      ) : (
        <p className="text-xl sm:text-2xl font-bold mt-2 leading-tight tabular-nums text-foreground">
          {sign && (
            <span className="text-muted-foreground/70 mr-0.5 font-medium">
              {sign}
            </span>
          )}
          {value}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground mt-1 leading-snug truncate">
        {hint}
      </p>
    </Card>
  );
}

// ─── Filter chip ─────────────────────────────────────────────────────────────

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Badge
      variant="secondary"
      className="h-6 pl-2 pr-1 gap-1 text-[10px] font-medium"
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Retirer le filtre ${label}`}
        className="h-4 w-4 rounded-full inline-flex items-center justify-center hover:bg-foreground/10"
      >
        <XIcon className="h-2.5 w-2.5" />
      </button>
    </Badge>
  );
}
