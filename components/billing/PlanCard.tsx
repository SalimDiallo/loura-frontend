"use client";

/**
 * Carte d'un forfait dans la page billing — design adapté du landing
 * (cf. landing/components/sections/pricing.tsx).
 *
 * Style :
 * - Bord fin, fond uniforme, espacement généreux
 * - Typographie mono pour le nom du plan + petite taille
 * - Prix animé en gros + suffixe /mois ou /mois/an
 * - Plan populaire : fond foreground / texte background (inversé)
 * - Bouton outline avec flèche qui glisse au hover
 */

import { formatUsd, gnfToUsd, useUsdToGnfRate } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { Plan, SubscriptionCycle } from "@/lib/types/core";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

// ─── Helpers prix ───────────────────────────────────────────────────────────

function formatFng(price: number) {
    if (!price) return "Gratuit";
    // GNF entier : ``fr-FR`` garantit l'espace insécable comme séparateur
    // de milliers et aucune décimale.
    return `${new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 0,
    }).format(Math.round(price))} FNG`;
}

/**
 * Si l'utilisateur a choisi le cycle "annuel", on affiche le prix mensualisé
 * (price_yearly / 12) pour rester cohérent avec le landing qui montre le
 * prix mensuel "tel que facturé" même en mode annuel.
 */
function getDisplayPrice(plan: Plan, cycle: SubscriptionCycle): number {
    // GNF entier strict : on arrondit systématiquement même quand l'API
    // retourne un ``DecimalField`` à 2 décimales (ex: ``199000.00``).
    if (cycle === "yearly") {
        const yearly = parseFloat(plan.price_yearly);
        return Number.isFinite(yearly) && yearly > 0 ? Math.round(yearly / 12) : 0;
    }
    const monthly = parseFloat(plan.price_monthly);
    return Number.isFinite(monthly) ? Math.round(monthly) : 0;
}

/**
 * Affiche le prix en USD (converti depuis GNF) ; le GNF est rappelé en
 * sous-texte fin pour la transparence (la facturation reste en GNF).
 */
function AnimatedPrice({
    price,
    cycle,
    isPopular = false,
}: {
    /** Montant en **GNF**. */
    price: number;
    cycle: SubscriptionCycle;
    isPopular?: boolean;
}) {
    const { usdToGnf } = useUsdToGnfRate();
    const usdAmount = gnfToUsd(price, usdToGnf);
    const usdLabel = formatUsd(usdAmount);

    return (
        <motion.div
            key={price}
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex flex-col gap-0.5"
        >
            <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{usdLabel}</span>
                {price > 0 && (
                    <span
                        className={cn(
                            "text-sm",
                            isPopular ? "text-background/60" : "text-muted-foreground"
                        )}
                    >
                        /{cycle === "yearly" ? "mo/yr" : "mo"}
                    </span>
                )}
            </div>
            {price > 0 && (
                <span
                    className={cn(
                        "text-[11px] font-mono",
                        isPopular ? "text-background/50" : "text-muted-foreground/70"
                    )}
                >
                    ≈ {formatFng(price)} / {cycle === "yearly" ? "mois/an" : "mois"}
                </span>
            )}
        </motion.div>
    );
}

// ─── Configuration des features par plan ────────────────────────────────────

const PLAN_FEATURES: Record<string, string[]> = {
    free: [
        "1 organisation",
        "Module RH uniquement",
        "Support communautaire",
    ],
    basic: [
        "1 organisation",
        "RH + 2 modules au choix",
        "Support par e-mail",
        "Accès aux modules de base",
    ],
    pro: [
        "Jusqu'à 3 organisations",
        "Modules avancés illimités",
        "Gestion de paie automatisée",
        "Rapports avancés",
        "Support prioritaire",
    ],
    enterprise: [
        "Organisations illimitées",
        "Intégrations personnalisées",
        "Gestion fine des accès",
        "SLA garanti",
        "Accompagnement dédié",
        "IA avancée pour entreprise",
    ],
};

const PLAN_DESCRIPTIONS: Record<string, string> = {
    free: "Démarrez gratuitement avec le module RH.",
    basic: "Les fonctionnalités essentielles pour commencer sereinement.",
    pro: "Pour les équipes ambitieuses souhaitant aller plus loin.",
    enterprise:
        "Pour les organisations avec des besoins sur-mesure et souhaitant profiter de l'intelligence artificielle.",
};

// L'ordre dans lequel on présente les plans, utilisé pour le label
// "Toutes les fonctionnalités de X, plus :" sur les paliers supérieurs.
const PLAN_HIERARCHY = ["free", "basic", "pro", "enterprise"];

