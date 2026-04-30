"use client";

import Section from "@/landing/components/section";
import { formatUsd, gnfToUsd, useUsdToGnfRate } from "@/lib/hooks/useExchangeRate";
import { billingService } from "@/lib/services/core";
import type { Plan, SubscriptionCycle } from "@/lib/types/core";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// ─── Données statiques (fallback si API indisponible) ────────────────────────
//
// Ces données sont **synchronisées** avec les plans seedés en base
// (cf. core/migrations/0006_seed_plans.py). Servent de filet quand la page
// landing est rendue sans backend joignable (build statique, dev offline,
// API en panne...).

interface PricingItem {
  /** Identifiant logique stable, aligné avec ``Plan.code`` du backend. */
  code: "free" | "basic" | "pro" | "enterprise";
  name: string;
  /** Prix mensuel, en GNF. 0 = gratuit. */
  price: number;
  /** Prix mensualisé en mode annuel (price_yearly / 12), en GNF. 0 = gratuit. */
  yearlyPrice: number;
  description: string;
  buttonText: string;
  /** Lien du CTA quand l'utilisateur n'est pas connecté (landing). */
  buttonLink: string;
  buttonType: "internal" | "external";
  isPopular: boolean;
  features: string[];
}

const FALLBACK_PRICING_ITEMS: PricingItem[] = [
  {
    code: "free",
    name: "Free",
    price: 0,
    yearlyPrice: 0,
    description: "Démarrez gratuitement avec le module RH.",
    buttonText: "Commencer gratuitement",
    isPopular: false,
    features: [
      "1 organisation",
      "Module RH uniquement",
      "Support communautaire",
    ],
    buttonLink: "/auth/register?plan=free",
    buttonType: "internal",
  },
  {
    code: "basic",
    name: "Basic",
    price: 49000,
    yearlyPrice: 40833, // 49000 * 12 * 0.8 / 12
    description: "Les fonctionnalités essentielles pour commencer sereinement.",
    buttonText: "Choisir Basic",
    isPopular: false,
    features: [
      "1 organisation",
      "RH + 2 modules au choix",
      "Support par e-mail",
      "Accès aux modules de base",
    ],
    buttonLink: "/auth/register?plan=basic",
    buttonType: "internal",
  },
  {
    code: "pro",
    name: "Pro",
    price: 99000,
    yearlyPrice: 79200, // 99000 * 12 * 0.8 / 12
    description: "Pour les équipes ambitieuses souhaitant aller plus loin.",
    buttonText: "Choisir Pro",
    isPopular: true,
    features: [
      "Jusqu'à 3 organisations",
      "Modules avancés illimités",
      "Gestion de paie automatisée",
      "Rapports avancés",
      "Support prioritaire",
    ],
    buttonLink: "/auth/register?plan=pro",
    buttonType: "internal",
  },
  {
    code: "enterprise",
    name: "Entreprise",
    price: 0, // sur devis
    yearlyPrice: 0,
    description:
      "Pour les organisations avec des besoins sur-mesure et souhaitant profiter de l'intelligence artificielle.",
    buttonText: "Nous contacter",
    isPopular: false,
    features: [
      "Organisations illimitées",
      "Intégrations personnalisées",
      "Gestion fine des accès",
      "SLA garanti",
      "Accompagnement dédié",
      "IA avancée pour entreprise",
    ],
    buttonLink: "mailto:hello@loura.app?subject=Contact%20%5BEntreprise%5D",
    buttonType: "external",
  },
];

const pricingConfig = {
  description:
    "Des tarifs fixes et transparents, adaptés à toutes les tailles d'entreprise. Aucun engagement, aucune mauvaise surprise.",
  pricingItems: FALLBACK_PRICING_ITEMS,
};

// ─── Mapping API → PricingItem ─────────────────────────────────────────────

const FEATURES_BY_CODE: Record<string, string[]> = {
  free: FALLBACK_PRICING_ITEMS[0].features,
  basic: FALLBACK_PRICING_ITEMS[1].features,
  pro: FALLBACK_PRICING_ITEMS[2].features,
  enterprise: FALLBACK_PRICING_ITEMS[3].features,
};

const BUTTON_TEXT_BY_CODE: Record<string, string> = {
  free: "Commencer gratuitement",
  basic: "Choisir Basic",
  pro: "Choisir Pro",
  enterprise: "Nous contacter",
};

