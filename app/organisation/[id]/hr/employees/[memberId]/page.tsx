"use client";

import { BadgeStatus } from "@/components/BadgeStatus";
import { DetailPageLayout } from "@/components/layout/DetailPageLayout";
import { Badge } from "@/components/ui/badge";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoField } from "@/components/ui/info-field";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { PermissionsBadgeList } from "@/components/ui/permissions-badge-list";
import { useMember, useRemoveMember, useUpdateMember } from "@/lib/hooks/hr";
import {
    Calendar,
    Check,
    Mail,
    Phone,
    Shield,
    ShieldAlert,
    Trash2,
    User,
    UserCheck,
    UserX,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { FaEdit } from "react-icons/fa";
import { toast } from "sonner";

/**
 * Page de détails d'un employé (membre)
 */
export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const memberId = params.memberId as string;

  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [confirmToggleStatusOpen, setConfirmToggleStatusOpen] = useState(false);

  // Fetch member data
  const { data: member, isLoading, error } = useMember(orgId, memberId);

  // Mutations
  const updateMember = useUpdateMember();
  const removeMember = useRemoveMember();

  // Handlers
  const handleToggleStatus = async () => {
    if (!member) return;

    try {
      await updateMember.mutateAsync({
        orgId,
        memberId,
        data: { is_active: !member.is_active },
      });
      toast.success(
        member.is_active
          ? "Employé désactivé avec succès"
          : "Employé activé avec succès"
      );
      setConfirmToggleStatusOpen(false);
    } catch (err) {
      toast.error("Erreur lors de la modification du statut");
    }
  };

  const handleRemove = async () => {
    try {
      await removeMember.mutateAsync({ orgId, memberId });
      toast.success("Employé retiré de l'organisation");
      setConfirmRemoveOpen(false);
      router.push(`/organisation/${orgId}/hr/employees`);
    } catch (err) {
      toast.error("Erreur lors de la suppression de l'employé");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // Error state
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
        </div>
      }
      avatar={
        <EntityAvatar src={user.avatar_url} fallback={fullName} size="xl" />
      }
      actions={[
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
        }
      ]}
    >
      {/* Grille d'informations */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <User className="h-4 w-4" />
              Informations générales
            </CardTitle>
            <CardDescription>
              Coordonnées et informations de base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <InfoField label="Email" value={user.email} icon={Mail} />
            {user.phone && <InfoField label="Téléphone" value={user.phone} icon={Phone} />}
            {employee.employee_id && <InfoField label="ID Employé" value={employee.employee_id} icon={User} />}
            <InfoField 
              label="Date d'arrivée" 
              value={new Date(joined_at).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })} 
              icon={Calendar} 
            />
          </CardContent>
        </Card>

        {/* Rôle et Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Shield className="h-4 w-4" />
              Rôle et Permissions
            </CardTitle>
            <CardDescription>
              Accès et droits de l'employé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rôle assigné */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Rôle assigné</p>
              {role ? (
                <div className="border rounded-lg p-3 bg-muted/30 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{role.name}</p>
                    {role.description && <p className="text-xs text-muted-foreground mt-1">{role.description}</p>}
                  </div>
                  <Badge variant="outline" className="text-xs">{role.permissions.length} perms</Badge>
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Aucun rôle assigné</p>
                </div>
              )}
            </div>

            {/* Permissions supplémentaires */}
            {extra_permissions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Permissions supplémentaires</p>
                <div className="grid gap-2">
                  {extra_permissions.map((perm) => (
                    <div key={perm.id} className="flex items-center gap-2 text-sm border rounded-lg p-2">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      <div className="flex-1">
                        <p className="font-medium text-xs">{perm.label}</p>
                        <p className="text-[10px] text-muted-foreground">{perm.module}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total des permissions */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total des permissions</p>
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

      {/* Dialogs */}
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
            <Button variant="outline" onClick={() => setConfirmToggleStatusOpen(false)}>Annuler</Button>
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
            <Button variant="outline" onClick={() => setConfirmRemoveOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleRemove} disabled={removeMember.isPending}>
              {removeMember.isPending ? "Suppression..." : "Retirer l'employé"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailPageLayout>
  );
}
