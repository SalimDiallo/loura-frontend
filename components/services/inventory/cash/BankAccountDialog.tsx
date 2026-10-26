"use client";

/**
 * Dialog de création / édition d'un compte bancaire.
 *
 * Volontairement minimal (utilisateurs non techniques) : intitulé + solde
 * d'ouverture suffisent ; banque, n° de compte et rattachement entrepôt sont
 * optionnels.
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
import {
  useCreateBankAccount,
  useUpdateBankAccount,
} from "@/lib/hooks/inventory";
import type { BankAccount } from "@/lib/types/inventory";
import { useState } from "react";
import { toast } from "sonner";

interface IdName {
  id: string;
  name: string;
}

export function BankAccountDialog({
  open,
  onOpenChange,
  orgId,
  warehouses = [],
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  warehouses?: IdName[];
  /** Compte à éditer ; absent = création. */
  account?: BankAccount | null;
}) {
  const createAccount = useCreateBankAccount();
  const updateAccount = useUpdateBankAccount();
  const isEdit = !!account;
  const pending = createAccount.isPending || updateAccount.isPending;

  // Initialisé depuis ``account`` au montage. Le parent force un remontage via
  // ``key`` quand on passe d'un compte à un autre (ou à la création), ce qui
  // réexécute cet initialiseur — évite un setState dans un effet.
  const [form, setForm] = useState(() => ({
    name: account?.name ?? "",
    bank_name: account?.bank_name ?? "",
    account_number: account?.account_number ?? "",
    opening_balance: account?.opening_balance ?? "0",
    warehouse_id: account?.warehouse ?? "",
    notes: account?.notes ?? "",
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast("Intitulé manquant", {
        description: "Donnez un nom au compte (ex. Compte courant BICIGUI).",
      });
      return;
    }
    const data = {
      name: form.name.trim(),
      bank_name: form.bank_name || undefined,
      account_number: form.account_number || undefined,
      opening_balance: form.opening_balance || "0",
      warehouse_id: form.warehouse_id || null,
      notes: form.notes || undefined,
    };
    try {
      if (isEdit && account) {
        await updateAccount.mutateAsync({ orgId, id: account.id, data });
        toast.success("Compte mis à jour.");
      } else {
        await createAccount.mutateAsync({ orgId, data });
        toast.success("Compte créé.");
      }
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error("Erreur", { description: getApiErrorMessage(error) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le compte" : "Nouveau compte bancaire"}
          </DialogTitle>
          <DialogDescription>
            Comptes bancaires, Mobile Money ou autres fonds dématérialisés.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="ba-name">Intitulé *</Label>
            <Input
              id="ba-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex. Compte courant BICIGUI"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ba-bank">Banque</Label>
              <Input
                id="ba-bank"
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                placeholder="Ex. BICIGUI, Orange Money…"
              />
            </div>
            <div>
              <Label htmlFor="ba-number">N° de compte</Label>
              <Input
                id="ba-number"
                value={form.account_number}
                onChange={(e) =>
                  setForm({ ...form, account_number: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ba-opening">Solde d&apos;ouverture (GNF)</Label>
              <Input
                id="ba-opening"
                type="number"
                step="0.01"
                value={form.opening_balance}
                onChange={(e) =>
                  setForm({ ...form, opening_balance: e.target.value })
                }
                disabled={isEdit}
              />
              {isEdit && (
                <p className="text-xs text-muted-foreground mt-1">
                  Le solde d&apos;ouverture ne se modifie pas après création.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="ba-warehouse">Entrepôt (facultatif)</Label>
              <select
                id="ba-warehouse"
                value={form.warehouse_id}
                onChange={(e) =>
                  setForm({ ...form, warehouse_id: e.target.value })
                }
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">— Aucun —</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="ba-notes">Notes</Label>
            <Textarea
              id="ba-notes"
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
              disabled={pending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