const BUTTON_LINK_BY_CODE: Record<string, { link: string; type: "internal" | "external" }> = {
  free: { link: "/auth/register?plan=free", type: "internal" },
  basic: { link: "/auth/register?plan=basic", type: "internal" },
  pro: { link: "/auth/register?plan=pro", type: "internal" },
  enterprise: {
    link: "mailto:hello@loura.app?subject=Contact%20%5BEntreprise%5D",
    type: "external",
  },
};

function planToPricingItem(plan: Plan): PricingItem {
  const monthly = parseFloat(plan.price_monthly) || 0;
  const yearly = parseFloat(plan.price_yearly) || 0;
  // On affiche le prix mensualisé en mode annuel (yearly / 12) pour
  // cohérence avec le format "FNG/mois/an".
  const yearlyPerMonth = yearly > 0 ? Math.round(yearly / 12) : 0;
  const cta = BUTTON_LINK_BY_CODE[plan.code] ?? {
    link: "/auth/register",
    type: "internal" as const,
  };
  return {
    code: (plan.code as PricingItem["code"]) ?? "basic",
    name: plan.name,
    price: monthly,
    yearlyPrice: yearlyPerMonth,
    description: plan.description || "",
    buttonText: BUTTON_TEXT_BY_CODE[plan.code] ?? `Choisir ${plan.name}`,
    isPopular: plan.code === "pro",
    features: FEATURES_BY_CODE[plan.code] ?? [],
    buttonLink: cta.link,
    buttonType: cta.type,
  };
}

/**
 * Hook public : récupère le catalogue des plans depuis l'API.
 *
 * - L'endpoint ``/billing/plans/`` est ouvert (``AllowAny``) → utilisable
 *   sans connexion sur la landing page.
 * - En cas d'échec (offline, build static, backend down), on retourne le
 *   fallback statique pour ne jamais casser le rendu.
 */
function usePublicPricingItems(): {
  items: PricingItem[];
  isLoading: boolean;
  isFromApi: boolean;
} {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public", "plans"],
    queryFn: () => billingService.listPlans(),
    staleTime: 10 * 60_000, // 10 min — ces données changent rarement
    retry: 1,
  });

  if (isLoading) {
    return { items: FALLBACK_PRICING_ITEMS, isLoading: true, isFromApi: false };
  }

  if (isError || !data || data.length === 0) {
    return { items: FALLBACK_PRICING_ITEMS, isLoading: false, isFromApi: false };
  }

  return {
    items: data.map(planToPricingItem),
    isLoading: false,
    isFromApi: true,
  };
}

// ─── BillingToggle ─────────────────────────────────────────────────────────