// ─── Composant ──────────────────────────────────────────────────────────────

interface PlanCardProps {
    plan: Plan;
    cycle: SubscriptionCycle;
    isCurrent: boolean;
    isPopular?: boolean;
    /** Index dans la grille (0-based) pour décaler l'animation d'apparition. */
    index?: number;
    onChoose: () => void;
}

export function PlanCard({
    plan,
    cycle,
    isCurrent,
    isPopular = false,
    index = 0,
    onChoose,
}: PlanCardProps) {
    const features = PLAN_FEATURES[plan.code] ?? [plan.description];
    const description = PLAN_DESCRIPTIONS[plan.code] ?? plan.description;
    const displayPrice = getDisplayPrice(plan, cycle);
    const isEnterprise = plan.code === "enterprise";

    // Label du plan inférieur ("Toutes les fonctionnalités de Basic, plus :")
    const planIdx = PLAN_HIERARCHY.indexOf(plan.code);
    const previousPlan =
        planIdx > 0 ? PLAN_HIERARCHY[planIdx - 1] : null;
    const previousPlanLabel =
        previousPlan === "free"
            ? "Free"
            : previousPlan === "basic"
            ? "Basic"
            : previousPlan === "pro"
            ? "Pro"
            : null;

    const buttonLabel = isCurrent
        ? "Forfait actuel"
        : isEnterprise
        ? "Nous contacter"
        : `Choisir ${plan.name}`;

    const handleClick = () => {
        if (isCurrent) return;
        if (isEnterprise) {
            window.location.href =
                "mailto:hello@loura.app?subject=Contact%20%5BEntreprise%5D";
            return;
        }
        onChoose();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={cn(
                "relative flex flex-col gap-6 p-8 bg-background",
                isPopular && "bg-foreground text-background",
                isCurrent && !isPopular && "ring-1 ring-primary"
            )}
        >
            {/* Badge populaire */}
            {isPopular && (
                <span className="absolute top-6 right-6 text-[10px] font-mono uppercase tracking-widest bg-background text-foreground px-2 py-0.5">
                    Populaire
                </span>
            )}

            {/* Badge plan actuel (si pas populaire pour ne pas chevaucher) */}
            {isCurrent && !isPopular && (
                <span className="absolute top-6 right-6 text-[10px] font-mono uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5">
                    Actuel
                </span>
            )}

            {/* En-tête */}
            <div className="flex flex-col gap-3">
                <p
                    className={cn(
                        "text-xs font-mono uppercase tracking-widest",
                        isPopular ? "text-background/60" : "text-primary/60"
                    )}
                >
                    {plan.name}
                </p>
                {isEnterprise ? (
                    <span className="text-3xl font-bold tracking-tight">Sur devis</span>
                ) : (
                    <AnimatedPrice price={displayPrice} cycle={cycle} isPopular={isPopular} />
                )}
                <p
                    className={cn(
                        "text-sm leading-relaxed",
                        isPopular ? "text-background/70" : "text-muted-foreground"
                    )}
                >
                    {description}
                </p>
            </div>

            {/* CTA */}
            <button
                onClick={handleClick}
                disabled={isCurrent}
                className={cn(
                    "group flex items-center justify-center gap-2 border text-sm font-medium px-4 py-2.5 transition-all duration-200",
                    isCurrent && "cursor-not-allowed opacity-60",
                    !isCurrent &&
                        (isPopular
                            ? "border-background/30 text-background hover:bg-background hover:text-foreground"
                            : "border-border text-foreground hover:border-foreground hover:bg-foreground hover:text-background")
                )}
            >
                {buttonLabel}
                {!isCurrent && (
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                )}
            </button>

            {/* Séparateur */}
            <div
                className={cn(
                    "h-px w-full",
                    isPopular ? "bg-background/20" : "bg-border/60"
                )}
            />

            {/* Features */}
            <ul className="flex flex-col gap-3">
                {previousPlanLabel && (
                    <li
                        className={cn(
                            "text-xs font-mono mb-1",
                            isPopular ? "text-background/50" : "text-muted-foreground/60"
                        )}
                    >
                        Toutes les fonctionnalités de {previousPlanLabel}, plus :
                    </li>
                )}
                {features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                        <Check
                            className={cn(
                                "w-4 h-4 mt-0.5 shrink-0",
                                isPopular ? "text-background/70" : "text-primary/70"
                            )}
                            strokeWidth={2}
                        />
                        <span
                            className={cn(
                                "text-sm",
                                isPopular ? "text-background/85" : "text-foreground"
                            )}
                        >
                            {f}
                        </span>
                    </li>
                ))}
            </ul>
        </motion.div>
    );
}
