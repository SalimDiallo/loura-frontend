'use client';

import { authService } from '@/lib/services/auth/auth.service';
import type { LoginCredentials } from '@/lib/types';
import { AuthResponse } from '@/lib/types/auth/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook pour la connexion utilisateur
 * Gère l'authentification et la mise en cache de l'utilisateur
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      return authService.login(credentials);
    },

    onSuccess: (data) => {
      // Mettre à jour le cache de l'utilisateur courant
      queryClient.setQueryData(['currentUser'], data.user);

      // Invalider les queries liées à l'auth
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      // Dispatcher l'événement de login
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('loura:login', { detail: data }));
      }
    },

    onError: (error) => {
      console.error('Login failed:', error);
      // Nettoyer le localStorage en cas d'erreur
      if (typeof window !== 'undefined') {
        localStorage.removeItem('loura_access_token');
        localStorage.removeItem('loura_refresh_token');
        localStorage.removeItem('loura_user');
      }
    },
  });
}