export function BillingToggle({
  value,
  onChange,
}: {
  value: SubscriptionCycle;
  onChange: (v: SubscriptionCycle) => void;
}) {
  return (
    <div className="flex items-center gap-1 border border-border bg-background p-1 w-fit mx-auto">
      {(["monthly", "yearly"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "relative px-5 py-1.5 text-sm font-medium transition-all duration-200",
            value === tab
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab === "monthly" ? "Mensuel" : "Annuel"}
          {tab === "yearly" && (
            <span className="ml-1.5 text-[10px] font-semibold text-green-500">
              −20%
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Helpers prix ───────────────────────────────────────────────────────────

/** Format GNF brut (gardé pour rétro-compatibilité ; non utilisé sur l'UI). */
export function formatFng(price: number) {
  return price
    ? price
        .toLocaleString("fr-GN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
        .replace(/,/g, " ") + " FNG"
    : "Gratuit";
}

/**
 * Affichage du prix en USD (converti depuis GNF via le hook ``useUsdToGnfRate``).
 *
 * Le montant en GNF est conservé en sous-texte discret pour la transparence —
 * la facturation Djomy se fait toujours en GNF, le USD n'est qu'un confort
 * d'affichage.
 */
export function AnimatedPrice({
  price,
  cycle,
}: {
  /** Montant en **GNF**. */
  price: number;
  cycle: SubscriptionCycle;
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
          <span className="text-sm text-muted-foreground">
            /{cycle === "yearly" ? "mo/yr" : "mo"}
          </span>
        )}
      </div>
      {price > 0 && (
        <span className="text-[11px] text-muted-foreground/70 font-mono">
          ≈ {formatFng(price)} / {cycle === "yearly" ? "mois/an" : "mois"}
        </span>
      )}
    </motion.div>
  );
}

// ─── PricingCards (composant public, garde l'API existante) ────────────────

export function PricingCards({
  pricingItems,
  cycle,
}: {
  pricingItems: PricingItem[];
  cycle: SubscriptionCycle;
}) {
  return (
    <div className="grid grid-cols-1 min-[650px]:grid-cols-2 min-[900px]:grid-cols-2 lg:grid-cols-4 gap-px bg-border/50 border border-border/50">
      {pricingItems.map((tier, i) => {
        const isEnterprise = tier.code === "enterprise";
        const displayPrice = cycle === "yearly" ? tier.yearlyPrice : tier.price;

        return (
          <motion.div
            key={tier.code}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className={cn(
              "relative flex flex-col gap-6 p-8 bg-background",
              tier.isPopular && "bg-foreground text-background"
            )}
          >
            {/* Badge populaire */}
            {tier.isPopular && (
              <span className="absolute top-6 right-6 text-[10px] font-mono uppercase tracking-widest bg-background text-foreground px-2 py-0.5">
                Populaire
              </span>
            )}

            {/* En-tête */}
            <div className="flex flex-col gap-3">
              <p
                className={cn(
                  "text-xs font-mono uppercase tracking-widest",
                  tier.isPopular ? "text-background/60" : "text-primary/60"
                )}
              >
                {tier.name}
              </p>
              {isEnterprise ? (
                <span className="text-3xl font-bold tracking-tight">Sur devis</span>
              ) : (
                <AnimatedPrice price={displayPrice} cycle={cycle} />
              )}
              <p
                className={cn(
                  "text-sm leading-relaxed min-h-[3rem]",
                  tier.isPopular ? "text-background/70" : "text-muted-foreground"
                )}
              >
                {tier.description}
              </p>
            </div>

            {/* CTA */}
            {tier.buttonType === "internal" ? (
              <Link
                href={tier.buttonLink}
                className={cn(
                  "group flex items-center justify-center gap-2 border text-sm font-medium px-4 py-2.5 transition-all duration-200",
                  tier.isPopular
                    ? "border-background/30 text-background hover:bg-background hover:text-foreground"
                    : "border-border text-foreground hover:border-foreground hover:bg-foreground hover:text-background"
                )}
              >
                {tier.buttonText}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <a
                href={tier.buttonLink}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group flex items-center justify-center gap-2 border text-sm font-medium px-4 py-2.5 transition-all duration-200",
                  tier.isPopular
                    ? "border-background/30 text-background hover:bg-background hover:text-foreground"
                    : "border-border text-foreground hover:border-foreground hover:bg-foreground hover:text-background"
                )}
              >
                {tier.buttonText}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
            )}

            {/* Séparateur */}
            <div
              className={cn(
                "h-px w-full",
                tier.isPopular ? "bg-background/20" : "bg-border/60"
              )}
            />

            {/* Features — label "Toutes les fonctionnalités de X, plus :" */}
            <ul className="flex flex-col gap-3">
              {i > 0 && tier.code !== "free" && (
                <li
                  className={cn(
                    "text-xs font-mono mb-1",
                    tier.isPopular ? "text-background/50" : "text-muted-foreground/60"
                  )}
                >
                  Toutes les fonctionnalités de&nbsp;
                  {tier.code === "basic"
                    ? "Free"
                    : tier.code === "pro"
                    ? "Basic"
                    : "Pro"}
                  , plus&nbsp;:
                </li>
              )}
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check
                    className={cn(
                      "w-4 h-4 mt-0.5 shrink-0",
                      tier.isPopular ? "text-background/70" : "text-primary/70"
                    )}
                    strokeWidth={2}
                  />
                  <span
                    className={cn(
                      "text-sm",
                      tier.isPopular ? "text-background/85" : "text-foreground"
                    )}
                  >
                    {f}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Section principale ─────────────────────────────────────────────────────

export function PricingSection() {
  const [cycle, setCycle] = useState<SubscriptionCycle>("monthly");
  const { items, isLoading, isFromApi } = usePublicPricingItems();

  return (
    <Section
      id="pricing"
      title="Tarifs"
      subtitle="Simples, transparents, sans surprise."
      description={pricingConfig.description}
    >
      <div className="mt-10 flex flex-col gap-10">
        <BillingToggle value={cycle} onChange={setCycle} />

        {isLoading && !isFromApi ? (
          <div className="grid grid-cols-1 min-[650px]:grid-cols-2 lg:grid-cols-4 gap-px bg-border/50 border border-border/50 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-background p-8 h-96" />
            ))}
          </div>
        ) : (
          <PricingCards pricingItems={items} cycle={cycle} />
        )}

        <p className="text-center text-xs text-muted-foreground/60">
          Tous les prix sont HT · Paiement sécurisé · Résiliable à tout moment
        </p>
      </div>
    </Section>
  );
}
