"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/lib/api/error-message"
import { useAdminGrantMonths } from "@/lib/hooks/admin"
import { useState } from "react"
import { toast } from "sonner"

export function GrantMonthsDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [months, setMonths] = useState<number>(1)
  const [reason, setReason] = useState("")
  const mutation = useAdminGrantMonths(userId)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (months < 1 || months > 24) {
      toast.error("Le nombre de mois doit être entre 1 et 24.")
      return
    }
    mutation.mutate(
      { months, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`${months} mois offerts.`)
          onOpenChange(false)
          setMonths(1)
          setReason("")
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Impossible d'offrir les mois."))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Offrir des mois gratuits</DialogTitle>
          <DialogDescription>
            Prolonge la fin de période de l&apos;abonnement courant sans
            changer le plan. Le compteur d&apos;essai n&apos;est pas
            réinitialisé : on ajoute N × 30 jours à la fin de période actuelle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="months">Nombre de mois (1–24)</Label>
            <Input
              id="months"
              type="number"
              min={1}
              max={24}
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value || "0", 10))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Raison (interne, optionnel)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: compensation incident du 2026-04-15"
              maxLength={255}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Envoi…" : `Offrir ${months} mois`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
