'use client';

import { useQuery } from '@tanstack/react-query';
import {
  authService,
  type UnifiedUser,
} from '@/lib/services/auth/auth.service';

/**
 * Hook pour récupérer l'utilisateur courant
 * Avec cache et auto-refetch
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<UnifiedUser> => {
      // Vérifier si on a un token
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('loura_access_token')
        : null;

      if (!token) {
        throw new Error('No access token found');
      }

      return authService.getCurrentUser();
    },

    // Ne fetch que si on a un token
    enabled: typeof window !== 'undefined'
      ? !!localStorage.getItem('loura_access_token')
      : false,

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

/**
 * Hook utilitaire pour vérifier si l'utilisateur est admin
 */
export function useIsAdmin() {
  const { data: user } = useCurrentUser();

  return {
    isAdmin: user?.user_type === 'admin',
    user,
  };
}
