"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { PermissionGuard } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SmartSelector, type SmartSelectorItem } from "@/components/ui/smart-selector";
import { Switch } from "@/components/ui/switch";
import { useCreatePosition, useDepartments } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import { CreatePositionData, PositionLevel } from "@/lib/types";
import { Briefcase, Building, FileText, Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FaUserTie } from "react-icons/fa";
import { toast } from "sonner";

const POSITION_LEVELS: { id: PositionLevel; label: string }[] = [
  { id: "junior", label: "Junior" },
  { id: "intermediate", label: "Intermédiaire" },
  { id: "senior", label: "Senior" },
  { id: "lead", label: "Lead" },
  { id: "manager", label: "Manager" },
  { id: "director", label: "Directeur" },
];

export default function CreatePositionPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.HR.MANAGE_EMPLOYEES}>
      <CreatePositionPage />
    </PermissionGuard>
  );
}

function CreatePositionPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [formData, setFormData] = useState<CreatePositionData>({
    name: "",
    description: "",
    department_id: null,
    level: "intermediate",
    is_active: true,
  });

  // Fetch departments (for selection)
  const { data: departmentsResponse } = useDepartments(orgId, { page_size: "all" });
  const allDepartments = Array.isArray(departmentsResponse) 
    ? departmentsResponse 
    : ((departmentsResponse as any)?.results || []);

  const createPosition = useCreatePosition();

  // Mapper pour SmartSelector
  const departmentItems: SmartSelectorItem[] = useMemo(() => 
    allDepartments.map((d: any) => ({
      id: d.id,
      name: d.name,
      subtitle: d.full_path,
      icon: Building,
    }))
  , [allDepartments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast("Nom requis", { description: "Le nom du poste est obligatoire." });
      return;
    }

    try {
      await createPosition.mutateAsync({
        orgId,
        data: formData,
      });

      toast.success("Poste créé avec succès !");
      router.push(`/organisation/${orgId}/hr/positions`);
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible de créer le poste",
      });
    }
  };

  const selectedDepartmentName = useMemo(() => {
    if (!formData.department_id) return "Aucun département";
    return allDepartments.find((d: any) => d.id === formData.department_id)?.name || "Département inconnu";
  }, [formData.department_id, allDepartments]);

  const selectedLevelName = useMemo(() => {
    return POSITION_LEVELS.find((l) => l.id === formData.level)?.label || formData.level;
  }, [formData.level]);

  return (
    <FormPageLayout
      title="Créer un poste"
      subtitle="Définissez les rôles et niveaux de responsabilité"
      backLink={`/organisation/${orgId}/hr/positions`}
      sidebar={
        <Card>
          <CardHeader>
            <CardTitle>Aperçu</CardTitle>
            <CardDescription>
              Aperçu en temps réel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Nom du Poste</p>
              <p className="text-sm text-primary font-medium flex items-center gap-2">
                <FaUserTie className="h-4 w-4" />
                {formData.name || 'Nouveau Poste'}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Département & Niveau</p>
              <p className="text-sm text-muted-foreground flex flex-col gap-1">
                <span className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5" />
                  {selectedDepartmentName}
                </span>
                <span className="flex items-center gap-1.5 ml-0.5">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Niveau {selectedLevelName}
                </span>
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Statut</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${formData.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
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
          <CardTitle>Détails du poste</CardTitle>
          <CardDescription>
            Remplissez les informations essentielles du job
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="position-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Titre du poste *</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Ex: Développeur Frontend, Comptable..."
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
                    placeholder="Brèves attributions..."
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="flex w-full border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-10 border rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Niveau de Responsabilité</Label>
                <select
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as PositionLevel })}
                >
                  {POSITION_LEVELS.map(level => (
                    <option key={level.id} value={level.id}>{level.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Rattachement au Département <span className="text-muted-foreground font-normal text-xs">(Optionnel)</span></Label>
                <SmartSelector
                  items={departmentItems}
                  selectedIds={formData.department_id ? [formData.department_id] : []}
                  onChange={(ids) => setFormData({ ...formData, department_id: ids[0] || null })}
                  placeholder="Sélectionner le département"
                  accentColor="primary"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex flex-row items-center justify-between border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Poste Actif</Label>
                  <p className="text-sm text-muted-foreground">
                    Si désactivé, ce poste ne pourra plus être assigné à de nouveaux employés.
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

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
                disabled={createPosition.isPending}
                className="gap-2"
              >
                {createPosition.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Enregistrer le poste
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </FormPageLayout>
  );
}
