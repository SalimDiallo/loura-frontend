'use client';

import {
    Alert,
    Button,
    Form,
    FormEmailField,
    PasswordFieldWithToggle,
} from '@/components/ui';
import Logo from '@/components/ui/Logo';
import { ApiError } from '@/lib/api/client';
import { siteConfig } from '@/lib/config';
import { useAuth, useUser, useZodForm } from '@/lib/hooks';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { z } from 'zod';

// Schéma de validation Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { login, isLoginPending, loginError } = useAuth();
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

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

  const form = useZodForm<LoginFormData>({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const getRedirectUrl = useCallback((): string => {
    // Si une URL de redirection personnalisée est fournie, l'utiliser
    if (redirectUrl) {
      return redirectUrl;
    }

    return siteConfig.core.dashboard.home;
  }, [redirectUrl]);

  // Redirection automatique si l'utilisateur est déjà connecté
  useEffect(() => {
    // Vérifier que l'utilisateur existe ET qu'il y a des tokens valides
    if (user?.id && user.user_type) {
      // Vérifier si on a des tokens dans localStorage
      const hasTokens =
        typeof window !== 'undefined' &&
        localStorage.getItem('loura_access_token') &&
        localStorage.getItem('loura_refresh_token');

      if (hasTokens) {
        const destination = getRedirectUrl();
        router.push(destination);
      }
    }
  }, [user, router, getRedirectUrl]);

  const onSubmit = form.handleSubmit(async (data: LoginFormData) => {
    try {
      const destination = getRedirectUrl();
      await login(data, destination);
    } catch (err) {
      // Les erreurs sont gérées par le hook useAuth
      console.error('Login error:', err);
    }
  });

  return (
    <div className="min-h-screen flex bg-background relative">
      {/* Bouton Retour */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border border-border bg-background/80 backdrop-blur-sm hover:bg-secondary transition-colors"
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

              {loginError && (
                <Alert variant="destructive">
                  {loginError instanceof ApiError && loginError.status === 401
                    ? 'Identifiants incorrects'
                    : loginError instanceof ApiError && loginError.status === 403
                      ? 'Compte désactivé. Contactez votre administrateur.'
                      : 'Une erreur est survenue lors de la connexion'}
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
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-muted-foreground">Se souvenir</span>
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
                disabled={isLoginPending}
              >
                {isLoginPending ? (
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
          <p className="mt-10 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} LouraTech. Tous droits réservés.
          </p>
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
