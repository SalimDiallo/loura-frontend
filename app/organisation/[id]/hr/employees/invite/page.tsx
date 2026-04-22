"use client";

import { PermissionGuard } from "@/components/permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SmartSelector, type SmartSelectorItem } from "@/components/ui/smart-selector";
import { useDepartments, usePermissions, usePositions, useRoles, useSendInvitation } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import type { CreateInvitationData } from "@/lib/types";
import { AlertTriangle, ArrowLeft, BadgeInfo, Briefcase, Building, Crown, Loader2, Mail, Send, Shield, UserCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { toast } from "sonner";

/**
 * Page d'invitation d'un nouvel employé
 */
export default function InviteEmployeePageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.HR.INVITE_EMPLOYEES}>
      <InviteEmployeePage />
    </PermissionGuard>
  );
}

function InviteEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [formData, setFormData] = useState<CreateInvitationData>({
    email: "",
    role_id: null,
    permission_ids: [],
    department_id: null,
    position_id: null,
  });

  // Erreur structurée du backend (is_owner, already_member, already_invited)
  const [serverError, setServerError] = useState<
    | { code?: string; message?: string; membership_id?: string }
    | null
  >(null);

  // Fetch roles, permissions, departments, positions
  const { data: roles = [] } = useRoles(orgId);
  const { data: permissions = [] } = usePermissions();
  const { data: departments = [] } = useDepartments(orgId, { page_size: "all" as any });
  const { data: positions = [] } = usePositions(
    orgId,
    formData.department_id
      ? { department: formData.department_id, page_size: "all" as any }
      : { page_size: "all" as any },
  );

  // Mutation
  const sendInvitation = useSendInvitation();

  // Map roles to SmartSelector format
  const roleItems: SmartSelectorItem[] = useMemo(() => 
    roles.map(r => ({
      id: r.id,
      name: r.name,
      subtitle: r.description || undefined,
      icon: Shield,
    }))
  , [roles]);

  // Map permissions to SmartSelector format
  const permissionItems: SmartSelectorItem[] = useMemo(() => 
    permissions.map(p => ({
      id: p.id,
      name: p.label,
      subtitle: p.codename,
      group: p.module,
    }))
  , [permissions]);

  // Departments
  const deptList: any[] = Array.isArray(departments)
    ? departments
    : ((departments as any)?.results || []);
  const departmentItems: SmartSelectorItem[] = useMemo(() =>
    deptList.map((d: any) => ({
      id: d.id,
      name: d.name,
      subtitle: d.description || undefined,
      icon: Building,
    })),
    [deptList]
  );

  // Positions (already filtered by department via hook)
  const positionList: any[] = Array.isArray(positions)
    ? positions
    : ((positions as any)?.results || []);
  const positionItems: SmartSelectorItem[] = useMemo(() =>
    positionList.map((p: any) => ({
      id: p.id,
      name: p.name,
      subtitle: `${p.level_display || p.level}${p.department?.name ? ` • ${p.department.name}` : ""}`,
      icon: Briefcase,
    })),
    [positionList]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

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

      router.push(`/organisation/${orgId}/hr/employees`);
    } catch (error: any) {
      // Extraire l'erreur structurée éventuelle
      const emailErr = error?.data?.email;
      if (emailErr && typeof emailErr === "object" && !Array.isArray(emailErr) && emailErr.code) {
        setServerError(emailErr);
        return;
      }

      toast("Erreur", {
        description:
          error.message || "Impossible d'envoyer l'invitation",
      });
    }
  };

  // Réinitialiser l'erreur quand l'email change
  const handleEmailChange = (newEmail: string) => {
    setFormData({ ...formData, email: newEmail });
    if (serverError) setServerError(null);
  };

  // Nouvelle fonction pour description du rôle
  const getRoleDescription = (roleId: string | null) => {
    if (!roleId) return "Ne donne aucun accès particulier par défaut.";
    const role = roles.find((r) => r.id === roleId);
    if (!role) return "";
    if (role.description) return role.description;
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
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>

                  {/* Feedback structuré pour l'email */}
                  {serverError?.code === "is_owner" && (
                    <Alert className="mt-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                      <Crown className="h-4 w-4 text-amber-600" />
                      <AlertTitle>Propriétaire de l'organisation</AlertTitle>
                      <AlertDescription>
                        {serverError.message ||
                          "Ce compte est le propriétaire de l'organisation et a déjà tous les droits."}
                      </AlertDescription>
                    </Alert>
                  )}
                  {serverError?.code === "already_member" && (
                    <Alert className="mt-2 border-blue-300 bg-blue-50 dark:bg-blue-950/20">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      <AlertTitle>Déjà membre</AlertTitle>
                      <AlertDescription className="flex flex-col gap-2">
                        <span>{serverError.message}</span>
                        {serverError.membership_id && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-fit gap-2"
                            onClick={() =>
                              router.push(
                                `/organisation/${orgId}/hr/employees/${serverError.membership_id}`
                              )
                            }
                          >
                            <UserCheck className="h-4 w-4" /> Voir la fiche
                          </Button>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                  {serverError?.code === "already_invited" && (
                    <Alert className="mt-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle>Invitation en cours</AlertTitle>
                      <AlertDescription className="flex flex-col gap-2">
                        <span>{serverError.message}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-fit"
                          onClick={() =>
                            router.push(`/organisation/${orgId}/hr/employees/invitations`)
                          }
                        >
                          Voir les invitations
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Département */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Département <span className="text-xs text-muted-foreground">(optionnel)</span>
                  </Label>
                  <SmartSelector
                    items={departmentItems}
                    selectedIds={formData.department_id ? [formData.department_id] : []}
                    onChange={(ids) => {
                      const newDept = ids[0] || null;
                      setFormData((prev) => ({
                        ...prev,
                        department_id: newDept,
                        // Réinitialiser le poste si incompatible avec le nouveau département
                        position_id: null,
                      }));
                    }}
                    placeholder="Sélectionner un département"
                    accentColor="primary"
                  />
                </div>

                {/* Poste */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Poste <span className="text-xs text-muted-foreground">(optionnel)</span>
                  </Label>
                  <SmartSelector
                    items={positionItems}
                    selectedIds={formData.position_id ? [formData.position_id] : []}
                    onChange={(ids) => {
                      const newPos = ids[0] || null;
                      const selected = positionList.find((p: any) => p.id === newPos);
                      setFormData((prev) => ({
                        ...prev,
                        position_id: newPos,
                        // Synchroniser automatiquement le département si le poste en a un
                        department_id:
                          selected?.department?.id || prev.department_id || null,
                      }));
                    }}
                    placeholder={
                      formData.department_id
                        ? "Sélectionner un poste dans ce département"
                        : "Sélectionner un poste"
                    }
                    accentColor="primary"
                  />
                  {formData.department_id && positionItems.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Aucun poste dans ce département. Créez-en un depuis la section Postes.
                    </p>
                  )}
                </div>

                {/* Nouvelle section Role UX amélioré */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    Rôle {roles.length > 0 && <span className="text-xs text-muted-foreground">(optionnel)</span>}
                  </Label>
                  <div className="flex flex-col gap-2">
                    <SmartSelector
                      items={roleItems}
                      selectedIds={formData.role_id ? [formData.role_id] : []}
                      onChange={(ids) => setFormData({ ...formData, role_id: ids[0] || null })}
                      placeholder="Sélectionner un rôle"
                      accentColor="primary"
                    />
                    {/* Affiche une description claire du rôle sélectionné */}
                    <div className="border p-3 bg-muted/40 text-xs flex items-start gap-2 transition-all">
                      <BadgeInfo className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="leading-relaxed">
                        {getRoleDescription(formData?.role_id ?? null)}
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
                  <SmartSelector
                    items={permissionItems}
                    selectedIds={formData.permission_ids || []}
                    onChange={(ids) => setFormData({ ...formData, permission_ids: ids })}
                    multiple
                    mode="inline"
                    accentColor="blue"
                    searchPlaceholder="Rechercher une permission ou un module..."
                    maxHeight="300px"
                  />
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
                <p className="text-sm font-medium">Département</p>
                <p className="text-sm text-muted-foreground">
                  {formData.department_id
                    ? deptList.find((d: any) => d.id === formData.department_id)?.name
                    : "Non assigné"}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Poste</p>
                <p className="text-sm text-muted-foreground">
                  {formData.position_id
                    ? positionList.find((p: any) => p.id === formData.position_id)?.name
                    : "Non assigné"}
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
                          <FaCheck className="h-3 w-3 text-green-600" />
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
