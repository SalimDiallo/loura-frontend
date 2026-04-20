'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

interface RefreshTokenResponse {
  access: string;
}

/**
 * Hook pour rafraîchir le token d'accès
 * Utilisé automatiquement par l'API client en cas de 401
 */
export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<RefreshTokenResponse> => {
      const refreshToken = typeof window !== 'undefined'
        ? localStorage.getItem('loura_refresh_token')
        : null;

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<RefreshTokenResponse>(
        API_ENDPOINTS.AUTH.REFRESH,
        { refresh: refreshToken }
      );

      return response;
    },

    onSuccess: (data) => {
      // Mettre à jour le token d'accès dans localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('loura_access_token', data.access);
      }

      // Invalider les queries pour refetch avec le nouveau token
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },

    onError: (error) => {
      console.error('Token refresh failed:', error);

      // Nettoyer l'auth si le refresh échoue
      if (typeof window !== 'undefined') {
        localStorage.removeItem('loura_access_token');
        localStorage.removeItem('loura_refresh_token');
        localStorage.removeItem('loura_user');
      }

      // Nettoyer le cache
      queryClient.clear();

      // Dispatcher l'événement de logout
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('loura:logout'));
      }
    },
  });
}
