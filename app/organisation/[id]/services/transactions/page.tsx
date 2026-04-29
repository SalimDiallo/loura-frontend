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
import { AddTransactionDialog } from "@/components/services/services/AddTransactionDialog";
import { AuditLine } from "@/components/services/services/AuditLine";
import { ConfirmActionDialog } from "@/components/services/services/ConfirmActionDialog";
import {
  TransactionStatusBadge,
  TransactionTypeBadge,
} from "@/components/services/services/ServiceStatusBadge";
import { Button } from "@/components/ui/button";
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
} from "@/lib/hooks/services";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  ServiceTransaction,
  ServiceTransactionStatus,
  ServiceTransactionType
} from "@/lib/types";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  FaBan,
  FaCheckCircle,
  FaHandHoldingUsd,
  FaMoneyBillWave,
  FaPlus,
  FaTimesCircle
} from "react-icons/fa";
import { toast } from "sonner";

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

const TX_STATUS_ITEMS: QuickSelectItem[] = STATUS_OPTIONS.filter(
  (o) => o.value !== ""
).map((o) => ({ id: o.value, name: o.label }));

const TX_TYPE_ITEMS: QuickSelectItem[] = TYPE_OPTIONS.filter(
  (o) => o.value !== ""
).map((o) => ({ id: o.value, name: o.label }));

export default function TransactionsPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.SERVICE_TRANSACTIONS.VIEW}>
      <TransactionsPage />
    </PermissionGuard>
  );
}

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
  // Initialisation depuis l'URL, sans resync sur changement (pas d'effet).
  const [status, setStatus] = useState<string>(initialStatus);
  const [type, setType] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingConfirmTx, setPendingConfirmTx] = useState<ServiceTransaction | null>(null);
  const [pendingCancelTx, setPendingCancelTx] = useState<ServiceTransaction | null>(null);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: (status as ServiceTransactionStatus) || undefined,
      transaction_type: (type as ServiceTransactionType) || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [search, status, type, dateFrom, dateTo]
  );

  const {
    data,
    meta,
    setPage,
    nextPage,
    prevPage,
    isLoading,
  } = usePaginatedServiceTransactions(orgId, filters, { pageSize: 15 });

  const confirm = useConfirmServiceTransaction(orgId);
  const cancel = useCancelServiceTransaction(orgId);

  const filtersActive = !!status || !!type || !!dateFrom || !!dateTo;

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
        stats={[
          <ListStat
            key="total"
            label="Transactions"
            value={meta.totalItems}
            icon={<FaMoneyBillWave className="h-4 w-4 text-muted-foreground" />}
          />,
        ]}
        searchFilters={
          <ListSearchFilters
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Référence, description, inscription..."
            filtersOpen={filterOpen}
            onFiltersOpenChange={setFilterOpen}
            filtersAreActive={filtersActive}
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
                  <label className="text-sm font-medium block mb-2">Du</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Au</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  />
                </div>
              </div>
            }
          />
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
                Les paiements et dépenses des services apparaîtront ici.
              </p>
            </div>
          ) : (
            <>
              <ListTable
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
                            onClick={() =>
                              router.push(
                                `/organisation/${orgId}/services/enrollments/${t.enrollment}`
                              )
                            }
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
                        <div className="flex justify-end gap-1">
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
