'use client';

import { Alert, Button } from '@/components/ui';
import Logo from '@/components/ui/Logo';
import { ApiError } from '@/lib/api/client';
import { siteConfig } from '@/lib/config';
import { useResendVerification, useVerifyEmail } from '@/lib/hooks';
import { ArrowRight, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

type Status = 'pending' | 'success' | 'expired' | 'invalid' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<Status>('pending');
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const triggered = useRef(false);

  const { mutateAsync: verify } = useVerifyEmail();
  const { mutateAsync: resend, isPending: isResending } =
    useResendVerification();

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;

    if (!token) {
      setStatus('invalid');
      return;
    }

    (async () => {
      try {
        const response = await verify(token);
        setVerifiedEmail(response.data.user.email);
        setStatus('success');
      } catch (err) {
        if (err instanceof ApiError) {
          const code = (err.data as { code?: string } | undefined)?.code;
          if (code === 'token_expired') setStatus('expired');
          else if (code === 'token_invalid') setStatus('invalid');
          else setStatus('error');
        } else {
          setStatus('error');
        }
      }
    })();
  }, [token, verify]);

  const handleResend = async () => {
    if (!verifiedEmail) return;
    try {
      await resend(verifiedEmail);
    } catch {
      // L'erreur n'est pas critique : la réponse backend est neutre.
    }
  };

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

          <div className="bg-card border border-border p-8 space-y-6">
            {status === 'pending' && (
              <div className="flex flex-col items-center text-center space-y-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <h1 className="text-lg font-semibold tracking-tight">
                  Vérification en cours...
                </h1>
                <p className="text-sm text-muted-foreground">
                  Merci de patienter quelques instants.
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Adresse email confirmée
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {verifiedEmail ? (
                    <>
                      L'adresse{' '}
                      <span className="font-medium text-foreground">
                        {verifiedEmail}
                      </span>{' '}
                      est désormais vérifiée. Vous pouvez vous connecter.
                    </>
                  ) : (
                    'Votre adresse email est désormais vérifiée. Vous pouvez vous connecter.'
                  )}
                </p>
                <Link
                  href={siteConfig.auth.login}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline underline-offset-4"
                >
                  Aller à la connexion
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {(status === 'expired' || status === 'invalid' || status === 'error') && (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-destructive" />
                </div>
                <h1 className="text-xl font-semibold tracking-tight">
                  {status === 'expired'
                    ? 'Lien expiré'
                    : status === 'invalid'
                      ? 'Lien invalide'
                      : 'Vérification impossible'}
                </h1>
                <Alert variant="destructive">
                  {status === 'expired'
                    ? "Ce lien a dépassé sa durée de validité (24h). Demandez-en un nouveau depuis la page de connexion."
                    : status === 'invalid'
                      ? "Ce lien est invalide ou a déjà été utilisé. Si votre compte n'est pas encore vérifié, demandez un nouvel email."
                      : "Une erreur est survenue. Veuillez réessayer dans quelques instants."}
                </Alert>

                {verifiedEmail && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11"
                    onClick={handleResend}
                    disabled={isResending}
                  >
                    {isResending ? 'Envoi...' : 'Renvoyer un lien'}
                  </Button>
                )}

                <Link
                  href={siteConfig.auth.login}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Retour à la connexion
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
