"use client";

import { GenerateDocumentButton } from "@/components/documents";
import { DetailPageLayout, DetailPageTab } from "@/components/layout/DetailPageLayout";
import {
  PermissionGuard,
  useOrgPermissions
} from "@/components/permissions";
import { AddServiceModuleDialog } from "@/components/services/services/AddServiceModuleDialog";
import { AddTransactionDialog } from "@/components/services/services/AddTransactionDialog";
import { AuditLine } from "@/components/services/services/AuditLine";
import { ConfirmActionDialog } from "@/components/services/services/ConfirmActionDialog";
import { ModuleWorkflowActions } from "@/components/services/services/ModuleWorkflowActions";
import {
  EnrollmentStatusBadge,
  ModuleStatusBadge,
  PaymentModeBadge,
  ProgressBar,
  TransactionStatusBadge,
  TransactionTypeBadge,
} from "@/components/services/services/ServiceStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  QuickSelect,
  type QuickSelectItem,
} from "@/components/ui/quick-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCurrencyFormatter } from "@/lib/hooks";
import { usePaginatedMembers } from "@/lib/hooks/hr";
import {
  useAddModuleInstanceNote,
  useCancelServiceTransaction,
  useConfirmServiceTransaction,
  useDeleteEnrollment,
  useDeleteModuleInstance,
  useEnrollment,
  useEnrollmentTransactions,
  useGenerateEnrollmentModules,
  useModuleInstanceNotes,
  useRecomputeEnrollmentTotal,
  useUpdateEnrollment,
  useUpdateModuleInstance,
} from "@/lib/hooks/services";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  ServiceEnrollmentStatus,
  ServiceModuleInstance,
} from "@/lib/types";
import { Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  FaBan,
  FaCalendarAlt,
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaConciergeBell,
  FaEllipsisH,
  FaHandHoldingUsd,
  FaListOl,
  FaMoneyBillWave,
  FaPlay,
  FaPlus,
  FaProjectDiagram,
  FaReceipt,
  FaStickyNote,
  FaStop,
  FaSyncAlt,
  FaTimesCircle,
  FaUserCheck,
  FaUserCog,
  FaUserPlus
} from "react-icons/fa";
import { toast } from "sonner";

/**
 * Transitions de statut **manuelles** disponibles pour chaque statut courant.
 *
 * Le statut s'ajuste automatiquement côté backend en fonction de l'état des
 * modules (start/complete/skip). Les transitions ci-dessous représentent
 * uniquement les actions qui exigent une décision humaine (suspendre,
 * annuler, réouvrir un dossier clos).
 */
type StatusAction = {
  to: ServiceEnrollmentStatus;
  label: string;
  description: string;
  tone?: "default" | "danger" | "success";
  icon: React.ElementType;
};

const STATUS_MANUAL_ACTIONS: Record<ServiceEnrollmentStatus, StatusAction[]> = {
  pending: [
    {
      to: "cancelled",
      label: "Annuler le dossier",
      description:
        "Le dossier sera marqué comme annulé. Aucune étape ne pourra plus changer son statut automatiquement.",
      tone: "danger",
      icon: FaBan,
    },
  ],
  in_progress: [
    {
      to: "suspended",
      label: "Suspendre",
      description:
        "Suspend temporairement le suivi. Le statut ne sera plus mis à jour automatiquement tant que vous n'aurez pas réactivé.",
      icon: FaSyncAlt,
    },
    {
      to: "cancelled",
      label: "Annuler le dossier",
      description: "Action irréversible.",
      tone: "danger",
      icon: FaBan,
    },
  ],
  suspended: [
    {
      to: "in_progress",
      label: "Réactiver",
      description:
        "Le dossier reprend son cours. Le statut redeviendra dynamique selon les étapes.",
      tone: "success",
      icon: FaPlay,
    },
    {
      to: "cancelled",
      label: "Annuler le dossier",
      description: "Action irréversible.",
      tone: "danger",
      icon: FaBan,
    },
  ],
  completed: [
    {
      to: "in_progress",
      label: "Réouvrir le dossier",
      description:
        "Permet de modifier à nouveau les étapes. Le dossier redeviendra « En cours ».",
      icon: FaSyncAlt,
    },
  ],
  cancelled: [
    {
      to: "pending",
      label: "Réouvrir le dossier",
      description: "Le dossier sera réinitialisé en attente.",
      icon: FaSyncAlt,
    },
  ],
};

export default function EnrollmentDetailPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.SERVICE_ENROLLMENTS.VIEW}>
      <EnrollmentDetailPage />
    </PermissionGuard>
  );
}

function EnrollmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const enrollmentId = params.enrollmentId as string;
  const { formatCurrency } = useCurrencyFormatter();
  const { can } = useOrgPermissions();

  const canManage = can(PERMISSIONS.SERVICE_ENROLLMENTS.MANAGE);
  const canManageTx = can(PERMISSIONS.SERVICE_TRANSACTIONS.MANAGE);
  const canConfirmTx = can(PERMISSIONS.SERVICE_TRANSACTIONS.CONFIRM);

  const { data: enrollment, isLoading, error } = useEnrollment(orgId, enrollmentId);
  const txQuery = useEnrollmentTransactions(orgId, enrollmentId);
  const generateModules = useGenerateEnrollmentModules(orgId);
  const recomputeTotal = useRecomputeEnrollmentTotal(orgId);
  const updateEnrollment = useUpdateEnrollment(orgId);
  const deleteEnrollment = useDeleteEnrollment(orgId);

  const [txOpen, setTxOpen] = useState(false);
  const [txModuleTarget, setTxModuleTarget] = useState<string | undefined>();
  const [txAutoFill, setTxAutoFill] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const moduleInstances = useMemo(
    () => (enrollment?.module_instances ?? []).slice().sort((a, b) => a.order - b.order),
    [enrollment]
  );

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

  if (isLoading || !enrollment) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  const summary = enrollment.modules_summary;
  // Le backend peut renvoyer un solde négatif si le client a sur-payé.
  // On distingue : balance restante (≥ 0, à encaisser) et excédent (> 0
  // si trop perçu) pour ne jamais afficher de chiffre négatif aux yeux
  // de l'utilisateur.
  const rawBalance = Number(enrollment.balance_due);
  const balanceDue = Math.max(0, rawBalance);
  const overpaid = Math.max(0, -rawBalance);
  const totalPaid = Number(enrollment.total_paid);
  const totalDue = Number(enrollment.total_due);

  const handleStatusChange = async (next: ServiceEnrollmentStatus) => {
    try {
      const data: Record<string, unknown> = { status: next };
      if (next === "completed" && !enrollment.end_date) {
        data.end_date = new Date().toISOString().slice(0, 10);
      }
      await updateEnrollment.mutateAsync({
        id: enrollment.id,
        data,
      });
      toast.success("Statut mis à jour.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error("Action impossible", { description: e?.message });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEnrollment.mutateAsync(enrollment.id);
      toast.success("Inscription supprimée.");
      router.push(`/organisation/${orgId}/services/enrollments`);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string }; message?: string };
      toast.error("Suppression impossible", {
        description: e?.data?.detail || e?.message,
      });
    }
  };

  const tabs: DetailPageTab[] = [
    {
      value: "modules",
      label: "Étapes",
      icon: FaListOl,
      content: (
        <ModulesTab
          orgId={orgId}
          enrollmentId={enrollment.id}
          serviceId={enrollment.service}
          modules={moduleInstances}
          canManage={canManage}
          onAddTx={(moduleId) => {
            setTxModuleTarget(moduleId);
            setTxAutoFill(false);
            setTxOpen(true);
          }}
        />
      ),
    },
    {
      value: "transactions",
      label: "Finance",
      icon: FaMoneyBillWave,
      content: (
        <TransactionsTab
          orgId={orgId}
          transactions={txQuery.data?.results ?? []}
          isLoading={txQuery.isLoading}
          totalDue={totalDue}
          totalPaid={totalPaid}
          balanceDue={balanceDue}
          canManageTx={canManageTx}
          canConfirmTx={canConfirmTx}
          onAddTx={() => {
            setTxModuleTarget(undefined);
            setTxAutoFill(false);
            setTxOpen(true);
          }}
          onSettle={() => {
            // « Solder » en un clic : on ouvre le dialog avec le solde
            // pré-rempli, l'utilisateur n'a plus qu'à valider.
            setTxModuleTarget(undefined);
            setTxAutoFill(true);
            setTxOpen(true);
          }}
        />
      ),
    },
    {
      value: "info",
      label: "Informations",
      icon: FaUserCheck,
      content: <InfoTab enrollment={enrollment} />,
    },
  ];

  return (
    <>
      <DetailPageLayout
        title={enrollment.customer_info.name}
        subtitle={`${enrollment.service_info.name} · ${enrollment.reference}`}
        backLink={`/organisation/${orgId}/services/enrollments`}
        icon={FaUserPlus}
        badge={
          <div className="flex items-center gap-2">
            <EnrollmentStatusBadge status={enrollment.status} />
            <PaymentModeBadge mode={enrollment.payment_mode} />
          </div>
        }
        actions={[
          ...(canManageTx
            ? [
                {
                  label: "Encaisser",
                  icon: FaHandHoldingUsd,
                  onClick: () => {
                    setTxModuleTarget(undefined);
                    setTxAutoFill(false);
                    setTxOpen(true);
                  },
                },
              ]
            : []),
          ...(canManage
            ? [
                {
                  label: "Modifier",
                  icon: FaUserCog,
                  onClick: () => setEditOpen(true),
                  variant: "outline" as const,
                },
              ]
            : []),
        ]}
        headerExtras={
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {enrollment.start_date && (
              <span className="inline-flex items-center gap-1.5">
                <FaCalendarAlt className="h-3 w-3" />
                Démarré le{" "}
                <strong>
                  {new Date(enrollment.start_date).toLocaleDateString("fr-FR")}
                </strong>
              </span>
            )}
            {enrollment.expected_end_date && (
              <span className="inline-flex items-center gap-1.5">
                <FaClock className="h-3 w-3" />
                Fin prévue :{" "}
                <strong>
                  {new Date(enrollment.expected_end_date).toLocaleDateString(
                    "fr-FR"
                  )}
                </strong>
              </span>
            )}
            {enrollment.assignee_info?.user && (
              <span className="inline-flex items-center gap-1.5">
                <FaUserCog className="h-3 w-3" />
                Responsable :{" "}
                <strong>{enrollment.assignee_info.user.name}</strong>
              </span>
            )}
            <GenerateDocumentButton
              orgId={orgId}
              docType="service_enrollment_invoice"
              objectId={enrollment.id}
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 ml-auto"
              modalTitle="Facture de service"
              modalSubtitle={`${enrollment.reference} · ${enrollment.customer_info.name}`}
            >
              Facture
            </GenerateDocumentButton>
          </div>
        }
        summaryCards={
          <>
            <SummaryCard
              label="Avancement"
              value={`${summary.progress_pct.toFixed(0)}%`}
              extra={
                <ProgressBar value={summary.progress_pct} className="mt-2" />
              }
              hint={`${summary.completed} / ${summary.total} étapes`}
              icon={<FaProjectDiagram className="h-4 w-4 text-amber-600" />}
            />
            <SummaryCard
              label="Total dû"
              value={formatCurrency(totalDue)}
              hint={enrollment.payment_mode_display}
              icon={<FaMoneyBillWave className="h-4 w-4 text-muted-foreground" />}
            />
            <SummaryCard
              label="Payé"
              value={formatCurrency(totalPaid)}
              hint="Transactions confirmées"
              icon={<FaHandHoldingUsd className="h-4 w-4 text-green-600" />}
              valueClassName="text-green-700"
            />
            <SummaryCard
              label={overpaid > 0 ? "Excédent client" : "Reste à payer"}
              value={
                overpaid > 0
                  ? `+${formatCurrency(overpaid)}`
                  : formatCurrency(balanceDue)
              }
              hint={
                overpaid > 0
                  ? "Trop-perçu — à rembourser"
                  : balanceDue === 0
                    ? "Soldé"
                    : "À encaisser"
              }
              icon={<FaCalendarAlt className="h-4 w-4 text-amber-600" />}
              valueClassName={
                overpaid > 0
                  ? "text-blue-700"
                  : balanceDue === 0
                    ? "text-green-700"
                    : "text-amber-700"
              }
            />
          </>
        }
        banners={
          <EnrollmentStatusBanner
            enrollment={enrollment}
            canManage={canManage}
            onChangeStatus={handleStatusChange}
            isPending={updateEnrollment.isPending}
            onRecomputeTotal={async () => {
              try {
                await recomputeTotal.mutateAsync(enrollment.id);
                toast.success("Total recalculé.");
              } catch (err: unknown) {
                const e = err as { message?: string };
                toast.error("Échec", { description: e?.message });
              }
            }}
            recomputeIsPending={recomputeTotal.isPending}
          />
        }
        tabs={tabs}
        audit={{
          created_at: enrollment.created_at,
          updated_at: enrollment.updated_at,
          created_by_info: enrollment.created_by_info,
          updated_by_info: enrollment.updated_by_info,
        }}
      />

      <AddTransactionDialog
        open={txOpen}
        onOpenChange={setTxOpen}
        orgId={orgId}
        enrollmentId={enrollment.id}
        moduleInstanceId={txModuleTarget}
        autoFillBalance={txAutoFill}
        fillBalanceLabel={txAutoFill ? "Solder le dossier" : "Solder"}
        remainingBalance={(() => {
          // Solde cible : module si on encaisse une étape spécifique,
          // sinon solde global de l'inscription. Toujours ≥ 0.
          if (txModuleTarget) {
            const m = moduleInstances.find((mi) => mi.id === txModuleTarget);
            return m ? Math.max(0, Number(m.balance_due)) : undefined;
          }
          return balanceDue;
        })()}
      />

      <EditEnrollmentDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        orgId={orgId}
        enrollment={enrollment}
        onSave={async (data) => {
          try {
            await updateEnrollment.mutateAsync({ id: enrollment.id, data });
            toast.success("Inscription mise à jour.");
            setEditOpen(false);
          } catch (err: unknown) {
            const e = err as { message?: string };
            toast.error("Échec", { description: e?.message });
          }
        }}
        onRequestDelete={() => {
          setEditOpen(false);
          setConfirmDeleteOpen(true);
        }}
        isPending={updateEnrollment.isPending}
      />

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette inscription ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Impossible si des transactions sont
              déjà rattachées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={deleteEnrollment.isPending}
              onClick={async () => {
                setConfirmDeleteOpen(false);
                await handleDelete();
              }}
            >
              {deleteEnrollment.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Bandeau "statut" : auto-détection + actions manuelles uniquement ───────

function EnrollmentStatusBanner({
  enrollment,
  canManage,
  onChangeStatus,
  isPending,
  onRecomputeTotal,
  recomputeIsPending,
}: {
  enrollment: import("@/lib/types").ServiceEnrollment;
  canManage: boolean;
  onChangeStatus: (next: ServiceEnrollmentStatus) => Promise<void>;
  isPending: boolean;
  onRecomputeTotal: () => Promise<void>;
  recomputeIsPending: boolean;
}) {
  const [actionMenu, setActionMenu] = useState<StatusAction | null>(null);
  const actions = STATUS_MANUAL_ACTIONS[enrollment.status] ?? [];
  const status = enrollment.status;
  const isManualLock = status === "cancelled" || status === "suspended";

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 border bg-card p-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <EnrollmentStatusBadge status={status} className="text-sm py-1 px-2.5" />
          <div className="text-xs text-muted-foreground min-w-0">
            {isManualLock ? (
              <span>
                Le statut a été{" "}
                <strong className="text-foreground">défini manuellement</strong>.
                Il ne sera pas mis à jour automatiquement tant qu&apos;il
                reste dans cet état.
              </span>
            ) : (
              <span>
                Le statut s&apos;ajuste automatiquement selon l&apos;avancement
                des étapes (démarrage, validation…).
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              disabled={recomputeIsPending}
              onClick={onRecomputeTotal}
              aria-label="Recalculer le total dû"
            >
              {recomputeIsPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <FaSyncAlt className="h-3 w-3 mr-1.5" />
              )}
              Recalculer le total
            </Button>
          )}
          {canManage && actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="default" disabled={isPending}>
                  <FaEllipsisH className="h-3 w-3 mr-1.5" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Statut du dossier</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <DropdownMenuItem
                      key={action.to}
                      onSelect={(e) => {
                        e.preventDefault();
                        setActionMenu(action);
                      }}
                      className={
                        action.tone === "danger"
                          ? "text-destructive focus:text-destructive"
                          : ""
                      }
                    >
                      <Icon className="h-3.5 w-3.5 mr-2" />
                      {action.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <ConfirmActionDialog
        open={!!actionMenu}
        onOpenChange={(o) => !o && setActionMenu(null)}
        title={actionMenu?.label ?? ""}
        description={actionMenu?.description ?? ""}
        icon={
          actionMenu ? <actionMenu.icon className="h-4 w-4" /> : undefined
        }
        confirmLabel={actionMenu?.label ?? "Confirmer"}
        tone={actionMenu?.tone}
        details={
          actionMenu ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Statut actuel</span>
              <EnrollmentStatusBadge status={status} />
              <span className="text-muted-foreground">→</span>
              <EnrollmentStatusBadge status={actionMenu.to} />
            </div>
          ) : null
        }
        onConfirm={async () => {
          if (!actionMenu) return;
          try {
            await onChangeStatus(actionMenu.to);
          } catch (err) {
            throw err;
          }
        }}
      />
    </>
  );
}

// ─── Tab : Modules ───────────────────────────────────────────────────────────

function ModulesTab({
  orgId,
  enrollmentId,
  serviceId,
  modules,
  canManage,
  onAddTx,
}: {
  orgId: string;
  enrollmentId: string;
  serviceId: string;
  modules: ServiceModuleInstance[];
  canManage: boolean;
  onAddTx: (moduleId: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const deleteInstance = useDeleteModuleInstance(orgId, enrollmentId);
  const [pendingDelete, setPendingDelete] =
    useState<ServiceModuleInstance | null>(null);

  return (
    <div className="space-y-3">
      {/* En-tête : bouton "Ajouter une étape" toujours visible quand canManage */}
      {canManage && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
          <div className="text-sm">
            <strong>{modules.length}</strong> étape{modules.length > 1 ? "s" : ""}
            {" "}sélectionnée{modules.length > 1 ? "s" : ""} pour ce client.
            <span className="text-muted-foreground ml-1">
              Ajoutez les étapes une par une selon les besoins.
            </span>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <FaPlus className="h-3 w-3 mr-1.5" />
            Ajouter une étape
          </Button>
        </div>
      )}

      {modules.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <FaListOl className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="font-medium">Aucune étape pour le moment</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Ajoutez les étapes au fur et à mesure des besoins du client,
              au lieu de tout générer d&apos;un coup.
            </p>
            {canManage && (
              <Button onClick={() => setAddOpen(true)}>
                <FaPlus className="h-3 w-3 mr-1.5" />
                Ajouter la première étape
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        modules.map((m) => (
          <ModuleCard
            key={m.id}
            orgId={orgId}
            enrollmentId={enrollmentId}
            instance={m}
            canManage={canManage}
            onAddTx={() => onAddTx(m.id)}
            onRemove={() => setPendingDelete(m)}
          />
        ))
      )}

      <AddServiceModuleDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        orgId={orgId}
        enrollmentId={enrollmentId}
        serviceId={serviceId}
        existingInstances={modules}
      />

      <ConfirmActionDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={`Retirer « ${pendingDelete?.name ?? ""} » ?`}
        description="L'étape sera retirée de l'inscription et ne sera plus comptabilisée dans le total dû. Action possible uniquement si l'étape est en attente et sans transaction liée."
        icon={<FaListOl className="h-4 w-4 text-red-600" />}
        confirmLabel="Retirer cette étape"
        tone="danger"
        details={
          pendingDelete ? (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Statut</span>
                <ModuleStatusBadge status={pendingDelete.status} />
              </div>
              {pendingDelete.price != null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prix</span>
                  <span className="font-semibold">
                    {pendingDelete.price}
                  </span>
                </div>
              )}
            </div>
          ) : null
        }
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteInstance.mutateAsync(pendingDelete.id);
            toast.success("Étape retirée.");
          } catch (err: unknown) {
            const e = err as {
              data?: { detail?: string };
              message?: string;
            };
            toast.error("Suppression impossible", {
              description: e?.data?.detail || e?.message,
            });
            throw err;
          }
        }}
      />
    </div>
  );
}

