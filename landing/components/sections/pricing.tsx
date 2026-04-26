"use client";

import Section from "@/landing/components/section";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const pricingConfig = {
  description:
    "Des tarifs fixes et transparents, adaptés à toutes les tailles d'entreprise. Aucun engagement, aucune mauvaise surprise.",
  pricingItems: [
    {
      name: "Essentiel",
      price: 49000,
      yearlyPrice: 40833,
      description: "Les fonctionnalités essentielles pour commencer sereinement.",
      buttonText: "Choisir Essentiel",
      isPopular: false,
      features: [
        "Gestion de base RH",
        "1 organisation",
        "Support par e-mail",
        "Accès aux modules de base",
      ],
      buttonLink: "/auth/register?plan=essentiel",
      buttonType: "internal",
    },
    {
      name: "Pro",
      price: 99000,
      yearlyPrice: 82500,
      description: "Pour les équipes ambitieuses souhaitant aller plus loin.",
      buttonText: "Choisir Pro",
      isPopular: true,
      features: [
        "Toutes les fonctionnalités d’Essentiel",
        "Modules avancés illimités",
        "Gestion de paie automatisée",
        "Rapports avancés",
        "Support prioritaire",
      ],
      buttonLink: "/auth/register?plan=pro",
      buttonType: "internal",
    },
    {
      name: "Entreprise",
      price: 259000,
      yearlyPrice: 215833,
      description: "Pour les organisations avec des besoins sur-mesure et souhaitant profiter de l'intelligence artificielle.",
      buttonText: "Nous contacter",
      isPopular: false,
      features: [
        "Toutes les fonctionnalités de Pro",
        "Intégrations personnalisées",
        "Gestion fine des accès",
        "SLA garanti",
        "Accompagnement dédié",
        "IA avancée pour entreprise",
      ],
      buttonLink: "mailto:hello@loura.app?subject=Contact%20%5BEntreprise%5D",
      buttonType: "external",
    },
  ],
};

function BillingToggle({
  value,
  onChange,
}: {
  value: "monthly" | "yearly";
  onChange: (v: "monthly" | "yearly") => void;
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

function formatFng(price: number) {
  return price
    ? price.toLocaleString("fr-GN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/,/g, " ") + " FNG"
    : "Gratuit";
}

function AnimatedPrice({
  price,
  cycle,
}: {
  price: number;
  cycle: "monthly" | "yearly";
}) {
  return (
    <motion.div
      key={price}
      initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex items-baseline gap-1"
    >
      <span className="text-4xl font-bold tracking-tight">
        {formatFng(price)}
      </span>
      {price > 0 && (
        <span className="text-sm text-muted-foreground">
          /{cycle === "yearly" ? "mois/an" : "mois"}
        </span>
      )}
    </motion.div>
  );
}

export function PricingSection() {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <Section
      id="pricing"
      title="Tarifs"
      subtitle="Simples, transparents, sans surprise."
      description={pricingConfig.description}
    >
      <div className="mt-10 flex flex-col gap-10">
        <BillingToggle value={cycle} onChange={setCycle} />

        <div className="grid grid-cols-1 min-[650px]:grid-cols-2 min-[900px]:grid-cols-3 gap-px bg-border/50 border border-border/50">
          {pricingConfig.pricingItems.map((tier, i) => (
            <motion.div
              key={tier.name}
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
                <AnimatedPrice
                  price={cycle === "yearly" ? tier.yearlyPrice : tier.price}
                  cycle={cycle}
                />
                <p
                  className={cn(
                    "text-sm leading-relaxed",
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

              {/* Features */}
              <ul className="flex flex-col gap-3">
                {i > 0 && (
                  <li
                    className={cn(
                      "text-xs font-mono mb-1",
                      tier.isPopular ? "text-background/50" : "text-muted-foreground/60"
                    )}
                  >
                    Toutes les fonctionnalités de&nbsp;
                    {i === 1 ? "Essentiel" : "Pro"}, plus&nbsp;:
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
          ))}
        </div>

        {/* Note de bas de page */}
        <p className="text-center text-xs text-muted-foreground/60">
          Tous les prix sont HT · Paiement sécurisé · Résiliable à tout moment
        </p>
      </div>
    </Section>
  );
}
