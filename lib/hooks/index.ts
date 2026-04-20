/**
 * Hooks personnalisés pour LOURA
 * Point d'entrée centralisé pour tous les hooks
 */

// Auth hooks
export {
  useCurrentUser, useIsAuthenticated, useLogin, useLogout, useRefreshToken, useRegister
} from './auth';

export { useAuth, useRequireAuth } from './useAuth';
export { useUser } from './useUser';

// Form hooks
export { useZodForm } from './useZodForm';

// Pagination hooks
export { usePaginatedQuery, useAllQuery } from './usePagination';
export type { PaginationMeta, PaginationState, UsePaginatedQueryReturn } from './usePagination';
