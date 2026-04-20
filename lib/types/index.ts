/**
 * Types centralisés - Point d'entrée principal
 * ============================================
 * Réexporte tous les types partagés pour un import facile
 */

// Types partagés génériques
export * from './shared';

// Types d'authentification (stricts - correspondent au backend)
export type {
  AuthResponse, AuthState, AuthTokens, BaseUser, ChangePasswordData, CurrentUser, LoginCredentials, LoginResponse, RegisterData, RegisterResponse, UpdateProfileData
} from './auth/auth';

// Type guards pour l'authentification
export { isBaseUser, isLoginResponse } from './auth/auth';

