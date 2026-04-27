
import { BaseService } from '@/lib/api/base-service';
import { apiClient, tokenManager } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  BaseUser,
  ChangePasswordData,
  LoginCredentials,
  LoginResponse,
  RegisterData,
} from '@/lib/types';
import { isLoginResponse } from '@/lib/types';
import {
  AuthResponse,
  ForgotPasswordResponse,
  RegisterPendingResponse,
  ResendVerificationResponse,
  ResetPasswordData,
  ResetPasswordResponse,
  VerifyEmailResponse
} from '@/lib/types/auth/auth';

// AuthService n'est pas strictement CRUD, mais expose getCurrentUser, updateProfile, etc.
// On hérite de BaseService pour factoriser ce qui peut l'être et garder l’API homogène.
class AuthService extends BaseService<BaseUser, RegisterData, Partial<BaseUser>> {
  // Pas de endpoints CRUD standard, mais on doit satisfaire l'interface
  protected readonly endpoints = {
    LIST: '', // non utilisé pour l'auth
    CREATE: API_ENDPOINTS.AUTH.REGISTER,
    DETAIL: () => API_ENDPOINTS.AUTH.ME,
    UPDATE: () => API_ENDPOINTS.AUTH.UPDATE_PROFILE,
    DELETE: () => '', // non pris en charge
  };

  /**
   * Inscription d'un utilisateur.
   *
   * Le backend ne délivre PAS de tokens JWT : l'utilisateur doit confirmer
   * son email via le lien reçu avant de pouvoir se connecter. La réponse
   * contient simplement le user créé (`email_verified=false`) et un drapeau
   * `requires_email_verification`.
   */
  async register(data: RegisterData): Promise<RegisterPendingResponse> {
    return apiClient.post<RegisterPendingResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data,
      { requiresAuth: false }
    );
  }

  /**
   * Vérifie l'email à partir du token signé reçu par mail.
   */
  async verifyEmail(token: string): Promise<VerifyEmailResponse> {
    return apiClient.post<VerifyEmailResponse>(
      API_ENDPOINTS.AUTH.VERIFY_EMAIL,
      { token },
      { requiresAuth: false }
    );
  }

  /**
   * Renvoie un lien de vérification. La réponse est neutre côté backend
   * (200 même si l'email est inconnu) pour éviter l'énumération de comptes.
   */
  async resendVerification(email: string): Promise<ResendVerificationResponse> {
    return apiClient.post<ResendVerificationResponse>(
      API_ENDPOINTS.AUTH.RESEND_VERIFICATION,
      { email },
      { requiresAuth: false }
    );
  }

  /**
   * Demande un email de réinitialisation de mot de passe.
   * Réponse neutre côté backend (200 même si l'email est inconnu) pour
   * éviter l'énumération des comptes.
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    return apiClient.post<ForgotPasswordResponse>(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email },
      { requiresAuth: false }
    );
  }

  /**
   * Soumet un nouveau mot de passe à partir d'un token signé reçu par mail.
   */
  async resetPassword(data: ResetPasswordData): Promise<ResetPasswordResponse> {
    return apiClient.post<ResetPasswordResponse>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      data,
      { requiresAuth: false }
    );
  }

  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const rawResponse = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
      { requiresAuth: false }
    );

    if (!isLoginResponse(rawResponse)) {
      console.error('Invalid login response:', rawResponse);
      throw new Error('Invalid response format from backend');
    }

    const response: AuthResponse = {
      message: rawResponse.message,
      access: rawResponse.data.access,
      refresh: rawResponse.data.refresh,
      user: rawResponse.data.user,
    };

    if (response.access && response.refresh && response.user) {
      // Choix du storage (localStorage/sessionStorage) selon "remember_me".
      // Par défaut, on persiste durablement (true) pour préserver le
      // comportement historique si la case n'est pas explicitement décochée.
      const rememberMe = credentials.remember_me ?? true;
      tokenManager.setTokens(response.access, response.refresh, rememberMe);
      tokenManager.saveUser(response.user);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('loura:login', { detail: response }));
      }
    }

    return response;
  }

  /**
   * Déconnexion utilisateur
   */
  async logout(): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        API_ENDPOINTS.AUTH.LOGOUT,
        { refresh: tokenManager.getRefreshToken() }
      );
      tokenManager.clearTokens();
      return response;
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      tokenManager.clearTokens();
      return { message: 'Logout completed (with errors)' };
    }
  }

  /**
   * Récupérer l'utilisateur courant
   */
  async getCurrentUser(): Promise<BaseUser> {
    const response = await apiClient.get<BaseUser>(API_ENDPOINTS.AUTH.ME);
    tokenManager.saveUser(response);
    return response;
  }

  /**
   * Mettre à jour le profil
   */
  async updateProfile(data: Partial<BaseUser>): Promise<BaseUser> {
    const response = await apiClient.patch<{ data: BaseUser; message: string }>(
      API_ENDPOINTS.AUTH.UPDATE_PROFILE,
      data
    );

    tokenManager.saveUser(response.data);
    return response.data;
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
      data
    );
  }

  /**
   * Supprimer l'avatar
   */
  async deleteAvatar(): Promise<{ message: string; data: BaseUser }> {
    return apiClient.delete<{ message: string; data: BaseUser }>(
      API_ENDPOINTS.AUTH.DELETE_AVATAR
    );
  }

  /**
   * Vérifier si authentifié
   */
  isAuthenticated(): boolean {
    return !!tokenManager.getAccessToken();
  }

  /**
   * Récupérer l'utilisateur stocké localement
   */
  getStoredUser(): BaseUser | null {
    return tokenManager.getUser();
  }
}

// Instance singleton du service d'authentification
export const authService = new AuthService();

// ============================================================================
// RE-EXPORTS
// ============================================================================

export type { AuthResponse, BaseUser, ChangePasswordData, LoginCredentials, RegisterData };
export type CurrentUser = BaseUser | null;
