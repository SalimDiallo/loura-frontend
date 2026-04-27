'use client';

import { authService } from '@/lib/services/auth/auth.service';
import type {
    ResetPasswordData,
    ResetPasswordResponse,
} from '@/lib/types/auth/auth';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook pour soumettre un nouveau mot de passe à partir d'un token signé.
 *
 * Codes d'erreur backend (champ `data.code`) :
 * - `token_expired` : le lien a dépassé sa durée de validité.
 * - `token_invalid` : le lien est altéré ou déjà utilisé.
 * - `account_disabled` : le compte est désactivé.
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordData): Promise<ResetPasswordResponse> => {
      return authService.resetPassword(data);
    },
    onError: (error) => {
      console.error('Reset password failed:', error);
    },
  });
}
