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
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/lib/api/error-message"
import { useAdminChangePlan } from "@/lib/hooks/admin"
import { usePlans } from "@/lib/hooks/core"
import type { SubscriptionCycle } from "@/lib/types/core"
import { useState } from "react"
import { toast } from "sonner"

export function ChangePlanDialog({
  userId,
  open,
  onOpenChange,
}: {
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [planCode, setPlanCode] = useState<string>("")
  const [cycle, setCycle] = useState<SubscriptionCycle>("monthly")
  const [reason, setReason] = useState("")

  const plans = usePlans()
  const mutation = useAdminChangePlan(userId)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!planCode) {
      toast.error("Sélectionne un plan.")
      return
    }
    mutation.mutate(
      { plan_code: planCode, cycle, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`Bascule effectuée vers ${planCode}.`)
          onOpenChange(false)
          setPlanCode("")
          setReason("")
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err, "Échec du changement de plan."))
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer de plan (admin)</DialogTitle>
          <DialogDescription>
            Bascule l&apos;utilisateur vers un autre plan sans paiement Djomy.
            Le précédent abonnement est marqué <em>cancelled</em> et un nouveau
            cycle démarre immédiatement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Plan cible</Label>
            <Select value={planCode} onValueChange={setPlanCode}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un plan" />
              </SelectTrigger>
              <SelectContent>
                {(plans.data ?? []).map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.name} — {p.price_monthly} {p.currency}/mois
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cycle</Label>
            <Select
              value={cycle}
              onValueChange={(v) => setCycle(v as SubscriptionCycle)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="yearly">Annuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Raison (interne, optionnel)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: client VIP, migration manuelle, etc."
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
              {mutation.isPending ? "Envoi…" : "Confirmer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
