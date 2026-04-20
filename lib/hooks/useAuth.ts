'use client';

import { useRouter } from 'next/navigation';
import { useLogin, useLogout, useRegister, useIsAuthenticated } from './auth';
import { useUser } from './useUser';
import type { LoginCredentials, RegisterData } from '@/lib/services/auth/auth.service';

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
  const { user, isAdmin, isEmployee } = useUser();

  /**
   * Connexion avec redirection automatique
   */
  const login = async (credentials: LoginCredentials, redirectTo?: string) => {
    const result = await loginMutation.mutateAsync(credentials);

    // Redirection basée sur le type d'utilisateur
    if (redirectTo) {
      router.push(redirectTo);
    } else if (result.user_type === 'admin') {
      router.push('/dashboard');
    } else {
      router.push('/employee/dashboard');
    }

    return result;
  };

  /**
   * Inscription avec redirection automatique
   */
  const register = async (data: RegisterData, redirectTo?: string) => {
    const result = await registerMutation.mutateAsync(data);

    // Redirection
    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.push('/dashboard');
    }

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
    isAdmin,
    isEmployee,

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

/**
 * Hook pour protéger une route admin
 */
export function useRequireAdmin(redirectTo: string = '/') {
  const router = useRouter();
  const { user, isLoading } = useUser();

  if (!isLoading && user?.user_type !== 'admin') {
    router.push(redirectTo);
  }

  return { isLoading, isAdmin: user?.user_type === 'admin' };
}
