"use client";

/**
 * Dialog de création d'un mouvement de caisse (apport / retrait).
 *
 * Réutilisé depuis la page Caisse — évite une page de formulaire séparée pour
 * une saisie rapide au comptoir. Le sens (entrée/sortie) est choisi via deux
 * boutons segmentés bien visibles pour limiter les erreurs.
 */

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useCreateCashAdjustment } from "@/lib/hooks/inventory";
import type {
  CashDirection,
  CashPaymentMethod,
} from "@/lib/types/inventory";
import { useState } from "react";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";
import { toast } from "sonner";

const METHOD_OPTIONS: { value: CashPaymentMethod; label: string }[] = [
  { value: "cash", label: "Espèces" },
  { value: "bank_transfer", label: "Virement bancaire" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "check", label: "Chèque" },
  { value: "card", label: "Carte bancaire" },
  { value: "other", label: "Autre" },
];

interface WarehouseOption {
  id: string;
  name: string;
}

export function CashAdjustmentDialog({
  open,
  onOpenChange,
  orgId,
  warehouses,
  defaultWarehouseId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  warehouses: WarehouseOption[];
  defaultWarehouseId?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const createAdjustment = useCreateCashAdjustment();

  const [direction, setDirection] = useState<CashDirection>("in");
  const [form, setForm] = useState({
    warehouse_id: defaultWarehouseId ?? "",
    amount: "",
    method: "cash" as CashPaymentMethod,
    label: "",
    reason: "",
    adjustment_date: today,
    notes: "",
  });

  const reset = () => {
    setDirection("in");
    setForm({
      warehouse_id: defaultWarehouseId ?? "",
      amount: "",
      method: "cash",
      label: "",
      reason: "",
      adjustment_date: today,
      notes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.warehouse_id || !form.amount || !form.label) {
      toast("Champs manquants", {
        description: "Caisse, montant et intitulé sont obligatoires.",
      });
      return;
    }
    try {
      await createAdjustment.mutateAsync({
        orgId,
        data: {
          warehouse_id: form.warehouse_id,
          direction,
          amount: form.amount,
          method: form.method,
          label: form.label,
          reason: form.reason || undefined,
          adjustment_date: form.adjustment_date,
          notes: form.notes || undefined,
        },
      });
      toast.success(
        direction === "in" ? "Apport enregistré." : "Retrait enregistré."
      );
      reset();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error("Erreur", { description: getApiErrorMessage(error) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau mouvement de caisse</DialogTitle>
          <DialogDescription>
            Enregistrez un apport (entrée) ou un retrait (sortie) de fonds.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sens : boutons segmentés */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection("in")}
              className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                direction === "in"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40"
                  : "border-border text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <FaArrowDown className="h-3.5 w-3.5" />
              Apport (entrée)
            </button>
            <button
              type="button"
              onClick={() => setDirection("out")}
              className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                direction === "out"
                  ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/40"
                  : "border-border text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <FaArrowUp className="h-3.5 w-3.5" />
              Retrait (sortie)
            </button>
          </div>

          <div>
            <Label htmlFor="adj-label">Intitulé *</Label>
            <Input
              id="adj-label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder={
                direction === "in" ? "Ex. Fond de caisse" : "Ex. Retrait gérant"
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adj-amount">Montant (GNF) *</Label>
              <Input
                id="adj-amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="adj-date">Date *</Label>
              <Input
                id="adj-date"
                type="date"
                value={form.adjustment_date}
                onChange={(e) =>
                  setForm({ ...form, adjustment_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adj-warehouse">Caisse (entrepôt) *</Label>
              <select
                id="adj-warehouse"
                value={form.warehouse_id}
                onChange={(e) =>
                  setForm({ ...form, warehouse_id: e.target.value })
                }
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                required
              >
                <option value="">— Choisir une caisse —</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="adj-method">Méthode</Label>
              <select
                id="adj-method"
                value={form.method}
                onChange={(e) =>
                  setForm({
                    ...form,
                    method: e.target.value as CashPaymentMethod,
                  })
                }
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              >
                {METHOD_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="adj-notes">Notes</Label>
            <Textarea
              id="adj-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createAdjustment.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={createAdjustment.isPending}>
              {createAdjustment.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
