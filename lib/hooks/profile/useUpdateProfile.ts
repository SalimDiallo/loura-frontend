'use client';

import { authService } from '@/lib/services/auth/auth.service';
import type { BaseUser } from '@/lib/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook pour la mise à jour du profil utilisateur
 * Met à jour le cache après succès
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<BaseUser>): Promise<BaseUser> => {
      return authService.updateProfile(data);
    },

    onSuccess: (updatedUser) => {
      // Mettre à jour le cache de l'utilisateur courant
      queryClient.setQueryData(['currentUser'], updatedUser);

      // Invalider les queries liées au profil
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });

      // Dispatcher l'événement de mise à jour
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('loura:profile-updated', { detail: updatedUser })
        );
      }
    },

    onError: (error) => {
      console.error('Profile update failed:', error);
    },
  });
}
