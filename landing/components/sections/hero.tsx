"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { motion } from "framer-motion";

import HeroVideoDialog from "@/landing/components/magicui/hero-video";
import Link from "next/link";
import { BackgroundRippleEffect } from "../ui/background-ripple-effect";

/* ────────────────────────────────────────────────
   Animations Lottie latérales
──────────────────────────────────────────────── */
const LOTTIE_LEFT_SRC = "/lottie/left-team.json";
const LOTTIE_RIGHT_SRC = "/lottie/right-analytics.json";

function LottieDecor({ side, src }: { side: "left" | "right"; src: string }) {
  const isLeft = side === "left";

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, delay: 0.4 }}
      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 hidden xl:block w-[220px] 2xl:w-[280px] ${
        isLeft ? "left-2 2xl:left-8" : "right-2 2xl:right-8"
      }`}
      style={{ zIndex: 10 }}
    >
      <DotLottieReact
        src={src}
        autoplay
        loop
        className="w-full h-auto opacity-90"
      />
    </motion.div>
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
          className="group inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-background font-semibold shadow-lg shadow-primary/10 px-7 py-3.5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-primary"
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
          className="inline-flex items-center gap-2 bg-background/80 hover:bg-secondary border border-border text-foreground hover:text-primary font-semibold px-7 py-3.5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-border"
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
        <BackgroundRippleEffect  />

        {/* Animations Lottie décoratives — gauche & droite */}
        <LottieDecor side="left" src={LOTTIE_LEFT_SRC} />
        <LottieDecor side="right" src={LOTTIE_RIGHT_SRC} />

        <HeroPill />
        <HeroTitles />
        <HeroCTA />
        <HeroImage />
        <div className="pointer-events-none absolute inset-x-0 -bottom-12 h-1/3 bg-linear-to-t from-background via-background to-transparent lg:h-1/4"></div>
      </div>
    </section>
  );
}
