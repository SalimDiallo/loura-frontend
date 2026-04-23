"use client";

import { motion } from "framer-motion";

import HeroVideoDialog from "@/landing/components/magicui/hero-video";
import Link from "next/link";
import { BackgroundRippleEffect } from "../ui/background-ripple-effect";

/* ────────────────────────────────────────────────
   Icône SVG inline – réutilisable
──────────────────────────────────────────────── */
type IconProps = { className?: string };

const IconUsers = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
  </svg>
);

const IconChart = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm6 2V9a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v12m6 0h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2z" />
  </svg>
);

const IconBox = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m16 0l-8 4M4 7l8 4" />
  </svg>
);

const IconSettings = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
  </svg>
);

const IconProject = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2m-6 9l2 2 4-4" />
  </svg>
);

const IconHandshake = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5l2.5-2.5M17 11.5l-2.5-2.5M3 15l3-3m15 3l-3-3M3 15c0 1.1.9 2 2 2h2l3 3 2-2 2 2 3-3h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2L13 4l-2 2-2-2-3 3H2a2 2 0 0 0-2 2v6z" />
  </svg>
);

const IconCoin = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v1m0 8v1m3.5-5.5A3.5 3.5 0 0 1 12 15a3.5 3.5 0 0 1-3.5-3.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 3.5 3.5z" />
  </svg>
);

/* ────────────────────────────────────────────────
   Grille de points décoratifs
──────────────────────────────────────────────── */
function DotGrid({ cols = 6, rows = 8 }: { cols?: number; rows?: number }) {
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "10px" }}
    >
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] h-[3px] rounded-full bg-primary/20"
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────
   Ligne verticale avec label flottant
──────────────────────────────────────────────── */
function VerticalLine({ label, top }: { label: string; top: string }) {
  return (
    <div className="relative flex flex-col items-center" style={{ marginTop: top }}>
      <span className="text-[9px] font-mono text-primary/30 tracking-widest mb-1 rotate-0 whitespace-nowrap">
        {label}
      </span>
      <div className="w-px h-24 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />
    </div>
  );
}

/* ────────────────────────────────────────────────
   Panneau latéral complet (gauche ou droite)
──────────────────────────────────────────────── */
const sideIcons = [
  { Icon: IconUsers, label: "RH", delay: 0.1 },
  { Icon: IconChart, label: "Analytics", delay: 0.2 },
  { Icon: IconBox, label: "Stock", delay: 0.3 },
  { Icon: IconSettings, label: "Config", delay: 0.4 },
  { Icon: IconProject, label: "Projets", delay: 0.5 },
  { Icon: IconHandshake, label: "CRM", delay: 0.6 },
  { Icon: IconCoin, label: "Finance", delay: 0.7 },
];

