"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { PermissionGuard } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useCurrencyFormatter } from "@/lib/hooks";
import { useCreateExpense, useWarehouses } from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import { Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { FaCoins } from "react-icons/fa";
import { toast } from "sonner";

export default function CreateExpensePageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.EXPENSES.MANAGE}>
      <CreateExpensePage />
    </PermissionGuard>
  );
}

function CreateExpensePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const { formatCurrency } = useCurrencyFormatter();

  const { data: warehouses = [] } = useWarehouses(orgId, {
    page_size: "all",
    is_active: true,
  });
  const createExpense = useCreateExpense();

  const today = new Date().toISOString().slice(0, 10);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    reason: "",
    expense_date: today,
    warehouse_id: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      toast("Champ manquant", { description: "La description est obligatoire." });
      return;
    }
    const amount = parseFloat(formData.amount);
    if (!formData.amount || !Number.isFinite(amount) || amount <= 0) {
      toast("Montant invalide", { description: "Saisissez un montant > 0." });
      return;
    }
    if (!formData.expense_date) {
      toast("Champ manquant", { description: "La date est obligatoire." });
      return;
    }
    try {
      await createExpense.mutateAsync({
        orgId,
        data: {
          description: formData.description,
          amount: formData.amount,
          reason: formData.reason || undefined,
          expense_date: formData.expense_date,
          warehouse_id: formData.warehouse_id || null,
          notes: formData.notes || undefined,
        },
      });
      toast.success("Dépense enregistrée.");
      router.push(`/organisation/${orgId}/inventory/expenses`);
    } catch (error: unknown) {
      toast.error("Erreur", { description: getApiErrorMessage(error) });
    }
  };

  const amountNum = parseFloat(formData.amount);
  const amountPreview =
    formData.amount && Number.isFinite(amountNum) && amountNum > 0
      ? formatCurrency(amountNum)
      : null;

  return (
    <FormPageLayout
      title="Nouvelle dépense"
      subtitle="Enregistrez une dépense avec son motif et l'entrepôt rattaché"
      backLink={`/organisation/${orgId}/inventory/expenses`}
      sidebar={
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Aperçu</CardTitle>
            <CardDescription>Résumé de la dépense</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <FaCoins className="h-4 w-4 text-amber-600 shrink-0" />
                {formData.description || "Nouvelle dépense"}
              </p>
            </div>
            {amountPreview && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Montant</p>
                <p className="text-lg font-bold text-amber-700">{amountPreview}</p>
              </div>
            )}
            {formData.expense_date && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">
                  {new Date(formData.expense_date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
          <CardDescription>Renseignez les détails de la dépense</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                placeholder="Ex. Loyer entrepôt mai"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense_date">Date *</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expense_date: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motif</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Ex. loyer, électricité, transport..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warehouse_id">Entrepôt</Label>
              <select
                id="warehouse_id"
                value={formData.warehouse_id}
                onChange={(e) =>
                  setFormData({ ...formData, warehouse_id: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">— Aucun entrepôt —</option>
                {(warehouses as { id: string; name: string }[]).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Obligatoire si vous êtes restreint à un sous-ensemble
                d&apos;entrepôts.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                placeholder="Informations complémentaires..."
              />
            </div>

            <div className="flex gap-3 pt-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={createExpense.isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={createExpense.isPending} className="gap-2">
                {createExpense.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </FormPageLayout>
  );
}
