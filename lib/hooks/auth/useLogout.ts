'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/services/auth/auth.service';

/**
 * Hook pour la déconnexion utilisateur
 * Invalide le refresh token et nettoie le cache
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ message: string }> => {
      return authService.logout();
    },

    onSuccess: () => {
      // Nettoyer le localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('loura_access_token');
        localStorage.removeItem('loura_refresh_token');
        localStorage.removeItem('loura_user');
        localStorage.removeItem('current_organization_slug');
      }

      // Nettoyer tout le cache
      queryClient.clear();

      // Dispatcher l'événement de logout
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('loura:logout'));
      }
    },

    onError: (error) => {
      console.error('Logout failed:', error);

      // Même en cas d'erreur, nettoyer le localStorage localement
      if (typeof window !== 'undefined') {
        localStorage.removeItem('loura_access_token');
        localStorage.removeItem('loura_refresh_token');
        localStorage.removeItem('loura_user');
        localStorage.removeItem('current_organization_slug');
      }

      // Nettoyer le cache
      queryClient.clear();
    },
  });
}
