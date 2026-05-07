"use client";

/**
 * Page d'upgrade - VERSION MINIMALISTE
 * Une seule carte centrée avec l'essentiel uniquement
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    PhoneInput,
    getInternationalFormat,
    isValidPhoneNumber,
    type Country
} from "@/components/ui/phone-input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUsd, gnfToUsd, useUsdToGnfRate } from "@/lib/hooks";
import { useChangePlan, useMySubscription, usePlans } from "@/lib/hooks/core";
import type { Plan, SubscriptionCycle } from "@/lib/types/core";
import { ArrowLeft, Crown, Loader2, Sparkles, Wallet, Zap } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const PLAN_ICONS: Record<string, typeof Sparkles> = {
    free: Sparkles,
    basic: Zap,
    pro: Crown,
    enterprise: Crown,
};

/** Format GNF brut, gardé en sous-texte pour la transparence. */
function formatGnf(value: string | number): string {
    const n = typeof value === "string" ? parseFloat(value) : value;
    if (!Number.isFinite(n)) return String(value);
    return `${new Intl.NumberFormat("fr-GN").format(n).replace(/,/g, " ")} FNG`;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function UpgradePage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const planCode = params.planCode as string;

    const { data: plans, isLoading: plansLoading } = usePlans();
    const { data: subscription } = useMySubscription();
    const changePlanMutation = useChangePlan();

    const initialCycle = (searchParams.get("cycle") as SubscriptionCycle) || "monthly";
    const [cycle, setCycle] = useState<SubscriptionCycle>(initialCycle);
    const [phoneValue, setPhoneValue] = useState("");
    const [phoneCountry, setPhoneCountry] = useState<Country | null>(null);
    const [isPhoneValid, setIsPhoneValid] = useState(false);

    const plan = useMemo<Plan | undefined>(
        () => plans?.find((p) => p.code === planCode),
        [plans, planCode]
    );

    // ⚠️ Tous les hooks doivent être appelés avant tout `return` conditionnel
    // (cf. Rules of Hooks). On lit ici le taux de change pour qu'il soit
    // toujours invoqué dans le même ordre, même si on rend un fallback.
    const { usdToGnf } = useUsdToGnfRate();

    // ── États invalides ────────────────────────────────────────────────────

    if (plansLoading) {
        return (
            <div className="container mx-auto p-6 max-w-3xl space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-96 w-full rounded-lg" />
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="container mx-auto p-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Forfait introuvable</CardTitle>
                        <CardDescription>
                            Le forfait <code>{planCode}</code> n'existe pas ou n'est pas disponible.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/core/billing">Retour aux abonnements</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (subscription?.plan.code === plan.code && subscription?.cycle === cycle) {
        return (
            <div className="container mx-auto p-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>C'est déjà votre forfait actuel</CardTitle>
                        <CardDescription>
                            Vous êtes déjà sur le plan <strong>{plan.name}</strong> ({cycle === "yearly" ? "annuel" : "mensuel"}).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/core/billing">Retour aux abonnements</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ── Logique simplifiée ─────────────────────────────────────────────────

    const Icon = PLAN_ICONS[plan.code] ?? Sparkles;
    const basePrice = cycle === "yearly" ? plan.price_yearly : plan.price_monthly;
    const basePriceNum = parseFloat(basePrice);
    
    // Calcul prorata rapide
    const planHierarchy = ["free", "basic", "pro", "enterprise"];
    const currentSubIndex = subscription ? planHierarchy.indexOf(subscription.plan.code) : -1;
    const targetPlanIndex = planHierarchy.indexOf(plan.code);
    const isUpgrade = currentSubIndex < targetPlanIndex;
    
    let finalPrice = basePriceNum;
    let prorataCredit = 0;
    
    if (isUpgrade && subscription && subscription.days_remaining > 0 && subscription.plan.code !== "free") {
        const currentPrice = parseFloat(
            subscription.cycle === "yearly" ? subscription.plan.price_yearly : subscription.plan.price_monthly
        );
        const daysInPeriod = subscription.cycle === "yearly" ? 365 : 30;
        prorataCredit = (currentPrice / daysInPeriod) * subscription.days_remaining;
        finalPrice = Math.max(0, basePriceNum - prorataCredit);
    }
    
    // Conversion GNF → USD pour l'affichage (paiement Djomy reste en GNF).
    // Le hook ``useUsdToGnfRate`` est appelé plus haut dans le composant
    // pour respecter les Rules of Hooks ; ici on consomme la valeur.
    const finalPriceUsd = formatUsd(gnfToUsd(finalPrice, usdToGnf));
    const basePriceUsd = formatUsd(gnfToUsd(basePriceNum, usdToGnf));
    const prorataCreditUsd = formatUsd(gnfToUsd(prorataCredit, usdToGnf));
    const finalPriceGnfLabel = formatGnf(finalPrice);
    const basePriceGnfLabel = formatGnf(basePriceNum);
    const isFree = finalPrice === 0;
    
    const handlePhoneChange = (value: string, country: Country) => {
        setPhoneValue(value);
        setPhoneCountry(country);
        // Échappe le + pour la regex (ex: +224 devient \+224)
        const escapedDialCode = country.dialCode.replace(/\+/g, "\\+");
        const digits = value.replace(new RegExp(`^(${escapedDialCode}|00${country.dialCode.slice(1)})`, "g"), "");
        setIsPhoneValid(isValidPhoneNumber(digits, country));
    };
    
    const canSubmit = isFree || isPhoneValid;


    const handleSubmit = () => {
        if (!isFree && !isPhoneValid) {
            toast.error("Veuillez saisir un numéro de téléphone valide");
            return;
        }
        
        const payerNumber = phoneCountry && phoneValue 
            ? getInternationalFormat(phoneValue.replace(phoneCountry.dialCode, ""), phoneCountry)
            : phoneValue;
        
        changePlanMutation.mutate(
            {
                plan_code: plan.code,
                cycle,
                payer_number: isFree ? undefined : payerNumber,
                // Pas de sélection de méthode - Djomy propose toutes les options
            },
            {
                onSuccess: (response) => {
                    const data = response.data;
                    if (data.requires_payment && data.redirect_url) {
                        toast.info("Redirection vers la page de paiement Djomy...");
                        window.location.href = data.redirect_url;
                        return;
                    }
                    // Downgrade différé : le passage prend effet à la
                    // fin de la période en cours, pas immédiatement.
                    if (data.scheduled && data.effective_at) {
                        const date = new Date(data.effective_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                        });
                        toast.success(
                            `Passage à ${plan.name} programmé pour le ${date}.`,
                            { description: "Vous gardez votre forfait actuel jusque-là." }
                        );
                        router.push("/core/billing");
                        return;
                    }
                    toast.success(`Abonnement ${plan.name} activé.`);
                    router.push("/core/billing");
                },
                onError: (err: Error) => {
                    toast.error(err.message || "Erreur lors de l'initialisation du paiement.");
                },
            }
        );
    };

    // ── Rendu minimaliste ──────────────────────────────────────────────────

    return (
        <div className="container mx-auto p-6 max-w-lg">
            {/* Header */}
            <Button variant="ghost" size="sm" asChild className="mb-6">
                <Link href="/core/billing">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Retour
                </Link>
            </Button>

            {/* Carte unique */}
            <Card className="border-2 border-primary/20 shadow-lg">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Sélecteur de cycle */}
                    <div className="flex rounded-lg border bg-muted p-1">
                        {(["monthly", "yearly"] as SubscriptionCycle[]).map((c) => (
                            <button
                                key={c}
                                onClick={() => setCycle(c)}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                                    cycle === c 
                                        ? "bg-background text-foreground shadow-sm" 
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {c === "monthly" ? "Mensuel" : "Annuel -20%"}
                            </button>
                        ))}
                    </div>

                    {/* Prix */}
                    <div className="text-center">
                        {prorataCredit > 0 && basePriceNum !== finalPrice && (
                            <div className="mb-1">
                                <p className="text-sm text-muted-foreground line-through">
                                    {basePriceUsd}
                                </p>
                                <p className="text-[10px] text-muted-foreground/60 font-mono">
                                    ≈ {basePriceGnfLabel}
                                </p>
                            </div>
                        )}
                        <p className="text-4xl font-bold text-emerald-600">
                            {finalPriceUsd}
                        </p>
                        {!isFree && (
                            <p className="text-[11px] text-muted-foreground/70 font-mono mt-1">
                                Facturé en {finalPriceGnfLabel}
                            </p>
                        )}
                        {prorataCredit > 0 && (
                            <p className="text-xs text-emerald-600 mt-1">
                                Crédit de {prorataCreditUsd} appliqué
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            par {cycle === "yearly" ? "an" : "mois"}
                        </p>
                    </div>

                    {/* Numéro d'information */}
                    {!isFree && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Numéro d'information (recevra la notification)
                            </label>
                            <PhoneInput
                                value={phoneValue}
                                onChange={handlePhoneChange}
                                defaultCountry="GN"
                                placeholder="6 23 70 77 22"
                            />
                            {phoneValue && !isPhoneValid && (
                                <p className="text-xs text-destructive">
                                    Numéro invalide
                                </p>
                            )}
                        </div>
                    )}

                    {/* Bouton principal */}
                    <Button
                        className="w-full h-12 text-lg"
                        onClick={handleSubmit}
                        disabled={!canSubmit || changePlanMutation.isPending}
                    >
                        {changePlanMutation.isPending ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Traitement...
                            </>
                        ) : isFree ? (
                            "Activer gratuitement"
                        ) : (
                            <>
                                <Wallet className="h-5 w-5 mr-2" />
                                Payer
                            </>
                        )}
                    </Button>

                    {/* Info sécurité */}
                    <p className="text-xs text-center text-muted-foreground">
                        Paiement sécurisé via Djomy · Loura ne stocke pas vos données
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
