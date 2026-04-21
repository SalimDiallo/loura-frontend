"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/hooks/auth/useCurrentUser";
import { useOrganizations } from "@/lib/hooks/core";
import { useAcceptInvitation, useDeclineInvitation, useMyMemberships, usePendingInvitations } from "@/lib/hooks/hr";
import type { Invitation, MyMembership } from "@/lib/types";
import type { Organization } from "@/lib/types/core";
import { cn } from "@/lib/utils";
import {
    Building2,
    Check,
    Crown,
    Mail,
    Plus,
    Shield,
    Users,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

// ============================================================================
// ORGANIZATION CARD (OWNED)
// ============================================================================

function OwnedOrgCard({ org, onClick }: { org: Organization; onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer transition-shadow hover:shadow-lg p-0 overflow-hidden flex flex-col border border-muted hover:border-primary"
    >
      <div className="flex items-center gap-3 p-4">
        <div className="h-12 w-12 shrink-0 rounded-lg bg-primary/8 flex items-center justify-center overflow-hidden transition-colors group-hover:bg-primary/12">
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
            <h3 className="font-medium text-base text-foreground truncate group-hover:text-primary transition-colors">
              {org.name}
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-px rounded text-[9px] uppercase font-bold tracking-wider shrink-0",
                org.is_active
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "h-1 w-1 rounded-full",
                  org.is_active ? "bg-emerald-500" : "bg-muted-foreground/50"
                )}
              />
              {org.is_active ? "Actif" : "Inactif"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {org.category && (
              <span className="text-[10px] text-muted-foreground font-medium">
                {org.category.name}
              </span>
            )}
            {org.category && org.country && (
              <span className="text-muted-foreground/40">·</span>
            )}
            {org.country && (
              <span className="text-[10px] text-muted-foreground">{org.country}</span>
            )}
          </div>
        </div>
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
      className="group cursor-pointer transition-shadow hover:shadow-lg p-0 overflow-hidden flex flex-col border border-muted hover:border-violet-500"
    >
      <div className="flex items-center gap-3 p-4">
        <div className="h-12 w-12 shrink-0 rounded-lg bg-violet-500/8 flex items-center justify-center overflow-hidden transition-colors group-hover:bg-violet-500/12">
          {membership.organization.logo ? (
            <img src={membership.organization.logo} alt={membership.organization.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-violet-600 font-bold text-[14px] tracking-wide">
              {getInitials(membership.organization.name)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-base text-foreground truncate group-hover:text-violet-600 transition-colors">
              {membership.organization.name}
            </h3>
            {membership.role && (
              <span className="inline-flex items-center px-1.5 py-px rounded text-[9px] font-semibold tracking-wide bg-violet-500/10 text-violet-600 shrink-0">
                {membership.role.name}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Rejoint le {new Date(membership.joined_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ============================================================================
// INVITATION ROW WITH DIALOG CONFIRMATION (Pas touché, reste ligne basée)
// ============================================================================

function InvitationRowWithConfirmDialog({
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
  const [openAcceptDialog, setOpenAcceptDialog] = useState(false);
  const [openDeclineDialog, setOpenDeclineDialog] = useState(false);
  const isProcessing = isAccepting || isDeclining;

  return (
    <div className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-blue-500/8 flex items-center justify-center overflow-hidden">
          <Mail className="h-4 w-4 text-blue-600" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm text-foreground truncate">
              {invitation.organization?.name || "Organisation"}
            </h3>
            {invitation.role && (
              <span className="inline-flex items-center gap-1 px-1.5 py-px rounded text-[9px] font-semibold tracking-wide bg-blue-500/10 text-blue-600 shrink-0">
                <Shield className="h-2.5 w-2.5" />
                {invitation.role.name}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Invitation reçue le{" "}
            {new Date(invitation.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        {/* Accept Button + Dialog */}
        <Dialog open={openAcceptDialog} onOpenChange={setOpenAcceptDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setOpenAcceptDialog(true)}
              disabled={isProcessing}
              size="sm"
              variant="default"
              className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
            >
              {isAccepting ? (
                <>Acceptation...</>
              ) : (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Accepter
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer l'acceptation</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir accepter l'invitation pour <span className="font-medium">{invitation.organization?.name}</span> ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenAcceptDialog(false)}
                className="mr-2"
              >
                Annuler
              </Button>
              <Button
                disabled={isProcessing}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  onAccept();
                  setOpenAcceptDialog(false);
                }}
              >
                Confirmer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Decline Button + Dialog */}
        <Dialog open={openDeclineDialog} onOpenChange={setOpenDeclineDialog}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setOpenDeclineDialog(true)}
              disabled={isProcessing}
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs"
            >
              {isDeclining ? (
                <>Refus...</>
              ) : (
                <>
                  <X className="h-3 w-3 mr-1" />
                  Refuser
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer le refus</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir refuser l'invitation pour <span className="font-medium">{invitation.organization?.name}</span> ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenDeclineDialog(false)}
                className="mr-2"
              >
                Annuler
              </Button>
              <Button
                disabled={isProcessing}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  onDecline();
                  setOpenDeclineDialog(false);
                }}
              >
                Confirmer
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

export default function DashboardPage() {
  const router = useRouter();
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

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Bonjour, {userName}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {totalAll} organisation{totalAll !== 1 ? "s" : ""} au total
          {totalOrgs > 0 && myMemberships.length > 0 && (
            <span className="text-muted-foreground/60">
              {" "}— {totalOrgs} créée{totalOrgs !== 1 ? "s" : ""}, {myMemberships.length} en tant que membre
            </span>
          )}
        </p>
      </div>

      {/* Section 1: Mes organisations (owned) */}
      <div className="space-y-3">
        <SectionHeader
          icon={Crown}
          label="Mes organisations"
          count={totalOrgs}
          action={
            <div className="flex gap-2">
              <Button
                onClick={() => router.push("/core/dashboard/organizations")}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs font-semibold hover:text-primary hover:bg-primary/10 transition-colors"
              >
                Gérer
              </Button>
              <Button
                onClick={() => router.push("/core/dashboard/organizations/create")}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs font-semibold hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus className="h-3 w-3 mr-1" />
                Créer
              </Button>
            </div>
          }
        />
        {displayOrgs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {displayOrgs.map((org) => (
                <OwnedOrgCard
                  key={org.id}
                  org={org}
                  onClick={() => window.open(`/organisation/${org.id}/dashboard`, '_blank')}
                />
              ))}
            </div>
            {/* "View all" */}
            {totalOrgs > 5 && (
              <div
                className="p-3 flex justify-center hover:bg-muted/20 transition-colors cursor-pointer rounded"
                onClick={() => router.push("/core/dashboard/organizations")}
              >
                <span className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                  Afficher tout ({totalOrgs}) &rarr;
                </span>
              </div>
            )}
          </>
        ) : (
          <Card className="overflow-hidden bg-muted/30">
            <EmptyState
              icon={Building2}
              title="Aucune organisation"
              description="Créez votre premier espace de travail pour commencer."
              action={
                <Button
                  onClick={() => router.push("/core/dashboard/organizations/create")}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-medium"
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  Créer une organisation
                </Button>
              }
            />
          </Card>
        )}
      </div>

      {/* Section 2: Invitations en attente */}
      {!isInvitationsLoading && invitations.length > 0 && (
        <div className="space-y-3">
          <SectionHeader
            icon={Mail}
            label="Invitations en attente"
            count={invitations.length}
          />

          <Card className="overflow-hidden bg-muted/30">
            <div>
              {invitations.map((invitation) => (
                <InvitationRowWithConfirmDialog
                  key={invitation.id}
                  invitation={invitation}
                  onAccept={() => handleAcceptInvitation(invitation.id)}
                  onDecline={() => handleDeclineInvitation(invitation.id)}
                  isAccepting={acceptInvitation.isPending}
                  isDeclining={declineInvitation.isPending}
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Section 3: Organisations membre */}
      <div className="space-y-3">
        <SectionHeader
          icon={Users}
          label="Organisations membre"
          count={myMemberships.length}
        />

        {isMembershipsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
        ) : myMemberships.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {myMemberships.map((membership) => (
              <MemberOrgCard
                key={membership.id}
                membership={membership}
                onClick={() => window.open(`/organisation/${membership.organization.id}/dashboard`, '_blank')}
              />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden bg-muted/30">
            <EmptyState
              icon={Users}
              title="Aucune organisation"
              description="Vous n'êtes membre d'aucune organisation pour le moment."
            />
          </Card>
        )}
      </div>
    </div>
  );
}