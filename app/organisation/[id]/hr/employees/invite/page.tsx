"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { usePermissions, useRoles, useSendInvitation } from "@/lib/hooks/hr";
import type { CreateInvitationData, Permission } from "@/lib/types";
import { ArrowLeft, BadgeInfo, Check, Loader2, Mail, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Page d'invitation d'un nouvel employé
 */
export default function InviteEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [formData, setFormData] = useState<CreateInvitationData>({
    email: "",
    role_id: null,
    permission_ids: [],
  });

  // Fetch roles et permissions
  const { data: roles = [] } = useRoles(orgId);
  const { data: permissions = [] } = usePermissions();

  // Mutation
  const sendInvitation = useSendInvitation();

  // Group permissions by module
  const permissionsByModule = permissions.reduce(
    (acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      toast("Email requis", {
        description: "Veuillez saisir l'email de la personne à inviter.",
      });
      return;
    }

    try {
      const result = await sendInvitation.mutateAsync({
        orgId,
        data: formData,
      });

      toast("Invitation envoyée", {
        description: result.message || `Invitation envoyée à ${formData.email}`,
      });

      // Rediriger vers la liste des employés
      router.push(`/organisation/${orgId}/hr/employees`);
    } catch (error: any) {
      toast("Erreur", {
        description:
          error.message || "Impossible d'envoyer l'invitation",
      });
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids?.includes(permissionId)
        ? prev.permission_ids.filter((id) => id !== permissionId)
        : [...(prev.permission_ids || []), permissionId],
    }));
  };

  // Nouvelle fonction pour description du rôle
  const getRoleDescription = (roleId: string | null) => {
    if (!roleId || roleId === "none") return "Ne donne aucun accès particulier par défaut.";
    const role = roles.find((r) => r.id === roleId);
    if (!role) return "";
    if (role.description) return role.description;
    // Fallback : liste permissions pour le rôle (si possible)
    if (role.permissions && role.permissions.length > 0) {
      return `Ce rôle donne accès à : ${role.permissions.map((p: any) => p.label).join(", ")}`;
    }
    return "";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Inviter un employé
          </h1>
          <p className="text-muted-foreground mt-1">
            Envoyez une invitation pour rejoindre votre organisation
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'invitation</CardTitle>
              <CardDescription>
                Saisissez l'email et configurez le rôle et les permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nom@exemple.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Nouvelle section Role UX amélioré */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    Rôle {roles.length > 0 && <span className="text-xs text-muted-foreground">(optionnel)</span>}
                  </Label>
                  <div className="flex flex-col gap-2">
                    <Select
                      value={formData.role_id || "none"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role_id: value === "none" ? null : value })
                      }
                    >
                      <SelectTrigger aria-label="Sélectionner un rôle" className="w-full border">
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="flex items-center gap-2">
                          <BadgeInfo className="h-4 w-4 mr-1 text-muted-foreground" />
                          Aucun rôle
                        </SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <span className="font-medium">{role.name}</span>
                            {role.description && (
                              <span className="block text-xs text-muted-foreground mt-1">
                                {role.description}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Affiche une description claire du rôle sélectionné */}
                    <div className="rounded-md border p-2 bg-muted/40 text-xs flex items-center gap-2 transition-all">
                      <BadgeInfo className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {getRoleDescription(formData.role_id || "none")}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Le rôle détermine le niveau d'accès. Si vous ne sélectionnez aucun rôle, vous pouvez assigner des permissions individuelles ci-dessous.
                  </p>
                </div>

                {/* Permissions */}
                <div className="space-y-3">
                  <Label>
                    Permissions supplémentaires (
                    {formData.permission_ids?.length || 0})
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sélectionnez des permissions en plus de celles du rôle
                  </p>
                  <div className="space-y-4 border rounded-lg p-4 max-h-96 overflow-y-auto">
                    {Object.entries(permissionsByModule).map(
                      ([module, perms]) => (
                        <div key={module} className="space-y-2">
                          <h4 className="font-semibold text-sm capitalize">
                            {module}
                          </h4>
                          <div className="space-y-1 pl-4">
                            {perms.map((perm) => (
                              <div
                                key={perm.id}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="checkbox"
                                  id={perm.id}
                                  checked={formData.permission_ids?.includes(
                                    perm.id
                                  )}
                                  onChange={() => togglePermission(perm.id)}
                                  className="rounded"
                                />
                                <label
                                  htmlFor={perm.id}
                                  className="text-sm cursor-pointer"
                                >
                                  {perm.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={sendInvitation.isPending}
                    className="gap-2"
                  >
                    {sendInvitation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Envoyer l'invitation
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Aperçu de l'invitation</CardTitle>
              <CardDescription>
                Ce que l'invité verra
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">
                  {formData.email || "Non renseigné"}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Rôle</p>
                <p className="text-sm text-muted-foreground font-medium">
                  {formData.role_id
                    ? roles.find((r) => r.id === formData.role_id)?.name
                    : "Aucun rôle assigné"}
                </p>
                <span className="text-xs text-muted-foreground">
                  {getRoleDescription(formData.role_id || "none")}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Permissions directes</p>
                {(formData.permission_ids?.length || 0) > 0 ? (
                  <div className="space-y-1">
                    {formData.permission_ids?.map((permId) => {
                      const perm = permissions.find((p) => p.id === permId);
                      return (
                        <div
                          key={permId}
                          className="text-xs text-muted-foreground flex items-center gap-1"
                        >
                          <Check className="h-3 w-3 text-green-600" />
                          {perm?.label}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucune permission directe
                  </p>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  L'invitation expirera dans 7 jours
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
