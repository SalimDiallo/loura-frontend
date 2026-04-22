"use client";

import { GenerateDocumentButton } from "@/components/documents";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { Can, useOrgPermissions } from "@/components/permissions";
import { AuditBadge } from "@/components/services/AuditBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useContract, useDeleteContract, useUpdateContract } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import type { ContractStatus, ContractType } from "@/lib/types";
import {
  AlertTriangle,
  CalendarDays,
  DollarSign,
  FileText,
  Loader2,
  Pause,
  Play,
  Save,
  Square,
  Trash2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const CONTRACT_TYPES: { id: ContractType; label: string }[] = [
  { id: "cdi", label: "CDI" },
  { id: "cdd", label: "CDD" },
  { id: "freelance", label: "Freelance" },
  { id: "internship", label: "Stage" },
  { id: "other", label: "Autre" },
];

function statusBadge(status: ContractStatus) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-700 border-green-200">Actif</Badge>;
    case "suspended":
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Suspendu</Badge>;
    case "terminated":
      return <Badge variant="destructive">Terminé</Badge>;
  }
}

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const contractId = params.contractId as string;
  const { can } = useOrgPermissions();
  const canManage = can(PERMISSIONS.CONTRACTS.MANAGE);

  const { data: contract, isLoading } = useContract(orgId, contractId);
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();

  const [contractType, setContractType] = useState<ContractType>("cdi");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [notes, setNotes] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState<ContractStatus | null>(null);

  useEffect(() => {
    if (contract) {
      setContractType(contract.contract_type);
      setStartDate(contract.start_date);
      setEndDate(contract.end_date || "");
      setBaseSalary(contract.base_salary);
      setNotes(contract.notes || "");
    }
  }, [contract]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseSalary || Number(baseSalary) <= 0) {
      toast.error("Le salaire de base doit être supérieur à 0.");
      return;
    }
    try {
      await updateContract.mutateAsync({
        orgId,
        contractId,
        data: {
          contract_type: contractType,
          start_date: startDate,
          end_date: endDate || undefined,
          base_salary: baseSalary,
          notes,
        },
      });
      toast.success("Contrat mis à jour !");
    } catch (error: any) {
      toast.error("Erreur", { description: error.message || "Impossible de mettre à jour" });
    }
  };

  const handleStatusChange = async () => {
    if (!showStatusChange) return;
    try {
      await updateContract.mutateAsync({
        orgId,
        contractId,
        data: { status: showStatusChange },
      });
      toast.success(
        showStatusChange === "terminated"
          ? "Contrat résilié."
          : showStatusChange === "suspended"
            ? "Contrat suspendu."
            : "Contrat réactivé."
      );
      setShowStatusChange(null);
    } catch (error: any) {
      toast.error("Erreur", { description: error.message || "Impossible de modifier le statut" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContract.mutateAsync({ orgId, contractId });
      toast.success("Contrat supprimé.");
      router.push(`/organisation/${orgId}/hr/contracts`);
    } catch (error: any) {
      toast.error("Erreur", { description: error.message || "Impossible de supprimer" });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-destructive">Contrat introuvable.</p>
      </div>
    );
  }

  const memberName = `${contract.membership?.employee?.user?.first_name || ""} ${contract.membership?.employee?.user?.last_name || ""}`.trim();

  return (
    <FormPageLayout
      title={`Contrat — ${memberName}`}
      subtitle={`${contract.contract_type_display} • Créé le ${new Date(contract.created_at).toLocaleDateString("fr-FR")}`}
      backLink={`/organisation/${orgId}/hr/contracts`}
      sidebar={
        <div className="space-y-4">
          {/* Status card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Statut du contrat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {statusBadge(contract.status)}
              </div>

              <Can permission={PERMISSIONS.CONTRACTS.MANAGE}>
                <div className="space-y-2 pt-2">
                  {contract.status === "active" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 text-yellow-600 hover:text-yellow-700"
                        onClick={() => setShowStatusChange("suspended")}
                      >
                        <Pause className="h-4 w-4" /> Suspendre
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                        onClick={() => setShowStatusChange("terminated")}
                      >
                        <Square className="h-4 w-4" /> Résilier
                      </Button>
                    </>
                  )}
                  {contract.status === "suspended" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 text-green-600 hover:text-green-700"
                        onClick={() => setShowStatusChange("active")}
                      >
                        <Play className="h-4 w-4" /> Réactiver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                        onClick={() => setShowStatusChange("terminated")}
                      >
                        <Square className="h-4 w-4" /> Résilier
                      </Button>
                    </>
                  )}
                  {contract.status === "terminated" && (
                    <p className="text-xs text-muted-foreground italic">
                      Ce contrat est résilié. Aucune action de statut disponible.
                    </p>
                  )}
                </div>
              </Can>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" /> Documents
              </CardTitle>
              <CardDescription className="text-xs">
                Génération PDF avec le branding de l'organisation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GenerateDocumentButton
                orgId={orgId}
                docType="contract"
                objectId={contractId}
                modalTitle="Contrat de travail"
                modalSubtitle={memberName}
                className="w-full justify-start gap-2"
              >
                Aperçu du contrat
              </GenerateDocumentButton>
            </CardContent>
          </Card>

          {/* Info card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Membre</p>
                <p className="font-medium">{memberName}</p>
                <p className="text-xs text-muted-foreground">{contract.membership?.employee?.user?.email}</p>
              </div>
              <div className="space-y-1.5 pt-1 border-t">
                <AuditBadge
                  kind="created"
                  user={contract.created_by_info}
                  at={contract.created_at}
                  fallback={
                    <p className="text-xs text-muted-foreground">
                      Créé le{" "}
                      {new Date(contract.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  }
                />
                {contract.updated_at !== contract.created_at && (
                  <AuditBadge
                    kind="updated"
                    user={contract.updated_by_info}
                    at={contract.updated_at}
                    fallback={
                      <p className="text-xs text-muted-foreground">
                        Modifié le{" "}
                        {new Date(contract.updated_at).toLocaleDateString(
                          "fr-FR"
                        )}
                      </p>
                    }
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Zone de danger */}
          <Can permission={PERMISSIONS.CONTRACTS.MANAGE}>
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-sm text-destructive">Zone de danger</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="h-4 w-4" /> Supprimer le contrat
                </Button>
              </CardContent>
            </Card>
          </Can>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>{canManage ? "Modifier le contrat" : "Détails du contrat"}</CardTitle>
          <CardDescription>
            {canManage
              ? "Modifiez les informations du contrat"
              : "Consultation en lecture seule (permission hr.manage_contracts requise pour modifier)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <fieldset disabled={!canManage} className="space-y-6 disabled:opacity-70">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type de contrat</Label>
                <select
                  className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value as ContractType)}
                  disabled={!canManage}
                >
                  {CONTRACT_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Date de début</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Date de fin</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="end_date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_salary">Salaire de base mensuel</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="base_salary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex w-full border rounded-md border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-10"
                  placeholder="Notes, conditions particulières..."
                />
              </div>
            </div>

            </fieldset>
            <div className="flex gap-3 pt-4 justify-end border-t">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {canManage ? "Annuler" : "Retour"}
              </Button>
              <Can permission={PERMISSIONS.CONTRACTS.MANAGE}>
                <Button type="submit" disabled={updateContract.isPending} className="gap-2">
                  {updateContract.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Enregistrer
                </Button>
              </Can>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Status change confirmation */}
      <Dialog open={!!showStatusChange} onOpenChange={() => setShowStatusChange(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Changer le statut
            </DialogTitle>
            <DialogDescription>
              {showStatusChange === "terminated" &&
                "Êtes-vous sûr de vouloir résilier ce contrat ? Cette action marque le contrat comme terminé."}
              {showStatusChange === "suspended" &&
                "Êtes-vous sûr de vouloir suspendre ce contrat ? Il pourra être réactivé ultérieurement."}
              {showStatusChange === "active" &&
                "Voulez-vous réactiver ce contrat ?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusChange(null)}>Annuler</Button>
            <Button
              variant={showStatusChange === "terminated" ? "destructive" : "default"}
              onClick={handleStatusChange}
              disabled={updateContract.isPending}
              className="gap-2"
            >
              {updateContract.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le contrat</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le contrat de {memberName} sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteContract.isPending}
              className="gap-2"
            >
              {deleteContract.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormPageLayout>
  );
}
