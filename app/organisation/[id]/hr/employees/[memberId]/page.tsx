"use client";

import { BadgeStatus } from "@/components/BadgeStatus";
import { DetailPageLayout } from "@/components/layout/DetailPageLayout";
import { Can, useOrgPermissions } from "@/components/permissions";
import { AuditBadge } from "@/components/services/AuditBadge";
import { Badge } from "@/components/ui/badge";
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
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { MemberWarehouseAccessSection } from "@/components/inventory/MemberWarehouseAccessSection";
import { InfoField } from "@/components/ui/info-field";
import { PermissionsBadgeList } from "@/components/ui/permissions-badge-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMember,
  useMemberAdvanceRequests,
  useMemberAssignments,
  useMemberContracts,
  useMemberPayments,
  useRemoveMember,
  useUpdateMember,
} from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  AdvanceRequest,
  Contract,
  Payment,
  PositionAssignment,
} from "@/lib/types";
import {
  Briefcase,
  Calendar,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  HandCoins,
  Mail,
  Phone,
  Plus,
  Shield,
  ShieldAlert,
  Trash2,
  User,
  UserCheck,
  UserX,
  Wallet,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAmount(amount: string | number): string {
  return Number(amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function contractStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active": return "default";
    case "suspended": return "secondary";
    case "terminated": return "destructive";
    default: return "outline";
  }
}

function paymentStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved": return "default";
    case "pending": return "secondary";
    case "rejected": return "destructive";
    default: return "outline";
  }
}

// ─── Quick Action Button ─────────────────────────────────────────────────────