function ModuleCard({
  orgId,
  enrollmentId,
  instance,
  canManage,
  onAddTx,
  onRemove,
}: {
  orgId: string;
  enrollmentId: string;
  instance: ServiceModuleInstance;
  canManage: boolean;
  onAddTx: () => void;
  /** Callback : retirer cette étape de l'inscription. */
  onRemove?: () => void;
}) {
  const { formatCurrency } = useCurrencyFormatter();
  const [notesOpen, setNotesOpen] = useState(false);
  // Le reste à payer ne s'affiche jamais négatif : si le module est sur-payé,
  // on montre 0 et on affiche un excédent visible séparément.
  const rawBalance = Number(instance.balance_due);
  const balance = Math.max(0, rawBalance);
  const overpaid = Math.max(0, -rawBalance);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start gap-4 pb-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
          {instance.order + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-base">{instance.name}</CardTitle>
            <ModuleStatusBadge status={instance.status} />
            {instance.is_required ? (
              <span className="text-[10px] uppercase tracking-wide text-primary bg-primary/10 rounded px-1.5 py-0.5">
                Obligatoire
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                Optionnel
              </span>
            )}
          </div>
          {instance.description && (
            <CardDescription className="mt-1 line-clamp-2">
              {instance.description}
            </CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <div className="text-muted-foreground">Durée estimée</div>
            <div className="font-medium">
              {instance.estimated_duration_days != null
                ? `${instance.estimated_duration_days} j`
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Prix</div>
            <div className="font-medium">
              {instance.price != null
                ? formatCurrency(Number(instance.price))
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Payé</div>
            <div className="font-medium text-green-700">
              {formatCurrency(Number(instance.amount_paid))}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">
              {overpaid > 0 ? "Excédent" : "Reste"}
            </div>
            <div
              className={`font-medium ${
                overpaid > 0
                  ? "text-blue-700"
                  : balance > 0
                    ? "text-amber-700"
                    : "text-green-700"
              }`}
            >
              {overpaid > 0
                ? `+${formatCurrency(overpaid)}`
                : formatCurrency(balance)}
            </div>
          </div>
        </div>

        {instance.status === "blocked" && instance.blocked_reason && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 text-xs text-red-800 dark:text-red-200 space-y-1">
            <div>
              <strong>Motif du blocage :</strong> {instance.blocked_reason}
            </div>
            <AuditLine
              verb="Bloqué par"
              user={instance.blocked_by_info}
              at={instance.suspended_at}
              icon={<FaStop className="h-3 w-3" />}
              className="text-red-700 dark:text-red-300"
            />
          </div>
        )}

        {/* Pile d'audit des transitions de workflow.
            On garde l'historique complet (démarrage, validation, blocage,
            réouverture) même après une réouverture pour conserver la
            traçabilité des actions précédentes. */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <AuditLine
            verb="Démarré par"
            user={instance.started_by_info}
            at={instance.started_at}
            icon={<FaPlay className="h-3 w-3 text-amber-600" />}
          />
          <AuditLine
            verb="Terminé par"
            user={instance.completed_by_info}
            at={instance.completed_at}
            icon={<FaCheck className="h-3 w-3 text-green-600" />}
          />
          <AuditLine
            verb="Réouvert par"
            user={instance.reopened_by_info}
            at={instance.reopened_at}
            icon={<FaSyncAlt className="h-3 w-3 text-blue-600" />}
          />
        </div>

        {instance.assignee_info?.user && (
          <div className="text-xs text-muted-foreground">
            Assigné à <strong>{instance.assignee_info.user.name}</strong>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 justify-between">
          <ModuleWorkflowActions
            orgId={orgId}
            enrollmentId={enrollmentId}
            instance={instance}
            disabled={!canManage}
            size="sm"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotesOpen(true)}
            >
              <FaStickyNote className="h-3 w-3 mr-1.5" />
              Notes ({instance.notes_count})
            </Button>
            <Button variant="outline" size="sm" onClick={onAddTx}>
              <FaHandHoldingUsd className="h-3 w-3 mr-1.5" />
              Encaisser
            </Button>
            {canManage && onRemove && instance.status === "pending" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                aria-label={`Retirer l'étape ${instance.name}`}
                className="text-destructive hover:text-destructive"
              >
                <FaTimesCircle className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <ModuleNotesDialog
        open={notesOpen}
        onOpenChange={setNotesOpen}
        orgId={orgId}
        instanceId={instance.id}
        instanceName={instance.name}
      />
    </Card>
  );
}

function ModuleNotesDialog({
  open,
  onOpenChange,
  orgId,
  instanceId,
  instanceName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  orgId: string;
  instanceId: string;
  instanceName: string;
}) {
  const { data: notes, isLoading } = useModuleInstanceNotes(
    orgId,
    open ? instanceId : undefined
  );
  const addNote = useAddModuleInstanceNote(orgId, instanceId);
  const [content, setContent] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Notes — {instanceName}</DialogTitle>
          <DialogDescription>
            Historique des notes ajoutées sur cette étape.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (notes?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune note pour le moment.
            </p>
          ) : (
            notes!.map((n) => (
              <div key={n.id} className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  {n.author_info?.user?.name || "Auteur inconnu"} ·{" "}
                  {new Date(n.created_at).toLocaleString("fr-FR")}
                </div>
                <div className="text-sm whitespace-pre-wrap">{n.content}</div>
              </div>
            ))
          )}
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const text = content.trim();
            if (!text) return;
            try {
              await addNote.mutateAsync({ content: text });
              setContent("");
              toast.success("Note ajoutée.");
            } catch (err: unknown) {
              const e = err as { message?: string };
              toast.error("Échec", { description: e?.message });
            }
          }}
          className="space-y-2"
        >
          <Label htmlFor="new-note" className="text-sm">
            Ajouter une note
          </Label>
          <Textarea
            id="new-note"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Que voulez-vous noter ?"
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </Button>
            <Button type="submit" disabled={addNote.isPending || !content.trim()}>
              {addNote.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Ajouter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab : Transactions ──────────────────────────────────────────────────────

function TransactionsTab({
  orgId,
  transactions,
  isLoading,
  totalDue,
  totalPaid,
  balanceDue,
  canManageTx,
  canConfirmTx,
  onAddTx,
  onSettle,
}: {
  orgId: string;
  transactions: import("@/lib/types").ServiceTransaction[];
  isLoading: boolean;
  totalDue: number;
  totalPaid: number;
  balanceDue: number;
  canManageTx: boolean;
  canConfirmTx: boolean;
  onAddTx: () => void;
  /** Solder en un clic : pré-remplit le dialog avec le solde restant. */
  onSettle: () => void;
}) {
  const { formatCurrency } = useCurrencyFormatter();
  const confirm = useConfirmServiceTransaction(orgId);
  const cancel = useCancelServiceTransaction(orgId);
  const [pendingConfirmTx, setPendingConfirmTx] =
    useState<import("@/lib/types").ServiceTransaction | null>(null);
  const [pendingCancelTx, setPendingCancelTx] =
    useState<import("@/lib/types").ServiceTransaction | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FaMoneyBillWave className="h-4 w-4" />
            Transactions
          </CardTitle>
          <CardDescription>
            Suivi des paiements et mouvements liés à cette inscription.
          </CardDescription>
        </div>
        {canManageTx && (
          <div className="flex flex-wrap items-center gap-2">
            {balanceDue > 0 && (
              <Button
                size="sm"
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={onSettle}
                aria-label={`Solder le dossier : ${formatCurrency(balanceDue)}`}
              >
                <FaCheckCircle className="h-3 w-3 mr-1.5" />
                Solder · {formatCurrency(balanceDue)}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onAddTx}>
              <FaHandHoldingUsd className="h-3 w-3 mr-1.5" />
              Nouvelle transaction
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <KpiBox label="Total dû" value={formatCurrency(totalDue)} />
          <KpiBox
            label="Encaissé"
            value={formatCurrency(totalPaid)}
            tone="positive"
          />
          <KpiBox
            label={balanceDue === 0 && totalPaid > totalDue ? "Excédent" : "Reste à payer"}
            value={
              balanceDue === 0 && totalPaid > totalDue
                ? `+${formatCurrency(totalPaid - totalDue)}`
                : formatCurrency(balanceDue)
            }
            tone={
              balanceDue === 0 && totalPaid > totalDue
                ? "positive"
                : balanceDue === 0
                  ? "positive"
                  : "warning"
            }
          />
        </div>

        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-lg">
            <FaMoneyBillWave className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-60" />
            <p className="text-sm font-medium">Aucune transaction</p>
            <p className="text-xs text-muted-foreground mt-1">
              Les paiements et dépenses apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-lg border p-3 hover:bg-muted/30 transition"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="flex flex-col gap-1 shrink-0">
                    <TransactionTypeBadge type={t.transaction_type} />
                    <TransactionStatusBadge status={t.status} />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="text-sm font-medium truncate">
                      {t.reference || t.description || t.module_name || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(t.transaction_date).toLocaleDateString("fr-FR")}{" "}
                      · {t.payment_method_display}
                    </div>
                    {/* Audit explicite : qui a validé / annulé. */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
                      <AuditLine
                        verb="Enregistrée par"
                        user={t.created_by_info}
                        at={t.created_at}
                        icon={<FaHandHoldingUsd className="h-3 w-3" />}
                      />
                      <AuditLine
                        verb="Validée par"
                        user={t.confirmed_by_info}
                        at={t.confirmed_at}
                        icon={<FaCheckCircle className="h-3 w-3 text-green-600" />}
                      />
                      <AuditLine
                        verb="Annulée par"
                        user={t.cancelled_by_info}
                        at={t.cancelled_at}
                        icon={<FaBan className="h-3 w-3 text-red-600" />}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-base font-semibold ${
                      t.direction === "in" ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {t.direction === "in" ? "+" : "−"}
                    {formatCurrency(Number(t.amount))}
                  </span>
                  {t.status === "confirmed" && (
                    <GenerateDocumentButton
                      orgId={orgId}
                      docType="service_transaction_receipt"
                      objectId={t.id}
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      hideIcon
                      aria-label="Imprimer le reçu"
                      modalTitle="Reçu de transaction"
                      modalSubtitle={t.reference || t.transaction_type_display}
                    >
                      <FaReceipt className="h-3.5 w-3.5" />
                    </GenerateDocumentButton>
                  )}
                  {canConfirmTx && t.status === "pending" && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setPendingConfirmTx(t)}
                      aria-label="Valider"
                    >
                      <FaCheckCircle className="h-3 w-3" />
                    </Button>
                  )}
                  {canConfirmTx && t.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingCancelTx(t)}
                      aria-label="Annuler"
                    >
                      <FaTimesCircle className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* ── Confirmation : valider une transaction ─────────────────────── */}
      <ConfirmActionDialog
        open={!!pendingConfirmTx}
        onOpenChange={(o) => !o && setPendingConfirmTx(null)}
        title="Valider la transaction ?"
        description="La transaction sera comptabilisée immédiatement et affectera le solde."
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

      {/* ── Confirmation : annuler une transaction ─────────────────────── */}
      <ConfirmActionDialog
        open={!!pendingCancelTx}
        onOpenChange={(o) => !o && setPendingCancelTx(null)}
        title="Annuler cette transaction ?"
        description="L'opération sera marquée comme annulée et exclue du solde. Action irréversible."
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
    </Card>
  );
}

function KpiBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "warning";
}) {
  const valueClass =
    tone === "positive"
      ? "text-green-700"
      : tone === "warning"
        ? "text-amber-700"
        : "";
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

// ─── Tab : Info ──────────────────────────────────────────────────────────────

function InfoTab({
  enrollment,
}: {
  enrollment: import("@/lib/types").ServiceEnrollment;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2 text-sm">
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <FaUserCheck className="h-3 w-3" /> Client
          </h4>
          <dl className="space-y-1 text-muted-foreground">
            <Field label="Nom" value={enrollment.customer_info.name} />
            <Field
              label="Type"
              value={enrollment.customer_info.customer_type}
            />
            <Field label="Email" value={enrollment.customer_info.email} />
            <Field
              label="Téléphone"
              value={enrollment.customer_info.phone}
            />
          </dl>
        </div>
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <FaConciergeBell className="h-3 w-3" /> Service
          </h4>
          <dl className="space-y-1 text-muted-foreground">
            <Field label="Nom" value={enrollment.service_info.name} />
            <Field label="Code" value={enrollment.service_info.code} />
            <Field
              label="Mode"
              value={enrollment.payment_mode_display}
            />
          </dl>
        </div>
        <div className="md:col-span-2">
          <h4 className="font-semibold mb-2">Notes</h4>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {enrollment.notes || "—"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{label}</dt>
      <dd className="font-medium text-foreground text-right wrap-break-word">
        {value || "—"}
      </dd>
    </div>
  );
}

// ─── Edit dialog ─────────────────────────────────────────────────────────────

function EditEnrollmentDialog({
  open,
  onOpenChange,
  orgId,
  enrollment,
  onSave,
  onRequestDelete,
  isPending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  orgId: string;
  enrollment: import("@/lib/types").ServiceEnrollment;
  onSave: (data: import("@/lib/types").UpdateServiceEnrollmentData) => Promise<void>;
  onRequestDelete: () => void;
  isPending: boolean;
}) {
  const members = usePaginatedMembers(orgId, undefined, { pageSize: 100 });
  const [startDate, setStartDate] = useState(enrollment.start_date ?? "");
  const [expectedEndDate, setExpectedEndDate] = useState(
    enrollment.expected_end_date ?? ""
  );
  const [endDate, setEndDate] = useState(enrollment.end_date ?? "");
  const [assignee, setAssignee] = useState(enrollment.assignee ?? "");
  const [notes, setNotes] = useState(enrollment.notes);
  const updateModule = useUpdateModuleInstance(orgId, enrollment.id);

  const memberItems: QuickSelectItem[] = useMemo(
    () =>
      members.data.map((m) => {
        const u = m.employee?.user;
        const fullName =
          [u?.first_name, u?.last_name].filter(Boolean).join(" ") || "—";
        return { id: m.id, name: fullName, subtitle: u?.email };
      }),
    [members.data]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l&apos;inscription</DialogTitle>
          <DialogDescription>
            Mettez à jour le planning, le responsable ou les notes.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            await onSave({
              start_date: startDate || null,
              expected_end_date: expectedEndDate || null,
              end_date: endDate || null,
              assignee: assignee || null,
              notes,
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ed-start">Date de début</Label>
              <Input
                id="ed-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-expected">Date prévue</Label>
              <Input
                id="ed-expected"
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ed-end">Date de fin réelle</Label>
            <Input
              id="ed-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Responsable</Label>
            <QuickSelect
              label="Responsable"
              items={memberItems}
              selectedId={assignee}
              onSelect={setAssignee}
              placeholder="Rechercher un employé..."
              icon={FaUserCog}
              accentColor="purple"
              canCreate={false}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ed-notes">Notes</Label>
            <Textarea
              id="ed-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={onRequestDelete}
              disabled={isPending || updateModule.isPending}
            >
              Supprimer
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  icon,
  extra,
  valueClassName,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  extra?: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueClassName ?? ""}`}>{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        {extra}
      </CardContent>
    </Card>
  );
}
