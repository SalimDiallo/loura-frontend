'use client';

import {
    Alert,
    Button,
    Form,
    FormEmailField,
} from '@/components/ui';
import Logo from '@/components/ui/Logo';
import { siteConfig } from '@/lib/config';
import { useForgotPassword, useZodForm } from '@/lib/hooks';
import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';

// Schéma de validation Zod
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email requis')
    .email('Adresse email invalide'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const forgotPasswordMutation = useForgotPassword();

  const form = useZodForm<ForgotPasswordFormData>({
    schema: forgotPasswordSchema,
    defaultValues: { email: '' },
  });

  const onSubmit = form.handleSubmit(async (data: ForgotPasswordFormData) => {
    try {
      await forgotPasswordMutation.mutateAsync(data.email);
      // Réponse backend volontairement neutre (200 même si l'email
      // n'existe pas) pour éviter l'énumération des comptes. On affiche
      // donc systématiquement le même état "demande envoyée".
      setSubmittedEmail(data.email);
    } catch (err) {
      console.error('Forgot password error:', err);
    }
  });

  return (
    <div className="min-h-screen flex bg-background relative">
      <Link
        href={siteConfig.auth.login}
        className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border bg-background/80 backdrop-blur-sm hover:bg-secondary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Connexion
      </Link>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center">
            <Logo
              showTitle
              className="flex items-center justify-center gap-2 mb-3"
            />
            <p className="text-muted-foreground text-sm">
              Réinitialiser votre mot de passe
            </p>
          </div>

          {submittedEmail ? (
            <div className="bg-card border border-border p-8 space-y-5 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h1 className="text-lg font-semibold tracking-tight">
                Demande envoyée
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Si un compte existe pour{' '}
                <span className="font-medium text-foreground">
                  {submittedEmail}
                </span>
                , un email contenant un lien de réinitialisation vient
                d'être envoyé. Le lien expire dans 1 heure.
              </p>
              <p className="text-xs text-muted-foreground">
                Vérifiez vos spams si vous ne recevez rien dans les
                prochaines minutes.
              </p>
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => setSubmittedEmail(null)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Renvoyer un lien
                </button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-5">
                <Alert>
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">
                    Saisissez l'adresse email associée à votre compte.
                    Nous vous enverrons un lien pour choisir un nouveau
                    mot de passe.
                  </span>
                </Alert>

                {forgotPasswordMutation.isError && (
                  <Alert variant="destructive">
                    Une erreur est survenue. Veuillez réessayer dans
                    quelques instants.
                  </Alert>
                )}

                <FormEmailField
                  name="email"
                  label="Email"
                  placeholder="vous@exemple.com"
                  required
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium group"
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-background/30 border-t-background animate-spin" />
                      Envoi en cours...
                    </div>
                  ) : (
                    <>
                      Envoyer le lien
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
          </div>

          <Link
            href={siteConfig.auth.login}
            className="flex items-center justify-center w-full h-11 border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            Retour à la connexion
          </Link>

          <div className="mt-10 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} LouraTech. Tous droits réservés.
          </div>
        </div>
      </div>
    </div>
  );
}
