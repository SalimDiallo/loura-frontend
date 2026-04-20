'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  authService,
  type AuthResponse,
  type RegisterData,
} from '@/lib/services/auth/auth.service';

/**
 * Hook pour l'inscription utilisateur
 * Crée un compte et authentifie automatiquement
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegisterData): Promise<AuthResponse> => {
      return authService.register(data);
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
      console.error('Registration failed:', error);
      // Nettoyer le localStorage en cas d'erreur
      if (typeof window !== 'undefined') {
        localStorage.removeItem('loura_access_token');
        localStorage.removeItem('loura_refresh_token');
        localStorage.removeItem('loura_user');
      }
    },
  });
}
