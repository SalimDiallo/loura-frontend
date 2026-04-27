'use client';

import { authService } from '@/lib/services/auth/auth.service';
import type { ForgotPasswordResponse } from '@/lib/types/auth/auth';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook pour demander un email de réinitialisation de mot de passe.
 *
 * Le backend retourne toujours 200 avec un message neutre afin d'éviter
 * l'énumération des comptes — ne pas inférer d'information sur l'existence
 * d'un email à partir de la réponse.
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string): Promise<ForgotPasswordResponse> => {
      return authService.forgotPassword(email);
    },
    onError: (error) => {
      console.error('Forgot password failed:', error);
    },
  });
}
