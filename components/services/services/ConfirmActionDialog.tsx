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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

export type ConfirmActionTone = "default" | "danger" | "success";

export interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /** Niveau de sensibilité visuelle. */
  tone?: ConfirmActionTone;
  /** Libellé du bouton principal (ex: "Valider", "Annuler la transaction"). */
  confirmLabel: string;
  /** Libellé du bouton d'abandon. Défaut : "Annuler". */
  cancelLabel?: string;
  /** Icône optionnelle dans le header. */
  icon?: ReactNode;
  /** Bandeau d'information additionnel (ex: récap montant). */
  details?: ReactNode;
  /** Si fourni, demande un texte (ex: motif de blocage). */
  reasonField?: {
    label: string;
    placeholder?: string;
    required?: boolean;
    rows?: number;
  };
  /** Async : si la promesse résout, le modal se ferme. Si elle rejette, il reste ouvert. */
  onConfirm: (reason?: string) => Promise<void> | void;
}

const TONE_CLASS: Record<ConfirmActionTone, string> = {
  default: "",
  danger: "",
  success: "",
};

/**
 * Modal de confirmation générique pour toute action sensible.
 *
 * - Bouton principal coloré selon `tone` (`danger` = rouge, défaut sinon).
 * - Loader pendant la mutation, désactive les boutons.
 * - Optionnellement collecte un motif (textarea, requis ou non).
 */
export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  tone = "default",
  confirmLabel,
  cancelLabel = "Annuler",
  icon,
  details,
  reasonField,
  onConfirm,
}: ConfirmActionDialogProps) {
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    if (reasonField?.required && !reason.trim()) {
      return;
    }
    setPending(true);
    try {
      await onConfirm(reason.trim() || undefined);
      // succès : on referme et on reset
      setReason("");
      onOpenChange(false);
    } catch {
      // L'appelant gère le toast d'erreur. On laisse le modal ouvert pour retry.
    } finally {
      setPending(false);
    }
  };

  const confirmVariant: "destructive" | "default" =
    tone === "danger" ? "destructive" : "default";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (pending) return;
        if (!o) setReason("");
        onOpenChange(o);
      }}
    >
      <DialogContent className={`sm:max-w-md ${TONE_CLASS[tone]}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {details && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
            {details}
          </div>
        )}

        {reasonField && (
          <div className="space-y-1.5">
            <Label htmlFor="confirm-reason">
              {reasonField.label}
              {reasonField.required && (
                <span className="text-destructive ml-0.5">*</span>
              )}
            </Label>
            <Textarea
              id="confirm-reason"
              rows={reasonField.rows ?? 3}
              placeholder={reasonField.placeholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={pending}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={handleConfirm}
            disabled={
              pending || (reasonField?.required && !reason.trim())
            }
          >
            {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
