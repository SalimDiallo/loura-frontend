"use client";

import FlickeringGrid from "@/landing/components/magicui/flickering-grid";
import Ripple from "@/landing/components/magicui/ripple";
import Safari from "@/landing/components/safari";
import Section from "@/landing/components/section";
import { cn } from "@/landing/lib/utils";
import { motion } from "framer-motion";

const features = [
  {
    title: "Gestion des employés",
    description:
      "Centralisez toutes les informations de vos employés : fiches, contrats, documents administratifs. Suivi du personnel, historique, accès simplifié.",
    className: "hover:bg-blue-500/10 transition-all duration-500 ease-out",
    content: (
      <>
        <Safari
          src={`/images/landing/employees.png`}
          url="#"
          className="-mb-32 mt-4 max-h-64 w-full px-4 select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-y-[-10px] transition-all duration-300"
        />
      </>
    ),
  },
  {
    title: "Gestion de la paie & congés",
    description:
      "Automatisez la gestion de la paie, des absences et des congés. Paramétrage flexible et génération automatique des bulletins : gagnez du temps et limitez les erreurs.",
    className:
      "order-3 xl:order-none hover:bg-green-500/10 transition-all duration-500 ease-out",
    content: (
      <Safari
        src={`/images/landing/paie.png`}
        url="#"
        className="-mb-32 mt-4 max-h-64 w-full px-4 select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-y-[-10px] transition-all duration-300"
      />
    ),
  },
  {
    title: "Stocks, inventaires & ventes",
    description:
      "Suivi précis des stocks, historiques des mouvements, gestion des ventes et inventaires en quelques clics. Anticipez les ruptures, optimisez vos flux.",
    className:
      "md:row-span-2 hover:bg-orange-500/10 transition-all duration-500 ease-out",
    content: (
      <>
        <FlickeringGrid
          className="z-0 absolute inset-0 [mask:radial-gradient(circle_at_center,#fff_400px,transparent_0)]"
          squareSize={4}
          gridGap={6}
          color="#000"
          maxOpacity={0.1}
          flickerChance={0.1}
          height={800}
          width={800}
        />
        <Safari
          src={`/images/landing/stocks.png`}
          url="#"
          className="-mb-48 ml-12 mt-16 h-full px-4 select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-x-[-10px] transition-all duration-300"
        />
      </>
    ),
  },
  {
    title: "Gestion des rôles & accès",
    description:
      "Sécurisez les accès selon les rôles : direction, RH, employés, commerciaux, etc. Gérez facilement les permissions pour chaque utilisateur.",
    className:
      "flex-row order-4 md:col-span-2 md:flex-row xl:order-none hover:bg-red-500/10 transition-all duration-500 ease-out",
    content: (
      <>
        <Ripple className="absolute -bottom-full" />
        <Safari
          src={`/dashboard.png`}
          url="https://loura.app/roles"
          className="-mb-32 mt-4 max-h-64 w-full px-4 select-none drop-shadow-[0_0_28px_rgba(0,0,0,.1)] group-hover:translate-y-[-10px] transition-all duration-300"
        />
      </>
    ),
  },
];

export default function SolutionSection() {
  return (
    <Section
      title="Solution"
      subtitle="Loura gère tout pour vous, simplement."
      description="Plus qu’un simple outil, Loura centralise la gestion des ressources humaines, des stocks, des ventes, et automatise la paie ainsi que la gestion fine des accès pour vos équipes."
      className="bg-neutral-100 dark:bg-neutral-900"
    >
      <div className="mx-auto mt-16 grid max-w-sm grid-cols-1 gap-6 text-gray-500 md:max-w-3xl md:grid-cols-2 xl:grid-rows-2 md:grid-rows-3 xl:max-w-6xl xl:auto-rows-fr xl:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className={cn(
              "group relative items-start overflow-hidden bg-neutral-50 dark:bg-neutral-800 p-6 rounded-2xl",
              feature.className
            )}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: index * 0.1,
            }}
            viewport={{ once: true }}
          >
            <div>
              <h3 className="font-semibold mb-2 text-primary">
                {feature.title}
              </h3>
              <p className="text-foreground">{feature.description}</p>
            </div>
            {feature.content}
            <div className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-neutral-50 dark:from-neutral-900 pointer-events-none"></div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
