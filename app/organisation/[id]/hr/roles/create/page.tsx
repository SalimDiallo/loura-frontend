"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRole, usePermissions } from "@/lib/hooks/hr";
import type { CreateRoleData } from "@/lib/types";
import { Check, Save, Shield, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Page de création d'un nouveau rôle
 */
export default function CreateRolePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [formData, setFormData] = useState<CreateRoleData>({
    name: "",
    description: "",
    permission_ids: [],
  });

  // Fetch permissions
  const { data: permissions, isLoading: permissionsLoading } = usePermissions();

  // Mutation
  const createRole = useCreateRole();

  // Handlers
  const handleTogglePermission = (permId: string) => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permId)
        ? prev.permission_ids.filter((id) => id !== permId)
        : [...prev.permission_ids, permId],
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
      if (
        !window.confirm(
          "Vous avez des données non enregistrées. Voulez-vous vraiment quitter ?"
        )
      ) {
        return;
      }
    }
    router.push(`/organisation/${orgId}/hr/roles`);
  };

  // Group permissions by module
  const permissionsByModule =
    permissions?.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>) || {};

  // Loading state
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
      infoBanner={hasData && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
            Remplissez tous les champs et cliquez sur "Créer le rôle"
          </p>
        </div>
      )}
      sidebar={
        <>
          {/* Résumé */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Nom du rôle</p>
                  <p className="font-medium">
                    {formData.name || (
                      <span className="text-muted-foreground italic">
                        Non défini
                      </span>
                    )}
                  </p>
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

          {/* Actions rapides */}
          <Card className="border-dashed">
            <CardContent className="pt-6 space-y-2">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!formData.name.trim() || createRole.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {createRole.isPending ? "Création..." : "Créer le rôle"}
              </Button>
              <Button variant="outline" className="w-full" onClick={handleCancel}>
                Annuler
              </Button>
            </CardContent>
          </Card>
        </>
      }
    >
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
            <p className="text-xs text-muted-foreground">
              Choisissez un nom clair et descriptif
            </p>
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
            <p className="text-xs text-muted-foreground">
              Optionnel - Aide à comprendre le rôle
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>
            Sélectionnez les permissions à attribuer à ce rôle
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formData.permission_ids.length === 0 ? (
            <div className="border border-dashed rounded-lg p-8 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucune permission sélectionnée
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sélectionnez au moins une permission ci-dessous
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
              <p className="text-sm font-medium">
                {formData.permission_ids.length} permission
                {formData.permission_ids.length > 1 ? "s" : ""} sélectionnée
                {formData.permission_ids.length > 1 ? "s" : ""}
              </p>
              <div className="flex flex-wrap gap-1">
                {formData.permission_ids.slice(0, 10).map((permId) => {
                  const perm = permissions?.find((p) => p.id === permId);
                  return perm ? (
                    <Badge key={permId} variant="secondary" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      {perm.label}
                    </Badge>
                  ) : null;
                })}
                {formData.permission_ids.length > 10 && (
                  <Badge variant="secondary" className="text-xs">
                    +{formData.permission_ids.length - 10} autres
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Separator className="my-6" />

          {/* Liste des permissions */}
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            {Object.entries(permissionsByModule).map(([module, perms]) => (
              <div key={module} className="space-y-3">
                <div className="sticky top-0 bg-background py-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold uppercase text-muted-foreground">
                      {module}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {perms.filter((p) =>
                        formData.permission_ids.includes(p.id)
                      ).length}{" "}
                      / {perms.length}
                    </Badge>
                  </div>
                  <Separator className="mt-2" />
                </div>
                <div className="space-y-3 ml-2">
                  {perms.map((perm) => {
                    const isChecked = formData.permission_ids.includes(
                      perm.id
                    );

                    return (
                      <div key={perm.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={perm.id}
                          checked={isChecked}
                          onCheckedChange={() =>
                            handleTogglePermission(perm.id)
                          }
                          className="mt-0.5"
                        />
                        <div className="flex-1 space-y-0.5">
                          <label
                            htmlFor={perm.id}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {perm.label}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {perm.codename}
                          </p>
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
    </FormPageLayout>
  );
}
