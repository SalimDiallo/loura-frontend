'use client';

import { authService } from '@/lib/services/auth/auth.service';
import type { ResendVerificationResponse } from '@/lib/types/auth/auth';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook pour redemander un email de vérification.
 *
 * Le backend retourne toujours 200 avec un message neutre afin d'éviter
 * l'énumération des comptes — ne pas inférer d'information sur l'existence
 * d'un email à partir de la réponse.
 */
export function useResendVerification() {
  return useMutation({
    mutationFn: async (email: string): Promise<ResendVerificationResponse> => {
      return authService.resendVerification(email);
    },
    onError: (error) => {
      console.error('Resend verification failed:', error);
    },
  });
}
