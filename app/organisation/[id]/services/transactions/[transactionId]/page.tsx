"use client";

import { DetailPageLayout } from "@/components/layout/DetailPageLayout";
import { Can, PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { AuditLine } from "@/components/services/services/AuditLine";
import { ConfirmActionDialog } from "@/components/services/services/ConfirmActionDialog";
import {
  TransactionStatusBadge,
  TransactionTypeBadge,
} from "@/components/services/services/ServiceStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
  useCancelServiceTransaction,
  useConfirmServiceTransaction,
  useServiceTransaction,
} from "@/lib/hooks/services";
import { PERMISSIONS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  FaArrowDown,
  FaArrowUp,
  FaBan,
  FaCalendarAlt,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaHandHoldingUsd,
  FaHashtag,
  FaMoneyBillWave,
  FaReceipt,
  FaTimesCircle,
  FaWallet,
} from "react-icons/fa";
import { toast } from "sonner";

export default function TransactionDetailPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.SERVICE_TRANSACTIONS.VIEW}>
      <TransactionDetailPage />
    </PermissionGuard>
  );
}

function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const transactionId = params.transactionId as string;
  const { can } = useOrgPermissions();
  const canConfirm = can(PERMISSIONS.SERVICE_TRANSACTIONS.CONFIRM);
  const { formatCurrency } = useCurrencyFormatter();

  const { data: tx, isLoading, error } = useServiceTransaction(
    orgId,
    transactionId
  );
  const confirm = useConfirmServiceTransaction(orgId);
  const cancel = useCancelServiceTransaction(orgId);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const backLink = `/organisation/${orgId}/services/transactions`;

  if (error || (!isLoading && !tx)) {
    return (
      <DetailPageLayout
        title="Transaction"
        backLink={backLink}
        error={{
          message: "Transaction introuvable ou inaccessible.",
        }}
      />
    );
  }

  if (isLoading || !tx) {
    return (
      <DetailPageLayout
        title="Transaction"
        backLink={backLink}
        isLoading
      />
    );
  }

  const amount = Number(tx.amount);
  const isIn = tx.direction === "in";
  const txDate = new Date(tx.transaction_date);
  const txDateLabel = isFinite(txDate.getTime())
    ? txDate.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : tx.transaction_date;

  const headerTitle =
    tx.reference || tx.description || `Transaction ${tx.id.slice(0, 8)}`;

  const actions = canConfirm
    ? [
        ...(tx.status === "pending"
          ? [
              {
                label: "Valider",
                icon: FaCheckCircle,
                onClick: () => setConfirmOpen(true),
              },
            ]
          : []),
        ...(tx.status !== "cancelled"
          ? [
              {
                label: "Annuler",
                icon: FaTimesCircle,
                variant: "destructive" as const,
                onClick: () => setCancelOpen(true),
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      <DetailPageLayout
        title={headerTitle}
        subtitle={tx.reference ? tx.description : undefined}
        backLink={backLink}
        icon={FaMoneyBillWave}
        badge={<TransactionStatusBadge status={tx.status} />}
        actions={actions}
        headerExtras={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <FaCalendarAlt className="h-3 w-3" />
              {txDateLabel}
            </span>
            <span className="opacity-50">·</span>
            <TransactionTypeBadge type={tx.transaction_type} />
            <span className="opacity-50">·</span>
            <span className="inline-flex items-center gap-1.5">
              <FaWallet className="h-3 w-3" />
              {tx.payment_method_display}
            </span>
          </div>
        }
        summaryCards={
          <>
            <SummaryCard
              label="Montant"
              value={
                <span
                  className={cn(
                    "text-2xl font-bold tabular-nums",
                    isIn ? "text-green-700" : "text-red-700"
                  )}
                >
                  {isIn ? "+" : "−"}
                  {formatCurrency(amount)}
                </span>
              }
              hint={tx.currency}
              icon={
                isIn ? (
                  <FaArrowDown className="h-4 w-4 text-green-700" />
                ) : (
                  <FaArrowUp className="h-4 w-4 text-red-700" />
                )
              }
            />
            <SummaryCard
              label="Type"
              value={
                <div className="pt-1">
                  <TransactionTypeBadge type={tx.transaction_type} />
                </div>
              }
              hint={tx.direction_display}
              icon={<FaHandHoldingUsd className="h-4 w-4 text-muted-foreground" />}
            />
            <SummaryCard
              label="Mode de paiement"
              value={
                <span className="text-base font-semibold">
                  {tx.payment_method_display}
                </span>
              }
              hint="Canal d'encaissement"
              icon={<FaWallet className="h-4 w-4 text-muted-foreground" />}
            />
            <SummaryCard
              label="Statut"
              value={
                <div className="pt-1">
                  <TransactionStatusBadge status={tx.status} />
                </div>
              }
              hint={tx.status_display}
              icon={<FaReceipt className="h-4 w-4 text-muted-foreground" />}
            />
          </>
        }
        audit={{
          created_at: tx.created_at,
          updated_at: tx.updated_at,
          created_by_info: tx.created_by_info,
          updated_by_info: tx.updated_by_info,
        }}
      >
        {/* ── Détails de la transaction ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Détails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Référence">
              {tx.reference ? (
                <span className="font-mono text-xs">{tx.reference}</span>
              ) : (
                <span className="text-muted-foreground italic">—</span>
              )}
            </Row>
            <Separator />
            <Row label="Description">
              {tx.description ? (
                <span className="whitespace-pre-wrap">{tx.description}</span>
              ) : (
                <span className="text-muted-foreground italic">
                  Aucune description
                </span>
              )}
            </Row>
            <Separator />
            <Row label="Date de la transaction">{txDateLabel}</Row>
            <Separator />
            <Row label="Devise">{tx.currency}</Row>
            <Separator />
            <Row label="Identifiant">
              <span className="font-mono text-xs flex items-center gap-1.5">
                <FaHashtag className="h-3 w-3 opacity-60" />
                {tx.id}
              </span>
            </Row>
          </CardContent>
        </Card>

        {/* ── Rattachements ────────────────────────────────────────────── */}
        {(tx.enrollment || tx.module_instance) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rattachements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {tx.enrollment && (
                <Row label="Inscription">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/organisation/${orgId}/services/enrollments/${tx.enrollment}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    {tx.enrollment_reference || tx.enrollment}
                    <FaExternalLinkAlt className="h-3 w-3" />
                  </button>
                </Row>
              )}
              {tx.module_instance && (
                <>
                  {tx.enrollment && <Separator />}
                  <Row label="Étape">
                    <span>{tx.module_name || tx.module_instance}</span>
                  </Row>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Journal (audit) ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Journal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <AuditLine
              verb="Créée par"
              user={tx.created_by_info}
              at={tx.created_at}
              icon={<FaHandHoldingUsd className="h-3 w-3" />}
            />
            {tx.confirmed_at && (
              <AuditLine
                verb="Validée par"
                user={tx.confirmed_by_info}
                at={tx.confirmed_at}
                icon={<FaCheckCircle className="h-3 w-3 text-green-600" />}
              />
            )}
            {tx.cancelled_at && (
              <AuditLine
                verb="Annulée par"
                user={tx.cancelled_by_info}
                at={tx.cancelled_at}
                icon={<FaBan className="h-3 w-3 text-red-600" />}
              />
            )}
            {tx.updated_at !== tx.created_at && tx.updated_by_info && (
              <AuditLine
                verb="Modifiée par"
                user={tx.updated_by_info}
                at={tx.updated_at}
                icon={<FaReceipt className="h-3 w-3" />}
              />
            )}
          </CardContent>
        </Card>

        {/* ── Actions secondaires (visibles uniquement avec droits) ────── */}
        <Can permission={PERMISSIONS.SERVICE_TRANSACTIONS.CONFIRM}>
          {(tx.status === "pending" || tx.status === "confirmed") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {tx.status === "pending" && (
                  <Button
                    variant="default"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <FaCheckCircle className="mr-2 h-3.5 w-3.5" />
                    Valider la transaction
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => setCancelOpen(true)}
                >
                  <FaTimesCircle className="mr-2 h-3.5 w-3.5" />
                  Annuler la transaction
                </Button>
              </CardContent>
            </Card>
          )}
        </Can>
      </DetailPageLayout>

      {/* ── Dialog : valider ─────────────────────────────────────────── */}
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Valider la transaction ?"
        description="La transaction sera comptabilisée immédiatement et affectera les soldes liés."
        icon={<FaCheckCircle className="h-4 w-4 text-green-600" />}
        confirmLabel="Valider l'encaissement"
        tone="success"
        details={
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">
                {tx.transaction_type_display}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mode</span>
              <span>{tx.payment_method_display}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-bold text-base">
                {formatCurrency(amount)}
              </span>
            </div>
            {tx.enrollment_reference && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inscription</span>
                <span className="font-mono text-xs">
                  {tx.enrollment_reference}
                </span>
              </div>
            )}
          </div>
        }
        onConfirm={async () => {
          try {
            await confirm.mutateAsync(tx.id);
            toast.success("Transaction validée.");
          } catch (err: unknown) {
            toast.error("Échec", { description: getApiErrorMessage(err) });
            throw err;
          }
        }}
      />

      {/* ── Dialog : annuler ─────────────────────────────────────────── */}
      <ConfirmActionDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Annuler cette transaction ?"
        description="La transaction sera marquée comme annulée et exclue des soldes. Action irréversible."
        icon={<FaBan className="h-4 w-4 text-red-600" />}
        confirmLabel="Confirmer l'annulation"
        tone="danger"
        details={
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">
                {tx.transaction_type_display}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-bold">
                {formatCurrency(amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Statut actuel</span>
              <TransactionStatusBadge status={tx.status} />
            </div>
          </div>
        }
        onConfirm={async () => {
          try {
            await cancel.mutateAsync(tx.id);
            toast.success("Transaction annulée.");
          } catch (err: unknown) {
            toast.error("Échec", { description: getApiErrorMessage(err) });
            throw err;
          }
        }}
      />
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        {icon}
      </div>
      <div className="mt-2 leading-tight">{value}</div>
      {hint && (
        <p className="text-[11px] text-muted-foreground mt-1 truncate">
          {hint}
        </p>
      )}
    </Card>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
      <span className="text-muted-foreground text-xs sm:text-sm shrink-0 sm:w-48">
        {label}
      </span>
      <div className="text-foreground text-right sm:text-right break-words min-w-0">
        {children}
      </div>
    </div>
  );
}
