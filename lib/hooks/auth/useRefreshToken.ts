'use client';

import { apiClient, tokenManager } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

/**
 * Hook pour rafraîchir le token d'accès
 * Utilisé automatiquement par l'API client en cas de 401
 */
export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<RefreshTokenResponse> => {
      const refreshToken = tokenManager.getRefreshToken();

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
      // Met à jour les tokens via le tokenManager pour respecter le storage
      // (localStorage / sessionStorage) choisi via "Se souvenir de moi".
      // SimpleJWT renvoie un nouveau refresh quand ROTATE_REFRESH_TOKENS est
      // activé : on le préserve si présent, sinon on conserve l'actuel.
      const currentRefresh = tokenManager.getRefreshToken() ?? '';
      tokenManager.setTokens(data.access, data.refresh ?? currentRefresh);

      // Invalider les queries pour refetch avec le nouveau token
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },

    onError: (error) => {
      console.error('Token refresh failed:', error);

      // Nettoyer l'auth si le refresh échoue
      tokenManager.clearTokens();

      // Nettoyer le cache
      queryClient.clear();

      // Dispatcher l'événement de logout
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('loura:logout'));
      }
    },
  });
}
