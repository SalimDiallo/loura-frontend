'use client';

import type { LoginCredentials, RegisterData } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useIsAuthenticated, useLogin, useLogout, useRegister } from './auth';
import { useUser } from './useUser';

/**
 * Hook principal pour la gestion de l'authentification
 * Combine login, logout, register et état de l'utilisateur
 *
 * @example
 * ```tsx
 * const { login, logout, user, isAuthenticated } = useAuth();
 *
 * const handleLogin = async () => {
 *   try {
 *     await login({ email: 'user@example.com', password: '123456' });
 *     router.push('/dashboard');
 *   } catch (error) {
 *     console.error('Login failed:', error);
 *   }
 * };
 * ```
 */
export function useAuth() {
  const router = useRouter();

  // Mutations
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const registerMutation = useRegister();

  // État utilisateur
  const { isAuthenticated, isLoading: isAuthLoading } = useIsAuthenticated();
  const { user } = useUser();

  /**
   * Connexion avec redirection automatique
   */
  const login = async (credentials: LoginCredentials, redirectTo: string = '/dashboard') => {
    const result = await loginMutation.mutateAsync(credentials);
    router.push(redirectTo);
    return result;
  };

  /**
   * Inscription : crée le compte puis redirige vers la page d'attente
   * de vérification d'email. Le backend ne délivre PAS de tokens : il faut
   * que l'utilisateur clique sur le lien envoyé par email.
   *
   * @param data        Payload d'inscription.
   * @param redirectTo  Destination après création. Par défaut, la page
   *                    d'attente avec l'email en query.
   */
  const register = async (
    data: RegisterData,
    redirectTo?: string,
  ) => {
    const result = await registerMutation.mutateAsync(data);
    const target =
      redirectTo
      ?? `/auth/verify-pending?email=${encodeURIComponent(data.email)}`;
    router.push(target);
    return result;
  };

  /**
   * Déconnexion avec redirection
   */
  const logout = async (redirectTo: string = '/auth') => {
    await logoutMutation.mutateAsync();
    router.push(redirectTo);
  };

  return {
    // Actions
    login,
    logout,
    register,

    // État
    user,
    isAuthenticated,
    isLoading: isAuthLoading || loginMutation.isPending || registerMutation.isPending,

    // États des mutations
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
    registerError: registerMutation.error,

    isLoginPending: loginMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    isRegisterPending: registerMutation.isPending,
  };
}

/**
 * Hook pour protéger une route (redirection si non authentifié)
 */
export function useRequireAuth(redirectTo: string = '/auth') {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useIsAuthenticated();

  if (!isLoading && !isAuthenticated) {
    router.push(redirectTo);
  }

  return { isLoading, isAuthenticated };
}
