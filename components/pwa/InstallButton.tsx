"use client";

import { cn } from "@/lib/utils";
import { Download } from "lucide-react";
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
 *   d'instructions « Partager → Sur l'écran d'accueil ».
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

  // Ferme le hint iOS au clic extérieur.
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
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
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
      : "h-9 px-3.5 text-xs";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Installer LouraTech"
        title="Installer LouraTech sur votre appareil"
        className={cn(
          "inline-flex items-center gap-2 font-medium",
          "border border-border bg-background/70 backdrop-blur-sm",
          "text-foreground hover:bg-secondary hover:border-foreground/20",
          "transition-colors focus-visible:outline-2 focus-visible:outline-primary",
          sizeClasses
        )}
      >
        <Download
          className={variant === "wide" ? "w-4 h-4" : "w-3.5 h-3.5"}
          aria-hidden
        />
        <span>Installer l&apos;app</span>
      </button>

      {isIOS && showIOSHint && (
        <div
          role="dialog"
          aria-label="Instructions d'installation iOS"
          className={cn(
            "absolute right-0 top-full mt-2 w-72 p-3",
            "bg-popover text-popover-foreground border border-border",
            "shadow-lg z-50 text-xs leading-relaxed"
          )}
        >
          Sur iOS&nbsp;: appuyez sur l&apos;icône{" "}
          <span className="font-semibold">Partager</span> en bas de Safari,
          puis sur{" "}
          <span className="font-semibold">«&nbsp;Sur l&apos;écran d&apos;accueil&nbsp;»</span>{" "}
          pour installer LouraTech.
        </div>
      )}
    </div>
  );
}
