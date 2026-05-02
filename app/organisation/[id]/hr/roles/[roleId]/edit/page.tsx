"use client";

import { PermissionGuard, PermissionsPicker } from "@/components/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions, useRole, useUpdateRole } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import type { UpdateRoleData } from "@/lib/types";
import { ArrowLeft, Save, Shield, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Page d'édition d'un rôle
 */
export default function EditRolePageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.HR.MANAGE_ROLES}>
      <EditRolePage />
    </PermissionGuard>
  );
}

function EditRolePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const roleId = params.roleId as string;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permission_ids: [] as string[],
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch data
  const { data: role, isLoading: roleLoading, error } = useRole(orgId, roleId);
  const { data: permissions, isLoading: permissionsLoading } = usePermissions();

  // Mutation
  const updateRole = useUpdateRole();

  // Initialize form with role data
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description,
        permission_ids: role.permissions.map((p) => p.id),
      });
    }
  }, [role]);

  // Detect changes
  useEffect(() => {
    if (!role) return;

    const nameChanged = formData.name !== role.name;
    const descChanged = formData.description !== role.description;
    const permsChanged =
      JSON.stringify([...formData.permission_ids].sort()) !==
      JSON.stringify(role.permissions.map((p) => p.id).sort());

    setHasChanges(nameChanged || descChanged || permsChanged);
  }, [formData, role]);

  // PermissionsPicker gère lui-même la résolution des dépendances/exclusions.
  const handlePermissionsChange = (newIds: string[]) => {
    setFormData((prev) => ({ ...prev, permission_ids: newIds }));
  };

  const handleSubmit = async () => {
    if (!role || !hasChanges || !formData.name.trim()) return;

    try {
      await updateRole.mutateAsync({
        orgId,
        roleId,
        data: {
          name: formData.name,
          description: formData.description,
          permission_ids: formData.permission_ids,
        } as UpdateRoleData,
      });
      toast.success("Rôle mis à jour avec succès");
      router.push(`/organisation/${orgId}/hr/roles/${roleId}`);
    } catch (err) {
      toast.error("Erreur lors de la mise à jour du rôle");
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (
        !window.confirm(
          "Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?"
        )
      ) {
        return;
      }
    }
    router.push(`/organisation/${orgId}/hr/roles/${roleId}`);
  };

  // Loading state
  if (roleLoading || permissionsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
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
              Erreur lors du chargement : {error?.message || "Rôle introuvable"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group permissions by module (utilisé seulement pour la sidebar "Modules couverts")
  const permissionsByModule =
    permissions?.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>) || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Modifier le rôle</h1>
          <p className="text-muted-foreground mt-1">
            {role.name} • {role.permissions.length} permission
            {role.permissions.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasChanges || !formData.name.trim() || updateRole.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateRole.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* Badge si modifications */}
      {hasChanges && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
            Vous avez des modifications non enregistrées
          </p>
        </div>
      )}

      {/* Form */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main column - 2/3 */}
        <div className="md:col-span-2 space-y-6">
          {/* Informations du rôle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Informations du rôle
              </CardTitle>
              <CardDescription>
                Nom et description du rôle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom du rôle <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Manager, Caissier, Superviseur..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez les responsabilités et le périmètre de ce rôle..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Modifiez les permissions attribuées à ce rôle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionsPicker
                permissions={permissions ?? []}
                selectedIds={formData.permission_ids}
                onChange={handlePermissionsChange}
                description="Les dépendances et exclusions mutuelles sont appliquées automatiquement."
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1/3 */}
        <div className="space-y-6">
          {/* Résumé */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Nom du rôle</p>
                  <p className="font-medium">{formData.name}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-muted-foreground">Description</p>
                  <p className="font-medium text-xs">
                    {formData.description || (
                      <span className="text-muted-foreground italic">
                        Aucune description
                      </span>
                    )}
                  </p>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-medium">
                  <span>Total permissions</span>
                  <Badge className="gap-1">
                    <Shield className="h-3 w-3" />
                    {formData.permission_ids.length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modules couverts */}
          {formData.permission_ids.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Modules couverts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(permissionsByModule)
                    .filter(([, perms]) =>
                      perms.some((p) => formData.permission_ids.includes(p.id))
                    )
                    .map(([module, perms]) => {
                      const selectedCount = perms.filter((p) =>
                        formData.permission_ids.includes(p.id)
                      ).length;
                      return (
                        <div
                          key={module}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="font-medium">{module}</span>
                          <Badge variant="outline" className="text-xs">
                            {selectedCount} / {perms.length}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card className="border-dashed">
            <CardContent className="pt-6 space-y-2">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={
                  !hasChanges || !formData.name.trim() || updateRole.isPending
                }
              >
                <Save className="h-4 w-4 mr-2" />
                {updateRole.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleCancel}>
                Annuler
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
