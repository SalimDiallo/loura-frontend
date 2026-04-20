'use client';

import {
  Alert,
  Button,
  Form,
  PasswordFieldWithToggle
} from '@/components/ui';
import { Card } from '@/components/ui/card';
import { useChangePassword } from '@/lib/hooks/profile/useChangePassword';
import { useZodForm } from '@/lib/hooks/useZodForm';
import { ArrowLeft, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

// Schéma de validation Zod pour le changement de mot de passe
const changePasswordSchema = z
  .object({
    old_password: z
      .string()
      .min(1, 'Veuillez saisir votre mot de passe actuel'),
    new_password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
    new_password_confirm: z
      .string()
      .min(1, 'Veuillez confirmer votre nouveau mot de passe'),
  })
  .refine((data) => data.new_password === data.new_password_confirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['new_password_confirm'],
  })
  .refine((data) => data.old_password !== data.new_password, {
    message: 'Le nouveau mot de passe doit être différent de l\'ancien',
    path: ['new_password'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const changePasswordMutation = useChangePassword();

  const form = useZodForm({
    schema: changePasswordSchema,
    defaultValues: {
      old_password: '',
      new_password: '',
      new_password_confirm: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePasswordMutation.mutateAsync(data);
      form.reset();
      // Rediriger vers le profil après succès
      setTimeout(() => {
        router.push('/core/profile');
      }, 2000);
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
    }
  };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/core/profile')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-xl font-medium text-foreground">
            Modifier mon mot de passe
          </h1>
          <p className="text-sm text-muted-foreground">
            Changez votre mot de passe pour sécuriser votre compte
          </p>
        </div>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Message de succès */}
            {changePasswordMutation.isSuccess && (
              <Alert>
                Votre mot de passe a été modifié avec succès. Redirection en cours...
              </Alert>
            )}

            {/* Champs du formulaire */}
            <div className="space-y-4">
              <PasswordFieldWithToggle
                name="old_password"
                label="Mot de passe actuel"
                placeholder="Saisissez votre mot de passe actuel"
                required
              />

              <PasswordFieldWithToggle
                name="new_password"
                label="Nouveau mot de passe"
                placeholder="Saisissez votre nouveau mot de passe"
                required
              />

              <PasswordFieldWithToggle
                name="new_password_confirm"
                label="Confirmer le nouveau mot de passe"
                placeholder="Confirmez votre nouveau mot de passe"
                required
              />

              <div className="text-xs text-muted-foreground space-y-1 pt-2">
                <p>Votre mot de passe doit :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Contenir au moins 8 caractères</li>
                  <li>Contenir au moins une lettre majuscule</li>
                  <li>Contenir au moins un chiffre</li>
                  <li>Être différent de votre mot de passe actuel</li>
                </ul>
              </div>
            </div>

            {/* Message d'erreur */}
            {changePasswordMutation.isError && (
              <Alert variant="destructive">
                {changePasswordMutation.error instanceof ApiError
                  ? changePasswordMutation.error.message
                  : 'Une erreur est survenue lors du changement de mot de passe'}
              </Alert>
            )}

            {/* Boutons d'action */}
            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending || !form.formState.isDirty}
                className="w-full md:w-auto"
              >
                <Key className="h-4 w-4 mr-2" />
                {changePasswordMutation.isPending ? 'Modification...' : 'Modifier le mot de passe'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/core/profile')}
                className="w-full md:w-auto"
              >
                Annuler
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
