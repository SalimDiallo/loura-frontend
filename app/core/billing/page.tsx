"use client";

import { SubscriptionStatusBadge, UsageGuard } from "@/components/billing";
import { PlanCard } from "@/components/billing/PlanCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BillingToggle } from "@/landing/components/sections/pricing";
import {
    useBillingEvents,
    useCancelSubscription,
    useMySubscription,
    usePlans
} from "@/lib/hooks/core";
import type { Plan, SubscriptionCycle } from "@/lib/types/core";
import { Crown, History, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// ─── Subscription Banner (compact, design landing-like) ─────────────────────

function CurrentSubscriptionBanner() {
  const { data: subscription, isLoading } = useMySubscription();
  const cancelMutation = useCancelSubscription();

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }
  if (!subscription) return null;

  const isFree = subscription.plan.code === "free";
  const isCancelled = subscription.status === "cancelled";

  const handleCancel = () => {
    if (
      !confirm(
        "Annuler votre abonnement ? Vous garderez l'accès jusqu'à la fin de la période."
      )
    )
      return;
    cancelMutation.mutate(undefined, {
      onSuccess: () => toast.success("Abonnement annulé."),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <div className="border border-border bg-background px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 bg-primary/10 flex items-center justify-center shrink-0">
          <Crown className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-mono uppercase tracking-widest text-primary/60">
              Forfait actuel
            </p>
            {isCancelled && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                Annulé
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-lg leading-tight">
            {subscription.plan.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            Cycle {subscription.cycle === "yearly" ? "annuel" : "mensuel"}
            {!isFree && (
              <>
                {" · "}
                {subscription.days_remaining > 0
                  ? `${subscription.days_remaining} jour${
                      subscription.days_remaining > 1 ? "s" : ""
                    } restant`
                  : "Période terminée"}
              </>
            )}
          </p>
        </div>
      </div>
      {!isFree && !isCancelled && (
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={cancelMutation.isPending}
        >
          <X className="h-4 w-4 mr-2" />
          Annuler l'abonnement
        </Button>
      )}
    </div>
  );
}

// ─── Billing Events List ─────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  created: "Abonnement créé",
  upgraded: "Upgrade",
  downgraded: "Downgrade",
  renewed: "Renouvellement",
  cancelled: "Annulation",
  expired: "Expiration",
  payment_success: "Paiement réussi",
  payment_failed: "Paiement échoué",
  limit_reached: "Limite atteinte",
};

function BillingHistory() {
  const { data: events, isLoading } = useBillingEvents();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  if (!events || events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun événement pour le moment.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {events.map((evt) => (
        <div
          key={evt.id}
          className="flex items-center justify-between gap-4 py-2 border-b last:border-0 text-sm"
        >
          <div>
            <span className="font-medium">
              {EVENT_LABELS[evt.event_type] ?? evt.event_type}
            </span>
            {evt.message && (
              <p className="text-xs text-muted-foreground">{evt.message}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {new Date(evt.created_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page (Section grid uses landing/components/sections/pricing.tsx design) ───────────

export default function BillingPage() {
  const router = useRouter();
  const { data: subscription } = useMySubscription();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const [cycle, setCycle] = useState<SubscriptionCycle>("monthly");

  // For toggling, resolve the normalized variant (expected by PricingCard)
  const cycleVariant = cycle === "monthly" ? "monthly" : "yearly";

  const handleChoose = (plan: Plan) => {
    // Redirection vers la page upgrade dédiée avec le cycle pré-sélectionné.
    router.push(`/core/billing/upgrade/${plan.code}?cycle=${cycle}`);
  };

  const popularPlanCode = "pro";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 space-y-12">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Abonnement & Facturation
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez votre forfait Loura et suivez vos paiements.
        </p>
      </header>

      <CurrentSubscriptionBanner />

      {/* Section Forfaits — design landing-like, grille collée bord à bord */}
      <section className="space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Choisissez votre forfait
          </h2>
          <p className="text-muted-foreground max-w-xl">
            Tarifs fixes et transparents, adaptés à toutes les tailles d'entreprise.
            Aucun engagement, résiliable à tout moment.
          </p>
          <BillingToggle value={cycleVariant} onChange={setCycle} />
        </div>

        <div className="grid grid-cols-1 min-[650px]:grid-cols-2 min-[900px]:grid-cols-2 lg:grid-cols-4 gap-px bg-border/50 border border-border/50">
          {plansLoading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-background p-8">
                  <Skeleton className="h-80 w-full" />
                </div>
              ))
            : plans?.map((plan, idx) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  cycle={cycleVariant}
                  isPopular={plan.code === popularPlanCode}
                  isCurrent={subscription?.plan.code === plan.code}
                  onChoose={() => handleChoose(plan)}
                />
              ))}
        </div>

        <p className="text-center text-xs text-muted-foreground/60">
          Tous les prix sont HT · Paiement sécurisé via Djomy · Résiliable à tout moment
        </p>
      </section>

      {/* Utilisation actuelle */}
      {subscription && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Utilisation actuelle</h2>
            <SubscriptionStatusBadge subscription={subscription} showDetails />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UsageGuard
              resourceType="organizations"
              current={subscription.usage?.organization_count || 0}
              limit={subscription.plan.max_organizations}
              resourceName="Organisations"
              currentPlan={subscription.plan}
            />
            <UsageGuard
              resourceType="modules"
              current={subscription.usage?.modules_count || 0}
              limit={subscription.plan.max_modules_per_org}
              resourceName="Modules par organisation"
              currentPlan={subscription.plan}
            />
          </div>
        </section>
      )}

      {/* Historique */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Historique de facturation</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          50 derniers événements liés à votre abonnement.
        </p>
        <div className="border border-border bg-background p-6">
          <BillingHistory />
        </div>
      </section>
    </div>
  );
}
