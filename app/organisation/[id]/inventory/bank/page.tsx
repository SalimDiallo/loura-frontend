"use client";

import {
  ListPageLayout,
  ListPagination,
  ListStat,
  ListTable,
  ListTableColumn,
} from "@/components/layout/ListPageLayout";
import { PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { BankAccountDialog } from "@/components/services/inventory/cash/BankAccountDialog";
import { CashAdjustmentDialog } from "@/components/services/inventory/cash/CashAdjustmentDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
  useBankAccounts,
  useBankSummary,
  useDeleteBankAccount,
  usePaginatedBankTransactions,
  useTreasuryOverview,
  useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { BankAccount, CashTransaction } from "@/lib/types/inventory";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaBuildingColumns,
  FaCalendarDays,
  FaPen,
  FaPlus,
  FaRightLeft,
  FaScaleBalanced,
  FaTrash,
} from "react-icons/fa6";
import { toast } from "sonner";

const METHOD_LABELS: Record<string, string> = {
  cash: "Espèces",
  bank_transfer: "Virement",
  mobile_money: "Mobile Money",
  check: "Chèque",
  card: "Carte",
  other: "Autre",
  transfer: "Transfert",
};

const SOURCE_LABELS: Record<string, string> = {
  sale_payment: "Vente",
  po_payment: "Achat",
  expense: "Dépense",
  adjustment: "Banque",
  transfer: "Transfert",
};

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

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Normalise une réponse liste (paginée ou tableau brut) en tableau. */
function asArray<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  const r = (data as { results?: T[] }).results;
  return Array.isArray(r) ? r : [];
}

export default function BankPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.CASH.VIEW}>
      <BankPage />
    </PermissionGuard>
  );
}

