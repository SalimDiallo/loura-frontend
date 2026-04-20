'use client';

import {
  Alert,
  Button,
  Form,
  FormInputField,
  FormTextareaField
} from '@/components/ui';
import { Card } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { Skeleton } from '@/components/ui/skeleton';
import { API_ENDPOINTS } from '@/lib/api/config';
import { useCurrentUser } from '@/lib/hooks/auth/useCurrentUser';
import { useDeleteAvatar } from '@/lib/hooks/profile/useDeleteAvatar';
import { useUpdateProfile } from '@/lib/hooks/profile/useUpdateProfile';
import { useFileUpload } from '@/lib/hooks/useFileUpload';
import { useZodForm } from '@/lib/hooks/useZodForm';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';

// Schéma de validation Zod pour la mise à jour du profil
const updateProfileSchema = z.object({
  first_name: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères'),
  last_name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  phone: z.string().max(20, 'Le téléphone ne peut pas dépasser 20 caractères').optional(),
  avatar_url: z.string().url('URL invalide').optional().or(z.literal('')),
  language: z.string().max(5, 'Le code de langue ne peut pas dépasser 5 caractères').optional(),
  timezone: z.string().max(50, 'Le fuseau horaire ne peut pas dépasser 50 caractères').optional(),
  date_of_birth: z.string().optional().or(z.literal('')),
  address: z.string().max(500, 'L\'adresse ne peut pas dépasser 500 caractères').optional(),
  city: z.string().max(100, 'La ville ne peut pas dépasser 100 caractères').optional(),
  country: z.string().max(100, 'Le pays ne peut pas dépasser 100 caractères').optional(),
});

type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export default function EditProfilePage() {
  const router = useRouter();
  const { data: user, isLoading: isUserLoading, isError } = useCurrentUser();
  const updateProfileMutation = useUpdateProfile();
  const deleteAvatarMutation = useDeleteAvatar();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentError, setCurrentError] = useState<Error | null>(null);

  // Hook d'upload d'avatar
  const avatarUpload = useFileUpload({
    endpoint: API_ENDPOINTS.AUTH.UPLOAD_AVATAR,
    maxSize: 5, // 5MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  });

  const form = useZodForm({
    schema: updateProfileSchema,
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      avatar_url: '',
      language: 'fr',
      timezone: 'Africa/Conakry',
      date_of_birth: '',
      address: '',
      city: '',
      country: '',
    },
  });

  // Remplir le formulaire avec les données de l'utilisateur
  useEffect(() => {
    if (user) {
      form.reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
        language: user.language || 'fr',
        timezone: user.timezone || 'Africa/Conakry',
        date_of_birth: user.date_of_birth || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
      });
    }
  }, [user, form]);

  // Gérer l'upload d'avatar
  const handleAvatarUpload = async (file: File) => {
    try {
      await avatarUpload.uploadAsync(file);
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'avatar:', error);
      setCurrentError(error as Error);
    }
  };

  // Gérer la suppression d'avatar
  const handleAvatarDelete = async () => {
    try {
      await deleteAvatarMutation.mutateAsync();
      setSelectedFile(null);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'avatar:', error);
      setCurrentError(error as Error);
    }
  };

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      // Nettoyer les champs vides
      const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => value !== '')
      );

      await updateProfileMutation.mutateAsync(cleanedData);
      router.push('/core/profile');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      setCurrentError(error as Error);
    }
  };

  if (isError) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <Alert variant="destructive">
          Erreur lors du chargement de vos informations. Veuillez réessayer ou vous reconnecter.
        </Alert>
      </div>
    );
  }

  if (isUserLoading) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-8">
        <Skeleton className="h-8 w-40" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    );
  }

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
            Modifier mon profil
          </h1>
          <p className="text-sm text-muted-foreground">
            Mettez à jour vos informations personnelles
          </p>
        </div>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Informations personnelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInputField
                  name="first_name"
                  label="Prénom"
                  placeholder="Votre prénom"
                  required
                />
                <FormInputField
                  name="last_name"
                  label="Nom"
                  placeholder="Votre nom"
                  required
                />
              </div>
              <FormInputField
                name="phone"
                label="Téléphone"
                placeholder="+224 XXX XXX XXX"
                type="tel"
              />
              <FormInputField
                name="date_of_birth"
                label="Date de naissance"
                type="date"
              />
            </div>

            {/* Avatar */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Photo de profil</h3>
              <FileUpload
                value={user?.avatar_url}
                onChange={setSelectedFile}
                onUpload={handleAvatarUpload}
                onDelete={handleAvatarDelete}
                accept="image/*"
                maxSize={5}
                isUploading={avatarUpload.isUploading}
                isDeleting={deleteAvatarMutation.isPending}
                uploadProgress={avatarUpload.uploadProgress}
                showDeleteButton={!!user?.avatar_url}
                label="Avatar"
                description="PNG, JPG, GIF ou WEBP (max. 5MB)"
                error={avatarUpload.isError ? avatarUpload.error?.message : undefined}
              />
              {avatarUpload.isSuccess && (
                <Alert variant="success">
                  Avatar uploadé avec succès !
                </Alert>
              )}
              {deleteAvatarMutation.isSuccess && (
                <Alert variant="success">
                  Avatar supprimé avec succès !
                </Alert>
              )}
              {currentError && (
                <Alert variant="destructive" className="mt-2">
                  {currentError.message}
                </Alert>
              )}
            </div>

            {/* Adresse */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Adresse</h3>
              <FormTextareaField
                name="address"
                label="Adresse"
                placeholder="Votre adresse complète"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInputField
                  name="city"
                  label="Ville"
                  placeholder="Votre ville"
                />
                <FormInputField
                  name="country"
                  label="Pays"
                  placeholder="Votre pays"
                />
              </div>
            </div>

            {/* Préférences */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Préférences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInputField
                  name="language"
                  label="Langue"
                  placeholder="fr"
                />
                <FormInputField
                  name="timezone"
                  label="Fuseau horaire"
                  placeholder="Africa/Conakry"
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending || !form.formState.isDirty}
                className="w-full md:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
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
