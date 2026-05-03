"use client";

import { SubscriptionSummaryCard } from "@/components/billing/SubscriptionSummaryCard";
import GuidedTour from "@/components/GuidedTour";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/lib/config";
import { useCurrentUser } from "@/lib/hooks/auth/useCurrentUser";
import { useOrganizations } from "@/lib/hooks/core";
import { useAcceptInvitation, useDeclineInvitation, useMyMemberships, usePendingInvitations } from "@/lib/hooks/hr";
import type { Invitation, MyMembership } from "@/lib/types";
import type { Organization } from "@/lib/types/core";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Blocks,
  Building2,
  Check,
  Compass,
  Crown,
  Mail,
  Palette,
  Plus,
  Shield,
  Sparkles,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ============================================================================
// HELPERS
// ============================================================================

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Salutation contextuelle selon l'heure locale de l'utilisateur.
 * Pas d'emoji ni de symbole bruyant — juste le mot juste.
 */
function getGreeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 6) return "Bonsoir";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

/**
 * Distance temporelle relative en français (« il y a 3 jours »).
 * Uniformise le rendu des dates dans les cards.
 */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const diffMs = Date.now() - then;
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 1) return "aujourd'hui";
  if (days < 2) return "hier";
  if (days < 30) return `il y a ${days} j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(months / 12);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
}

// ============================================================================
// KPI PILL — métrique compacte affichée dans le hero
// ============================================================================

function KpiPill({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone?: "primary" | "violet" | "emerald" | "amber";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    violet: "bg-violet-500/10 text-violet-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
  } as const;
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/60 bg-background/50">
      <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", tones[tone])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground leading-none">
          {label}
        </p>
        <p className="text-base font-semibold text-foreground leading-tight mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// ORGANIZATION CARD (OWNED)
// ============================================================================

function OwnedOrgCard({ org, onClick }: { org: Organization; onClick: () => void }) {
  const moduleCount = org.module_codes?.length ?? 0;
  return (
    <Card
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 p-0 overflow-hidden flex flex-col border border-border hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      <div className="flex items-center gap-3 p-4">
        <div className="h-12 w-12 shrink-0 rounded-lg bg-primary/8 flex items-center justify-center overflow-hidden transition-colors group-hover:bg-primary/15 ring-1 ring-primary/10">
          {org.logo ? (
            <img src={org.logo} alt={org.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-primary font-bold text-[14px] tracking-wide">
              {getInitials(org.name)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {org.name}
            </h3>
            {!org.is_active && (
              <span className="inline-flex items-center gap-1 px-1.5 py-px text-[9px] uppercase font-bold tracking-wider bg-muted text-muted-foreground rounded shrink-0">
                Inactif
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
            {org.category?.name && (
              <span className="font-medium truncate">{org.category.name}</span>
            )}
            {org.category?.name && org.country && (
              <span className="text-muted-foreground/40">·</span>
            )}
            {org.country && <span className="truncate">{org.country}</span>}
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
      {/* Footer compact : modules + indicateur d'état actif */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-border/50 bg-muted/20">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Blocks className="h-3 w-3" />
          <span>
            {moduleCount} module{moduleCount > 1 ? "s" : ""}
          </span>
        </div>
        {org.is_active && (
          <div className="flex items-center gap-1 text-[10px] text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Actif
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// ORGANIZATION CARD (MEMBER)
// ============================================================================

function MemberOrgCard({
  membership,
  onClick,
}: {
  membership: MyMembership;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 p-0 overflow-hidden flex flex-col border border-border hover:border-violet-500/40 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:outline-none"
    >
      <div className="flex items-center gap-3 p-4">
        <div className="h-12 w-12 shrink-0 rounded-lg bg-violet-500/8 flex items-center justify-center overflow-hidden transition-colors group-hover:bg-violet-500/15 ring-1 ring-violet-500/10">
          {membership.organization.logo ? (
            <img src={membership.organization.logo} alt={membership.organization.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-violet-600 font-bold text-[14px] tracking-wide">
              {getInitials(membership.organization.name)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-foreground truncate group-hover:text-violet-600 transition-colors">
            {membership.organization.name}
          </h3>
          {membership.role && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-violet-600 font-medium">
              <Shield className="h-2.5 w-2.5" />
              {membership.role.name}
            </div>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
      <div className="flex items-center gap-1.5 px-4 py-2 border-t border-border/50 bg-muted/20 text-[10px] text-muted-foreground">
        <UserPlus className="h-3 w-3" />
        Rejoint {formatRelative(membership.joined_at)}
      </div>
    </Card>
  );
}

// ============================================================================
// INVITATION ROW WITH DIALOG CONFIRMATION (Pas touché, reste ligne basée)
// ============================================================================

function InvitationRow({
  invitation,
  onAccept,
  onDecline,
  isAccepting,
  isDeclining,
}: {
  invitation: Invitation;
  onAccept: () => void;
  onDecline: () => void;
  isAccepting: boolean;
  isDeclining: boolean;
}) {
  const [openDeclineDialog, setOpenDeclineDialog] = useState(false);
  const isProcessing = isAccepting || isDeclining;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-muted/30 transition-colors group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center overflow-hidden ring-1 ring-blue-500/15">
          <Mail className="h-4 w-4 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-sm text-foreground truncate">
              {invitation.organization?.name || "Organisation"}
            </h3>
            {invitation.role && (
              <span className="inline-flex items-center gap-1 px-1.5 py-px text-[9px] font-semibold tracking-wide bg-blue-500/10 text-blue-600 rounded shrink-0">
                <Shield className="h-2.5 w-2.5" />
                {invitation.role.name}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Invitation reçue {formatRelative(invitation.created_at)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Accept en un clic — action positive, pas besoin de confirmation */}
        <Button
          onClick={onAccept}
          disabled={isProcessing}
          size="sm"
          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isAccepting ? (
            <>
              <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
              …
            </>
          ) : (
            <>
              <Check className="h-3 w-3 mr-1" />
              Accepter
            </>
          )}
        </Button>
        {/* Refuser : confirmation simple (action négative) */}
        <Dialog open={openDeclineDialog} onOpenChange={setOpenDeclineDialog}>
          <DialogTrigger asChild>
            <Button
              disabled={isProcessing}
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Refuser</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Refuser l&apos;invitation ?</DialogTitle>
              <DialogDescription>
                Vous ne rejoindrez pas{" "}
                <span className="font-medium text-foreground">
                  {invitation.organization?.name}
                </span>
                . Vous pourrez recevoir une nouvelle invitation plus tard si l&apos;administrateur la renvoie.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenDeclineDialog(false)}
              >
                Annuler
              </Button>
              <Button
                disabled={isProcessing}
                size="sm"
                variant="destructive"
                onClick={() => {
                  onDecline();
                  setOpenDeclineDialog(false);
                }}
              >
                Refuser
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION HEADER
// ============================================================================

function SectionHeader({
  icon: Icon,
  label,
  count,
  action,
}: {
  icon: React.ElementType;
  label: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-md bg-muted/60 flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <h2 className="text-sm font-medium text-foreground">{label}</h2>
        {count !== undefined && (
          <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center mb-3">
        <Icon className="h-4.5 w-4.5 text-muted-foreground/50" />
      </div>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-[240px] leading-relaxed">
        {description}
      </p>
      {action}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user, isLoading: isUserLoading, isError } = useCurrentUser();
  const {
    data: organizations,
    meta,
    isLoading: isOrgsLoading,
  } = useOrganizations();

  // Invitations en attente
  const { data: invitations = [], isLoading: isInvitationsLoading } = usePendingInvitations();
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();

  // Memberships de l'utilisateur
  const { data: myMemberships = [], isLoading: isMembershipsLoading } = useMyMemberships();

  const isLoading = isUserLoading || isOrgsLoading;

  // ── KPIs hero — calculés AVANT tout early return pour respecter les
  // Rules of Hooks (l'ordre des hooks doit être stable entre les renders).
  // `organizations` peut être `undefined` pendant le chargement, on
  // sécurise avec un fallback `[]`.
  const greeting = useMemo(() => getGreeting(), []);
  const totalModules = useMemo(
    () =>
      (organizations ?? []).reduce(
        (acc, o) => acc + (o.module_codes?.length ?? 0),
        0,
      ),
    [organizations],
  );
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    [],
  );

  // Onboarding: actif si ?onboarding=1, si bouton manuel, ou aucune donnée utilisateur
  const onboardingFlag = searchParams.get("onboarding") === "1";
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [onboardingManual, setOnboardingManual] = useState(false);
  const hasNoData =
    !isLoading &&
    !isInvitationsLoading &&
    !isMembershipsLoading &&
    (organizations?.length ?? 0) === 0 &&
    myMemberships.length === 0 &&
    invitations.length === 0;
  const showOnboarding =
    onboardingManual ||
    (!onboardingDismissed && (onboardingFlag || hasNoData));

  const handleDismissOnboarding = () => {
    setOnboardingDismissed(true);
    setOnboardingManual(false);
    if (onboardingFlag) {
      router.replace(siteConfig.core.dashboard.home);
    }
  };

  const handleStartOnboarding = () => {
    setOnboardingDismissed(false);
    setOnboardingManual(true);
  };

  // Auto-clean URL si flag présent mais utilisateur a déjà des données
  useEffect(() => {
    if (onboardingFlag && !hasNoData && !isLoading && !showOnboarding) {
      router.replace(siteConfig.core.dashboard.home);
    }
  }, [onboardingFlag, hasNoData, isLoading, showOnboarding, router]);

  // Handlers pour les invitations
  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitation.mutateAsync(invitationId);
      toast("Invitation acceptée", {
        description: "Vous avez rejoint l'organisation avec succès !",
      });
    } catch (error: any) {
      toast("Erreur", {
        description: error.message || "Impossible d'accepter l'invitation",
      });
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      await declineInvitation.mutateAsync(invitationId);
      toast("Invitation refusée", {
        description: "L'invitation a été refusée.",
      });
    } catch (error: any) {
      toast("Erreur", {
        description: error.message || "Impossible de refuser l'invitation",
      });
    }
  };

  // ========================================================================
  // ERROR
  // ========================================================================

  if (isError) {
    return (
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <div className="text-red-700 bg-red-100 px-4 py-3 rounded-lg text-sm">
          Erreur lors du chargement. Veuillez réessayer.
        </div>
      </div>
    );
  }

  // ========================================================================
  // LOADING
  // ========================================================================

  if (isLoading) {
    return (
      <div className="px-4 py-8 max-w-4xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="space-y-2 pb-5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Section 1 skeleton */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-7 w-16" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Section 2 skeleton */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Card className="overflow-hidden bg-muted/30">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3.5">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    );
  }

  // ========================================================================
  // DATA
  // ========================================================================

  const userName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.email || "Utilisateur";

  const displayOrgs = organizations.slice(0, 5);
  const totalOrgs = meta.totalItems;
  const totalAll = totalOrgs + myMemberships.length;

  // Prénom uniquement pour la salutation (plus naturel que nom complet)
  const firstName = user?.first_name?.trim() || userName.split(" ")[0];

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="px-4 py-6 sm:py-8 max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* ─── HERO HEADER ─── */}
      <header className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                {todayLabel}
              </p>
              <SubscriptionSummaryCard />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1">
              {greeting},{" "}
              <span className="text-primary">{firstName}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Voici un aperçu de votre activité aujourd&apos;hui.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleStartOnboarding}
              variant="ghost"
              size="sm"
              className="h-9 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <Compass className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden xs:inline">Visite</span>
              <span className="inline xs:hidden">Aide</span>
            </Button>
            <Button
              data-tour="create-org"
              onClick={() => router.push("/core/dashboard/organizations/create")}
              size="sm"
              className="h-9 px-3 text-xs font-medium"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Nouvelle organisation
            </Button>
          </div>
        </div>

        {/* KPI pills — visible quand l'utilisateur a au moins une donnée */}
        {totalAll > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <KpiPill
              icon={Crown}
              label="Mes orgs"
              value={totalOrgs}
              tone="primary"
            />
            <KpiPill
              icon={Users}
              label="Membre de"
              value={myMemberships.length}
              tone="violet"
            />
            <KpiPill
              icon={Blocks}
              label="Modules"
              value={totalModules}
              tone="emerald"
            />
            <KpiPill
              icon={Mail}
              label="Invitations"
              value={invitations.length}
              tone={invitations.length > 0 ? "amber" : "primary"}
            />
          </div>
        )}
      </header>

      {/* Onboarding — visite guidée (spotlight + blur) */}
      {showOnboarding && (
        <GuidedTour
          firstName={user?.first_name ?? ""}
          onFinish={handleDismissOnboarding}
          steps={[
            {
              target: "create-org",
              icon: Building2,
              title: "Créez votre première organisation",
              description:
                "Cliquez sur le bouton mis en évidence pour démarrer. C'est l'espace de travail principal de votre équipe.",
              cta: {
                label: "Créer maintenant",
                onClick: () =>
                  router.push(
                    `${siteConfig.core.dashboard.organizations.create}?onboarding=1`
                  ),
              },
              placement: "bottom",
            },
            {
              target: "manage-orgs",
              icon: UserPlus,
              title: "Gérez vos espaces et membres",
              description:
                "Depuis cette section, gérez vos organisations, invitez des collaborateurs et attribuez-leur des rôles.",
              placement: "bottom",
            },
            {
              target: "memberships-section",
              icon: Palette,
              title: "Suivez vos collaborations",
              description:
                "Vous retrouverez ici les organisations qui vous invitent à collaborer. Personnalisez ensuite votre branding depuis chaque espace.",
              placement: "top",
            },
          ]}
        />
      )}

      {/* Section : Invitations en attente (PRIORITÉ — placée en premier) */}
      {!isInvitationsLoading && invitations.length > 0 && (
        <div className="space-y-3">
          <SectionHeader
            icon={Mail}
            label="Invitations en attente"
            count={invitations.length}
          />

          <Card className="overflow-hidden border-amber-200/60 bg-amber-50/30 divide-y divide-amber-200/40">
            {invitations.map((invitation) => (
              <InvitationRow
                key={invitation.id}
                invitation={invitation}
                onAccept={() => handleAcceptInvitation(invitation.id)}
                onDecline={() => handleDeclineInvitation(invitation.id)}
                isAccepting={acceptInvitation.isPending}
                isDeclining={declineInvitation.isPending}
              />
            ))}
          </Card>
        </div>
      )}

      {/* Section : Mes organisations (owned) */}
      <div className="space-y-3">
        <SectionHeader
          icon={Crown}
          label="Mes organisations"
          count={totalOrgs}
          action={
            totalOrgs > 0 && (
              <Button
                data-tour="manage-orgs"
                onClick={() => router.push("/core/dashboard/organizations")}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-primary"
              >
                Tout gérer
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )
          }
        />
        {displayOrgs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {displayOrgs.map((org) => (
                <OwnedOrgCard
                  key={org.id}
                  org={org}
                  onClick={() => router.push(`/organisation/${org.id}/dashboard`)}
                />
              ))}
            </div>
            {totalOrgs > 5 && (
              <button
                onClick={() => router.push("/core/dashboard/organizations")}
                className="w-full p-3 flex items-center justify-center gap-1.5 hover:bg-muted/40 transition-colors rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-primary"
              >
                Afficher les {totalOrgs} organisations
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </>
        ) : (
          <Card className="overflow-hidden bg-muted/20 border-dashed">
            <EmptyState
              icon={Building2}
              title="Démarrez avec votre premier espace"
              description="Une organisation, c'est l'espace de travail principal de votre équipe : RH, stocks, services."
              action={
                <Button
                  onClick={() => router.push("/core/dashboard/organizations/create")}
                  size="sm"
                  className="h-9 text-xs font-medium"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Créer une organisation
                </Button>
              }
            />
          </Card>
        )}
      </div>

      {/* Section : Organisations membre — masquée si vide (réduit le bruit) */}
      {(isMembershipsLoading || myMemberships.length > 0) && (
        <div className="space-y-3" data-tour="memberships-section">
          <SectionHeader
            icon={Users}
            label="Organisations membre"
            count={myMemberships.length}
          />

          {isMembershipsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-muted animate-pulse" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {myMemberships.map((membership) => (
                <MemberOrgCard
                  key={membership.id}
                  membership={membership}
                  onClick={() => router.push(`/organisation/${membership.organization.id}/dashboard`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  );
}