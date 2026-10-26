"use client";

import {
  ListPageLayout,
  ListStat,
  ListTable,
  ListTableColumn,
} from "@/components/layout/ListPageLayout";
import { PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { TransferDialog } from "@/components/services/inventory/cash/TransferDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
  useBankAccounts,
  useDeleteTreasuryTransfer,
  useTreasuryOverview,
  useTreasuryTransfers,
  useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  BankAccount,
  TreasuryTransfer,
} from "@/lib/types/inventory";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  FaBuildingColumns,
  FaCalendarDays,
  FaRightLeft,
  FaScaleBalanced,
  FaTrash,
  FaWallet,
} from "react-icons/fa6";
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

function asArray<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  const r = (data as { results?: T[] }).results;
  return Array.isArray(r) ? r : [];
}

export default function TreasuryPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.CASH.VIEW}>
      <TreasuryPage />
    </PermissionGuard>
  );
}

function TreasuryPage() {
  const params = useParams();
  const orgId = params.id as string;
  const { can } = useOrgPermissions();
  const { formatCurrency } = useCurrencyFormatter();
  const money = (value: string | number) => formatCurrency(Number(value) || 0);
  const canManage = can(PERMISSIONS.CASH.MANAGE);

  const [transferOpen, setTransferOpen] = useState(false);

  const { data: overview, isLoading, error } = useTreasuryOverview(orgId);
  const { data: transfersRaw } = useTreasuryTransfers(orgId);
  const transfers = useMemo(
    () => asArray<TreasuryTransfer>(transfersRaw),
    [transfersRaw]
  );
  const { data: warehouses = [] } = useWarehouses(orgId, {
    page_size: "all",
    is_active: true,
  });
  const { data: accountsRaw } = useBankAccounts(orgId, { active: 1 });
  const accounts = useMemo(() => asArray<BankAccount>(accountsRaw), [accountsRaw]);
  const deleteTransfer = useDeleteTreasuryTransfer();

  const handleDeleteTransfer = async (t: TreasuryTransfer) => {
    if (!window.confirm("Annuler ce transfert ?")) return;
    try {
      await deleteTransfer.mutateAsync({ orgId, id: t.id });
      toast.success("Transfert annulé.");
    } catch {
      toast.error("Annulation impossible.");
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

  const caisses = overview?.caisses ?? [];
  const bankAccounts = overview?.bank_accounts ?? [];

  return (
    <>
      <ListPageLayout
        title="Trésorerie"
        icon={FaScaleBalanced}
        description="Vue consolidée : espèces en caisse + fonds en banque. Total = caisses + banques."
        headerActions={
          canManage
            ? [
                {
                  label: "Transfert caisse ↔ banque",
                  icon: FaRightLeft,
                  onClick: () => setTransferOpen(true),
                },
              ]
            : []
        }
        stats={[
          <ListStat
            key="total"
            label="Trésorerie totale"
            value={
              <span className="text-primary">{money(overview?.total ?? 0)}</span>
            }
            icon={<FaScaleBalanced className="h-4 w-4 text-muted-foreground" />}
          />,
          <ListStat
            key="cash"
            label="Total caisses (espèces)"
            value={money(overview?.total_cash ?? 0)}
            icon={<FaWallet className="h-4 w-4 text-muted-foreground" />}
          />,
          <ListStat
            key="bank"
            label="Total banque"
            value={money(overview?.total_bank ?? 0)}
            icon={<FaBuildingColumns className="h-4 w-4 text-muted-foreground" />}
          />,
        ]}
        content={
          <div className="space-y-8">
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Caisses ─────────────────────────────────────── */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <FaWallet className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Caisses (espèces)</h3>
                  </div>
                  {caisses.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center bg-muted/20 rounded-lg">
                      Aucune caisse mouvementée.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {caisses.map((c) => {
                        const bal = Number(c.balance);
                        return (
                          <div
                            key={c.warehouse_id ?? "none"}
                            className="flex items-center justify-between rounded-lg border border-border p-3"
                          >
                            <span className="text-sm font-medium">
                              {c.warehouse_name}
                            </span>
                            <span
                              className={`font-mono tabular-nums font-semibold ${
                                bal >= 0 ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {money(bal)}
                            </span>
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 font-semibold">
                        <span className="text-sm">Total caisses</span>
                        <span className="font-mono tabular-nums">
                          {money(overview?.total_cash ?? 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </section>

                {/* ── Comptes ─────────────────────────────────────── */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <FaBuildingColumns className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Comptes bancaires</h3>
                  </div>
                  {bankAccounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center bg-muted/20 rounded-lg">
                      Aucun compte mouvementé.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {bankAccounts.map((a) => {
                        const bal = Number(a.balance);
                        return (
                          <div
                            key={a.bank_account_id ?? "none"}
                            className="flex items-center justify-between rounded-lg border border-border p-3"
                          >
                            <span className="text-sm font-medium">
                              {a.name}
                              {a.bank_name ? (
                                <span className="text-xs text-muted-foreground">
                                  {" "}
                                  · {a.bank_name}
                                </span>
                              ) : null}
                            </span>
                            <span
                              className={`font-mono tabular-nums font-semibold ${
                                bal >= 0 ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {money(bal)}
                            </span>
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 font-semibold">
                        <span className="text-sm">Total banque</span>
                        <span className="font-mono tabular-nums">
                          {money(overview?.total_bank ?? 0)}
                        </span>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ── Transferts internes ───────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FaRightLeft className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Transferts caisse ↔ banque</h3>
              </div>
              {transfers.length === 0 ? (
                <div className="text-center py-10 bg-muted/20 rounded-lg">
                  <FaRightLeft className="h-9 w-9 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="font-medium">Aucun transfert</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Déposez vos espèces en banque ou retirez du liquide sans
                    fausser la trésorerie totale.
                  </p>
                </div>
              ) : (
                <ListTable
                  columns={[
                    <ListTableColumn key="dir" header="Sens">
                      {({ value: t }: { value: TreasuryTransfer }) => (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          {t.direction === "cash_to_bank" ? (
                            <>
                              <FaWallet className="h-3 w-3" />→
                              <FaBuildingColumns className="h-3 w-3" />
                              Dépôt
                            </>
                          ) : (
                            <>
                              <FaBuildingColumns className="h-3 w-3" />→
                              <FaWallet className="h-3 w-3" />
                              Retrait
                            </>
                          )}
                        </span>
                      )}
                    </ListTableColumn>,
                    <ListTableColumn key="amount" header="Montant" align="right">
                      {({ value: t }: { value: TreasuryTransfer }) => (
                        <span className="font-mono tabular-nums font-semibold">
                          {money(t.amount)}
                        </span>
                      )}
                    </ListTableColumn>,
                    <ListTableColumn key="wh" header="Caisse">
                      {({ value: t }: { value: TreasuryTransfer }) => (
                        <span className="text-xs">{t.warehouse_name}</span>
                      )}
                    </ListTableColumn>,
                    <ListTableColumn key="acc" header="Compte">
                      {({ value: t }: { value: TreasuryTransfer }) => (
                        <span className="text-xs">{t.bank_account_name}</span>
                      )}
                    </ListTableColumn>,
                    <ListTableColumn key="date" header="Date">
                      {({ value: t }: { value: TreasuryTransfer }) => (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <FaCalendarDays className="h-3 w-3" />
                          {formatDate(t.transfer_date)}
                        </span>
                      )}
                    </ListTableColumn>,
                    <ListTableColumn key="actions" header="" align="right">
                      {({ value: t }: { value: TreasuryTransfer }) =>
                        canManage ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteTransfer(t)}
                            className="p-1.5 rounded hover:bg-red-50 text-red-600"
                            title="Annuler le transfert"
                          >
                            <FaTrash className="h-3 w-3" />
                          </button>
                        ) : null
                      }
                    </ListTableColumn>,
                  ]}
                  data={transfers}
                />
              )}
            </section>
          </div>
        }
      />

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        orgId={orgId}
        warehouses={warehouses as { id: string; name: string }[]}
        bankAccounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      />
    </>
  );
}
