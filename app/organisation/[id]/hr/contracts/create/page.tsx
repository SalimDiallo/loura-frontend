"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { PermissionGuard } from "@/components/permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SmartSelector, type SmartSelectorItem } from "@/components/ui/smart-selector";
import { useCreateContract, useMemberContracts, useMembers } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import type { ActiveContractExistsError, Contract, ContractStatus, ContractType } from "@/lib/types";
import { formatCurrency } from "@/utils/formatters";
import { AlertTriangle, CalendarDays, DollarSign, FileText, Loader2, Save, UserCheck } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const CONTRACT_TYPES: { id: ContractType; label: string }[] = [
  { id: "cdi", label: "CDI" },
  { id: "cdd", label: "CDD" },
  { id: "freelance", label: "Freelance" },
  { id: "internship", label: "Stage" },
  { id: "other", label: "Autre" },
];

/**
 * Règles d'utilisation de la date de fin selon le type de contrat :
 * - ``hidden``    : contrat à durée indéterminée → pas de date de fin.
 * - ``required``  : contrat à durée déterminée → date de fin obligatoire.
 * - ``optional``  : date de fin possible mais non imposée.
 */
const END_DATE_MODE: Record<ContractType, "hidden" | "required" | "optional"> = {
  cdi: "hidden",
  cdd: "required",
  internship: "required",
  freelance: "optional",
  other: "optional",
};

const CONTRACT_STATUSES: { id: ContractStatus; label: string }[] = [
  { id: "active", label: "Actif" },
  { id: "suspended", label: "Suspendu" },
];

export default function CreateContractPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.CONTRACTS.MANAGE}>
      <CreateContractPage />
    </PermissionGuard>
  );
}

function CreateContractPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = params.id as string;
  const prefilledMember = searchParams.get("member");

  const [membershipId, setMembershipId] = useState(prefilledMember || "");
  const [contractType, setContractType] = useState<ContractType>("cdi");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [status, setStatus] = useState<ContractStatus>("active");
  const [notes, setNotes] = useState("");
  /**
   * Par défaut, si un contrat actif existe pour ce membre, il sera
   * automatiquement terminé lors de la création du nouveau contrat.
   * L'utilisateur peut décocher cette case pour bloquer la création.
   */
  const [closeExisting, setCloseExisting] = useState(true);

  const { data: membersData } = useMembers(orgId, { page_size: 100 });
  const members = (membersData as any)?.results || [];

  const { data: memberContractsData } = useMemberContracts(
    orgId,
    membershipId
  );
  const existingActiveContract: Contract | undefined = useMemo(() => {
    const list = (memberContractsData as Contract[] | undefined) || [];
    return list.find((c) => c.status === "active");
  }, [memberContractsData]);

  const createContract = useCreateContract();

  const memberItems: SmartSelectorItem[] = useMemo(() =>
    members.map((m: any) => ({
      id: m.id,
      name: `${m.employee?.user?.first_name || ""} ${m.employee?.user?.last_name || ""}`.trim() || m.employee?.user?.email,
      subtitle: m.employee?.user?.email,
      icon: UserCheck,
    })),
    [members]
  );

  const selectedMember = members.find((m: any) => m.id === membershipId);

  const endDateMode = END_DATE_MODE[contractType];

  // Si l'utilisateur change pour un type sans date de fin (CDI), on réinitialise.
  const handleContractTypeChange = (newType: ContractType) => {
    setContractType(newType);
    if (END_DATE_MODE[newType] === "hidden") {
      setEndDate("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!membershipId) {
      toast.error("Veuillez sélectionner un membre.");
      return;
    }
    if (!startDate) {
      toast.error("La date de début est obligatoire.");
      return;
    }
    if (endDateMode === "required" && !endDate) {
      toast.error("La date de fin est obligatoire pour ce type de contrat.");
      return;
    }
    if (endDate && startDate && endDate < startDate) {
      toast.error("La date de fin doit être postérieure à la date de début.");
      return;
    }
    if (!baseSalary || Number(baseSalary) <= 0) {
      toast.error("Le salaire de base doit être supérieur à 0.");
      return;
    }

    // Pour un CDI on ne transmet jamais de date de fin, même si elle était
    // saisie avant un changement de type.
    const payloadEndDate =
      endDateMode === "hidden" ? undefined : endDate || undefined;

    try {
      await createContract.mutateAsync({
        orgId,
        data: {
          membership_id: membershipId,
          contract_type: contractType,
          start_date: startDate,
          end_date: payloadEndDate,
          base_salary: baseSalary,
          status,
          notes,
          close_existing: closeExisting,
        },
      });
      toast.success(
        existingActiveContract && closeExisting
          ? "Contrat créé — l'ancien contrat actif a été terminé."
          : "Contrat créé avec succès !"
      );
      router.push(`/organisation/${orgId}/hr/contracts`);
    } catch (error: any) {
      const data = error?.data;
      // Erreur structurée : contrat actif existant et close_existing=false.
      const structured: ActiveContractExistsError | null =
        data && typeof data === "object"
          ? (Object.values(data).find(
              (v: any) =>
                (Array.isArray(v) ? v[0]?.code : v?.code) ===
                "ACTIVE_CONTRACT_EXISTS"
            ) as any) || (data?.code === "ACTIVE_CONTRACT_EXISTS" ? data : null)
          : null;
      if (structured?.code === "ACTIVE_CONTRACT_EXISTS") {
        toast.error("Contrat actif existant", {
          description:
            "Cochez « Terminer le contrat actif existant » pour continuer.",
        });
        return;
      }
      const msg = data
        ? typeof data === "string"
          ? data
          : JSON.stringify(data)
        : error.message || "Impossible de créer le contrat";
      toast.error("Erreur", { description: msg });
    }
  };

  return (
    <FormPageLayout
      title="Nouveau contrat"
      subtitle="Créez un contrat de travail pour un membre de l'organisation"
      backLink={`/organisation/${orgId}/hr/contracts`}
      sidebar={
        <Card>
          <CardHeader>
            <CardTitle>Aperçu</CardTitle>
            <CardDescription>Résumé du contrat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">Membre</p>
              <p className="text-sm font-medium">
                {selectedMember
                  ? `${selectedMember.employee?.user?.first_name || ""} ${selectedMember.employee?.user?.last_name || ""}`.trim()
                  : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">Type</p>
              <p className="text-sm">{CONTRACT_TYPES.find((t) => t.id === contractType)?.label}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">Période</p>
              <p className="text-sm">
                {startDate || "—"} →{" "}
                {endDateMode === "hidden"
                  ? "Indéterminée"
                  : endDate || (endDateMode === "required" ? "— (requise)" : "Indéterminée")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">Salaire de base</p>
              <p className="text-sm font-semibold">
                {baseSalary ? Number(baseSalary).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) : "—"}
              </p>
            </div>
            <div className="pt-3 border-t">
              <span className={`text-xs px-2 py-0.5 rounded-full ${status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {CONTRACT_STATUSES.find((s) => s.id === status)?.label}
              </span>
            </div>
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Détails du contrat</CardTitle>
          <CardDescription>Remplissez les informations du contrat de travail</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Membre *</Label>
              <SmartSelector
                items={memberItems}
                selectedIds={membershipId ? [membershipId] : []}
                onChange={(ids) => setMembershipId(ids[0] || "")}
                placeholder="Sélectionner un membre"
                accentColor="primary"
              />
            </div>

            {existingActiveContract && (
              <Alert variant="default" className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                <AlertTriangle className="h-4 w-4 !text-amber-600 dark:!text-amber-400" />
                <AlertTitle>Contrat actif existant</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p className="text-sm">
                    Ce membre possède déjà un contrat actif —{" "}
                    <span className="font-semibold">
                      {existingActiveContract.contract_type_display}
                    </span>{" "}
                    ({formatCurrency(Number(existingActiveContract.base_salary))})
                    débuté le{" "}
                    <span className="font-medium">
                      {existingActiveContract.start_date}
                    </span>
                    {existingActiveContract.end_date
                      ? ` jusqu'au ${existingActiveContract.end_date}`
                      : ""}
                    .
                  </p>
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={closeExisting}
                      onCheckedChange={(v) => setCloseExisting(v === true)}
                      className="mt-0.5"
                    />
                    <span className="text-sm leading-tight">
                      <span className="font-medium">
                        Terminer automatiquement le contrat actif existant
                      </span>{" "}
                      lors de la création du nouveau contrat.
                      {!closeExisting && (
                        <span className="mt-1 block text-xs text-amber-700 dark:text-amber-300">
                          Si cette case est décochée, la création échouera tant
                          que le contrat actuel n'aura pas été clôturé manuellement.
                        </span>
                      )}
                    </span>
                  </label>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type de contrat *</Label>
                <select
                  className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={contractType}
                  onChange={(e) => handleContractTypeChange(e.target.value as ContractType)}
                >
                  {CONTRACT_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Statut initial</Label>
                <select
                  className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContractStatus)}
                >
                  {CONTRACT_STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Date de début *</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              {endDateMode === "hidden" ? (
                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <div className="flex h-10 items-center rounded-md border border-dashed border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                    Durée indéterminée (CDI)
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="end_date">
                    Date de fin{" "}
                    {endDateMode === "required" ? (
                      <span className="text-destructive">*</span>
                    ) : (
                      <span className="text-muted-foreground font-normal text-xs">
                        (Optionnel)
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="end_date"
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="pl-10"
                      required={endDateMode === "required"}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_salary">Salaire de base mensuel *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="base_salary"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 3000.00"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes <span className="text-muted-foreground font-normal text-xs">(Optionnel)</span></Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  id="notes"
                  rows={3}
                  placeholder="Conditions particulières, commentaires..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex w-full border rounded-md border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-10"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 justify-end border-t">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button type="submit" disabled={createContract.isPending} className="gap-2">
                {createContract.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Créer le contrat
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormPageLayout>
  );
}
