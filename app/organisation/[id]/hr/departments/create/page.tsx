"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { PermissionGuard } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SmartSelector, type SmartSelectorItem } from "@/components/ui/smart-selector";
import { Switch } from "@/components/ui/switch";
import { useCreateDepartment, useDepartments, usePaginatedMembers } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import { CreateDepartmentData } from "@/lib/types";
import { Briefcase, Building, FileText, Loader2, Save, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function CreateDepartmentPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.HR.MANAGE_EMPLOYEES}>
      <CreateDepartmentPage />
    </PermissionGuard>
  );
}

function CreateDepartmentPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [formData, setFormData] = useState<CreateDepartmentData>({
    name: "",
    description: "",
    parent_id: null,
    manager_id: null,
    is_active: true,
  });

  // Fetch departments (for parent selection)
  const { data: departmentsResponse } = useDepartments(orgId, { page_size: "all" });
  const allDepartments = Array.isArray(departmentsResponse) ? departmentsResponse : ((departmentsResponse as any)?.results || []);

  // Fetch members (for manager selection)
  const { data: membersResponse } = usePaginatedMembers(orgId, {}, { pageSize: 100 });
  const allMembers = membersResponse || [];

  // Mutation
  const createDepartment = useCreateDepartment();

  // Mapper pour SmartSelector
  const parentItems: SmartSelectorItem[] = useMemo(() =>
    allDepartments.map((d: any) => ({
      id: d.id,
      name: d.name,
      subtitle: d.full_path,
      icon: Building,
    }))
    , [allDepartments]);

  const managerItems: SmartSelectorItem[] = useMemo(() =>
    allMembers.map((m: any) => ({
      id: m.id, 
      name: `${m.employee.user.first_name} ${m.employee.user.last_name}`,
      subtitle: m.employee.user.email,
      icon: User,
    }))
    , [allMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast("Nom requis", { description: "Le nom du département est obligatoire." });
      return;
    }

    try {
      await createDepartment.mutateAsync({
        orgId,
        data: formData,
      });

      toast.success("Département créé avec succès !");
      router.push(`/organisation/${orgId}/hr/departments`);
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible de créer le département",
      });
    }
  };

  return (
    <FormPageLayout
      title="Créer un département"
      subtitle="Configurez la structure hiérarchique et désignez les responsables"
      backLink={`/organisation/${orgId}/hr/departments`}
      sidebar={
        <Card>
          <CardHeader>
            <CardTitle>Aperçu</CardTitle>
            <CardDescription>
              Aperçu en temps réel de votre département
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Nom complet</p>
              <p className="text-sm text-primary font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {formData.parent_id
                  ? `${allDepartments.find((d: any) => d.id === formData.parent_id)?.name} > ${formData.name || 'Nouveau'}`
                  : formData.name || 'Nouveau Département'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Responsable désigné</p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                {formData.manager_id
                  ? managerItems.find((m) => m.id === formData.manager_id)?.name
                  : "Aucun responsable"}
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Statut</p>
                <span className={`text-xs px-2 py-0.5  ${formData.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {formData.is_active ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Détails du département</CardTitle>
          <CardDescription>
            Remplissez les informations de base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="department-form" onSubmit={handleSubmit} className="space-y-6">

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nom du département *</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Ex: Ressources Humaines, IT..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    id="description"
                    rows={3}
                    placeholder="Brève description des responsabilités..."
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="flex w-full  border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Département Parent <span className="text-muted-foreground font-normal text-xs">(Optionnel)</span></Label>
                <SmartSelector
                  items={parentItems}
                  selectedIds={formData.parent_id ? [formData.parent_id] : []}
                  onChange={(ids) => setFormData({ ...formData, parent_id: ids[0] || null })}
                  placeholder="Sélectionner le département parent"
                  accentColor="primary"
                />
              </div>

              <div className="space-y-2">
                <Label>Responsable (Manager) <span className="text-muted-foreground font-normal text-xs">(Optionnel)</span></Label>
                <SmartSelector
                  items={managerItems}
                  selectedIds={formData.manager_id ? [formData.manager_id] : []}
                  onChange={(ids) => setFormData({ ...formData, manager_id: ids[0] || null })}
                  placeholder="Rechercher un membre de l'organisation"
                  accentColor="blue"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex flex-row items-center justify-between border p-4 ">
                <div className="space-y-0.5">
                  <Label className="text-base">Département Actif</Label>
                  <p className="text-sm text-muted-foreground">
                    Si désactivé, ce département n'apparaîtra plus dans les sélections.
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createDepartment.isPending}
                className="gap-2"
              >
                {createDepartment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Enregistrer le département
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </FormPageLayout>
  );
}
