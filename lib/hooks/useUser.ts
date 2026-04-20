'use client';

import { useCurrentUser } from './auth';
import type { BaseUser } from '@/lib/types';

/**
 * Hook utilitaire pour accéder à l'utilisateur courant
 * Réexporte useCurrentUser pour compatibilité avec les composants existants
 *
 * @example
 * ```tsx
 * const { user, isLoading, error } = useUser();
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (!user) return <div>Not authenticated</div>;
 *
 * return <div>Welcome {user.first_name}!</div>;
 * ```
 */
export function useUser() {
  const { data: user, isLoading, error, isError } = useCurrentUser();

  return {
    user: user ?? null,
    isLoading,
    error: isError ? (error as Error) : null,
    isAuthenticated: !!user,
  };
}
