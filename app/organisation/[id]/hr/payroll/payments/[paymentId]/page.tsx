"use client";

import { GenerateDocumentButton } from "@/components/documents";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { Can, useOrgPermissions } from "@/components/permissions";
import { ReviewerBadge } from "@/components/services/hr/ReviewerBadge";
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
import { useCurrencyFormatter } from "@/lib/hooks";
import { useDeletePayment, usePayment, useUpdatePayment } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import type { PaymentStatus, PaymentType } from "@/lib/types";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  DollarSign,
  FileText,
  Loader2,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PAYMENT_TYPES: { id: PaymentType; label: string }[] = [
  { id: "salary", label: "Salaire" },
  { id: "bonus", label: "Bonus" },
  { id: "premium", label: "Prime" },
  { id: "adjustment", label: "Ajustement" },
];

function statusBadge(status: PaymentStatus) {
  switch (status) {
    case "approved":
      return <Badge className="bg-green-100 text-green-700 border-green-200">Approuvé</Badge>;
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">En attente</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejeté</Badge>;
  }
}

function getMemberName(m: any) {
  return `${m?.employee?.user?.first_name || ""} ${m?.employee?.user?.last_name || ""}`.trim();
}

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const paymentId = params.paymentId as string;
  const { can } = useOrgPermissions();
  const canManage = can(PERMISSIONS.PAYMENTS.MANAGE);
  const canApprove = can(PERMISSIONS.PAYMENTS.APPROVE);

  const { formatCurrency } = useCurrencyFormatter();

  const { data: payment, isLoading } = usePayment(orgId, paymentId);
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();

  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("salary");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState<"approved" | "rejected" | null>(null);

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount);
      setPaymentType(payment.payment_type);
      setPaymentDate(payment.payment_date);
      setNotes(payment.notes || "");
    }
  }, [payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    if (!amount || Number(amount) <= 0) {
      toast.error("Le montant doit être supérieur à 0.");
      return;
    }
    if (!paymentDate) {
      toast.error("La date de paiement est obligatoire.");
      return;
    }
    try {
      await updatePayment.mutateAsync({
        orgId,
        paymentId,
        data: {
          amount,
          payment_type: paymentType,
          payment_date: paymentDate,
          notes,
        },
      });
      toast.success("Paiement mis à jour.");
    } catch (error: any) {
      toast.error("Erreur", { description: error.message || "Impossible de mettre à jour" });
    }
  };

  const handleStatusChange = async () => {
    if (!showStatusChange) return;
    try {
      await updatePayment.mutateAsync({
        orgId,
        paymentId,
        data: { status: showStatusChange },
      });
      toast.success(showStatusChange === "approved" ? "Paiement approuvé." : "Paiement rejeté.");
      setShowStatusChange(null);
    } catch (error: any) {
      toast.error("Erreur", { description: error.message || "Action impossible" });
    }
  };

  const handleDelete = async () => {
    try {
      await deletePayment.mutateAsync({ orgId, paymentId });
      toast.success("Paiement supprimé.");
      router.push(`/organisation/${orgId}/hr/payroll`);
    } catch (error: any) {
      toast.error("Erreur", { description: error.message || "Impossible de supprimer" });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Paiement introuvable.
        </div>
      </div>
    );
  }

  const memberName = getMemberName(payment.membership) || payment.membership?.employee?.user?.email || "—";

  return (
    <FormPageLayout
      title={`Paiement — ${memberName}`}
      subtitle={`${payment.payment_type_display} • Créé le ${new Date(payment.created_at).toLocaleDateString("fr-FR")}`}
      backLink={`/organisation/${orgId}/hr/payroll`}
      sidebar={
        <div className="space-y-4">
          {/* Status card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Statut du paiement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground font-medium">Montant</p>
                <p className="text-2xl font-bold tracking-tight">
                  {formatCurrency(Number(payment.amount))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(payment.status)}
              </div>

              {payment.status === "pending" && canApprove && (
                <div className="space-y-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-green-600 hover:text-green-700"
                    onClick={() => setShowStatusChange("approved")}
                  >
                    <Check className="h-4 w-4" /> Approuver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                    onClick={() => setShowStatusChange("rejected")}
                  >
                    <X className="h-4 w-4" /> Rejeter
                  </Button>
                </div>
              )}
              {payment.status === "approved" && payment.reviewer && (
                <p className="text-xs text-muted-foreground">
                  Approuvé par <ReviewerBadge reviewer={payment.reviewer} showIcon />
                </p>
              )}
              {payment.status === "rejected" && (
                <p className="text-xs text-muted-foreground italic">
                  Ce paiement a été rejeté.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" /> Documents
              </CardTitle>
              <CardDescription className="text-xs">
                Reçu PDF avec le branding de l'organisation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GenerateDocumentButton
                orgId={orgId}
                docType="payment"
                objectId={paymentId}
                modalTitle="Reçu de paiement"
                modalSubtitle={memberName}
                className="w-full justify-start gap-2"
              >
                Aperçu du reçu
              </GenerateDocumentButton>
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Bénéficiaire</p>
                <p className="font-medium">{memberName}</p>
                <p className="text-xs text-muted-foreground">{payment.membership?.employee?.user?.email}</p>
              </div>
              {payment.contract && (
                <div>
                  <p className="text-xs text-muted-foreground">Contrat lié</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-sm"
                    onClick={() => router.push(`/organisation/${orgId}/hr/contracts/${payment.contract}`)}
                  >
                    Voir le contrat
                  </Button>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Créé le</p>
                <p>{new Date(payment.created_at).toLocaleDateString("fr-FR")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dernière modification</p>
                <p>{new Date(payment.updated_at).toLocaleDateString("fr-FR")}</p>
              </div>
            </CardContent>
          </Card>

          {/* Danger */}
          <Can permission={PERMISSIONS.PAYMENTS.MANAGE}>
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
                  <Trash2 className="h-4 w-4" /> Supprimer le paiement
                </Button>
              </CardContent>
            </Card>
          </Can>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>{canManage ? "Modifier le paiement" : "Détails du paiement"}</CardTitle>
          <CardDescription>
            {canManage
              ? "Modifiez les informations du paiement"
              : "Consultation en lecture seule (permission hr.manage_payments requise pour modifier)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset disabled={!canManage} className="space-y-6 contents">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payment_type">Type de paiement *</Label>
                  <select
                    id="payment_type"
                    className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                    disabled={!canManage}
                  >
                    {PAYMENT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_date">Date de paiement *</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="payment_date"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="pl-10"
                      required
                      disabled={!canManage}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Montant *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10"
                    required
                    disabled={!canManage}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">
                  Notes <span className="text-muted-foreground font-normal text-xs">(Optionnel)</span>
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-10 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={!canManage}
                  />
                </div>
              </div>
            </fieldset>

            <div className="flex gap-3 pt-4 justify-end border-t">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                {canManage ? "Annuler" : "Retour"}
              </Button>
              {canManage && (
                <Button type="submit" disabled={updatePayment.isPending} className="gap-2">
                  {updatePayment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Enregistrer
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Delete confirm */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le paiement</DialogTitle>
            <DialogDescription>
              Voulez-vous supprimer le paiement de{" "}
              <span className="font-semibold">
                {formatCurrency(Number(payment.amount))} pour {memberName}
              </span>
              {" "}? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletePayment.isPending} className="gap-2">
              {deletePayment.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status change confirm */}
      <Dialog open={!!showStatusChange} onOpenChange={(open) => !open && setShowStatusChange(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showStatusChange === "approved" ? "Approuver le paiement" : "Rejeter le paiement"}
            </DialogTitle>
            <DialogDescription>
              Voulez-vous {showStatusChange === "approved" ? "approuver" : "rejeter"} le paiement de{" "}
              <span className="font-semibold">
                {formatCurrency(Number(payment.amount))} pour {memberName}
              </span>
              {" "}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusChange(null)}>Annuler</Button>
            <Button
              variant={showStatusChange === "approved" ? "default" : "destructive"}
              onClick={handleStatusChange}
              disabled={updatePayment.isPending}
              className="gap-2"
            >
              {updatePayment.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {showStatusChange === "approved" ? "Approuver" : "Rejeter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormPageLayout>
  );
}