function QuickAction({
  label,
  description,
  icon: Icon,
  onClick,
  variant = "default",
}: {
  label: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: "default" | "success" | "warning";
}) {
  const variantClasses = {
    default: "bg-primary/10 text-primary hover:bg-primary/15",
    success: "bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/20 dark:text-green-400",
    warning: "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400",
  };

  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors text-left"
    >
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${variantClasses[variant]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  icon: Icon,
  subtitle,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  tone?: "default" | "green" | "amber" | "blue";
}) {
  const toneBg = {
    default: "bg-muted text-muted-foreground",
    green: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${toneBg[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const memberId = params.memberId as string;
  const { can } = useOrgPermissions();
  const canManage = can(PERMISSIONS.HR.MANAGE_EMPLOYEES);

  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [confirmToggleStatusOpen, setConfirmToggleStatusOpen] = useState(false);

  // ── Queries ──
  const { data: member, isLoading, error } = useMember(orgId, memberId);
  const { data: contractsRaw } = useMemberContracts(orgId, memberId);
  const { data: paymentsRaw } = useMemberPayments(orgId, memberId);
  const { data: advancesRaw } = useMemberAdvanceRequests(orgId, memberId);
  const { data: assignmentsRaw } = useMemberAssignments(orgId, memberId);

  const contracts: Contract[] = Array.isArray(contractsRaw)
    ? contractsRaw
    : ((contractsRaw as any)?.results || []);
  const payments: Payment[] = Array.isArray(paymentsRaw)
    ? paymentsRaw
    : ((paymentsRaw as any)?.results || []);
  const advances: AdvanceRequest[] = Array.isArray(advancesRaw)
    ? advancesRaw
    : ((advancesRaw as any)?.results || []);
  const assignments: PositionAssignment[] = Array.isArray(assignmentsRaw)
    ? assignmentsRaw
    : ((assignmentsRaw as any)?.results || []);

  // ── Mutations ──
  const updateMember = useUpdateMember();
  const removeMember = useRemoveMember();

  // ── Computed stats ──
  const stats = useMemo(() => {
    const activeContracts = contracts.filter((c) => c.status === "active");
    const currentContract = activeContracts[0];
    const approvedPayments = payments.filter((p) => p.status === "approved");
    const totalPaid = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingAdvances = advances.filter((a) => a.status === "pending");
    const activeAssignments = assignments.filter((a) => !a.end_date);

    return {
      currentContract,
      activeContractsCount: activeContracts.length,
      totalPaid,
      approvedPaymentsCount: approvedPayments.length,
      pendingAdvancesCount: pendingAdvances.length,
      activePosition: activeAssignments[0]?.position?.name,
      activePositionsCount: activeAssignments.length,
    };
  }, [contracts, payments, advances, assignments]);

  // ── Handlers ──
  const handleToggleStatus = async () => {
    if (!member) return;
    try {
      await updateMember.mutateAsync({
        orgId,
        memberId,
        data: { is_active: !member.is_active },
      });
      toast.success(
        member.is_active ? "Employé désactivé avec succès" : "Employé activé avec succès"
      );
      setConfirmToggleStatusOpen(false);
    } catch {
      toast.error("Erreur lors de la modification du statut");
    }
  };

  const handleRemove = async () => {
    try {
      await removeMember.mutateAsync({ orgId, memberId });
      toast.success("Employé retiré de l'organisation");
      setConfirmRemoveOpen(false);
      router.push(`/organisation/${orgId}/hr/employees`);
    } catch {
      toast.error("Erreur lors de la suppression de l'employé");
    }
  };

  // ── Loading / Error states ──
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              Erreur lors du chargement des informations de l'employé :{" "}
              {error?.message || "Employé introuvable"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { employee, role, extra_permissions, all_permissions, is_active, joined_at } = member;
  const { user } = employee;
  const fullName = `${user.first_name} ${user.last_name}`;

  return (
    <DetailPageLayout
      title={fullName}
      subtitle="Consultez et gérez les informations de l'employé"
      backLink={`/organisation/${orgId}/hr/employees`}
      badge={
        <div className="flex items-center gap-2">
          <BadgeStatus status={is_active} />
          {role && (
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              {role.name}
            </Badge>
          )}
          {stats.activePosition && (
            <Badge variant="secondary" className="gap-1">
              <Briefcase className="h-3 w-3" />
              {stats.activePosition}
            </Badge>
          )}
        </div>
      }
      avatar={<EntityAvatar src={user.avatar_url} fallback={fullName} size="xl" />}
      actions={
        canManage
          ? [
              {
                label: "Modifier",
                icon: FaEdit,
                onClick: () => router.push(`/organisation/${orgId}/hr/employees/${memberId}/edit`),
                variant: "outline",
              },
              {
                label: is_active ? "Désactiver" : "Activer",
                icon: is_active ? UserX : UserCheck,
                onClick: () => setConfirmToggleStatusOpen(true),
                variant: "outline",
              },
              {
                label: "Retirer",
                icon: Trash2,
                onClick: () => setConfirmRemoveOpen(true),
                variant: "destructive",
              },
            ]
          : []
      }
    >
      <div className="space-y-6">
        {/* ═══ Statistiques rapides ═══ */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Stat
            label="Contrat actif"
            value={stats.currentContract?.contract_type_display || "Aucun"}
            subtitle={
              stats.currentContract
                ? `${formatAmount(stats.currentContract.base_salary)} / mois`
                : "Aucun contrat actif"
            }
            icon={FileText}
            tone={stats.currentContract ? "blue" : "default"}
          />
          <Stat
            label="Total payé"
            value={formatAmount(stats.totalPaid)}
            subtitle={`${stats.approvedPaymentsCount} paiement${stats.approvedPaymentsCount > 1 ? "s" : ""} approuvé${stats.approvedPaymentsCount > 1 ? "s" : ""}`}
            icon={Wallet}
            tone="green"
          />
          <Stat
            label="Avances en attente"
            value={stats.pendingAdvancesCount}
            subtitle={
              stats.pendingAdvancesCount > 0 ? "À valider" : "Aucune demande"
            }
            icon={HandCoins}
            tone={stats.pendingAdvancesCount > 0 ? "amber" : "default"}
          />
          <Stat
            label="Poste actuel"
            value={stats.activePositionsCount || "—"}
            subtitle={stats.activePosition || "Non assigné"}
            icon={Briefcase}
            tone={stats.activePositionsCount ? "blue" : "default"}
          />
        </div>

        {/* ═══ Actions rapides + Infos générales ═══ */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Actions rapides */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Plus className="h-4 w-4" />
                Actions rapides
              </CardTitle>
              <CardDescription>Opérations fréquentes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Can permission={PERMISSIONS.CONTRACTS.MANAGE}>
                <QuickAction
                  label="Créer un contrat"
                  description="Nouveau contrat de travail"
                  icon={FileText}
                  onClick={() =>
                    router.push(`/organisation/${orgId}/hr/contracts/create?member=${memberId}`)
                  }
                />
              </Can>
              <Can permission={PERMISSIONS.PAYMENTS.MANAGE}>
                <QuickAction
                  label="Nouveau paiement"
                  description="Enregistrer un paiement"
                  icon={CreditCard}
                  onClick={() =>
                    router.push(`/organisation/${orgId}/hr/payroll/create-payment?member=${memberId}`)
                  }
                  variant="success"
                />
              </Can>
              <Can
                permission={[PERMISSIONS.ADVANCES.REQUEST, PERMISSIONS.ADVANCES.REVIEW]}
                mode="any"
              >
                <QuickAction
                  label="Demander une avance"
                  description="Nouvelle demande d'avance"
                  icon={HandCoins}
                  onClick={() =>
                    router.push(`/organisation/${orgId}/hr/payroll/create-advance?member=${memberId}`)
                  }
                  variant="warning"
                />
              </Can>
              <Can permission={PERMISSIONS.HR.MANAGE_EMPLOYEES}>
                <QuickAction
                  label="Gérer les assignations"
                  description="Poste et département"
                  icon={Briefcase}
                  onClick={() =>
                    router.push(`/organisation/${orgId}/hr/positions`)
                  }
                />
              </Can>
              <Can permission={PERMISSIONS.HR.MANAGE_EMPLOYEES}>
                <QuickAction
                  label="Modifier les permissions"
                  description="Rôle et droits directs"
                  icon={Shield}
                  onClick={() =>
                    router.push(`/organisation/${orgId}/hr/employees/${memberId}/edit`)
                  }
                />
              </Can>
            </CardContent>
          </Card>

          {/* Informations générales */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <User className="h-4 w-4" />
                Informations générales
              </CardTitle>
              <CardDescription>Coordonnées et informations de base</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoField label="Email" value={user.email} icon={Mail} />
                {user.phone && <InfoField label="Téléphone" value={user.phone} icon={Phone} />}
                {employee.employee_id && (
                  <InfoField label="ID Employé" value={employee.employee_id} icon={User} />
                )}
                <InfoField
                  label="Date d'arrivée"
                  value={new Date(joined_at).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  icon={Calendar}
                />
              </div>
              {member.created_by_info && (
                <div className="mt-5 pt-4 border-t">
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1.5">
                    Ajouté par
                  </p>
                  <AuditBadge
                    kind="created"
                    user={member.created_by_info}
                    at={member.created_at}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ═══ Onglets Activité + Permissions ═══ */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Activité */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Briefcase className="h-4 w-4" />
                Activité RH
              </CardTitle>
              <CardDescription>
                Contrats, paiements, avances et assignations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="contracts" className="w-full">
                <TabsList>
                  <TabsTrigger value="contracts">
                    Contrats <span className="ml-1 text-xs opacity-70">({contracts.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="payments">
                    Paiements <span className="ml-1 text-xs opacity-70">({payments.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="advances">
                    Avances <span className="ml-1 text-xs opacity-70">({advances.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="positions">
                    Postes <span className="ml-1 text-xs opacity-70">({assignments.length})</span>
                  </TabsTrigger>
                </TabsList>

                {/* Contracts */}
                <TabsContent value="contracts" className="mt-4 space-y-2">
                  {contracts.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Aucun contrat pour cet employé.
                    </div>
                  ) : (
                    contracts.slice(0, 5).map((c) => (
                      <button
                        key={c.id}
                        onClick={() =>
                          router.push(`/organisation/${orgId}/hr/contracts/${c.id}`)
                        }
                        className="w-full flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/40 transition-colors text-left"
                      >
                        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{c.contract_type_display}</p>
                            <Badge variant={contractStatusVariant(c.status)} className="text-xs">
                              {c.status_display}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(c.start_date)} → {c.end_date ? formatDate(c.end_date) : "Indéterminée"}
                            {" • "}
                            {formatAmount(c.base_salary)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))
                  )}
                </TabsContent>

                {/* Payments */}
                <TabsContent value="payments" className="mt-4 space-y-2">
                  {payments.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Aucun paiement enregistré.
                    </div>
                  ) : (
                    payments.slice(0, 5).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className="h-9 w-9 rounded-lg bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 flex items-center justify-center shrink-0">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{formatAmount(p.amount)}</p>
                            <Badge variant="secondary" className="text-xs">
                              {p.payment_type_display}
                            </Badge>
                            <Badge variant={paymentStatusVariant(p.status)} className="text-xs">
                              {p.status_display}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(p.payment_date)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* Advances */}
                <TabsContent value="advances" className="mt-4 space-y-2">
                  {advances.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Aucune demande d'avance.
                    </div>
                  ) : (
                    advances.slice(0, 5).map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <HandCoins className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{formatAmount(a.amount)}</p>
                            <Badge variant={paymentStatusVariant(a.status)} className="text-xs">
                              {a.status_display}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {formatDate(a.request_date)} • {a.reason || "—"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* Positions */}
                <TabsContent value="positions" className="mt-4 space-y-2">
                  {assignments.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Aucune assignation de poste.
                    </div>
                  ) : (
                    assignments.slice(0, 5).map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{a.position.name}</p>
                            {!a.end_date && (
                              <Badge variant="default" className="text-xs">
                                Actuel
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(a.start_date)} →{" "}
                            {a.end_date ? formatDate(a.end_date) : "En cours"}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Rôle & Permissions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Shield className="h-4 w-4" />
                Rôle & Permissions
              </CardTitle>
              <CardDescription>Accès et droits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Rôle */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                  Rôle
                </p>
                {role ? (
                  <div className="border rounded-lg p-3 bg-muted/30">
                    <p className="font-medium text-sm">{role.name}</p>
                    {role.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {role.description}
                      </p>
                    )}
                    <Badge variant="outline" className="text-xs mt-2">
                      {role.permissions.length} perm{role.permissions.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-lg p-3 text-center">
                    <p className="text-sm text-muted-foreground">Aucun rôle</p>
                  </div>
                )}
              </div>

              {/* Permissions supplémentaires */}
              {extra_permissions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                    Permissions directes ({extra_permissions.length})
                  </p>
                  <div className="grid gap-1.5 max-h-48 overflow-y-auto">
                    {extra_permissions.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center gap-2 text-xs border rounded-md p-2"
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <p className="font-medium truncate">{perm.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                    Total effectif
                  </p>
                  <Badge variant="secondary" className="gap-1">
                    <Check className="h-3 w-3" />
                    {all_permissions.length}
                  </Badge>
                </div>
                <PermissionsBadgeList permissions={all_permissions} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══ Accès aux entrepôts (inventory) ═══ */}
        <MemberWarehouseAccessSection orgId={orgId} memberId={memberId} />
      </div>

      {/* ═══ Dialogs ═══ */}
      <Dialog open={confirmToggleStatusOpen} onOpenChange={setConfirmToggleStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{is_active ? "Désactiver" : "Activer"} l'employé</DialogTitle>
            <DialogDescription>
              {is_active
                ? "L'employé n'aura plus accès à l'organisation. Vous pourrez le réactiver plus tard."
                : "L'employé retrouvera l'accès à l'organisation avec ses permissions actuelles."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmToggleStatusOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleToggleStatus} disabled={updateMember.isPending}>
              {updateMember.isPending ? "En cours..." : is_active ? "Désactiver" : "Activer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer l'employé de l'organisation</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L'employé perdra immédiatement l'accès à l'organisation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemoveOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removeMember.isPending}
            >
              {removeMember.isPending ? "Suppression..." : "Retirer l'employé"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailPageLayout>
  );
}
