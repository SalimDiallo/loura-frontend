"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useAdminUserBilling } from "@/lib/hooks/admin"
import type { BillingEvent, SubscriptionStatus } from "@/lib/types/core"
import { Ban, Gift, RefreshCcw } from "lucide-react"
import { useState } from "react"
import { CancelSubDialog } from "./cancel-sub-dialog"
import { ChangePlanDialog } from "./change-plan-dialog"
import { GrantMonthsDialog } from "./grant-months-dialog"

function StatusBadge({ status }: { status: SubscriptionStatus | null }) {
  if (!status) return <Badge variant="outline">aucun</Badge>
  const variantMap: Record<SubscriptionStatus, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    cancelled: "secondary",
    expired: "destructive",
    past_due: "destructive",
  }
  const labelMap: Record<SubscriptionStatus, string> = {
    active: "Actif",
    cancelled: "Annulé",
    expired: "Expiré",
    past_due: "Paiement en attente",
  }
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>
}

function EventRow({ event }: { event: BillingEvent }) {
  const meta = event.metadata as Record<string, unknown>
  const isAdmin = Boolean(meta?.admin_action) || event.event_type === "gift_granted"
  const date = new Date(event.created_at).toLocaleString("fr-FR")

  return (
    <li className="border-l-2 border-muted py-2 pl-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs">{event.event_type}</span>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
      {event.message ? (
        <p className="mt-1 text-sm">{event.message}</p>
      ) : null}
      {isAdmin && typeof meta.granted_by_email === "string" ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Action admin · {String(meta.granted_by_email)}
          {typeof meta.reason === "string" && meta.reason
            ? ` · « ${meta.reason} »`
            : null}
        </p>
      ) : null}
      {event.event_type === "gift_granted" && typeof meta.months === "number" ? (
        <p className="mt-1 text-xs text-muted-foreground">
          +{meta.months} mois offerts
        </p>
      ) : null}
    </li>
  )
}

export function UserBillingDrawer({
  userId,
  open,
  onOpenChange,
}: {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data, isLoading } = useAdminUserBilling(userId)
  const [grantOpen, setGrantOpen] = useState(false)
  const [changeOpen, setChangeOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const sub = data?.subscription
  const user = data?.user

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{user?.full_name || user?.email || "Utilisateur"}</SheetTitle>
          <SheetDescription className="font-mono text-xs">
            {user?.email}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
          {/* ── Abonnement courant ────────────────────────────────────── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Abonnement courant
            </h3>
            {isLoading ? (
              <Skeleton className="h-32" />
            ) : sub ? (
              <div className="space-y-2 rounded-lg border p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{sub.plan.name}</span>
                  <StatusBadge status={sub.status} />
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Cycle</span>
                  <span>{sub.cycle === "yearly" ? "Annuel" : "Mensuel"}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Fin de période</span>
                  <span>
                    {new Date(sub.current_period_end).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Auto-renouvellement</span>
                  <span>{sub.auto_renew ? "oui" : "non"}</span>
                </div>
                {sub.scheduled_plan ? (
                  <div className="rounded-md bg-muted px-2 py-1 text-xs">
                    Changement planifié → <strong>{sub.scheduled_plan.name}</strong>{" "}
                    à la fin de la période
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun abonnement actif.
              </p>
            )}
          </section>

          {/* ── Actions ────────────────────────────────────────────────── */}
          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Actions
            </h3>
            <div className="flex flex-col gap-2">
              <Button
                variant="default"
                disabled={!userId}
                onClick={() => setGrantOpen(true)}
              >
                <Gift className="size-4" />
                Offrir des mois gratuits
              </Button>
              <Button
                variant="outline"
                disabled={!userId}
                onClick={() => setChangeOpen(true)}
              >
                <RefreshCcw className="size-4" />
                Changer de plan
              </Button>
              <Button
                variant="destructive"
                disabled={!userId || !sub}
                onClick={() => setCancelOpen(true)}
              >
                <Ban className="size-4" />
                Annuler l&apos;abonnement
              </Button>
            </div>
          </section>

          {/* ── Historique ─────────────────────────────────────────────── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">
              Historique de facturation (30 derniers)
            </h3>
            {isLoading ? (
              <Skeleton className="h-32" />
            ) : (data?.events ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun événement.</p>
            ) : (
              <ul className="space-y-1">
                {data?.events.map((e) => <EventRow key={e.id} event={e} />)}
              </ul>
            )}
          </section>
        </div>

        {userId ? (
          <>
            <GrantMonthsDialog
              userId={userId}
              open={grantOpen}
              onOpenChange={setGrantOpen}
            />
            <ChangePlanDialog
              userId={userId}
              open={changeOpen}
              onOpenChange={setChangeOpen}
            />
            <CancelSubDialog
              userId={userId}
              open={cancelOpen}
              onOpenChange={setCancelOpen}
            />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
