'use client';

import {
    Alert,
    Button,
    Form,
    PasswordFieldWithToggle,
} from '@/components/ui';
import Logo from '@/components/ui/Logo';
import { ApiError } from '@/lib/api/client';
import { siteConfig } from '@/lib/config';
import { useResetPassword, useZodForm } from '@/lib/hooks';
import {
    ArrowRight,
    CheckCircle2,
    Loader2,
    ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { z } from 'zod';

// Schéma de validation Zod — règles alignées sur les validators Django.
const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Minimum 8 caractères')
      .max(128, 'Maximum 128 caractères'),
    new_password_confirm: z.string().min(1, 'Confirmation requise'),
  })
  .refine((data) => data.new_password === data.new_password_confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['new_password_confirm'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

type Status = 'form' | 'success' | 'token_expired' | 'token_invalid';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<Status>(token ? 'form' : 'token_invalid');
  const resetMutation = useResetPassword();

  const form = useZodForm<ResetPasswordFormData>({
    schema: resetPasswordSchema,
    defaultValues: { new_password: '', new_password_confirm: '' },
  });

  // Erreur "validation" remontée par le backend (HTTP 400 sur new_password
  // typiquement — ex. mot de passe trop simple selon les validators Django).
  const fieldError = useMemo<string | null>(() => {
    const err = resetMutation.error;
    if (!(err instanceof ApiError) || err.status !== 400) return null;
    const data = err.data as
      | {
          errors?: { new_password?: string[]; non_field_errors?: string[] };
          message?: string;
        }
      | undefined;
    const pwdErrors = data?.errors?.new_password;
    if (pwdErrors && pwdErrors.length > 0) return pwdErrors[0];
    const nonField = data?.errors?.non_field_errors;
    if (nonField && nonField.length > 0) return nonField[0];
    return null;
  }, [resetMutation.error]);

  const onSubmit = form.handleSubmit(async (data: ResetPasswordFormData) => {
    try {
      await resetMutation.mutateAsync({
        token,
        new_password: data.new_password,
        new_password_confirm: data.new_password_confirm,
      });
      setStatus('success');
      // Redirection automatique vers la page de connexion après 3s.
      setTimeout(() => router.push(siteConfig.auth.login), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        const code = (err.data as { code?: string } | undefined)?.code;
        if (code === 'token_expired') setStatus('token_expired');
        else if (code === 'token_invalid' || code === 'account_disabled') {
          setStatus('token_invalid');
        }
        // sinon : on reste sur "form" et on affiche l'erreur via fieldError.
      }
      console.error('Reset password error:', err);
    }
  });

  return (
    <div className="min-h-screen flex bg-background relative">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center">
            <Logo
              showTitle
              className="flex items-center justify-center gap-2 mb-3"
            />
            <p className="text-muted-foreground text-sm">
              Choisissez un nouveau mot de passe
            </p>
          </div>

          {status === 'success' && (
            <div className="bg-card border border-border p-8 space-y-5 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight">
                Mot de passe mis à jour
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Votre mot de passe a été réinitialisé avec succès. Vous
                allez être redirigé vers la page de connexion...
              </p>
              <div className="pt-2">
                <Link
                  href={siteConfig.auth.login}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline underline-offset-4"
                >
                  Aller à la connexion
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {(status === 'token_expired' || status === 'token_invalid') && (
            <div className="bg-card border border-border p-8 space-y-5 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-destructive" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight">
                {status === 'token_expired' ? 'Lien expiré' : 'Lien invalide'}
              </h1>
              <Alert variant="destructive">
                {status === 'token_expired'
                  ? "Ce lien a dépassé sa durée de validité (1h). Demandez-en un nouveau."
                  : "Ce lien est invalide ou a déjà été utilisé. Demandez un nouveau lien si nécessaire."}
              </Alert>
              <div className="pt-2 space-y-3">
                <Link
                  href={siteConfig.auth.forgotPassword}
                  className="flex items-center justify-center w-full h-11 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  Demander un nouveau lien
                </Link>
                <Link
                  href={siteConfig.auth.login}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Retour à la connexion
                </Link>
              </div>
            </div>
          )}

          {status === 'form' && (
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-5">
                {fieldError && (
                  <Alert variant="destructive">{fieldError}</Alert>
                )}

                {resetMutation.isError && !fieldError && (
                  <Alert variant="destructive">
                    Une erreur est survenue. Veuillez réessayer.
                  </Alert>
                )}

                <PasswordFieldWithToggle
                  name="new_password"
                  label="Nouveau mot de passe"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />

                <PasswordFieldWithToggle
                  name="new_password_confirm"
                  label="Confirmer le mot de passe"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Minimum 8 caractères. Évitez les mots de passe courants
                  ou similaires à votre adresse email.
                </p>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium group"
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mise à jour...
                    </div>
                  ) : (
                    <>
                      Réinitialiser
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

                <Link
                  href={siteConfig.auth.login}
                  className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Retour à la connexion
                </Link>
              </form>
            </Form>
          )}

          <div className="mt-10 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} LouraTech. Tous droits réservés.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
