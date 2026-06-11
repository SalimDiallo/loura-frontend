"use client";

import { PermissionGuard } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useCreateExpense, useWarehouses } from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
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
    if (!formData.description || !formData.amount || !formData.expense_date) {
      toast("Champs manquants", {
        description: "Description, montant et date sont obligatoires.",
      });
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

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <FaCoins className="h-6 w-6 text-amber-600" />
          <h1 className="text-2xl font-bold tracking-tight">
            Nouvelle dépense
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Enregistrez une dépense avec son motif et l&apos;entrepôt rattaché.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                placeholder="Ex. Loyer entrepôt mai"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Montant *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div>
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

            <div>
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

            <div>
              <Label htmlFor="warehouse_id">Entrepôt</Label>
              <select
                id="warehouse_id"
                value={formData.warehouse_id}
                onChange={(e) =>
                  setFormData({ ...formData, warehouse_id: e.target.value })
                }
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">— Aucun entrepôt —</option>
                {(warehouses as { id: string; name: string }[]).map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Obligatoire si vous êtes restreint à un sous-ensemble
                d&apos;entrepôts.
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={createExpense.isPending}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={createExpense.isPending}>
            {createExpense.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
