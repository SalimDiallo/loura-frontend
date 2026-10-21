"use client";

import { Can, PermissionGuard } from "@/components/permissions";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
    useDeleteExpense,
    useExpense,
    useUpdateExpense,
    useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import { Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaCoins, FaTrash } from "react-icons/fa";
import { toast } from "sonner";

export default function ExpenseDetailWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.EXPENSES.VIEW}>
      <ExpenseDetail />
    </PermissionGuard>
  );
}

function ExpenseDetail() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const expenseId = params.expenseId as string;
  const { formatCurrency } = useCurrencyFormatter();

  const { data: expense, isLoading, error } = useExpense(orgId, expenseId);
  const { data: warehouses = [] } = useWarehouses(orgId, {
    page_size: "all",
    is_active: true,
  });
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    reason: "",
    expense_date: "",
    warehouse_id: "",
    notes: "",
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount,
        reason: expense.reason ?? "",
        expense_date: expense.expense_date,
        warehouse_id: expense.warehouse?.id ?? "",
        notes: expense.notes ?? "",
      });
    }
  }, [expense]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              Dépense introuvable ou inaccessible.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (!formData.amount || !Number.isFinite(amount) || amount <= 0) {
      toast("Montant invalide", { description: "Saisissez un montant > 0." });
      return;
    }
    try {
      await updateExpense.mutateAsync({
        orgId,
        id: expenseId,
        data: {
          description: formData.description,
          amount: formData.amount,
          reason: formData.reason || undefined,
          expense_date: formData.expense_date,
          warehouse_id: formData.warehouse_id || null,
          notes: formData.notes || undefined,
        },
      });
      toast.success("Dépense mise à jour.");
    } catch (err: unknown) {
      toast.error("Erreur", { description: getApiErrorMessage(err) });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteExpense.mutateAsync({ orgId, id: expenseId });
      toast.success("Dépense supprimée.");
      router.push(`/organisation/${orgId}/inventory/expenses`);
    } catch (err: unknown) {
      toast.error("Erreur", { description: getApiErrorMessage(err) });
    }
  };

  const amountNum = Number(expense.amount);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(`/organisation/${orgId}/inventory/expenses`)
            }
            className="mb-2 -ml-2"
          >
            <FaArrowLeft className="mr-2 h-3 w-3" />
            Retour aux dépenses
          </Button>
          <div className="flex items-center gap-3">
            <FaCoins className="h-5 w-5 text-amber-600 shrink-0" />
            <h1 className="text-2xl font-bold tracking-tight">
              {expense.description}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {Number.isFinite(amountNum) ? (
              <span className="font-semibold text-amber-700">
                {formatCurrency(amountNum)}
              </span>
            ) : null}{" "}
            · le{" "}
            {new Date(expense.expense_date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Créée le{" "}
            {new Date(expense.created_at).toLocaleString("fr-FR", {
              dateStyle: "short",
              timeStyle: "short",
            })}{" "}
            par{" "}
            <span
              className="font-medium"
              title={expense.created_by_info?.email ?? ""}
            >
              {expense.created_by_info?.name ||
                expense.created_by_info?.email ||
                "—"}
            </span>
          </p>
          {expense.updated_at !== expense.created_at &&
          expense.updated_by_info ? (
            <p className="text-xs text-muted-foreground">
              Modifiée le{" "}
              {new Date(expense.updated_at).toLocaleString("fr-FR", {
                dateStyle: "short",
                timeStyle: "short",
              })}{" "}
              par{" "}
              <span
                className="font-medium"
                title={expense.updated_by_info.email ?? ""}
              >
                {expense.updated_by_info.name ||
                  expense.updated_by_info.email ||
                  "—"}
              </span>
            </p>
          ) : null}
        </div>
        <Can permission={PERMISSIONS.EXPENSES.MANAGE}>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0">
                <FaTrash className="mr-2 h-3 w-3" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer cette dépense ?</AlertDialogTitle>
                <AlertDialogDescription>
                  La dépense sera déplacée dans la corbeille et retirée des
                  soldes de caisse. Elle reste restaurable.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteExpense.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Can>
      </header>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Modifier la dépense</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
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
              />
            </div>
          </CardContent>
        </Card>

        <Can permission={PERMISSIONS.EXPENSES.MANAGE}>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={updateExpense.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={updateExpense.isPending}
              className="gap-2"
            >
              {updateExpense.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </div>
        </Can>
      </form>
    </div>
  );
}
