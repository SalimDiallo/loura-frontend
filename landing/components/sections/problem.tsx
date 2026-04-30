"use client";

import BlurFade from "@/landing/components/magicui/blur-fade";
import Section from "@/landing/components/section";
import { Brain, Layers, ShieldAlert } from "lucide-react";

const problems = [
  {
    title: "Saisie répétitive.",
    description: "Duplication = erreurs, perte de temps.",
    icon: Brain,
  },
  {
    title: "Décisions sans données.",
    description: "RH, stock, clients dispersés.",
    icon: Layers,
  },
  {
    title: "Données exposées.",
    description: "Excel = sécurité et contrôle faibles.",
    icon: ShieldAlert,
  },
];

export default function ProblemSection() {
  return (
    <Section
      title="Problèmes"
      subtitle="Les blocages sans gestion centralisée."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {problems.map((p, i) => (
          <BlurFade key={i} delay={0.2 + i * 0.15} inView>
            <div className="flex flex-col gap-4 p-6 border border-border/60 bg-background hover:bg-muted/30 transition-colors duration-200">
              <p.icon className="w-6 h-6 text-primary/70" strokeWidth={1.5} />
              <h3 className="text-base font-semibold leading-snug">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </div>
          </BlurFade>
        ))}
      </div>
    </Section>
  );
}
