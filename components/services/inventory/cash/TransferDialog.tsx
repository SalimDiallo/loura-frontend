"use client";

/**
 * Dialog de transfert interne caisse ↔ banque.
 *
 * Deux sens via boutons segmentés : « Caisse → Banque » (déposer les espèces)
 * ou « Banque → Caisse » (retirer du liquide). Le total de trésorerie ne change
 * pas : on déplace simplement les fonds d'un canal à l'autre.
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
import { useCreateTreasuryTransfer } from "@/lib/hooks/inventory";
import type { TransferDirection } from "@/lib/types/inventory";
import { useState } from "react";
import { FaBuildingColumns, FaWallet } from "react-icons/fa6";
import { toast } from "sonner";

interface IdName {
  id: string;
  name: string;
}

export function TransferDialog({
  open,
  onOpenChange,
  orgId,
  warehouses,
  bankAccounts,
  defaultWarehouseId,
  defaultBankAccountId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  warehouses: IdName[];
  bankAccounts: IdName[];
  defaultWarehouseId?: string;
  defaultBankAccountId?: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const createTransfer = useCreateTreasuryTransfer();

  const [direction, setDirection] = useState<TransferDirection>("cash_to_bank");
  const [form, setForm] = useState({
    warehouse_id: defaultWarehouseId ?? "",
    bank_account_id: defaultBankAccountId ?? "",
    amount: "",
    transfer_date: today,
    label: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.warehouse_id || !form.bank_account_id || !form.amount) {
      toast("Champs manquants", {
        description: "Caisse, compte et montant sont obligatoires.",
      });
      return;
    }
    try {
      await createTransfer.mutateAsync({
        orgId,
        data: {
          warehouse_id: form.warehouse_id,
          bank_account_id: form.bank_account_id,
          direction,
          amount: form.amount,
          transfer_date: form.transfer_date,
          label: form.label || undefined,
          notes: form.notes || undefined,
        },
      });
      toast.success("Transfert enregistré.");
      setForm({
        warehouse_id: defaultWarehouseId ?? "",
        bank_account_id: defaultBankAccountId ?? "",
        amount: "",
        transfer_date: today,
        label: "",
        notes: "",
      });
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error("Erreur", { description: getApiErrorMessage(error) });
    }
  };

  const toBank = direction === "cash_to_bank";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transfert caisse ↔ banque</DialogTitle>
          <DialogDescription>
            Déplacez des fonds entre une caisse et un compte. La trésorerie
            totale reste inchangée.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDirection("cash_to_bank")}
              className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                toBank
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <FaWallet className="h-3.5 w-3.5" />→
              <FaBuildingColumns className="h-3.5 w-3.5" />
              Dépôt en banque
            </button>
            <button
              type="button"
              onClick={() => setDirection("bank_to_cash")}
              className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${
                !toBank
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <FaBuildingColumns className="h-3.5 w-3.5" />→
              <FaWallet className="h-3.5 w-3.5" />
              Retrait vers caisse
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tr-warehouse">Caisse *</Label>
              <select
                id="tr-warehouse"
                value={form.warehouse_id}
                onChange={(e) =>
                  setForm({ ...form, warehouse_id: e.target.value })
                }
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                required
              >
                <option value="">— Choisir —</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="tr-account">Compte bancaire *</Label>
              <select
                id="tr-account"
                value={form.bank_account_id}
                onChange={(e) =>
                  setForm({ ...form, bank_account_id: e.target.value })
                }
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                required
              >
                <option value="">— Choisir —</option>
                {bankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tr-amount">Montant (GNF) *</Label>
              <Input
                id="tr-amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="tr-date">Date *</Label>
              <Input
                id="tr-date"
                type="date"
                value={form.transfer_date}
                onChange={(e) =>
                  setForm({ ...form, transfer_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tr-label">Intitulé</Label>
            <Input
              id="tr-label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder={
                toBank ? "Ex. Dépôt recette du jour" : "Ex. Retrait pour la caisse"
              }
            />
          </div>

          <div>
            <Label htmlFor="tr-notes">Notes</Label>
            <Textarea
              id="tr-notes"
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
              disabled={createTransfer.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={createTransfer.isPending}>
              {createTransfer.isPending ? "Transfert..." : "Transférer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
