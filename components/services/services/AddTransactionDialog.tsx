"use client";

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
import {
  QuickSelect,
  type QuickSelectItem,
} from "@/components/ui/quick-select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateServiceTransaction,
  usePaginatedEnrollments,
} from "@/lib/hooks/services";
import type {
  CreateServiceTransactionData,
  ServiceTransactionPaymentMethod,
  ServiceTransactionType,
} from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { FaUserPlus } from "react-icons/fa";
import { toast } from "sonner";

const TRANSACTION_TYPE_OPTIONS: {
  value: ServiceTransactionType;
  label: string;
  subtitle?: string;
}[] = [
  {
    value: "client_payment",
    label: "Paiement client",
    subtitle: "Encaissement venant du client",
  },
  {
    value: "internal_expense",
    label: "Dépense interne",
    subtitle: "Sortie de trésorerie liée au dossier",
  },
  {
    value: "revenue",
    label: "Revenu",
    subtitle: "Autre entrée (commission, marge…)",
  },
  {
    value: "refund",
    label: "Remboursement",
    subtitle: "Restitution au client",
  },
];

const PAYMENT_METHOD_OPTIONS: {
  value: ServiceTransactionPaymentMethod;
  label: string;
}[] = [
  { value: "cash", label: "Espèces" },
  { value: "bank", label: "Virement bancaire" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "cheque", label: "Chèque" },
  { value: "card", label: "Carte" },
  { value: "other", label: "Autre" },
];

const TRANSACTION_TYPE_ITEMS: QuickSelectItem[] = TRANSACTION_TYPE_OPTIONS.map(
  (o) => ({ id: o.value, name: o.label, subtitle: o.subtitle })
);

const PAYMENT_METHOD_ITEMS: QuickSelectItem[] = PAYMENT_METHOD_OPTIONS.map(
  (o) => ({ id: o.value, name: o.label })
);

export interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  /** Préselection : inscription liée. */
  enrollmentId?: string;
  /** Préselection : module spécifique. */
  moduleInstanceId?: string;
  /** Type par défaut (paiement client par défaut). */
  defaultType?: ServiceTransactionType;
  /** Callback succès (tx créée). */
  onCreated?: () => void;
  /**
   * Solde à payer (ou montant cible) — affiche un bouton « Solder » qui
   * préfille le champ montant. Optionnel.
   */
  remainingBalance?: number;
  /** Libellé du bouton de pré-remplissage (par défaut : « Solder »). */
  fillBalanceLabel?: string;
  /**
   * Si vrai, pré-remplit automatiquement le montant avec ``remainingBalance``
   * dès l'ouverture (mode « solder en un clic »).
   */
  autoFillBalance?: boolean;
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  orgId,
  enrollmentId,
  moduleInstanceId,
  defaultType = "client_payment",
  onCreated,
  remainingBalance,
  fillBalanceLabel = "Solder",
  autoFillBalance = false,
}: AddTransactionDialogProps) {
  const create = useCreateServiceTransaction(orgId);

  const initialAmount =
    autoFillBalance && typeof remainingBalance === "number" && remainingBalance > 0
      ? remainingBalance.toFixed(2)
      : "";

  const [type, setType] = useState<ServiceTransactionType | "">(defaultType);
  const [amount, setAmount] = useState<string>(initialAmount);
  const [method, setMethod] = useState<ServiceTransactionPaymentMethod | "">(
    "cash"
  );
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [autoConfirm, setAutoConfirm] = useState(true);
  // Sélection libre d'un dossier client quand aucun ``enrollmentId``
  // n'est pré-fourni (ex : page « Transactions » globale).
  const [pickedEnrollmentId, setPickedEnrollmentId] = useState<string>("");

  // Charge la liste des inscriptions seulement lorsque l'utilisateur peut
  // choisir (mode page globale) ET que le dialog est effectivement ouvert.
  const enrollmentsQuery = usePaginatedEnrollments(
    enrollmentId ? "" : orgId,
    undefined,
    { pageSize: 100 }
  );
  const enrollmentItems = useMemo<QuickSelectItem[]>(
    () =>
      (enrollmentsQuery.data ?? []).map((e) => ({
        id: e.id,
        name: `${e.reference || "—"} · ${e.customer_info.name}`,
        subtitle: e.service_info.name,
      })),
    [enrollmentsQuery.data]
  );
  const effectiveEnrollmentId = enrollmentId || pickedEnrollmentId || "";

  const reset = () => {
    setType(defaultType);
    // Si on est en mode « solder en un clic », on repart toujours du solde
    // restant pour les réouvertures successives du dialog.
    setAmount(initialAmount);
    setMethod("cash");
    setDate(new Date().toISOString().slice(0, 10));
    setReference("");
    setDescription("");
    setAutoConfirm(true);
    setPickedEnrollmentId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) {
      toast.error("Montant invalide", {
        description: "Le montant doit être strictement positif.",
      });
      return;
    }
    if (!type) {
      toast.error("Type de transaction requis", {
        description: "Sélectionnez un type de transaction.",
      });
      return;
    }
    if (!method) {
      toast.error("Mode de paiement requis", {
        description: "Sélectionnez un mode de paiement.",
      });
      return;
    }
    const payload: CreateServiceTransactionData = {
      transaction_type: type,
      amount: num.toFixed(2),
      payment_method: method,
      transaction_date: date,
      reference: reference.trim(),
      description: description.trim(),
      status: autoConfirm ? "confirmed" : "pending",
    };
    if (effectiveEnrollmentId) payload.enrollment = effectiveEnrollmentId;
    if (moduleInstanceId) payload.module_instance = moduleInstanceId;

    try {
      await create.mutateAsync(payload);
      toast.success("Transaction enregistrée.");
      reset();
      onOpenChange(false);
      onCreated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string }; message?: string };
      toast.error("Création impossible", {
        description:
          e?.data?.detail || e?.message || "Veuillez réessayer.",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle transaction</DialogTitle>
          <DialogDescription>
            {enrollmentId
              ? "Enregistrez un mouvement financier lié à cette inscription."
              : "Enregistrez un paiement, une dépense ou un revenu du périmètre Services."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <QuickSelect
                label="Type"
                items={TRANSACTION_TYPE_ITEMS}
                selectedId={type}
                onSelect={(id) => setType(id as ServiceTransactionType | "")}
                placeholder="Choisir un type..."
                accentColor="primary"
                canCreate={false}
              />
            </div>
            <div>
              <Label>Mode</Label>
              <QuickSelect
                label="Mode"
                items={PAYMENT_METHOD_ITEMS}
                selectedId={method}
                onSelect={(id) =>
                  setMethod(id as ServiceTransactionPaymentMethod | "")
                }
                placeholder="Choisir un mode..."
                accentColor="orange"
                canCreate={false}
              />
            </div>
          </div>

          {/* Sélecteur de dossier : visible uniquement quand le dialog est
              ouvert depuis une page « globale » (pas de pré-rattachement).
              Obligatoire pour client_payment / refund. */}
          {!enrollmentId && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Dossier client</Label>
                {enrollmentsQuery.isLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
              <QuickSelect
                label="Dossier client"
                items={enrollmentItems}
                selectedId={pickedEnrollmentId}
                onSelect={setPickedEnrollmentId}
                placeholder={
                  enrollmentItems.length === 0
                    ? "Aucun dossier disponible"
                    : "Rechercher un dossier client..."
                }
                icon={FaUserPlus}
                accentColor="blue"
                canCreate={false}
              />
              <p className="text-[11px] text-muted-foreground">
                Optionnel — laissez vide pour une transaction non rattachée à un
                dossier.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="tx-amount">Montant</Label>
                {typeof remainingBalance === "number" && remainingBalance > 0 && (
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => setAmount(remainingBalance.toFixed(2))}
                    aria-label={`${fillBalanceLabel} : ${remainingBalance.toFixed(2)}`}
                  >
                    {fillBalanceLabel} ({remainingBalance.toFixed(2)})
                  </button>
                )}
              </div>
              <Input
                id="tx-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                inputMode="decimal"
              />
            </div>
            <div>
              <Label htmlFor="tx-date">Date</Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tx-ref">Référence (optionnel)</Label>
            <Input
              id="tx-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex : REC-001, virement #..."
            />
          </div>

          <div>
            <Label htmlFor="tx-desc">Description</Label>
            <Textarea
              id="tx-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes / commentaire"
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoConfirm}
              onChange={(e) => setAutoConfirm(e.target.checked)}
              className="h-4 w-4"
            />
            Valider immédiatement la transaction
          </label>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
