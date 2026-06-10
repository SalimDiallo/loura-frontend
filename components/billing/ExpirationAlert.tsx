"use client";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { useMySubscription, useRenewNow } from "@/lib/hooks/core";
import { AlertTriangle, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Alerte globale de renouvellement affichée en haut du layout `/core`.
 *
 * Visible uniquement si :
 * - L'abonnement est payant (non-Free).
 * - Il expire dans 7 jours ou moins (``days_remaining <= 7``).
 * - Il n'est pas déjà annulé.
 *
 * Offre deux actions :
 * - **Renouveler maintenant** : appelle l'endpoint ``renew-now``.
 *   - Mode direct (OM/MOMO) → SMS de confirmation ; toast d'info.
 *   - Mode gateway (carte/PayCard) → redirection vers Djomy.
 * - **Gérer** : lien vers ``/core/billing`` pour modifier l'abonnement.
 *
 * L'utilisateur peut masquer l'alerte pour la session (sessionStorage),
 * elle réapparaîtra à la prochaine visite ou recharge de page.
 */
const DISMISS_KEY_PREFIX = "loura.expirationAlert.dismissed:";

export function ExpirationAlert() {
  const { data: subscription } = useMySubscription();
  const renewMutation = useRenewNow();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (!subscription) return null;
  const isFree = subscription.plan.code === "free";
  const isCancelled = subscription.status === "cancelled";
  const daysRemaining = subscription.days_remaining ?? 0;

  // Seuil : 7 jours de la fin.
  if (isFree || isCancelled || daysRemaining > 7 || daysRemaining < 0)
    return null;

  // Clé de dismiss par période : on ne masque l'alerte que pour la
  // période en cours ; au prochain cycle elle réapparaît.
  const dismissKey =
    DISMISS_KEY_PREFIX + (subscription.current_period_end ?? "");
  const alreadyDismissed =
    typeof window !== "undefined" &&
    sessionStorage.getItem(dismissKey) === "1";
  if (dismissed || alreadyDismissed) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(dismissKey, "1");
    } catch {
      /* sessionStorage indisponible (SSR, privacy mode) */
    }
    setDismissed(true);
  };

  const handleRenew = () => {
    renewMutation.mutate(undefined, {
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
      onError: (err: Error) => {
        // Le backend qualifie l'erreur via ``reason``. Si le numéro de
        // paiement est manquant, on redirige l'utilisateur vers l'écran de
        // saisie du numéro — préchargé avec son plan/cycle courant — pour
        // qu'il finalise le renouvellement, plutôt que d'afficher une erreur.
        const reason =
          err instanceof ApiError
            ? (err.data as { reason?: string } | undefined)?.reason
            : undefined;

        if (reason === "missing_payer_number") {
          toast.info(
            "Saisissez votre numéro de paiement pour finaliser le renouvellement."
          );
          router.push(
            `/core/billing/upgrade/${subscription.plan.code}?cycle=${subscription.cycle}`
          );
          return;
        }
        if (reason === "djomy_not_configured") {
          toast.error(
            "Service de paiement indisponible. Réessayez dans quelques instants."
          );
          return;
        }
        toast.error(err.message || "Erreur lors du renouvellement.");
      },
    });
  };

  // Coloration selon l'urgence.
  const urgent = daysRemaining <= 2;
  const palette = urgent
    ? {
        bg: "bg-red-50 border-red-200",
        icon: "text-red-600",
        title: "text-red-900",
        body: "text-red-700/80",
        button: "bg-red-600 hover:bg-red-700 text-white",
      }
    : {
        bg: "bg-amber-50 border-amber-200",
        icon: "text-amber-600",
        title: "text-amber-900",
        body: "text-amber-700/80",
        button: "bg-amber-600 hover:bg-amber-700 text-white",
      };

  const dayLabel =
    daysRemaining === 0
      ? "aujourd'hui"
      : daysRemaining === 1
      ? "demain"
      : `dans ${daysRemaining} jours`;

  return (
    <div className={`border-b ${palette.bg}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <AlertTriangle
            className={`h-5 w-5 shrink-0 mt-0.5 ${palette.icon}`}
          />
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${palette.title}`}>
              Votre abonnement {subscription.plan.name} expire {dayLabel}.
            </p>
            <p className={`text-xs ${palette.body} mt-0.5`}>
              {subscription.auto_renew
                ? "Le renouvellement est programmé automatiquement, mais vous pouvez l'effectuer dès maintenant pour éviter toute coupure."
                : "Renouvelez-le pour conserver l'accès aux modules payants. Le renouvellement anticipé n'impacte pas vos jours restants — la nouvelle période démarre juste après la fin actuelle."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            className={palette.button}
            onClick={handleRenew}
            disabled={renewMutation.isPending}
          >
            {renewMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Traitement…
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-1.5" />
                Renouveler maintenant
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            asChild
            className="border-border"
          >
            <Link href="/core/billing">Gérer</Link>
          </Button>
          {/* <button
            type="button"
            onClick={handleDismiss}
            aria-label="Masquer l'alerte"
            className={`h-8 w-8 flex items-center justify-center hover:bg-black/5 rounded transition-colors ${palette.icon}`}
          >
            <X className="h-4 w-4" />
          </button> */}
        </div>
      </div>
    </div>
  );
}
