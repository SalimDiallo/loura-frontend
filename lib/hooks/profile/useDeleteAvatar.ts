'use client';

import { authService } from '@/lib/services/auth/auth.service';
import type { BaseUser } from '@/lib/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook pour la suppression de l'avatar utilisateur
 * Met à jour le cache après succès
 */
export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ message: string; user: BaseUser }> => {
      const response = await authService.deleteAvatar();
      return {
        message: response.message,
        user: response.data,
      };
    },

    onSuccess: ({ user }) => {
      // Mettre à jour le cache de l'utilisateur courant
      queryClient.setQueryData(['currentUser'], user);

      // Invalider les queries liées au profil
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });

      // Dispatcher l'événement de suppression d'avatar
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('loura:avatar-deleted', { detail: user })
        );
      }
    },

    onError: (error) => {
      console.error('Avatar deletion failed:', error);
    },
  });
}
