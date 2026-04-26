"use client";

import { siteConfig } from "@/lib/config";
import { useCurrentUser } from "@/lib/hooks/auth/useCurrentUser";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

// ─── Étapes de "préparation" (sobre, pro) ──────────────────────────────────

const STEPS = [
  { label: "Création de votre compte", duration: 700 },
  { label: "Préparation de votre espace", duration: 850 },
  { label: "Initialisation du tableau de bord", duration: 750 },
] as const;

const TOTAL_DURATION = STEPS.reduce((sum, s) => sum + s.duration, 0);

export default function WelcomePage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const firstName = user?.first_name?.trim() || "";

  // ── Progression linéaire de 0 → 100% sur la durée totale ────────────
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / TOTAL_DURATION) * 100);
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // ── Avance d'étape selon les durées définies ────────────────────────
  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    let acc = 0;
    STEPS.forEach((step, idx) => {
      acc += step.duration;
      const t = setTimeout(() => setCurrentStep(idx + 1), acc);
      timeouts.push(t);
    });
    return () => timeouts.forEach(clearTimeout);
  }, []);

  // ── Redirection finale ──────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(`${siteConfig.core.dashboard.home}?onboarding=1`);
    }, TOTAL_DURATION + 350);
    return () => clearTimeout(t);
  }, [router]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black px-6 transition-colors relative overflow-hidden">
      {/* Halo discret derrière le logo */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-sm flex flex-col items-center gap-10">
        {/* ─── Logo avec anneau de progression ─── */}
        <div className="relative">
          {/* Cercle de fond */}
          <svg
            className="absolute inset-0 -rotate-90"
            width={140}
            height={140}
            viewBox="0 0 140 140"
          >
            <circle
              cx="70"
              cy="70"
              r="66"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-neutral-200 dark:text-neutral-800"
            />
            <circle
              cx="70"
              cy="70"
              r="66"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 66}
              strokeDashoffset={(2 * Math.PI * 66) * (1 - progress / 100)}
              className="text-primary transition-[stroke-dashoffset] duration-200 ease-out"
            />
          </svg>

          {/* Logo centré + pulsation douce */}
          <div className="w-[140px] h-[140px] flex items-center justify-center">
            <div className="w-20 h-20 flex items-center justify-center animate-pulse-soft">
               <Image
                            src={"/images/logo-icon.png"}
                            width={500}
                            height={500}
                            alt="Logo de Loura tech (dark mode)"
                            className="block [&_img]:w-full [&_img]:h-full [&_img]:object-contain"
                            priority
                        />
            </div>
          </div>
        </div>

        {/* ─── Texte d'accueil ─── */}
        <div className="text-center space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500">
            Bienvenue
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            {greeting}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
            Nous préparons votre espace de travail. Cela ne prendra qu'un instant.
          </p>
        </div>

        {/* ─── Étapes de préparation ─── */}
        <ul className="w-full space-y-2.5">
          {STEPS.map((step, idx) => {
            const done = idx < currentStep;
            const active = idx === currentStep;
            return (
              <li
                key={idx}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-300",
                  active && "bg-neutral-50 dark:bg-neutral-950"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-300 shrink-0",
                    done
                      ? "bg-primary border-primary text-primary-foreground"
                      : active
                        ? "border-primary text-primary"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-300 dark:text-neutral-700"
                  )}
                >
                  {done ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : active ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "text-xs transition-colors duration-300",
                    done
                      ? "text-neutral-500 dark:text-neutral-500 line-through decoration-neutral-300 dark:decoration-neutral-700"
                      : active
                        ? "text-black dark:text-white font-medium"
                        : "text-neutral-400 dark:text-neutral-600"
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ul>

        {/* ─── Barre de progression discrète ─── */}
        <div className="w-full">
          <div className="h-0.5 w-full bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-600 text-center mt-2 font-mono tabular-nums">
            {Math.round(progress)}%
          </p>
        </div>
      </div>

      {/* ─── Footer discret ─── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-neutral-300 dark:text-neutral-700 tracking-wider uppercase">
        LouraTech
      </div>

      <style jsx>{`
        @keyframes pulse-soft {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.04); opacity: 0.92; }
        }
        :global(.animate-pulse-soft) {
          animation: pulse-soft 2.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
