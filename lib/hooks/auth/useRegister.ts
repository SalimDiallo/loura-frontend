'use client';

import { authService } from '@/lib/services/auth/auth.service';
import type { RegisterData } from '@/lib/types';
import type { RegisterPendingResponse } from '@/lib/types/auth/auth';
import { useMutation } from '@tanstack/react-query';

/**
 * Hook pour l'inscription utilisateur.
 *
 * Le backend ne délivre PAS de tokens JWT à l'inscription : l'utilisateur
 * doit confirmer son email via le lien envoyé par mail. Ce hook se contente
 * de créer le compte et de retourner la réponse `RegisterPendingResponse`
 * (le composant est responsable de la redirection vers /auth/verify-pending).
 */
export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterData): Promise<RegisterPendingResponse> => {
      return authService.register(data);
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });
}
