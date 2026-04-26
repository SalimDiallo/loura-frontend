/**
 * Types d'authentification - Correspondance exacte avec les serializers backend
 * =============================================================================
 * Ces types reflètent exactement la structure retournée par Django REST Framework
 *
 * Backend serializers correspondants:
 * - auth/serializers/user_serializer.py (UserSerializer)
 * - auth/serializers/token_serializer.py (TokenSerializer)
 */

// ============================================================================
// BASE USER - Correspond au UserSerializer Django
// ============================================================================

/**
 * Structure de base d'un utilisateur selon le UserSerializer backend
 *
 * Champs du modèle BaseUser Django:
 * - Lecture seule: id, email_verified, created_at, updated_at
 * - Modifiables: tous les autres champs
 */
export interface BaseUser {
  // Champs obligatoires en lecture seule
  id: string;
  email: string;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Informations personnelles
  first_name: string;
  last_name: string;
  phone?: string | null;
  avatar_url?: string | null;

  // Préférences
  language?: string | null;
  timezone?: string | null;

  // Détails additionnels
  date_of_birth?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;

  // Contact d'urgence (JSON field dans Django)
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  } | null;
}

// ============================================================================
// AUTH TOKENS - Correspond au TokenSerializer.get_token()
// ============================================================================

/**
 * Structure des tokens JWT retournée par TokenSerializer.get_token(user)
 *
 * Backend Python:
 * ```python
 * {
 *   'refresh': str(refresh),
 *   'access': str(refresh.access_token),
 *   'user': UserSerializer(user).data
 * }
 * ```
 */
export interface AuthTokens {
  refresh: string;
  access: string;
  user: BaseUser;
}

// ============================================================================
// LOGIN/REGISTER RESPONSE - Correspond à la réponse wrapped du backend
// ============================================================================

/**
 * Format de réponse des endpoints login et register
 *
 * Backend Python:
 * ```python
 * return Response({
 *   'message': 'Connexion réussie.',
 *   'data': tokens  # TokenSerializer.get_token(user)
 * }, status=status.HTTP_200_OK)
 * ```
 */
export interface LoginResponse {
  message: string;
  data: AuthTokens;
}

/**
 * Alias pour la réponse d'inscription (même structure que login)
 */
export type RegisterResponse = LoginResponse;

/**
 * Réponse de l'endpoint /auth/register/.
 *
 * Aucun token JWT n'est délivré au moment de l'inscription : l'utilisateur
 * doit d'abord confirmer son email. Le payload contient uniquement les
 * informations nécessaires pour rediriger vers /auth/verify-pending.
 */
export interface RegisterPendingResponse {
  message: string;
  data: {
    user: BaseUser;
    requires_email_verification: true;
  };
}

/**
 * Réponse de /auth/email/verify/ (POST { token }).
 */
export interface VerifyEmailResponse {
  message: string;
  data: {
    user: BaseUser;
  };
}

/**
 * Réponse neutre du renvoi de mail (200 même si l'email n'existe pas).
 */
export interface ResendVerificationResponse {
  message: string;
}

/**
 * Données d'un échec de login pour cause d'email non vérifié (HTTP 403).
 */
export interface EmailNotVerifiedError {
  message: string;
  code: 'email_not_verified';
  email: string;
}

/**
 * Format de réponse aplati pour l'usage frontend
 * Extrait les tokens du niveau `data` pour simplifier l'usage
 */
export interface AuthResponse {
  message: string;
  access: string;
  refresh: string;
  user: BaseUser;
}

// ============================================================================
// REQUEST TYPES - Données envoyées au backend
// ============================================================================

/**
 * Credentials de connexion
 */
export interface LoginCredentials {
  email: string;
  password: string;
  /**
   * Si vrai, les tokens sont persistés dans localStorage et la durée de vie
   * du refresh token est prolongée côté backend.
   * Sinon, les tokens sont stockés en sessionStorage (effacés à la fermeture
   * du navigateur) et la durée de vie standard est appliquée.
   */
  remember_me?: boolean;
}

/**
 * Données d'inscription
 * Note: password_confirm est requis par le RegisterSerializer backend
 */
export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

/**
 * Données pour changement de mot de passe
 */
export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

// ============================================================================
// UTILITY TYPES - Types dérivés pour l'usage frontend
// ============================================================================

/**
 * Type pour les mises à jour de profil (tous les champs modifiables deviennent optionnels)
 */
export type UpdateProfileData = Partial<
  Omit<BaseUser, 'id' | 'email' | 'email_verified' | 'is_active' | 'created_at' | 'updated_at'>
>;

/**
 * Type pour l'utilisateur courant (peut être null si non authentifié)
 */
export type CurrentUser = BaseUser | null;

/**
 * Type pour vérifier l'authentification
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: CurrentUser;
  isLoading: boolean;
}

// ============================================================================
// EXPORT TYPE GUARDS
// ============================================================================

/**
 * Type guard pour vérifier si une réponse est une LoginResponse valide
 */
export function isLoginResponse(value: unknown): value is LoginResponse {
  if (typeof value !== 'object' || value === null) return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.message === 'string' &&
    typeof obj.data === 'object' &&
    obj.data !== null &&
    'access' in obj.data &&
    'refresh' in obj.data &&
    'user' in obj.data
  );
}

/**
 * Type guard pour vérifier si un objet est un BaseUser valide
 */
export function isBaseUser(value: unknown): value is BaseUser {
  if (typeof value !== 'object' || value === null) return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.first_name === 'string' &&
    typeof obj.last_name === 'string' &&
    typeof obj.email_verified === 'boolean' &&
    typeof obj.is_active === 'boolean' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  );
}
