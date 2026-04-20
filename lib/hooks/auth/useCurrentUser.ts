'use client';

import { authService } from '@/lib/services/auth/auth.service';
import type { BaseUser } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook pour récupérer l'utilisateur courant
 * Utilise le cache TanStack Query avec auto-refetch
 */
export function useCurrentUser() {
  const hasToken =
    typeof window !== 'undefined' ? !!localStorage.getItem('loura_access_token') : false;

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<BaseUser> => {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('loura_access_token') : null;

      if (!token) {
        throw new Error('No access token found');
      }

      return authService.getCurrentUser();
    },

    // Ne fetch que si on a un token
    enabled: hasToken,

    // Rafraîchir les données toutes les 2 minutes
    staleTime: 2 * 60 * 1000,

    // Garder en cache pendant 10 minutes
    gcTime: 10 * 60 * 1000,

    // Retry en cas d'erreur
    retry: 1,

    // Refetch au focus de la fenêtre
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook utilitaire pour vérifier si l'utilisateur est authentifié
 */
export function useIsAuthenticated() {
  const { data: user, isLoading } = useCurrentUser();

  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}
