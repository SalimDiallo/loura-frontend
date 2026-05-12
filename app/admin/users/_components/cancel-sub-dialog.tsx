"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/lib/api/error-message"
import { useAdminCancelSub } from "@/lib/hooks/admin"
import { useState } from "react"
import { toast } from "sonner"

export function CancelSubDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [reason, setReason] = useState("")
  const mutation = useAdminCancelSub(userId)

  function confirm() {
    mutation.mutate(
      { reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Abonnement annulé.")
          onOpenChange(false)
          setReason("")
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Échec de l'annulation."))
        },
      }
    )
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler l&apos;abonnement ?</AlertDialogTitle>
          <AlertDialogDescription>
            L&apos;abonnement est conservé <strong>jusqu&apos;à la fin de la
            période en cours</strong>, puis bascule automatiquement sur le plan
            Free. L&apos;auto-renouvellement est désactivé.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Raison (interne, optionnel)</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: demande client, fraude détectée, etc."
            maxLength={255}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Retour
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            disabled={mutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending ? "Envoi…" : "Confirmer l'annulation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
