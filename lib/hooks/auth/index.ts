/**
 * Hooks d'authentification avec TanStack Query
 *
 * Ces hooks remplacent progressivement authService
 * pour une meilleure gestion du cache et des optimisations
 */

export {
    useCurrentUser,
    useIsAuthenticated
} from './useCurrentUser';
export { useForgotPassword } from './useForgotPassword';
export { useLogin } from './useLogin';
export { useLogout } from './useLogout';
export { useRefreshToken } from './useRefreshToken';
export { useRegister } from './useRegister';
export { useResendVerification } from './useResendVerification';
export { useResetPassword } from './useResetPassword';
export { useVerifyEmail } from './useVerifyEmail';