function BankPage() {
  const params = useParams();
  const orgId = params.id as string;
  const { can } = useOrgPermissions();
  const { formatCurrency } = useCurrencyFormatter();
  const money = (value: string | number) => formatCurrency(Number(value) || 0);
  const canManage = can(PERMISSIONS.CASH.MANAGE);

  // Par défaut : toute la période (cohérent avec la caisse et la trésorerie).
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [accountFilter, setAccountFilter] = useState<string>("");

  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);

  const { data: accountsRaw, isLoading: accountsLoading } = useBankAccounts(orgId);
  const accounts = useMemo(
    () => asArray<BankAccount>(accountsRaw),
    [accountsRaw]
  );
  const { data: warehouses = [] } = useWarehouses(orgId, {
    page_size: "all",
    is_active: true,
  });
  const deleteAccount = useDeleteBankAccount();

  const filters = useMemo(
    () => ({
      from: from || undefined,
      to: to || undefined,
      // Aucune borne = toute la période (le backend ignore la fenêtre du jour).
      all: !from && !to ? "1" : undefined,
      bank_account: accountFilter || undefined,
    }),
    [from, to, accountFilter]
  );

  const {
    data: transactions,
    meta,
    setPage,
    nextPage,
    prevPage,
    isLoading,
    error,
  } = usePaginatedBankTransactions(orgId, filters, { pageSize: 15 });

  const { data: summary } = useBankSummary(orgId, filters);
  // Source autoritative du total banque (inclut le bucket « Non affecté ») :
  // garantit la cohérence avec la page Trésorerie.
  const { data: overview } = useTreasuryOverview(orgId);

  // Flux bancaires non rattachés à un compte (historique / non renseigné).
  const unassigned = useMemo(
    () =>
      (overview?.bank_accounts ?? []).find(
        (b) => b.bank_account_id === null && Number(b.balance) !== 0
      ),
    [overview]
  );

  // Total = somme des comptes + non affecté (= overview.total_bank). On
  // privilégie le total de l'overview s'il est chargé, sinon on l'estime.
  const totalBalance = useMemo(() => {
    if (overview?.total_bank != null) return Number(overview.total_bank);
    return accounts.reduce(
      (acc, a) => acc + Number(a.balance ?? a.opening_balance ?? 0),
      0
    );
  }, [overview, accounts]);

  const handleDeleteAccount = async (account: BankAccount) => {
    if (
      !window.confirm(
        `Supprimer le compte « ${account.name} » ? Son historique reste consultable.`
      )
    )
      return;
    try {
      await deleteAccount.mutateAsync({ orgId, id: account.id });
      toast.success("Compte supprimé.");
    } catch {
      toast.error("Suppression impossible.");
    }
  };

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

  const accountOptions = accounts.map((a) => ({ id: a.id, name: a.name }));

  return (
    <>
      <ListPageLayout
        title="Banque"
        icon={FaBuildingColumns}
        description="Comptes bancaires et fonds dématérialisés (virement, Mobile Money, chèque, carte)."
        headerActions={
          canManage
            ? [
                {
                  label: "Nouveau compte",
                  icon: FaPlus,
                  onClick: () => {
                    setEditingAccount(null);
                    setAccountDialogOpen(true);
                  },
                },
                {
                  label: "Mouvement bancaire",
                  icon: FaRightLeft,
                  onClick: () => setMovementDialogOpen(true),
                },
              ]
            : []
        }
        stats={[
          <ListStat
            key="in"
            label="Crédits (période)"
            value={money(summary?.total_in ?? 0)}
            icon={<FaArrowDown className="h-4 w-4 text-emerald-600" />}
          />,
          <ListStat
            key="out"
            label="Débits (période)"
            value={money(summary?.total_out ?? 0)}
            icon={<FaArrowUp className="h-4 w-4 text-red-600" />}
          />,
          <ListStat
            key="balance"
            label="Solde total banque"
            value={
              <span className={totalBalance >= 0 ? "text-emerald-600" : "text-red-600"}>
                {money(totalBalance)}
              </span>
            }
            icon={<FaScaleBalanced className="h-4 w-4 text-muted-foreground" />}
          />,
          <ListStat
            key="count"
            label="Comptes"
            value={accounts.length}
            icon={<FaBuildingColumns className="h-4 w-4 text-muted-foreground" />}
          />,
        ]}
        content={
          <div className="space-y-8">
            {/* ── Comptes ─────────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FaBuildingColumns className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Comptes</h3>
              </div>
              {accountsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-10 bg-muted/20 rounded-lg">
                  <FaBuildingColumns className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="font-medium">Aucun compte bancaire</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Créez un compte pour suivre vos fonds hors espèces.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {accounts.map((a) => {
                    const bal = Number(a.balance ?? a.opening_balance ?? 0);
                    const isActive = accountFilter === a.id;
                    return (
                      <div
                        key={a.id}
                        className={`rounded-lg border p-4 transition-colors ${
                          isActive ? "border-primary bg-primary/5" : "border-border"
                        } ${!a.is_active ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setAccountFilter(isActive ? "" : a.id)
                            }
                            className="text-left min-w-0"
                            title="Filtrer les mouvements sur ce compte"
                          >
                            <div className="font-medium text-sm truncate">
                              {a.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {a.bank_name || "—"}
                              {a.account_number ? ` · ${a.account_number}` : ""}
                            </div>
                          </button>
                          {canManage && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAccount(a);
                                  setAccountDialogOpen(true);
                                }}
                                className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                                title="Modifier"
                              >
                                <FaPen className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAccount(a)}
                                className="p-1.5 rounded hover:bg-red-50 text-red-600"
                                title="Supprimer"
                              >
                                <FaTrash className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div
                          className={`mt-3 font-mono tabular-nums text-lg font-semibold ${
                            bal >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {money(bal)}
                        </div>
                      </div>
                    );
                  })}
                  {unassigned && (
                    <div className="rounded-lg border border-dashed border-border p-4 bg-muted/20">
                      <div className="font-medium text-sm">Non affecté</div>
                      <div className="text-xs text-muted-foreground">
                        Flux bancaires sans compte précisé
                      </div>
                      <div
                        className={`mt-3 font-mono tabular-nums text-lg font-semibold ${
                          Number(unassigned.balance) >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {money(unassigned.balance)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* ── Mouvements ──────────────────────────────────────── */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <FaRightLeft className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Mouvements bancaires</h3>
                  {accountFilter && (
                    <button
                      type="button"
                      onClick={() => setAccountFilter("")}
                      className="text-xs text-primary underline"
                    >
                      (compte filtré — tout afficher)
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <input
                    type="date"
                    value={from}
                    max={to || todayISO()}
                    onChange={(e) => setFrom(e.target.value)}
                    className="border border-border rounded-md px-3 py-1.5 text-sm bg-background"
                  />
                  <span className="text-muted-foreground text-sm">→</span>
                  <input
                    type="date"
                    value={to}
                    min={from}
                    max={todayISO()}
                    onChange={(e) => setTo(e.target.value)}
                    className="border border-border rounded-md px-3 py-1.5 text-sm bg-background"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg">
                  <FaBuildingColumns className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="font-medium">Aucun mouvement bancaire</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Les règlements par banque/Mobile Money et les transferts
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
                      <ListTableColumn key="account" header="Compte">
                        {({ value: t }: { value: CashTransaction }) => (
                          <span className="text-xs">
                            {t.bank_account_name || (
                              <span className="text-muted-foreground">
                                Non affecté
                              </span>
                            )}
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
                            <span className="text-xs text-muted-foreground">—</span>
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
                    ]}
                    data={transactions}
                  />
                  <ListPagination
                    meta={meta}
                    onPageChange={setPage}
                    onNext={nextPage}
                    onPrev={prevPage}
                  />
                </>
              )}
            </section>
          </div>
        }
      />

      <BankAccountDialog
        key={editingAccount?.id ?? "new"}
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        orgId={orgId}
        warehouses={warehouses as { id: string; name: string }[]}
        account={editingAccount}
      />
      <CashAdjustmentDialog
        open={movementDialogOpen}
        onOpenChange={setMovementDialogOpen}
        orgId={orgId}
        channel="bank"
        warehouses={warehouses as { id: string; name: string }[]}
        bankAccounts={accountOptions}
        defaultBankAccountId={accountFilter || undefined}
      />
    </>
  );
}

function DirectionBadge({ direction }: { direction: "in" | "out" }) {
  if (direction === "in") {
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50"
        title="Crédit"
      >
        <FaArrowDown className="h-3 w-3" />
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/50"
      title="Débit"
    >
      <FaArrowUp className="h-3 w-3" />
    </span>
  );
}
