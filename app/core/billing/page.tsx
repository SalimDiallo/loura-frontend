"use client";

import { SubscriptionStatusBadge, UsageGuard } from "@/components/billing";
import { PlanCard } from "@/components/billing/PlanCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { BillingToggle } from "@/landing/components/sections/pricing";
import {
  useBillingEvents,
  useCancelScheduledChange,
  useCancelSubscription,
  useMySubscription,
  usePlans,
  useRenewNow,
  useSetAutoRenew,
} from "@/lib/hooks/core";
import type { Plan, SubscriptionCycle } from "@/lib/types/core";
import { AlertTriangle, CalendarClock, CheckCircle2, Crown, History, Loader2, RefreshCw, X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

// ─── Subscription Banner (compact, design landing-like) ─────────────────────

function CurrentSubscriptionBanner() {
  const { data: subscription, isLoading } = useMySubscription();
  const cancelMutation = useCancelSubscription();
  const cancelScheduledMutation = useCancelScheduledChange();
  const autoRenewMutation = useSetAutoRenew();
  const renewNowMutation = useRenewNow();

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }
  if (!subscription) return null;

  const isFree = subscription.plan.code === "free";
  const isCancelled = subscription.status === "cancelled";
  const DIRECT_METHODS = ["OM", "MOMO"];
  const GATEWAY_METHODS = [
    "CARD",
    "VISA",
    "MC",
    "PAYCARD",
    "KULU",
    "SOUTRA_MONEY",
    "YMO",
  ];
  const isDirectMethod = DIRECT_METHODS.includes(subscription.payment_method);
  const isGatewayMethod = GATEWAY_METHODS.includes(subscription.payment_method);
  const canAutoRenew =
    !isFree && !isCancelled && (isDirectMethod || isGatewayMethod);
  const hasRenewalError = subscription.renewal_attempts > 0;

  const methodLabel: Record<string, string> = {
    OM: "Orange Money",
    MOMO: "MTN MoMo",
    CARD: "carte bancaire",
    VISA: "carte VISA",
    MC: "carte MasterCard",
    PAYCARD: "PayCard",
    KULU: "KULU",
    SOUTRA_MONEY: "Soutra Money",
    YMO: "YMO",
  };
  const renewalDescription = canAutoRenew
    ? isDirectMethod
      ? `Nous relancerons un paiement ${
          methodLabel[subscription.payment_method]
        } 24 h avant l'échéance. Vous recevrez une notification sur votre téléphone pour confirmer.`
      : `24 h avant l'échéance, nous vous enverrons un email avec un lien Djomy sécurisé pour renouveler en un clic par ${
          methodLabel[subscription.payment_method] ?? "votre moyen de paiement"
        }.`
    : "Non disponible — souscrivez à nouveau via un moyen de paiement supporté pour activer cette option.";

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

  const handleRenewNow = () => {
    renewNowMutation.mutate(undefined, {
      onSuccess: (res) => {
        if (res.redirect_url) {
          toast.info("Redirection vers le portail de paiement…");
          window.location.href = res.redirect_url;
          return;
        }
        toast.success(
          "Renouvellement lancé. Confirmez la notification sur votre téléphone."
        );
      },
      onError: (err: Error) =>
        toast.error(err.message || "Erreur lors du renouvellement."),
    });
  };

  const handleToggleAutoRenew = (checked: boolean) => {
    autoRenewMutation.mutate(checked, {
      onSuccess: () =>
        toast.success(
          checked
            ? "Auto-renouvellement activé."
            : "Auto-renouvellement désactivé."
        ),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  const isAutoRenewActive = !!subscription.auto_renew && canAutoRenew;
  const hasScheduledChange = !!subscription.scheduled_plan;
  const scheduledTargetIsFree =
    subscription.scheduled_plan?.code === "free";
  const formattedEndDate = new Date(
    subscription.current_period_end
  ).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const handleCancelScheduledChange = () => {
    cancelScheduledMutation.mutate(undefined, {
      onSuccess: () =>
        toast.success(
          scheduledTargetIsFree
            ? "Annulation supprimée — votre abonnement continue."
            : "Changement de forfait annulé."
        ),
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <div className="border border-border bg-background">
      {/* Bandeau principal : plan + badges d'état */}
      <div className="px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-300 text-[10px]"
                >
                  Annulé
                </Badge>
              )}
              {/* Badge auto-renouvellement en évidence dès le haut */}
              {!isFree && !isCancelled && (
                isAutoRenewActive ? (
                  <Badge
                    variant="outline"
                    className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[10px] gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Renouvellement auto actif
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-muted-foreground border-border text-[10px] gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Sans renouvellement
                  </Badge>
                )
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
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleRenewNow}
              disabled={renewNowMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {renewNowMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Traitement…
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Renouveler maintenant
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler l&apos;abonnement
            </Button>
          </div>
        )}
      </div>

      {/* Bandeau "changement planifié" — affiché si un downgrade ou
          une annulation a été programmée pour la fin de période. */}
      {hasScheduledChange && !isFree && (
        <div className="px-6 py-4 border-t border-border bg-amber-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <CalendarClock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-900">
                {scheduledTargetIsFree
                  ? "Annulation programmée"
                  : `Passage à ${subscription.scheduled_plan?.name} programmé`}
              </p>
              <p className="text-xs text-amber-800/80 mt-0.5">
                {scheduledTargetIsFree
                  ? `Vous garderez votre forfait ${subscription.plan.name} jusqu'au ${formattedEndDate}, puis vous basculerez sur Free.`
                  : `Votre forfait ${subscription.plan.name} reste actif jusqu'au ${formattedEndDate}. Le passage à ${subscription.scheduled_plan?.name} prendra effet ensuite.`}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelScheduledChange}
            disabled={cancelScheduledMutation.isPending}
            className="border-amber-300 text-amber-900 hover:bg-amber-100"
          >
            {cancelScheduledMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Annuler le changement
          </Button>
        </div>
      )}

      {/* Bloc auto-renouvellement — mis en avant pour les plans payants */}
      {!isFree && !isCancelled && (
        <div
          className={`px-6 py-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isAutoRenewActive
              ? "bg-emerald-50/40"
              : "bg-muted/30"
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                isAutoRenewActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <RefreshCw className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  Renouvellement automatique
                </p>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    isAutoRenewActive
                      ? "text-emerald-700"
                      : "text-muted-foreground"
                  }`}
                >
                  {isAutoRenewActive ? "Activé" : "Désactivé"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {renewalDescription}
              </p>
              {hasRenewalError && subscription.last_renewal_error && (
                <p className="mt-1.5 text-xs text-amber-700 flex items-start gap-1">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>
                    Dernière tentative échouée (
                    {subscription.renewal_attempts}/3) :{" "}
                    {subscription.last_renewal_error}
                  </span>
                </p>
              )}
            </div>
          </div>
          <Switch
            checked={subscription.auto_renew}
            onCheckedChange={handleToggleAutoRenew}
            disabled={!canAutoRenew || autoRenewMutation.isPending}
            aria-label="Renouvellement automatique"
          />
        </div>
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
  expiry_reminder: "Rappel d'expiration",
  renewal_attempt: "Tentative de renouvellement",
  renewal_failed: "Renouvellement échoué",
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
