'use client';

import { Alert, Button } from '@/components/ui';
import Logo from '@/components/ui/Logo';
import { siteConfig } from '@/lib/config';
import { useResendVerification } from '@/lib/hooks';
import { ArrowLeft, CheckCircle2, Mail, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function VerifyPendingContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [resentAt, setResentAt] = useState<number | null>(null);
  const { mutateAsync: resend, isPending, error } = useResendVerification();

  const handleResend = async () => {
    if (!email) return;
    try {
      await resend(email);
      setResentAt(Date.now());
    } catch {
      // Géré via `error` ci-dessous.
    }
  };

  return (
    <div className="min-h-screen flex bg-background relative">
      <Link
        href={siteConfig.auth.login}
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la connexion
      </Link>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <Logo
              showTitle
              className="flex items-center justify-center gap-2 mb-3"
            />
          </div>

          <div className="bg-card border border-border p-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight">
                Vérifiez votre boîte mail
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nous venons d'envoyer un lien de confirmation
                {email ? (
                  <>
                    {' à '}
                    <span className="font-medium text-foreground">{email}</span>
                  </>
                ) : (
                  ' à votre adresse email'
                )}
                . Cliquez sur le lien pour activer votre compte. Le lien
                expire au bout de 24h.
              </p>
            </div>

            {resentAt && (
              <Alert>
                <CheckCircle2 className="w-4 h-4" />
                Si un compte non vérifié existe pour cette adresse, un nouveau
                lien vient d'être envoyé.
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                Une erreur est survenue. Veuillez réessayer dans un instant.
              </Alert>
            )}

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={handleResend}
                disabled={!email || isPending}
              >
                {isPending ? (
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Renvoyer le lien
                  </span>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Mauvaise adresse ?{' '}
                <Link
                  href={siteConfig.auth.register}
                  className="font-medium text-foreground hover:underline underline-offset-2"
                >
                  Recommencer l'inscription
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Pas reçu d'email ? Vérifiez vos spams ou attendez quelques
            instants avant de demander un renvoi.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyPendingContent />
    </Suspense>
  );
}
