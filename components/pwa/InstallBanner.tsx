"use client";

import { cn } from "@/lib/utils";
import { Download, Plus, Share, Smartphone, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

const STORAGE_KEY = "loura.install-banner.dismissed-at";
/** Re-proposer la bannière 14 jours après un dismiss. */
const SUPPRESS_DAYS = 14;
/** Délai avant de montrer la bannière (laisse l'utilisateur arriver). */
const SHOW_DELAY_MS = 4000;

/**
 * Bannière flottante d'installation PWA pour les écrans mobiles.
 *
 * Apparait :
 *   - uniquement sur viewport `<lg` (la cible : mobile / tablette),
 *   - après un délai de {@link SHOW_DELAY_MS} ms,
 *   - jamais si l'app est déjà installée (display-mode standalone),
 *   - jamais si l'utilisateur l'a fermée il y a moins de {@link SUPPRESS_DAYS} jours,
 *   - jamais si le navigateur ne sait ni installer (pas d'évènement) ni n'est iOS Safari.
 *
 * Au clic sur "Installer" :
 *   - Chromium : déclenche `prompt()`.
 *   - iOS Safari : déplie les instructions Partager → Sur l'écran d'accueil.
 *
 * À placer dans le layout racine, **après** `<PwaRegister />`.
 */
export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [expandedIOS, setExpandedIOS] = useState(false);

  // ─── Détection environnement ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const standaloneMQ = window.matchMedia?.("(display-mode: standalone)");
    const isStandalone =
      standaloneMQ?.matches ||
      (window.navigator as Navigator & { standalone?: boolean })
        .standalone === true;
    if (isStandalone) {
      setInstalled(true);
      return;
    }

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
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // ─── Affichage différé + respect du dismiss persistant ───────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (installed) return;
    // Mobile / tablette uniquement
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    // Aucun moyen de proposer : Chromium n'a pas encore eu beforeinstallprompt
    // et on n'est pas sur iOS Safari.
    if (!deferred && !isIOS) return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const ts = Number(raw);
        if (
          Number.isFinite(ts) &&
          Date.now() - ts < SUPPRESS_DAYS * 24 * 60 * 60 * 1000
        ) {
          return;
        }
      }
    } catch {
      // localStorage indisponible → on continue sans suppression.
    }

    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [installed, deferred, isIOS]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setExpandedIOS(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Pas critique
    }
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") {
          setInstalled(true);
          setVisible(false);
        }
      } catch {
        /* user closed prompt */
      } finally {
        setDeferred(null);
      }
      return;
    }
    if (isIOS) setExpandedIOS((v) => !v);
  }, [deferred, isIOS]);

  if (!visible || installed) return null;

  return (
    <div
      role="dialog"
      aria-label="Installer LouraTech"
      className={cn(
        "fixed inset-x-3 bottom-3 z-[60] lg:hidden",
        "rounded-xl border border-border bg-popover shadow-2xl",
        "animate-in slide-in-from-bottom-4 fade-in duration-300"
      )}
      style={{
        // Respecte la safe area iOS (home indicator)
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* En-tête principal */}
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">
            Installez LouraTech
          </p>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">
            Accès rapide depuis l&apos;écran d&apos;accueil, mode plein écran.
          </p>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 h-9 rounded-md shrink-0",
            "bg-primary text-primary-foreground text-xs font-semibold",
            "hover:bg-primary/90 active:scale-95 transition-all"
          )}
        >
          <Download className="h-3.5 w-3.5" />
          {expandedIOS ? "Étapes" : "Installer"}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Plus tard"
          className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Section iOS dépliée */}
      {isIOS && expandedIOS && (
        <ol className="px-4 pb-4 space-y-2.5 text-xs border-t border-border pt-3">
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              1
            </span>
            <span className="pt-0.5">
              Appuyez sur{" "}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold align-middle">
                <Share className="h-3 w-3" />
                Partager
              </span>{" "}
              en bas de Safari.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              2
            </span>
            <span className="pt-0.5">
              Choisissez{" "}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold align-middle">
                <Plus className="h-3 w-3" />
                Sur l&apos;écran d&apos;accueil
              </span>
              .
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              3
            </span>
            <span className="pt-0.5">
              Confirmez avec{" "}
              <span className="font-semibold">Ajouter</span>.
            </span>
          </li>
        </ol>
      )}
    </div>
  );
}
