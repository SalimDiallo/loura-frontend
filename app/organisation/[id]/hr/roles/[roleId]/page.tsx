"use client";

import { Can, PermissionGuard } from "@/components/permissions";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteRole, useRole } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import {
    ArrowLeft,
    Calendar,
    Check,
    Edit,
    Shield,
    Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Page de détails d'un rôle
 */
export default function RoleDetailPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.HR.MANAGE_ROLES}>
      <RoleDetailPage />
    </PermissionGuard>
  );
}

function RoleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const roleId = params.roleId as string;

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Fetch role data
  const { data: role, isLoading, error } = useRole(orgId, roleId);

  // Mutation
  const deleteRole = useDeleteRole();

  // Handlers
  const handleDelete = async () => {
    try {
      await deleteRole.mutateAsync({ orgId, roleId });
      toast.success("Rôle supprimé avec succès");
      setConfirmDeleteOpen(false);
      router.push(`/organisation/${orgId}/hr/roles`);
    } catch (err) {
      toast.error("Erreur lors de la suppression du rôle");
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
  if (error || !role) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              Erreur lors du chargement du rôle :{" "}
              {error?.message || "Rôle introuvable"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group permissions by module
  const permissionsByModule = role.permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, typeof role.permissions>);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/organisation/${orgId}/hr/roles`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Détails du rôle</h1>
          <p className="text-muted-foreground mt-1">
            Consultez et gérez les informations du rôle
          </p>
        </div>
      </div>

      {/* Carte principale */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{role.name}</CardTitle>
                <CardDescription className="mt-2 text-base">
                  {role.description || "Aucune description"}
                </CardDescription>
              </div>
            </div>

            {/* Actions */}
            <Can permission={PERMISSIONS.HR.MANAGE_ROLES}>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/organisation/${orgId}/hr/roles/${roleId}/edit`)
                  }
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </Can>
          </div>
        </CardHeader>
      </Card>

      {/* Grid d'informations */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Statistiques */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
            <CardDescription>Informations sur le rôle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total de permissions
              </span>
              <Badge className="gap-1">
                <Shield className="h-3 w-3" />
                {role.permissions.length}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Modules couverts
              </span>
              <Badge variant="outline">
                {Object.keys(permissionsByModule).length}
              </Badge>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Créé le</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {new Date(role.created_at).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Dernière modification
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {new Date(role.updated_at).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modules */}
        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
            <CardDescription>
              Répartition des permissions par module
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(permissionsByModule).length === 0 ? (
              <div className="border border-dashed rounded-lg p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucune permission assignée
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div
                    key={module}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{module}</p>
                      <p className="text-xs text-muted-foreground">
                        {perms.length} permission{perms.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge variant="outline">{perms.length}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permissions détaillées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions ({role.permissions.length})
          </CardTitle>
          <CardDescription>
            Liste complète des permissions de ce rôle
          </CardDescription>
        </CardHeader>
        <CardContent>
          {role.permissions.length === 0 ? (
            <div className="border border-dashed rounded-lg p-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucune permission assignée à ce rôle
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Modifiez le rôle pour ajouter des permissions
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(permissionsByModule).map(([module, perms]) => (
                <div key={module} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold uppercase text-muted-foreground">
                      {module}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {perms.length}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {perms.map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30"
                      >
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{perm.label}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {perm.codename}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog - Confirmer suppression */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le rôle</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le rôle "{role.name}" ? Cette
              action est irréversible. Les employés ayant ce rôle perdront leurs
              permissions associées.
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
              onClick={handleDelete}
              disabled={deleteRole.isPending}
            >
              {deleteRole.isPending ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
