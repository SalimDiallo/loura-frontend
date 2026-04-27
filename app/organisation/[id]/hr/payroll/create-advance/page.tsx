"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { useOrgPermissions } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SmartSelector, type SmartSelectorItem } from "@/components/ui/smart-selector";
import { useCreateAdvanceRequest, useMembers } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import { CalendarDays, DollarSign, FileText, Loader2, Save, UserCheck } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function CreateAdvancePageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = params.id as string;
  const prefilledMember = searchParams.get("member");
  const { can, membershipId: myMembershipId } = useOrgPermissions();
  const canReviewForOthers = can(PERMISSIONS.ADVANCES.REVIEW);

  const [membershipId, setMembershipId] = useState(prefilledMember || "");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: membersData } = useMembers(orgId, { page_size: 100 });
  const allMembers = (membersData as any)?.results || [];

  // Si l'utilisateur ne peut pas reviewer, il ne peut créer que pour lui-même
  const members = useMemo(() => {
    if (canReviewForOthers) return allMembers;
    return allMembers.filter((m: any) => m.id === myMembershipId);
  }, [allMembers, canReviewForOthers, myMembershipId]);

  // Pré-sélectionner automatiquement son propre membership si restreint
  useEffect(() => {
    if (!canReviewForOthers && myMembershipId && !membershipId) {
      setMembershipId(myMembershipId);
    }
  }, [canReviewForOthers, myMembershipId, membershipId]);

  const createAdvance = useCreateAdvanceRequest();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!membershipId) { toast.error("Sélectionnez un membre."); return; }
    if (!amount || Number(amount) <= 0) { toast.error("Le montant doit être supérieur à 0."); return; }
    if (!reason.trim()) { toast.error("Le motif est obligatoire."); return; }

    try {
      await createAdvance.mutateAsync({
        orgId,
        data: {
          membership_id: membershipId,
          amount,
          reason,
          request_date: requestDate,
        },
      });
      toast.success("Demande d'avance créée avec succès !");
      router.push(`/organisation/${orgId}/hr/payroll`);
    } catch (error: any) {
      const msg = error?.data ? (typeof error.data === "string" ? error.data : JSON.stringify(error.data)) : error.message || "Impossible de créer la demande";
      toast.error("Erreur", { description: msg });
    }
  };

  return (
    <FormPageLayout
      title="Nouvelle demande d'avance"
      subtitle="Créez une demande d'avance sur salaire pour un membre"
      backLink={`/organisation/${orgId}/hr/payroll`}
      sidebar={
        <Card>
          <CardHeader>
            <CardTitle>Aperçu</CardTitle>
            <CardDescription>Résumé de la demande</CardDescription>
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
              <p className="text-xs font-medium uppercase text-muted-foreground">Montant demandé</p>
              <p className="text-lg font-bold">
                {amount ? Number(amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase text-muted-foreground">Date de la demande</p>
              <p className="text-sm">{requestDate || "—"}</p>
            </div>
            <div className="pt-3 border-t">
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                En attente de validation
              </span>
            </div>
            <p className="text-xs text-muted-foreground italic">
              La demande devra être approuvée par un administrateur.
            </p>
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Détails de la demande</CardTitle>
          <CardDescription>
            La demande sera créée avec le statut « En attente ». Un administrateur devra l'approuver ou la rejeter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Membre demandeur *</Label>
              <SmartSelector
                items={memberItems}
                selectedIds={membershipId ? [membershipId] : []}
                onChange={(ids) => setMembershipId(ids[0] || "")}
                placeholder="Sélectionner un membre"
                accentColor="primary"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant de l'avance *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="amount" type="number" min="0" step="0.01" placeholder="Ex: 500.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="request_date">Date de la demande *</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="request_date" type="date" value={requestDate} onChange={(e) => setRequestDate(e.target.value)} className="pl-10" required />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motif de la demande *</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  id="reason"
                  rows={4}
                  placeholder="Décrivez le motif de la demande d'avance..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="flex w-full border rounded-md border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 justify-end border-t">
              <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
              <Button type="submit" disabled={createAdvance.isPending} className="gap-2">
                {createAdvance.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Soumettre la demande
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormPageLayout>
  );
}

export default function CreateAdvancePage() {
  return (
    <Suspense fallback={null}>
      <CreateAdvancePageContent />
    </Suspense>
  );
}
