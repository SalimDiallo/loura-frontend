'use client';

import { authService } from '@/lib/services/auth/auth.service';
import type { ChangePasswordData } from '@/lib/types';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook pour le changement de mot de passe
 * Ne met pas à jour le cache utilisateur car seul le mot de passe change
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordData): Promise<{ message: string }> => {
      return authService.changePassword(data);
    },

    onSuccess: (response) => {
      // Dispatcher l'événement de changement de mot de passe
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('loura:password-changed', { detail: response })
        );
      }
    },

    onError: (error) => {
      console.error('Password change failed:', error);
    },
  });
}
