"use client";

import { BadgeStatus } from "@/components/BadgeStatus";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useMember, useRemoveMember, useUpdateMember } from "@/lib/hooks/hr";
import {
    ArrowLeft,
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/organisation/${orgId}/hr/employees`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Détails de l'employé</h1>
          <p className="text-muted-foreground mt-1">
            Consultez et gérez les informations de l'employé
          </p>
        </div>
      </div>

      {/* Carte principale - Informations employé */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {user.first_name[0]}
                    {user.last_name[0]}
                  </span>
                )}
              </div>

              {/* Nom et statut */}
              <div>
                <CardTitle className="text-2xl">
                  {user.first_name} {user.last_name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                <BadgeStatus status={is_active} withIcon />
                  {role && (
                    <Badge variant="outline" className="gap-1">
                      <Shield className="h-3 w-3" />
                      {role.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/organisation/${orgId}/hr/employees/${memberId}/edit`)
                }
                className="gap-2"
              >
                <FaEdit className="h-4 w-4" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmToggleStatusOpen(true)}
                className="gap-2"
              >
                {is_active ? (
                  <>
                    <UserX className="h-4 w-4" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" />
                    Activer
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmRemoveOpen(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Retirer
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grille d'informations */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations générales
            </CardTitle>
            <CardDescription>
              Coordonnées et informations de base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              {user.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                </div>
              )}

              {employee.employee_id && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">ID Employé</p>
                    <p className="font-medium font-mono">{employee.employee_id}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date d'arrivée</p>
                  <p className="font-medium">
                    {new Date(joined_at).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rôle et Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Rôle et Permissions
            </CardTitle>
            <CardDescription>
              Accès et droits de l'employé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rôle assigné */}
            <div>
              <p className="text-sm font-medium mb-2">Rôle assigné</p>
              {role ? (
                <div className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{role.name}</p>
                      {role.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {role.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {role.permissions.length} permission
                      {role.permissions.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-3 text-center">
                  <p className="text-sm text-muted-foreground">Aucun rôle assigné</p>
                </div>
              )}
            </div>

            {/* Permissions supplémentaires */}
            {extra_permissions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Permissions supplémentaires
                </p>
                <div className="space-y-2">
                  {extra_permissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="flex items-center gap-2 text-sm border rounded-lg p-2"
                    >
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      <div className="flex-1">
                        <p className="font-medium">{perm.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {perm.module}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total des permissions */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Total des permissions</p>
                <Badge variant="secondary" className="gap-1">
                  <Check className="h-3 w-3" />
                  {all_permissions.length}
                </Badge>
              </div>
              {all_permissions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {all_permissions.slice(0, 8).map((codename) => (
                    <Badge key={codename} variant="outline" className="text-xs">
                      {codename}
                    </Badge>
                  ))}
                  {all_permissions.length > 8 && (
                    <Badge variant="outline" className="text-xs">
                      +{all_permissions.length - 8} autres
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog - Confirmer changement de statut */}
      <Dialog
        open={confirmToggleStatusOpen}
        onOpenChange={setConfirmToggleStatusOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {is_active ? "Désactiver" : "Activer"} l'employé
            </DialogTitle>
            <DialogDescription>
              {is_active
                ? "L'employé n'aura plus accès à l'organisation. Vous pourrez le réactiver plus tard."
                : "L'employé retrouvera l'accès à l'organisation avec ses permissions actuelles."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmToggleStatusOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleToggleStatus}
              disabled={updateMember.isPending}
            >
              {updateMember.isPending
                ? "En cours..."
                : is_active
                ? "Désactiver"
                : "Activer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog - Confirmer suppression */}
      <Dialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer l'employé de l'organisation</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L'employé perdra immédiatement
              l'accès à l'organisation et toutes ses données de membership
              seront supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRemoveOpen(false)}
            >
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
    </div>
  );
}
