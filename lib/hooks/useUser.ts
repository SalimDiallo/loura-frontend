'use client';

import { useCurrentUser } from './auth';
import type { UnifiedUser } from '@/lib/services/auth/auth.service';

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
    isAdmin: user?.user_type === 'admin',
    isEmployee: user?.user_type === 'employee',
  };
}

/**
 * Hook pour obtenir les informations d'organisation de l'utilisateur
 */
export function useUserOrganization() {
  const { user } = useUser();

  const currentOrgSlug = typeof window !== 'undefined'
    ? localStorage.getItem('current_organization_slug')
    : null;

  const currentOrg = user?.organizations?.find(
    (org) => org.subdomain === currentOrgSlug
  );

  return {
    organization: currentOrg ?? null,
    organizations: user?.organizations ?? [],
    isLoading: !user,
  };
}
