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
      description="Centralisez RH, stocks, ventes, paie et accès."
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
              <h3 className="font-semibold mb-4 text-xl text-primary">
                {feature.title}
              </h3>
            </div>
            {feature.content}
            <div className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-neutral-50 dark:from-neutral-900 pointer-events-none"></div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
