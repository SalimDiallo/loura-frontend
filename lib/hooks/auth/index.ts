/**
 * Hooks d'authentification avec TanStack Query
 *
 * Ces hooks remplacent progressivement authService
 * pour une meilleure gestion du cache et des optimisations
 */

export { useLogin } from './useLogin';
export { useRegister } from './useRegister';
export { useLogout } from './useLogout';
export {
  useCurrentUser,
  useIsAuthenticated,
  useIsAdmin
} from './useCurrentUser';
export { useRefreshToken } from './useRefreshToken';
