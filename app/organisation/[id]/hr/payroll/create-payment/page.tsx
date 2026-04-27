"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { PermissionGuard } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SmartSelector, type SmartSelectorItem } from "@/components/ui/smart-selector";
import { useContracts, useCreatePayment, useMembers } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import type { PaymentType } from "@/lib/types";
import { CalendarDays, DollarSign, FileText, Loader2, Save, UserCheck } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";

const PAYMENT_TYPES: { id: PaymentType; label: string; desc: string }[] = [
  { id: "salary", label: "Salaire", desc: "Paiement mensuel régulier" },
  { id: "bonus", label: "Bonus", desc: "Prime de performance" },
  { id: "premium", label: "Prime", desc: "Prime exceptionnelle" },
  { id: "adjustment", label: "Ajustement", desc: "Correction de paie" },
];

export default function CreatePaymentPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.PAYMENTS.MANAGE}>
      <Suspense fallback={null}>
        <CreatePaymentPage />
      </Suspense>
    </PermissionGuard>
  );
}

function CreatePaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = params.id as string;
  const prefilledMember = searchParams.get("member");

  const [membershipId, setMembershipId] = useState(prefilledMember || "");
  const [contractId, setContractId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("salary");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const { data: membersData } = useMembers(orgId, { page_size: 100 });
  const members = (membersData as any)?.results || [];

  const { data: contractsRaw } = useContracts(orgId, { status: "active", page_size: "all" });
  const contracts = Array.isArray(contractsRaw) ? contractsRaw : ((contractsRaw as any)?.results || []);

  const createPayment = useCreatePayment();

  const memberItems: SmartSelectorItem[] = useMemo(() =>
    members.map((m: any) => ({
      id: m.id,
      name: `${m.employee?.user?.first_name || ""} ${m.employee?.user?.last_name || ""}`.trim() || m.employee?.user?.email,
      subtitle: m.employee?.user?.email,
      icon: UserCheck,
    })),
    [members]
  );

  const memberContracts = useMemo(() =>
    contracts.filter((c: any) => c.membership?.id === membershipId),
    [contracts, membershipId]
  );

  const contractItems: SmartSelectorItem[] = useMemo(() =>
    memberContracts.map((c: any) => ({
      id: c.id,
      name: `${c.contract_type_display} — ${Number(c.base_salary).toLocaleString("fr-FR")}`,
      subtitle: `${c.start_date} → ${c.end_date || "Indéterminée"}`,
    })),
    [memberContracts]
  );

  const selectedMember = members.find((m: any) => m.id === membershipId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!membershipId) { toast.error("Sélectionnez un membre."); return; }
    if (!amount || Number(amount) <= 0) { toast.error("Le montant doit être supérieur à 0."); return; }
    if (!paymentDate) { toast.error("La date de paiement est obligatoire."); return; }

    try {
      await createPayment.mutateAsync({
        orgId,
        data: {
          membership_id: membershipId,
          contract_id: contractId || undefined,
          amount,
          payment_type: paymentType,
          payment_date: paymentDate,
          notes,
        },
      });
      toast.success("Paiement créé avec succès !");
      router.push(`/organisation/${orgId}/hr/payroll`);
    } catch (error: any) {
      const msg = error?.data ? (typeof error.data === "string" ? error.data : JSON.stringify(error.data)) : error.message || "Impossible de créer le paiement";
      toast.error("Erreur", { description: msg });
    }
  };

  return (
    <FormPageLayout
      title="Nouveau paiement"
      subtitle="Enregistrez un paiement pour un membre"
      backLink={`/organisation/${orgId}/hr/payroll`}
      sidebar={
        <Card>
          <CardHeader>
            <CardTitle>Aperçu</CardTitle>
            <CardDescription>Résumé du paiement</CardDescription>
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
              <p className="text-sm">{PAYMENT_TYPES.find((t) => t.id === paymentType)?.label}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">Montant</p>
              <p className="text-lg font-bold">
                {amount ? Number(amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">Date</p>
              <p className="text-sm">{paymentDate || "—"}</p>
            </div>
            <div className="pt-3 border-t">
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                En attente de validation
              </span>
            </div>
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Détails du paiement</CardTitle>
          <CardDescription>Le paiement sera créé avec le statut « En attente »</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Membre *</Label>
              <SmartSelector
                items={memberItems}
                selectedIds={membershipId ? [membershipId] : []}
                onChange={(ids) => { setMembershipId(ids[0] || ""); setContractId(""); }}
                placeholder="Sélectionner un membre"
                accentColor="primary"
              />
            </div>

            {membershipId && contractItems.length > 0 && (
              <div className="space-y-2">
                <Label>Contrat associé <span className="text-muted-foreground font-normal text-xs">(Optionnel)</span></Label>
                <SmartSelector
                  items={contractItems}
                  selectedIds={contractId ? [contractId] : []}
                  onChange={(ids) => setContractId(ids[0] || "")}
                  placeholder="Associer à un contrat actif"
                  accentColor="blue"
                />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type de paiement *</Label>
                <select
                  className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                >
                  {PAYMENT_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label} — {t.desc}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_date">Date de paiement *</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="payment_date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="pl-10" required />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Montant *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="amount" type="number" min="0" step="0.01" placeholder="Ex: 3000.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes <span className="text-muted-foreground font-normal text-xs">(Optionnel)</span></Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea id="notes" rows={3} placeholder="Détails supplémentaires..." value={notes} onChange={(e) => setNotes(e.target.value)} className="flex w-full border rounded-md border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-10" />
              </div>
            </div>

            <div className="flex gap-3 pt-4 justify-end border-t">
              <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
              <Button type="submit" disabled={createPayment.isPending} className="gap-2">
                {createPayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Créer le paiement
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormPageLayout>
  );
}
