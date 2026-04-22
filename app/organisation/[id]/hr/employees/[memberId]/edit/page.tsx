"use client";

import { BadgeStatus } from "@/components/BadgeStatus";
import { PermissionGuard } from "@/components/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
    useMember,
    usePermissions,
    useRoles,
    useUpdateMember,
} from "@/lib/hooks/hr";
import {
    getDependentSelectedIds,
    getRequiredIds,
    resolvePermissionSelection,
} from "@/lib/permission-dependencies";
import { PERMISSIONS } from "@/lib/permissions";
import { ArrowLeft, Check, Save, Shield, ShieldAlert, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Page d'édition d'un employé (membre)
 */
export default function EditEmployeePageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.HR.MANAGE_EMPLOYEES}>
      <EditEmployeePage />
    </PermissionGuard>
  );
}

function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const memberId = params.memberId as string;

  // States
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch data
  const { data: member, isLoading: memberLoading, error } = useMember(orgId, memberId);
  const { data: roles, isLoading: rolesLoading } = useRoles(orgId);
  const { data: permissions, isLoading: permissionsLoading } = usePermissions();

  // Mutation
  const updateMember = useUpdateMember();

  // Initialize form with member data
  useEffect(() => {
    if (member) {
      setSelectedRoleId(member.role?.id || null);
      setSelectedPermissions(member.extra_permissions.map((p) => p.id));
      setIsActive(member.is_active);
    }
  }, [member]);

  // Detect changes
  useEffect(() => {
    if (!member) return;

    const roleChanged = selectedRoleId !== (member.role?.id || null);
    const permissionsChanged =
      JSON.stringify([...selectedPermissions].sort()) !==
      JSON.stringify(member.extra_permissions.map((p) => p.id).sort());
    const statusChanged = isActive !== member.is_active;

    setHasChanges(roleChanged || permissionsChanged || statusChanged);
  }, [selectedRoleId, selectedPermissions, isActive, member]);

  // Handlers
  const handleTogglePermission = (permId: string) => {
    setSelectedPermissions((prev) => {
      const nextRaw = prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId];
      // Les permissions déjà apportées par le rôle sont "implicites" :
      // pas besoin de les répéter dans les extras lors d'un auto-add.
      const implicitIds = roles?.find((r) => r.id === selectedRoleId)?.permissions.map((p) => p.id) ?? [];
      return resolvePermissionSelection(
        prev,
        nextRaw,
        permissions ?? [],
        { implicitIds },
      );
    });
  };

  const handleSubmit = async () => {
    if (!member || !hasChanges) return;

    try {
      await updateMember.mutateAsync({
        orgId,
        memberId,
        data: {
          role_id: selectedRoleId,
          extra_permission_ids: selectedPermissions,
          is_active: isActive,
        },
      });
      toast.success("Employé mis à jour avec succès");
      router.push(`/organisation/${orgId}/hr/employees/${memberId}`);
    } catch (err) {
      toast.error("Erreur lors de la mise à jour de l'employé");
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
    router.push(`/organisation/${orgId}/hr/employees/${memberId}`);
  };

  // Loading state
  if (memberLoading || rolesLoading || permissionsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
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
              Erreur lors du chargement : {error?.message || "Employé introuvable"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { employee } = member;
  const { user } = employee;

  // Get permissions from selected role
  const rolePermissions =
    roles?.find((r) => r.id === selectedRoleId)?.permissions || [];
  const rolePermissionIds = new Set(rolePermissions.map((p) => p.id));

  // Group permissions by module
  const permissionsByModule =
    permissions?.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>) || {};

  // Calculate total permissions
  const totalPermissions = rolePermissions.length + selectedPermissions.length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Modifier l'employé</h1>
          <p className="text-muted-foreground mt-1">
            {user.first_name} {user.last_name} • {user.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasChanges || updateMember.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMember.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* Badge si modifications en cours */}
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
          {/* Statut */}
          <Card>
            <CardHeader>
              <CardTitle>Statut de l'employé</CardTitle>
              <CardDescription>
                Activer ou désactiver l'accès de l'employé
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="status" className="text-base">
                    Employé actif
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {isActive
                      ? "L'employé peut accéder à l'organisation"
                      : "L'employé ne peut pas accéder à l'organisation"}
                  </p>
                </div>
                <Switch
                  id="status"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </CardContent>
          </Card>

          {/* Rôle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Rôle
              </CardTitle>
              <CardDescription>
                Attribuez un rôle prédéfini avec un ensemble de permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Rôle assigné</Label>
                <Select
                  value={selectedRoleId || "none"}
                  onValueChange={(value) =>
                    setSelectedRoleId(value === "none" ? null : value)
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Sélectionnez un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">Aucun rôle</span>
                    </SelectItem>
                    {roles?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <span>{role.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {role.permissions.length} perm.
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRoleId && rolePermissions.length > 0 && (
                <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                  <p className="text-sm font-medium">
                    Permissions incluses dans ce rôle :
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {rolePermissions.map((perm) => (
                      <Badge key={perm.id} variant="secondary" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        {perm.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissions supplémentaires */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Permissions supplémentaires
              </CardTitle>
              <CardDescription>
                Ajoutez des permissions individuelles en plus de celles du rôle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module} className="space-y-3">
                    <div className="sticky top-0 bg-background py-2">
                      <h4 className="text-sm font-semibold uppercase text-muted-foreground">
                        {module}
                      </h4>
                      <Separator className="mt-2" />
                    </div>
                    <div className="space-y-3 ml-2">
                      {perms.map((perm) => {
                        const isFromRole = rolePermissionIds.has(perm.id);
                        const isExtra = selectedPermissions.includes(perm.id);
                        const isChecked = isFromRole || isExtra;

                        // Décochage bloqué si une extra-permission sélectionnée
                        // dépend de celle-ci.
                        const lockingIds = isExtra
                          ? getDependentSelectedIds(
                              perm.id,
                              selectedPermissions,
                              permissions ?? [],
                            )
                          : [];
                        const isLocked = lockingIds.length > 0;
                        const lockingLabels = lockingIds
                          .map((id) => permissions?.find((p) => p.id === id)?.label)
                          .filter((l): l is string => Boolean(l));
                        const requiredIds = !isChecked
                          ? getRequiredIds(perm.id, permissions ?? [])
                          : [];
                        const requiredLabels = requiredIds
                          .filter((id) => !rolePermissionIds.has(id))
                          .map((id) => permissions?.find((p) => p.id === id)?.label)
                          .filter((l): l is string => Boolean(l));

                        const disabled = isFromRole || isLocked;

                        return (
                          <div key={perm.id} className="flex items-start space-x-3">
                            <Checkbox
                              id={perm.id}
                              checked={isChecked}
                              onCheckedChange={() =>
                                !disabled && handleTogglePermission(perm.id)
                              }
                              disabled={disabled}
                              className="mt-0.5"
                            />
                            <div className="flex-1 space-y-0.5">
                              <label
                                htmlFor={perm.id}
                                className={`text-sm font-medium leading-none flex items-center gap-2 ${
                                  isFromRole ? "text-muted-foreground" : ""
                                } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                              >
                                {perm.label}
                                {isFromRole && (
                                  <Badge variant="outline" className="text-xs">
                                    Du rôle
                                  </Badge>
                                )}
                              </label>
                              <p className="text-xs text-muted-foreground">
                                {perm.codename}
                              </p>
                              {isLocked && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                  Requise par : {lockingLabels.join(", ")}
                                </p>
                              )}
                              {!isChecked && requiredLabels.length > 0 && (
                                <p className="text-[10px] text-muted-foreground/70">
                                  Implique : {requiredLabels.join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1/3 */}
        <div className="space-y-6">
          {/* Informations employé */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={`${user.first_name} ${user.last_name}`}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-primary">
                      {user.first_name[0]}
                      {user.last_name[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                {employee.employee_id && (
                  <div>
                    <p className="text-muted-foreground">ID Employé</p>
                    <p className="font-medium font-mono">{employee.employee_id}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Rejoint le</p>
                  <p className="font-medium">
                    {new Date(member.joined_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Résumé des permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <BadgeStatus status={isActive} withIcon={false} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rôle</span>
                  <span className="font-medium">
                    {selectedRoleId
                      ? roles?.find((r) => r.id === selectedRoleId)?.name
                      : "Aucun"}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Permissions du rôle</span>
                  <Badge variant="outline">{rolePermissions.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Permissions extra</span>
                  <Badge variant="outline">{selectedPermissions.length}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-medium">
                  <span>Total permissions</span>
                  <Badge className="gap-1">
                    <Shield className="h-3 w-3" />
                    {totalPermissions}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-dashed">
            <CardContent className="pt-6 space-y-2">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!hasChanges || updateMember.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMember.isPending ? "Enregistrement..." : "Enregistrer"}
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
