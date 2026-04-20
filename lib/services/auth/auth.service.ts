
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
import { AuthResponse } from '@/lib/types/auth/auth';

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
   * Inscription d'un utilisateur
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const rawResponse = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data,
      { requiresAuth: false }
    );

    if (!isLoginResponse(rawResponse)) {
      throw new Error('Invalid response format from backend');
    }

    const response: AuthResponse = {
      message: rawResponse.message,
      access: rawResponse.data.access,
      refresh: rawResponse.data.refresh,
      user: rawResponse.data.user,
    };

    if (response.access && response.refresh && response.user) {
      tokenManager.setTokens(response.access, response.refresh);
      tokenManager.saveUser(response.user);
    }

    return response;
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
      tokenManager.setTokens(response.access, response.refresh);
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
    const response = await apiClient.patch<{ user: BaseUser; message: string }>(
      API_ENDPOINTS.AUTH.UPDATE_PROFILE,
      data
    );

    tokenManager.saveUser(response.user);
    return response.user;
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
