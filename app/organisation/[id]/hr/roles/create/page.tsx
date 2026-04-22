"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartSelector, type SmartSelectorItem } from "@/components/ui/smart-selector";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRole, usePermissions } from "@/lib/hooks/hr";
import { resolvePermissionSelection } from "@/lib/permission-dependencies";
import { PERMISSIONS } from "@/lib/permissions";
import type { CreateRoleData } from "@/lib/types";
import { Save, Shield, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

/**
 * Page de création d'un nouveau rôle
 */
export default function CreateRolePageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.HR.MANAGE_ROLES}>
      <CreateRolePage />
    </PermissionGuard>
  );
}

function CreateRolePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [formData, setFormData] = useState<CreateRoleData>({
    name: "",
    description: "",
    permission_ids: [],
  });

  // Fetch permissions
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions();

  // Map permissions to SmartSelector format
  const permissionItems: SmartSelectorItem[] = useMemo(() => 
    permissions.map(p => ({
      id: p.id,
      name: p.label,
      subtitle: p.codename,
      group: p.module,
    }))
  , [permissions]);

  // Mutation
  const createRole = useCreateRole();

  // Handlers
  const handlePermissionsChange = (newIds: string[]) => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: resolvePermissionSelection(
        prev.permission_ids,
        newIds,
        permissions,
      ),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Le nom du rôle est requis");
      return;
    }

    try {
      await createRole.mutateAsync({ orgId, data: formData });
      toast.success("Rôle créé avec succès");
      router.push(`/organisation/${orgId}/hr/roles`);
    } catch (err) {
      toast.error("Erreur lors de la création du rôle");
    }
  };

  const handleCancel = () => {
    if (formData.name || formData.description || formData.permission_ids.length > 0) {
      if (!window.confirm("Vous avez des données non enregistrées. Voulez-vous vraiment quitter ?")) {
        return;
      }
    }
    router.push(`/organisation/${orgId}/hr/roles`);
  };

  if (permissionsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const hasData = formData.name || formData.description || formData.permission_ids.length > 0;

  return (
    <FormPageLayout
      title="Créer un nouveau rôle"
      subtitle="Définissez un rôle avec des permissions spécifiques"
      backLink={`/organisation/${orgId}/hr/roles`}
      actions={[
        {
          label: "Annuler",
          icon: X,
          onClick: handleCancel,
          variant: "outline",
        },
        {
          label: createRole.isPending ? "Création..." : "Créer le rôle",
          icon: Save,
          onClick: handleSubmit,
          disabled: !formData.name.trim() || createRole.isPending,
        }
      ]}
      sidebar={
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Nom</p>
                <p className="font-semibold truncate">{formData.name || "Non défini"}</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-muted-foreground uppercase text-[10px] font-bold">Permissions</p>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-lg font-bold">{formData.permission_ids.length}</span>
                </div>
              </div>
              <Separator />
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!formData.name.trim() || createRole.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Enregistrer le rôle
              </Button>
            </CardContent>
          </Card>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Informations de base</CardTitle>
          <CardDescription>Donnez un nom et une description claire à ce rôle.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom du rôle <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              placeholder="Ex: Responsable RH, Manager de Stock..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Décrivez brièvement les responsabilités..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg font-bold">Permissions</CardTitle>
            <CardDescription>Sélectionnez les accès autorisés pour ce rôle.</CardDescription>
          </div>
          <Badge variant="secondary" className="h-6">
            {formData.permission_ids.length} sélectionnées
          </Badge>
        </CardHeader>
        <CardContent>
          <SmartSelector
            items={permissionItems}
            selectedIds={formData.permission_ids}
            onChange={handlePermissionsChange}
            multiple
            mode="inline"
            accentColor="primary"
            searchPlaceholder="Rechercher une permission ou un module..."
          />
        </CardContent>
      </Card>
    </FormPageLayout>
  );
}
