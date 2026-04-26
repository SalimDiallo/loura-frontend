"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";
import {
    useCallback,
    useLayoutEffect,
    useState,
    type CSSProperties,
} from "react";

export type TourStep = {
  target: string; // matches [data-tour="..."]
  icon: React.ElementType;
  title: string;
  description: string;
  cta?: { label: string; onClick: () => void };
  placement?: "bottom" | "top" | "right" | "left";
};

type Rect = { top: number; left: number; width: number; height: number };

function useTargetRect(selector: string, active: boolean): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  const measure = useCallback(() => {
    if (!active) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    if (r.top < 0 || r.bottom > window.innerHeight) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selector, active]);

  useLayoutEffect(() => {
    if (!active) return;
    measure();
    const t = setTimeout(measure, 120);
    const onResize = () => measure();
    const onScroll = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [measure, active]);

  return rect;
}

export default function GuidedTour({
  steps,
  firstName,
  onFinish,
}: {
  steps: TourStep[];
  firstName?: string;
  onFinish: () => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[stepIdx];
  const rect = useTargetRect(step.target, true);
  const total = steps.length;

  const next = () => {
    if (stepIdx < total - 1) setStepIdx((i) => i + 1);
    else onFinish();
  };
  const prev = () => stepIdx > 0 && setStepIdx((i) => i - 1);

  const PADDING = 10;
  const TOOLTIP_W = 340;
  const TOOLTIP_H = 220;
  let tooltipStyle: CSSProperties = {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: TOOLTIP_W,
  };
  if (rect) {
    const placement = step.placement ?? "bottom";
    let top = 0;
    let left = 0;
    if (placement === "bottom") {
      top = rect.top + rect.height + PADDING;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    } else if (placement === "top") {
      top = rect.top - TOOLTIP_H - PADDING;
      left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    } else if (placement === "right") {
      top = rect.top + rect.height / 2 - TOOLTIP_H / 2;
      left = rect.left + rect.width + PADDING;
    } else {
      top = rect.top + rect.height / 2 - TOOLTIP_H / 2;
      left = rect.left - TOOLTIP_W - PADDING;
    }
    top = Math.max(12, Math.min(top, window.innerHeight - TOOLTIP_H - 12));
    left = Math.max(12, Math.min(left, window.innerWidth - TOOLTIP_W - 12));
    tooltipStyle = { top, left, width: TOOLTIP_W };
  }

  const SPOT_PADDING = 8;
  const RADIUS = 12;
  const Icon = step.icon;

  // 4 bandes flou + sombres encadrant le spotlight (top, bottom, left, right).
  // Chaque bande a son propre backdrop-blur, donc la zone du spotlight reste nette.
  const spotTop = rect ? rect.top - SPOT_PADDING : 0;
  const spotLeft = rect ? rect.left - SPOT_PADDING : 0;
  const spotWidth = rect ? rect.width + SPOT_PADDING * 2 : 0;
  const spotHeight = rect ? rect.height + SPOT_PADDING * 2 : 0;
  const spotRight = spotLeft + spotWidth;
  const spotBottom = spotTop + spotHeight;

  const blurStyle: React.CSSProperties = {
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    background: "rgba(15, 23, 42, 0.45)",
    transition: "all 200ms ease",
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {rect ? (
        <>
          {/* Bande haute */}
          <div
            className="absolute pointer-events-auto"
            style={{
              ...blurStyle,
              top: 0,
              left: 0,
              right: 0,
              height: Math.max(0, spotTop),
            }}
            onClick={onFinish}
          />
          {/* Bande basse */}
          <div
            className="absolute pointer-events-auto"
            style={{
              ...blurStyle,
              top: spotBottom,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onClick={onFinish}
          />
          {/* Bande gauche (entre top et bottom) */}
          <div
            className="absolute pointer-events-auto"
            style={{
              ...blurStyle,
              top: spotTop,
              left: 0,
              width: Math.max(0, spotLeft),
              height: spotHeight,
            }}
            onClick={onFinish}
          />
          {/* Bande droite */}
          <div
            className="absolute pointer-events-auto"
            style={{
              ...blurStyle,
              top: spotTop,
              left: spotRight,
              right: 0,
              height: spotHeight,
            }}
            onClick={onFinish}
          />
          {/* Bord coloré autour du spotlight */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: spotTop,
              left: spotLeft,
              width: spotWidth,
              height: spotHeight,
              borderRadius: RADIUS,
              boxShadow:
                "0 0 0 2px hsl(var(--primary)), 0 0 0 6px rgba(99, 102, 241, 0.20), 0 0 32px rgba(99, 102, 241, 0.25)",
              transition: "all 200ms ease",
            }}
          />
        </>
      ) : (
        // Pas de cible : flou plein écran
        <div
          className="absolute inset-0 pointer-events-auto"
          style={blurStyle}
          onClick={onFinish}
        />
      )}

      {rect && (
        <div
          className="absolute pointer-events-none flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg"
          style={{
            top: rect.top - SPOT_PADDING - 16,
            left: rect.left - SPOT_PADDING - 16,
            transition: "all 200ms ease",
          }}
        >
          {stepIdx + 1}
        </div>
      )}

      <div
        className="absolute pointer-events-auto bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
        style={tooltipStyle}
      >
        <div className="px-5 pt-4 pb-3 border-b border-muted flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-primary/10 text-primary shrink-0">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Étape {stepIdx + 1} / {total}
            </span>
          </div>
          <button
            type="button"
            onClick={onFinish}
            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Fermer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="px-5 py-4">
          {stepIdx === 0 && firstName && (
            <p className="text-[11px] text-muted-foreground mb-1">
              Bienvenue {firstName}{" "}
              <Sparkles className="inline h-3 w-3 text-primary" />
            </p>
          )}
          <h3 className="text-sm font-semibold text-foreground mb-1.5">
            {step.title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {step.description}
          </p>

          <div className="flex gap-1.5 mt-4">
            {steps.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i === stepIdx
                    ? "bg-primary"
                    : i < stepIdx
                      ? "bg-primary/40"
                      : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>

        <div className="px-5 py-3 bg-muted/30 border-t border-muted flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={prev}
            disabled={stepIdx === 0}
            className="h-7 px-2 text-xs"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Précédent
          </Button>
          <div className="flex gap-2">
            {step.cta && (
              <Button
                size="sm"
                onClick={() => step.cta!.onClick()}
                className="h-7 px-3 text-xs font-semibold"
              >
                {step.cta.label}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
            <Button
              variant={step.cta ? "outline" : "default"}
              size="sm"
              onClick={next}
              className="h-7 px-3 text-xs font-semibold"
            >
              {stepIdx === total - 1 ? (
                <>
                  Terminer
                  <Check className="h-3 w-3 ml-1" />
                </>
              ) : (
                <>
                  Suivant
                  <ArrowRight className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
