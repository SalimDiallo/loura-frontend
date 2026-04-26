'use client';

import { authService } from '@/lib/services/auth/auth.service';
import type { VerifyEmailResponse } from '@/lib/types/auth/auth';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook pour consommer un token signé reçu par email et activer le compte.
 *
 * Utilisation :
 * ```ts
 * const { mutateAsync: verify, isPending, error } = useVerifyEmail();
 * useEffect(() => { if (token) verify(token); }, [token]);
 * ```
 */
export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (token: string): Promise<VerifyEmailResponse> => {
      return authService.verifyEmail(token);
    },
    onError: (error) => {
      console.error('Email verification failed:', error);
    },
  });
}
