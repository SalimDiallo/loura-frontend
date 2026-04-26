'use client';

import {
    Alert,
    Button,
    Form,
    FormEmailField,
    PasswordFieldWithToggle,
} from '@/components/ui';
import Logo from '@/components/ui/Logo';
import { ApiError, tokenManager } from '@/lib/api/client';
import { siteConfig } from '@/lib/config';
import { useLogin, useResendVerification, useUser, useZodForm } from '@/lib/hooks';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

// Schéma de validation Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
  remember_me: z.boolean().optional().default(true),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const loginMutation = useLogin();
  const resendMutation = useResendVerification();
  const [resendSuccess, setResendSuccess] = useState(false);

  // Détecte un échec de login pour cause d'email non vérifié (HTTP 403 +
  // payload `{ code: 'email_not_verified', email }` côté backend).
  const unverifiedEmail = useMemo<string | null>(() => {
    const err = loginMutation.error;
    if (!(err instanceof ApiError) || err.status !== 403) return null;
    const data = err.data as { code?: string; email?: string } | undefined;
    return data?.code === 'email_not_verified' && data.email ? data.email : null;
  }, [loginMutation.error]);

  const handleResendVerification = useCallback(async () => {
    if (!unverifiedEmail) return;
    try {
      await resendMutation.mutateAsync(unverifiedEmail);
      setResendSuccess(true);
    } catch {
      setResendSuccess(false);
    }
  }, [resendMutation, unverifiedEmail]);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setInfoMessage(decodeURIComponent(message));
    }

    const redirect = searchParams.get('redirect');
    if (redirect) {
      setRedirectUrl(decodeURIComponent(redirect));
    }
  }, [searchParams]);

  // Email éventuellement passé via `?email=...` (typiquement depuis la page
  // d'invitation). Capturé une seule fois au mount pour pouvoir le passer
  // comme valeur initiale du formulaire.
  const prefilledEmail = searchParams.get('email') ?? '';

  const form = useZodForm<LoginFormData>({
    schema: loginSchema,
    defaultValues: {
      email: prefilledEmail,
      password: '',
      remember_me: true,
    },
  });

  const getRedirectUrl = useCallback((): string => {
    if (redirectUrl) {
      return redirectUrl;
    }

    return siteConfig.core.dashboard.home;
  }, [redirectUrl]);

  // Redirection automatique si l'utilisateur est déjà connecté
  useEffect(() => {
    if (user?.id) {
      // Vérifie les tokens via tokenManager pour respecter le storage
      // choisi via "Se souvenir de moi" (localStorage ou sessionStorage).
      const hasTokens =
        !!tokenManager.getAccessToken() &&
        !!tokenManager.getRefreshToken();

      if (hasTokens) {
        const destination = getRedirectUrl();
        router.push(destination);
      }
    }
  }, [user, router, getRedirectUrl]);

  const onSubmit = form.handleSubmit(async (data: LoginFormData) => {
    try {
      const destination = getRedirectUrl();
      await loginMutation.mutateAsync(data);
      router.push(destination);
    } catch (err) {
      // Les erreurs sont gérées par le hook useLogin
      console.error('Login error:', err);
    }
  });

  return (
    <div className="min-h-screen flex bg-background relative">
      {/* Bouton Retour */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border bg-background/80 backdrop-blur-sm hover:bg-secondary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Accueil
      </Link>
      {/* Formulaire centré */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-10 text-center">
            <Logo
              showTitle={true}
              className="flex items-center justify-center gap-2 mb-3"
            />
            <p className="text-muted-foreground text-sm">
              Connectez-vous à votre espace
            </p>
          </div>

          {/* Formulaire */}
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-5">
              {infoMessage && <Alert variant="destructive">{infoMessage}</Alert>}

              {loginMutation.isError && !unverifiedEmail && (
                <Alert variant="destructive">
                  {loginMutation.error instanceof ApiError && loginMutation.error.status === 401
                    ? 'Identifiants incorrects'
                    : loginMutation.error instanceof ApiError && loginMutation.error.status === 403
                    ? 'Compte désactivé. Contactez votre administrateur.'
                    : 'Une erreur est survenue lors de la connexion'}
                </Alert>
              )}

              {unverifiedEmail && (
                <Alert variant="destructive" className="space-y-3">
                  <p>
                    Votre adresse{' '}
                    <span className="font-medium">{unverifiedEmail}</span>{' '}
                    n'a pas encore été vérifiée. Cliquez sur le lien envoyé
                    par email pour activer votre compte.
                  </p>
                  {resendSuccess ? (
                    <p className="text-xs text-foreground/80">
                      Un nouveau lien vient d'être envoyé (vérifiez vos spams).
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendMutation.isPending}
                      className="inline-flex items-center gap-2 text-xs font-medium text-foreground hover:underline underline-offset-4 disabled:opacity-50"
                    >
                      {resendMutation.isPending
                        ? 'Envoi en cours...'
                        : "Renvoyer l'email de vérification"}
                    </button>
                  )}
                </Alert>
              )}

              <FormEmailField
                name="email"
                label="Email"
                placeholder="vous@exemple.com"
                required
              />

              <PasswordFieldWithToggle
                name="password"
                label="Mot de passe"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary focus:ring-primary"
                    {...form.register('remember_me')}
                  />
                  <span className="text-muted-foreground">Se souvenir de moi</span>
                </label>
                <Link
                  href={siteConfig.auth.forgotPassword}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium group"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-background/30 border-t-background animate-spin" />
                    Connexion...
                  </div>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Séparateur */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-background text-muted-foreground">
                Nouveau sur LouraTech ?
              </span>
            </div>
          </div>

          {/* Lien inscription */}
          <Link
            href={siteConfig.auth.register}
            className="flex items-center justify-center w-full h-11 border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            Créer un compte
          </Link>

          {/* Footer */}
          <div className="mt-10 space-y-3">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <Link
                href="/docs/legals/terms"
                className="hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                CGU
              </Link>
              <span>•</span>
              <Link
                href="/docs/legals/privacy"
                className="hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Confidentialité
              </Link>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} LouraTech. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
