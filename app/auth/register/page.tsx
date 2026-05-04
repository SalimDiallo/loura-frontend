'use client';

import {
    Alert,
    Button,
    Form,
    FormEmailField,
    FormInputField,
    PasswordFieldWithToggle,
} from '@/components/ui';
import Logo from '@/components/ui/Logo';
import { siteConfig } from '@/lib/config';
import { useRegister, useUser, useZodForm } from '@/lib/hooks';
import {
    ArrowLeft,
    ArrowRight,
    BarChart3,
    Building2,
    Shield,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { z } from 'zod';

// ─── Validation schema ─────────────────────────────────────────────────────

const registerSchema = z
  .object({
    email: z.string().min(1, 'Email requis').email('Adresse email invalide'),
    first_name: z
      .string()
      .min(2, 'Le prénom doit contenir au moins 2 caractères')
      .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
    last_name: z
      .string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    password_confirm: z
      .string()
      .min(1, 'Veuillez confirmer votre mot de passe'),
    accept_terms: z.literal(true, {
      message:
        "Vous devez accepter les conditions d'utilisation et la politique de confidentialité.",
    }),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['password_confirm'],
  });

// ─── Sidebar content ───────────────────────────────────────────────────────

const features = [
  { icon: Building2, text: 'Multi-entreprises, multi-équipes' },
  { icon: Users, text: 'Gestion RH, ventes & inventaire' },
  { icon: BarChart3, text: 'Tableaux de bord en temps réel' },
  { icon: Shield, text: 'Sécurité et conformité RGPD' },
];

// ─── Password strength helper ──────────────────────────────────────────────

function getPasswordStrength(pwd: string): { score: number; label: string } {
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  if (!pwd) return { score: 0, label: '' };
  if (score <= 2) return { score, label: 'Faible' };
  if (score <= 3) return { score, label: 'Moyen' };
  if (score <= 4) return { score, label: 'Bon' };
  return { score, label: 'Excellent' };
}

// ─── Page ──────────────────────────────────────────────────────────────────

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [justRegistered, setJustRegistered] = useState(false);
  const {
    mutateAsync: register,
    isPending: isRegisterPending,
    error: registerError,
  } = useRegister();

  // Pré-remplissage depuis ?email=... (typiquement page d'invitation).
  const prefilledEmail = searchParams.get('email') ?? '';
  // Et URL de redirection éventuelle à passer après vérification d'email.
  const redirectAfterVerify = searchParams.get('redirect') ?? '';

  const form = useZodForm({
    schema: registerSchema,
    defaultValues: {
      email: prefilledEmail,
      first_name: '',
      last_name: '',
      password: '',
      password_confirm: '',
      accept_terms: false,
    },
  });

  const passwordValue = form.watch('password') || '';
  const strength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);

  // Si l'utilisateur est déjà connecté en arrivant ici (pas via register), on le redirige.
  // En revanche après un register fraîchement réussi, on laisse la nav vers /auth/welcome se faire.
  if (user?.id && !justRegistered) {
    router.push('/core/dashboard');
    return null;
  }

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      // Marque AVANT l'await pour neutraliser le guard dès le re-render qui suit la mise à jour du cache
      setJustRegistered(true);
      await register({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
        password_confirm: data.password_confirm,
      });
      // Le backend ne délivre PAS de tokens : on redirige vers la page d'attente
      // de vérification avec l'email en query pour que l'utilisateur puisse
      // demander un renvoi sans avoir à le retaper. Si un ``redirect`` était
      // présent (ex. invitation), on le propage afin que l'utilisateur soit
      // ramené sur la page d'origine après confirmation de son email.
      const params = new URLSearchParams({ email: data.email });
      if (redirectAfterVerify) {
        params.set('redirect', redirectAfterVerify);
      }
      router.replace(`${siteConfig.auth.verifyPending}?${params.toString()}`);
    } catch (err) {
      setJustRegistered(false);
      console.error('Registration error:', err);
    }
  });

  return (
    <div className="min-h-screen flex bg-white dark:bg-black transition-colors relative">
      {/* Bouton Retour */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Accueil
      </Link>

      {/* ─── Panneau gauche ─── */}
      {/* <aside className="hidden lg:flex lg:w-1/2 xl:w-[48%] bg-neutral-50 dark:bg-neutral-950 relative items-center justify-center transition-colors">
        <div className="w-full max-w-lg px-12 xl:px-16 flex flex-col justify-center py-16">
          <div className="mb-12">
            <Logo showTitle className="[&_h1]:text-black dark:[&_h1]:text-white" />
          </div>

          <h1 className="text-3xl xl:text-[34px] font-bold text-black dark:text-white leading-tight tracking-tight mb-5">
            Pilotez votre entreprise<br />avec sérénité.
          </h1>
          <p className="text-base text-neutral-600 dark:text-neutral-400 mb-12 leading-relaxed">
            Une plateforme unifiée pour vos opérations RH, vos ventes et votre
            stock — en quelques minutes seulement.
          </p>

          <ul className="space-y-4 mb-16">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-primary">
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                </span>
                <span className="text-[15px] text-neutral-800 dark:text-neutral-200">
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-6 flex items-center gap-6 text-xs text-neutral-500 dark:text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              SSL · Chiffrement bout-en-bout
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Conformité RGPD
            </span>
          </div>
        </div>
      </aside> */}

      {/* ─── Panneau droit — Formulaire ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 lg:px-12 bg-white dark:bg-black transition-colors">
        <div className="w-full max-w-md">
          {/* Header mobile */}
          <div className="lg:hidden mb-10 text-center">
            <Logo
              showTitle
              className="flex items-center justify-center gap-2 mb-6 [&_h1]:text-black dark:[&_h1]:text-white"
            />
          </div>

          {/* Titre */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white mb-2">
              Créer votre compte
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Quelques secondes suffisent. Aucune carte requise.
            </p>
          </div>

          {/* Formulaire */}
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-5">
              {registerError && (
                <Alert variant="destructive">
                  {
                     "Une erreur est survenue lors de l'inscription"}
                </Alert>
              )}

              {/* ─── Identité ─── */}
              <div className="space-y-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
                  Identité
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <FormInputField
                    name="first_name"
                    label="Prénom"
                    placeholder="Mohamed"
                    required
                  />
                  <FormInputField
                    name="last_name"
                    label="Nom"
                    placeholder="Diallo"
                    required
                  />
                </div>

                <FormEmailField
                  name="email"
                  label="Email"
                  placeholder="mohamed@gmail.com"
                  required
                />
              </div>

              {/* ─── Sécurité ─── */}
              <div className="space-y-4 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400 dark:text-neutral-500">
                  Sécurité
                </p>

                <PasswordFieldWithToggle
                  name="password"
                  label="Mot de passe"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />

                {/* Indicateur de force */}
                {passwordValue && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={
                            'h-1 flex-1 rounded-sm transition-colors ' +
                            (i <= strength.score
                              ? strength.score <= 2
                                ? 'bg-red-500'
                                : strength.score <= 3
                                  ? 'bg-amber-500'
                                  : strength.score <= 4
                                    ? 'bg-emerald-500'
                                    : 'bg-emerald-600'
                              : 'bg-neutral-200 dark:bg-neutral-800')
                          }
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex justify-between">
                      <span>Min. 8 caractères, 1 majuscule, 1 chiffre</span>
                      {strength.label && (
                        <span
                          className={
                            'font-semibold ' +
                            (strength.score <= 2
                              ? 'text-red-600'
                              : strength.score <= 3
                                ? 'text-amber-600'
                                : 'text-emerald-600')
                          }
                        >
                          {strength.label}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <PasswordFieldWithToggle
                  name="password_confirm"
                  label="Confirmer"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Conditions */}
              <div className="pt-2 space-y-2">
                <label
                  htmlFor="terms"
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    id="terms"
                    className={
                      'mt-0.5 w-4 h-4 border-border focus:ring-primary cursor-pointer' +
                      (form.formState.errors.accept_terms
                        ? ' border-destructive text-destructive'
                        : ' text-primary')
                    }
                    {...form.register('accept_terms')}
                  />
                  <span
                    className={
                      'text-xs leading-relaxed ' +
                      (form.formState.errors.accept_terms
                        ? 'text-destructive'
                        : 'text-neutral-600 dark:text-neutral-300')
                    }
                  >
                    J'accepte les{' '}
                    <Link
                      href="/docs/legals/terms"
                      className="font-medium text-black dark:text-white underline-offset-2 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      conditions d'utilisation
                    </Link>{' '}
                    et la{' '}
                    <Link
                      href="/docs/legals/privacy"
                      className="font-medium text-black dark:text-white underline-offset-2 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      politique de confidentialité
                    </Link>
                    .
                  </span>
                </label>

                {form.formState.errors.accept_terms && (
                  <p className="text-[11px] text-destructive ml-7">
                    {form.formState.errors.accept_terms.message as string}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-sm font-semibold"
                disabled={isRegisterPending}
              >
                {isRegisterPending ? (
                  'Création en cours…'
                ) : (
                  <>
                    Créer mon compte
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Lien connexion */}
          <p className="mt-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
            Déjà un compte ?{' '}
            <Link
              href={siteConfig.core.auth.login}
              className="font-semibold text-black dark:text-white hover:underline underline-offset-2"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
