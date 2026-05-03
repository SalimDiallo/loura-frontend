"use client";

/**
 * Widget de feedback utilisateur — sobre et discret.
 *
 * Bouton flottant en bas à droite, qui ouvre un petit panneau compact
 * permettant à n'importe quel utilisateur (connecté ou non) d'envoyer
 * un retour : idée, bug, compliment, autre.
 *
 * Le widget se masque automatiquement sur les routes où il serait
 * intrusif (écrans d'authentification, pages légales, impression…).
 */

import { Button } from "@/components/ui/button";
import { tokenManager } from "@/lib/api/client";
import {
    feedbackService,
    type FeedbackType,
} from "@/lib/services/feedback/feedback.service";
import { cn } from "@/lib/utils";
import {
    Bug,
    Heart,
    Lightbulb,
    MessageSquare,
    MessageSquarePlus,
    Send,
    Star,
    X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { toast } from "sonner";

// Routes où le widget ne doit pas apparaître (auth / légales / aperçus).
const HIDDEN_PATH_PREFIXES = [
  "/auth",
  "/admin",
  "/print",
  "/legal",
];

const TYPES: Array<{
  value: FeedbackType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "idea", label: "Idée", icon: Lightbulb },
  { value: "bug", label: "Bug", icon: Bug },
  { value: "love", label: "J'aime", icon: Heart },
  { value: "other", label: "Autre", icon: MessageSquare },
];

export function FeedbackWidget() {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("love");
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isHidden = useMemo(
    () => HIDDEN_PATH_PREFIXES.some((p) => pathname.startsWith(p)),
    [pathname],
  );

  const isAuthenticated = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      return !!tokenManager.getAccessToken();
    } catch {
      return false;
    }
  }, [open]);

  // Focus auto sur le textarea à l'ouverture + fermeture sur Escape.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => textareaRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Fermeture au clic en dehors.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const reset = useCallback(() => {
    setType("love");
    setRating(0);
    setMessage("");
    setEmail("");
    setSent(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = message.trim();
    if (trimmed.length < 3) {
      toast.error("Merci de décrire votre retour en quelques mots.");
      return;
    }
    setSubmitting(true);
    try {
      const orgSlug =
        typeof window !== "undefined"
          ? localStorage.getItem("current_organization_slug") || ""
          : "";

      await feedbackService.submit({
        type,
        message: trimmed,
        rating: rating > 0 ? rating : null,
        email: !isAuthenticated ? email.trim() : undefined,
        page_url:
          typeof window !== "undefined" ? window.location.href : undefined,
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        organization_slug: orgSlug || undefined,
      });
      setSent(true);
      toast.success("Merci, votre retour a bien été envoyé !");
      // Fermeture auto après un court délai
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 1400);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Impossible d'envoyer le feedback.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [type, rating, message, email, isAuthenticated, reset]);

  if (isHidden) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[55] print:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Envoyer un feedback"
          className={cn(
            "mb-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border",
            "bg-popover text-popover-foreground shadow-2xl",
            "animate-in fade-in slide-in-from-bottom-2 duration-200",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Votre retour</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {sent ? (
            <div className="px-4 py-8 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Heart className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">Merci pour votre retour.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Chaque message nous aide à améliorer Loura.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Types */}
              <div className="grid grid-cols-4 gap-1.5">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[11px] transition-colors",
                        active
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                      aria-pressed={active}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Rating (optionnel) */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Note (optionnel)
                </span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(rating === n ? 0 : n)}
                      aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                      className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          n <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "",
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Dites-nous ce qui fonctionne, ce qui coince, ou ce que vous aimeriez voir…"
                maxLength={5000}
                rows={4}
                className={cn(
                  "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm",
                  "placeholder:text-muted-foreground resize-none",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              />

              {/* Email (seulement si non authentifié) */}
              {!isAuthenticated && (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre email (optionnel)"
                  className={cn(
                    "w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm",
                    "placeholder:text-muted-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                />
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground">
                  {message.length}/5000
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitting || message.trim().length < 3}
                  className="h-8"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {submitting ? "Envoi…" : "Envoyer"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bouton flottant */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Donner mon avis"
        aria-expanded={open}
        className={cn(
          "group flex items-center gap-2 rounded-full border border-border",
          "bg-background/90 backdrop-blur px-3.5 h-10 shadow-lg",
          "text-sm font-medium text-foreground/80 hover:text-foreground",
          "hover:bg-background hover:shadow-xl transition-all",
        )}
      >
        <MessageSquarePlus className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="hidden sm:inline">Feedback</span>
      </button>
    </div>
  );
}