function SideDecor({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";

  return (
    <div
      className={`pointer-events-none absolute top-0 bottom-0 hidden xl:flex flex-col items-center gap-6 py-10 px-2 ${isLeft ? "left-2 2xl:left-6" : "right-2 2xl:right-6"
        }`}
      style={{ zIndex: 10 }}
    >
      {/* Grille de points */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        <DotGrid cols={4} rows={5} />
      </motion.div>

      {/* Ligne verticale décorative */}
      <VerticalLine label={isLeft ? "LOURA·TECH" : "MANAGE·IT"} top="0px" />

      {/* Icônes gestion */}
      <div className="flex flex-col gap-5 mt-2">
        {sideIcons.map(({ Icon, label, delay }, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: isLeft ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay }}
            className="flex flex-col items-center gap-0.5 group"
          >
            <div className="relative p-1.5 rounded-md border border-primary/10 bg-background/40 backdrop-blur-sm group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-300">
              <Icon className="w-5 h-5 text-primary/35 group-hover:text-primary/70 transition-colors duration-300" />
              {/* Halo au survol */}
              <div className="absolute inset-0 rounded-md bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
            </div>
            <span className="text-[8px] font-mono text-muted-foreground/30 tracking-widest mt-0.5 group-hover:text-primary/40 transition-colors duration-300">
              {label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Seconde ligne verticale */}
      <VerticalLine label={isLeft ? "v2·0·0" : "SaaS·ERP"} top="0px" />

      {/* Grille de points inférieure */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        <DotGrid cols={4} rows={3} />
      </motion.div>
    </div>
  );
}


function HeroPill() {
  return (
    <div className="border border-border bg-background/80 backdrop-blur-md shadow-sm shadow-border/10  text-xs h-9 px-5 flex items-center gap-3 text-muted-foreground animate-fade-in-up">
      {/* Star icon SVG inline for safety */}
      <svg className="w-4 h-4 text-primary/80" fill="none" viewBox="0 0 20 20">
        <path
          d="M10.916 3.514a1 1 0 0 0-1.832 0L7.115 7.22l-3.918.57a1 1 0 0 0-.555 1.705l2.837 2.766-.67 3.903a1 1 0 0 0 1.451 1.054L10 15.043l3.502 1.845a1 1 0 0 0 1.45-1.053l-.669-3.904 2.837-2.766a1 1 0 0 0-.555-1.704l-3.918-.57-1.038-3.706z"
          fill="currentColor"
        />
      </svg>
      <span className="font-semibold tracking-wide">
        Découvrez la gestion intelligente d'agence
      </span>
    </div>

  );
}

function HeroTitles() {
  return (
    <div className="relative z-20 pt-14 md:pt-20 max-w-5xl mx-auto h-full w-full flex flex-col gap-10 items-center justify-center">

      <div className="flex flex-col items-center justify-center gap-8">
        {/* Titre avec effets et mise en valeur de certains mots */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tighter text-balance text-center leading-[1.08] animate-fade-in-up">
          <span className="font-display font-black drop-shadow-sm">Gérez&nbsp;votre</span>
          <span className="text-primary font-display font-black drop-shadow-md">&nbsp;entreprise&nbsp;</span>
          <span className="font-display font-black italic underline decoration-primary/50 underline-offset-4">en toute simplicité</span>
        </h1>

        {/* Ligne de sous-titre plus dynamique */}
        <p className="text-lg md:text-xl text-center text-muted-foreground font-medium leading-relaxed max-w-3xl animate-fade-in-up delay-100">
          Louratech digitalise la gestion d’entreprise (RH, Stocks, Projets, CRM…).
        </p>
   
      </div>


    </div>

  );
}

function HeroCTA() {
  return (
    <>
      <div className="flex items-center gap-4 flex-wrap justify-center pt-2 animate-fade-in-up delay-200">
        <Link
          href="/auth/register"
          className="group inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-background font-semibold shadow-lg shadow-primary/10 px-7 py-3.5 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className="transition-colors duration-200 group-hover:text-background/80">
            Commencer maintenant
          </span>
          {/* ArrowRight SVG inline */}
          <svg
            className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-background/80"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path d="M6 10h8M12 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 bg-background/80 hover:bg-secondary border border-border text-foreground hover:text-primary font-semibold px-7 py-3.5 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-border"
        >
          <span className="transition-colors duration-200">Se Connecter</span>
        </Link>

      </div>
    </>
  );
}

function HeroImage() {
  return (
    <motion.div
      className="relative mx-auto flex w-full items-center justify-center"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 1 }}
    >
      <HeroVideoDialog
        animationStyle="from-center"
        videoSrc="https://www.youtube.com/embed/oJmNRXcqr18?si=OeiVqNbswvsvxmVs"
        thumbnailSrc="/images/landing/hrdash.png"
        thumbnailAlt="Hero Video"
        className="border rounded-lg shadow-lg max-w-6xl mt-16"
      />
    </motion.div>
  );
}

export default function Hero2() {
  return (
    <section id="hero">
      <div className="relative flex w-full flex-col items-center justify-start px-4 pt-2 sm:px-6 sm:pt-2 md:pt-2 lg:px-8">
        <BackgroundRippleEffect />

        {/* Décorations latérales – icônes et motifs de gestion */}
        <SideDecor side="left" />
        <SideDecor side="right" />

        <HeroPill />
        <HeroTitles />
        <HeroCTA />
        <HeroImage />
        <div className="pointer-events-none absolute inset-x-0 -bottom-12 h-1/3 bg-linear-to-t from-background via-background to-transparent lg:h-1/4"></div>
      </div>
    </section>
  );
}
