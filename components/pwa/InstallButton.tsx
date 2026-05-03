"use client";

import { cn } from "@/lib/utils";
import { Download, Plus, Share, Smartphone, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Évènement Chromium-only : `beforeinstallprompt`.
 * On le capture pour pouvoir déclencher manuellement l'installation depuis
 * un bouton dédié.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

interface InstallButtonProps {
  className?: string;
  /** Variante visuelle : compacte (header) ou large (CTA). */
  variant?: "compact" | "wide";
}

/**
 * Bouton sobre permettant d'installer l'app en tant que PWA bureau / mobile.
 *
 * - Sur Chromium (Chrome/Edge/Brave/Opera) : capture `beforeinstallprompt`
 *   et lance `prompt()` au clic.
 * - Sur iOS Safari (qui n'expose pas l'évènement) : affiche un mini-tooltip
 *   d'instructions visuelles « Partager → Sur l'écran d'accueil ».
 * - Si l'app est déjà installée (display-mode standalone) ou si le navigateur
 *   ne supporte rien : le bouton ne s'affiche pas.
 */
export function InstallButton({
  className,
  variant = "compact",
}: InstallButtonProps) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Déjà installé : on cache le bouton.
    const standaloneMQ = window.matchMedia?.("(display-mode: standalone)");
    const isStandalone =
      standaloneMQ?.matches ||
      // iOS Safari expose `navigator.standalone`.
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // Détection iOS (hors Chrome/Firefox/Edge sur iOS qui n'autorisent pas
    // non plus l'install PWA).
    const ua = window.navigator.userAgent.toLowerCase();
    const iOS =
      /iphone|ipad|ipod/.test(ua) && !/crios|fxios|edgios|opios/.test(ua);
    setIsIOS(iOS);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Ferme le hint iOS au clic extérieur ou via Escape.
  useEffect(() => {
    if (!showIOSHint) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowIOSHint(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowIOSHint(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [showIOSHint]);

  const handleClick = useCallback(async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") setInstalled(true);
      } catch {
        /* l'utilisateur a fermé la prompt — rien à faire */
      } finally {
        setDeferred(null);
      }
      return;
    }
    if (isIOS) {
      setShowIOSHint((v) => !v);
    }
  }, [deferred, isIOS]);

  if (installed) return null;
  // Si on n'a ni l'évènement Chromium ni un iOS, le bouton n'a rien à offrir.
  if (!deferred && !isIOS) return null;

  const sizeClasses =
    variant === "wide"
      ? "h-11 px-5 text-sm"
      : "h-9 px-3 text-xs";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Installer LouraTech"
        title="Installer LouraTech sur votre appareil"
        aria-expanded={showIOSHint}
        className={cn(
          "inline-flex items-center gap-1.5 sm:gap-2 font-medium rounded-md",
          "border border-primary/30 bg-primary/5 backdrop-blur-sm",
          "text-primary hover:bg-primary/10 hover:border-primary/50",
          "transition-colors focus-visible:outline-2 focus-visible:outline-primary",
          sizeClasses
        )}
      >
        <Download
          className={variant === "wide" ? "w-4 h-4" : "w-3.5 h-3.5"}
          aria-hidden
        />
        <span className="hidden xs:inline sm:inline">
          Installer{variant === "wide" ? " l'app" : ""}
        </span>
      </button>

      {isIOS && showIOSHint && <IOSHint onClose={() => setShowIOSHint(false)} />}
    </div>
  );
}

/**
 * Tooltip d'instructions iOS — visuel, étape par étape.
 * Aligné à droite par défaut, autonome (overlay sur clic extérieur géré par
 * le parent).
 */
function IOSHint({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-label="Instructions d'installation sur iOS"
      className={cn(
        "absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))]",
        "bg-popover text-popover-foreground border border-border rounded-lg",
        "shadow-xl z-50 overflow-hidden"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <Smartphone className="h-4 w-4 text-primary shrink-0" />
        <h3 className="text-sm font-semibold flex-1">
          Installer sur l&apos;écran d&apos;accueil
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Steps */}
      <ol className="px-4 py-3 space-y-3 text-xs leading-relaxed">
        <li className="flex items-start gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
            1
          </span>
          <span className="flex-1 pt-0.5">
            Appuyez sur l&apos;icône{" "}
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold align-middle">
              <Share className="h-3 w-3" />
              Partager
            </span>{" "}
            en bas de Safari.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
            2
          </span>
          <span className="flex-1 pt-0.5">
            Faites défiler et appuyez sur{" "}
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold align-middle">
              <Plus className="h-3 w-3" />
              Sur l&apos;écran d&apos;accueil
            </span>
            .
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
            3
          </span>
          <span className="flex-1 pt-0.5">
            Appuyez sur{" "}
            <span className="font-semibold">Ajouter</span> en haut à droite.
            L&apos;icône LouraTech apparaît sur votre écran.
          </span>
        </li>
      </ol>

      {/* Footer note */}
      <div className="px-4 py-2.5 border-t border-border bg-muted/30 text-[10px] text-muted-foreground">
        Disponible uniquement depuis <span className="font-semibold">Safari</span>.
      </div>
    </div>
  );
}
