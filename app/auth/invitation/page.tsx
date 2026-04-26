'use client';

import { Alert, Button } from '@/components/ui';
import Logo from '@/components/ui/Logo';
import { ApiError } from '@/lib/api/client';
import { siteConfig } from '@/lib/config';
import { useUser } from '@/lib/hooks';
import {
  useAcceptInvitationByToken,
  useInvitationByToken,
} from '@/lib/hooks/hr';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  LogIn,
  ShieldAlert,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function InvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const { user, isLoading: isUserLoading } = useUser();

  const {
    data: invitation,
    isLoading,
    error,
  } = useInvitationByToken(token);

  const acceptMutation = useAcceptInvitationByToken();
  const [acceptedOrgName, setAcceptedOrgName] = useState<string | null>(null);

  // ─── Erreurs amont ─────────────────────────────────────────────────────────

  if (!token) {
    return (
      <ErrorCard
        title="Lien invalide"
        message="Aucun token n'a été fourni. Vérifiez le lien reçu par email."
      />
    );
  }

  if (isLoading || isUserLoading) {
    return (
      <CenteredCard>
        <div className="flex flex-col items-center text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            Chargement de l'invitation...
          </p>
        </div>
      </CenteredCard>
    );
  }

  if (error) {
    const status =
      error instanceof ApiError ? error.status : null;
    return (
      <ErrorCard
        title={status === 404 ? 'Invitation introuvable' : 'Erreur'}
        message={
          status === 404
            ? "Ce lien n'est plus valide ou l'invitation a été supprimée."
            : 'Impossible de charger cette invitation. Réessayez plus tard.'
        }
      />
    );
  }

  if (!invitation) {
    return null;
  }

  // ─── Confirmation post-acceptation ─────────────────────────────────────────

  if (acceptedOrgName) {
    return (
      <CenteredCard>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Bienvenue dans {acceptedOrgName}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Votre adhésion est enregistrée. Vous pouvez accéder à votre
            tableau de bord pour démarrer.
          </p>
          <Button
            type="button"
            className="w-full h-11"
            onClick={() => router.replace('/core/dashboard')}
          >
            <span className="inline-flex items-center gap-2">
              Aller au tableau de bord
              <ArrowRight className="w-4 h-4" />
            </span>
          </Button>
        </div>
      </CenteredCard>
    );
  }

  // ─── Statuts non utilisables ───────────────────────────────────────────────

  if (invitation.status === 'accepted') {
    return (
      <ErrorCard
        title="Invitation déjà acceptée"
        message={`Vous avez déjà rejoint ${invitation.organization.name}.`}
        ctaLabel="Aller au tableau de bord"
        ctaHref="/core/dashboard"
      />
    );
  }

  if (invitation.status === 'declined') {
    return (
      <ErrorCard
        title="Invitation refusée"
        message="Cette invitation a été déclinée. Demandez à l'inviteur de vous renvoyer un nouveau lien si besoin."
      />
    );
  }

  if (invitation.status === 'expired' || invitation.is_expired) {
    return (
      <ErrorCard
        title="Lien expiré"
        message={`Cette invitation a dépassé sa durée de validité (jusqu'au ${new Date(
          invitation.expires_at,
        ).toLocaleDateString('fr-FR')}). Demandez à ${invitation.invited_by.first_name || invitation.invited_by.email} de vous en envoyer une nouvelle.`}
        icon={Clock}
      />
    );
  }

  // ─── Cas principal : invitation pending ────────────────────────────────────

  const inviterName =
    [invitation.invited_by.first_name, invitation.invited_by.last_name]
      .filter(Boolean)
      .join(' ') || invitation.invited_by.email;

  const isLoggedIn = Boolean(user);
  const emailMatches =
    isLoggedIn && user!.email.toLowerCase() === invitation.email.toLowerCase();

  const handleAccept = async () => {
    try {
      const response = await acceptMutation.mutateAsync(token);
      setAcceptedOrgName(response.data.organization.name);
    } catch {
      // Affiché via acceptMutation.error
    }
  };

  const acceptApiError = acceptMutation.error;
  const acceptErrorCode =
    acceptApiError instanceof ApiError
      ? (acceptApiError.data as { code?: string } | undefined)?.code
      : undefined;

  return (
    <CenteredCard>
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Rejoindre {invitation.organization.name}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">{inviterName}</span>{' '}
            vous invite à collaborer sur{' '}
            <span className="font-medium text-foreground">
              {invitation.organization.name}
            </span>
            .
          </p>
        </div>

        <div className="bg-muted/30 border border-border p-4 space-y-2">
          <DetailRow label="Adresse invitée" value={invitation.email} />
          {invitation.role && (
            <DetailRow label="Rôle" value={invitation.role.name} />
          )}
          {invitation.position && (
            <DetailRow label="Poste" value={invitation.position.name} />
          )}
          {invitation.department && (
            <DetailRow label="Département" value={invitation.department.name} />
          )}
          <DetailRow
            label="Expire le"
            value={new Date(invitation.expires_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          />
        </div>

        {acceptApiError && acceptErrorCode === 'email_mismatch' && (
          <Alert variant="destructive">
            Cette invitation est destinée à{' '}
            <span className="font-medium">{invitation.email}</span>.
            Déconnectez-vous puis reconnectez-vous avec cette adresse pour
            l'accepter.
          </Alert>
        )}

        {acceptApiError &&
          acceptErrorCode !== 'email_mismatch' && (
            <Alert variant="destructive">
              {acceptErrorCode === 'expired'
                ? 'Cette invitation a expiré entre temps. Demandez-en une nouvelle.'
                : "Impossible d'accepter l'invitation pour le moment. Réessayez plus tard."}
            </Alert>
          )}

        {/* CTA principal : dépend de l'état de l'utilisateur */}
        {isLoggedIn && emailMatches && (
          <Button
            type="button"
            className="w-full h-11"
            disabled={acceptMutation.isPending}
            onClick={handleAccept}
          >
            {acceptMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Acceptation...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                Accepter l'invitation
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        )}

        {isLoggedIn && !emailMatches && (
          <Alert variant="destructive" className="space-y-2">
            <p>
              Vous êtes connecté avec{' '}
              <span className="font-medium">{user!.email}</span>, mais cette
              invitation est destinée à{' '}
              <span className="font-medium">{invitation.email}</span>.
            </p>
            <Link
              href={`${siteConfig.auth.logout}?redirect=${encodeURIComponent(
                `/auth/invitation?token=${token}`,
              )}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:underline underline-offset-4"
            >
              Se déconnecter
              <ArrowRight className="w-3 h-3" />
            </Link>
          </Alert>
        )}

        {!isLoggedIn && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Pour accepter, connectez-vous avec l'adresse{' '}
              <span className="font-medium text-foreground">
                {invitation.email}
              </span>{' '}
              ou créez un compte.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`${siteConfig.auth.login}?email=${encodeURIComponent(
                  invitation.email,
                )}&redirect=${encodeURIComponent(
                  `/auth/invitation?token=${token}`,
                )}`}
                className="inline-flex items-center justify-center gap-2 h-11 border border-border bg-background hover:bg-muted text-sm font-medium transition-colors"
              >
                <LogIn className="w-4 h-4" />
                J'ai un compte
              </Link>
              <Link
                href={`${siteConfig.auth.register}?email=${encodeURIComponent(
                  invitation.email,
                )}&redirect=${encodeURIComponent(
                  `/auth/invitation?token=${token}`,
                )}`}
                className="inline-flex items-center justify-center gap-2 h-11 bg-foreground text-background hover:bg-foreground/90 text-sm font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Créer un compte
              </Link>
            </div>
          </div>
        )}
      </div>
    </CenteredCard>
  );
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background relative">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <Logo
              showTitle
              className="flex items-center justify-center gap-2 mb-3"
            />
          </div>
          <div className="bg-card border border-border p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-xs flex items-baseline gap-3">
      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="font-medium text-foreground break-all">{value}</span>
    </p>
  );
}

function ErrorCard({
  title,
  message,
  icon: Icon = ShieldAlert,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  message: string;
  icon?: React.ComponentType<{ className?: string }>;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <CenteredCard>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <Alert variant="destructive">{message}</Alert>
        {ctaHref && ctaLabel ? (
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline underline-offset-4"
          >
            {ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href={siteConfig.auth.login}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Retour à la connexion
          </Link>
        )}
      </div>
    </CenteredCard>
  );
}

export default function InvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <InvitationContent />
    </Suspense>
  );
}
