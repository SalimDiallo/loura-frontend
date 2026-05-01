/**
 * Types d'authentification - Correspondance exacte avec les serializers backend
 * =============================================================================
 * Ces types reflètent exactement la structure retournee par Django REST Framework
 */

export interface BaseUser {
  id: string
  email: string
  email_verified: boolean
  is_active: boolean
  is_superuser: boolean
  created_at: string
  updated_at: string
  first_name: string
  last_name: string
  phone?: string | null
  avatar_url?: string | null
  language?: string | null
  timezone?: string | null
  date_of_birth?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  emergency_contact?: {
    name?: string
    phone?: string
    relationship?: string
  } | null
}

export interface AuthTokens {
  refresh: string
  access: string
  user: BaseUser
}

export interface LoginResponse {
  message: string
  data: AuthTokens
}

export type RegisterResponse = LoginResponse

/**
 * Réponse de l'endpoint /auth/register/.
 *
 * Aucun token JWT n'est délivré au moment de l'inscription : l'utilisateur
 * doit d'abord confirmer son email. Le payload contient uniquement les
 * informations nécessaires pour rediriger vers /auth/verify-pending.
 */
export interface RegisterPendingResponse {
  message: string
  data: {
    user: BaseUser
    requires_email_verification: true
  }
}

/**
 * Réponse de /auth/email/verify/ (POST { token }).
 */
export interface VerifyEmailResponse {
  message: string
  data: {
    user: BaseUser
  }
}

/**
 * Réponse neutre du renvoi de mail (200 même si l'email n'existe pas).
 */
export interface ResendVerificationResponse {
  message: string
}

/**
 * Réponse neutre de /auth/password/forgot/ (200 même si l'email n'existe pas).
 */
export interface ForgotPasswordResponse {
  message: string
}

/**
 * Réponse de /auth/password/reset/ après mise à jour réussie.
 */
export interface ResetPasswordResponse {
  message: string
}

/**
 * Données envoyées à /auth/password/reset/.
 */
export interface ResetPasswordData {
  token: string
  new_password: string
  new_password_confirm: string
}

/**
 * Données d'un échec de login pour cause d'email non vérifié (403).
 */
export interface EmailNotVerifiedError {
  message: string
  code: "email_not_verified"
  email: string
}

export interface AuthResponse {
  message: string
  access: string
  refresh: string
  user: BaseUser
}

export interface LoginCredentials {
  email: string
  password: string
  remember_me?: boolean
}

export interface RegisterData {
  email: string
  password: string
  password_confirm: string
  first_name: string
  last_name: string
  phone?: string
}

export interface ChangePasswordData {
  old_password: string
  new_password: string
  new_password_confirm: string
}

export type UpdateProfileData = Partial<
  Omit<
    BaseUser,
    | "id"
    | "email"
    | "email_verified"
    | "is_active"
    | "created_at"
    | "updated_at"
  >
>

export type CurrentUser = BaseUser | null

export interface AuthState {
  isAuthenticated: boolean
  user: CurrentUser
  isLoading: boolean
}

export function isLoginResponse(value: unknown): value is LoginResponse {
  if (typeof value !== "object" || value === null) return false

  const obj = value as Record<string, unknown>

  return (
    typeof obj.message === "string" &&
    typeof obj.data === "object" &&
    obj.data !== null &&
    "access" in obj.data &&
    "refresh" in obj.data &&
    "user" in obj.data
  )
}

export function isBaseUser(value: unknown): value is BaseUser {
  if (typeof value !== "object" || value === null) return false

  const obj = value as Record<string, unknown>

  return (
    typeof obj.id === "string" &&
    typeof obj.email === "string" &&
    typeof obj.first_name === "string" &&
    typeof obj.last_name === "string" &&
    typeof obj.email_verified === "boolean" &&
    typeof obj.is_active === "boolean" &&
    typeof obj.created_at === "string" &&
    typeof obj.updated_at === "string"
  )
}
