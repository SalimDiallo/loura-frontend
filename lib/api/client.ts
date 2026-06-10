/**
 * Client API avec gestion des tokens JWT
 */

import { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS } from './config';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Gestionnaire de tokens
 *
 * "Se souvenir de moi" :
 * - Si remember_me est vrai au login, les tokens et l'utilisateur sont
 *   persistés dans `localStorage` (survit à la fermeture du navigateur).
 * - Sinon, ils sont stockés dans `sessionStorage` (effacés à la fermeture).
 *
 * Le choix est mémorisé dans `localStorage` via `STORAGE_KEYS.REMEMBER_ME`
 * pour que les opérations ultérieures (refresh, saveUser, etc.) ciblent
 * automatiquement le bon storage.
 */
const isBrowser = (): boolean => typeof window !== 'undefined';

/**
 * Retourne le storage actif selon le drapeau "remember_me".
 * Par défaut (drapeau absent) : localStorage, pour préserver le comportement
 * historique avec les sessions déjà ouvertes.
 */
const getActiveStorage = (): Storage | null => {
  if (!isBrowser()) return null;
  const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
  return remember === 'false' ? sessionStorage : localStorage;
};

/**
 * Lecture tolérante : tente d'abord le storage actif puis l'autre,
 * pour éviter de perdre une session lors d'une transition.
 */
const readFromAnyStorage = (key: string): string | null => {
  if (!isBrowser()) return null;
  const active = getActiveStorage();
  return (
    active?.getItem(key) ??
    localStorage.getItem(key) ??
    sessionStorage.getItem(key)
  );
};

const removeFromAllStorages = (key: string): void => {
  if (!isBrowser()) return;
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

export const tokenManager = {
  getAccessToken: (): string | null => readFromAnyStorage(STORAGE_KEYS.ACCESS_TOKEN),

  getRefreshToken: (): string | null => readFromAnyStorage(STORAGE_KEYS.REFRESH_TOKEN),

  /**
   * @param rememberMe Si fourni, met à jour le drapeau de persistance.
   *                   Sinon, conserve le drapeau courant (utile lors d'un
   *                   refresh automatique du token).
   */
  setTokens: (access: string, refresh: string, rememberMe?: boolean): void => {
    if (!isBrowser()) return;

    if (typeof rememberMe === 'boolean') {
      localStorage.setItem(
        STORAGE_KEYS.REMEMBER_ME,
        rememberMe ? 'true' : 'false'
      );
    }

    // Évite de laisser des tokens orphelins dans l'autre storage.
    removeFromAllStorages(STORAGE_KEYS.ACCESS_TOKEN);
    removeFromAllStorages(STORAGE_KEYS.REFRESH_TOKEN);

    const storage = getActiveStorage();
    if (!storage) return;
    storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  },

  clearTokens: (): void => {
    if (!isBrowser()) return;
    removeFromAllStorages(STORAGE_KEYS.ACCESS_TOKEN);
    removeFromAllStorages(STORAGE_KEYS.REFRESH_TOKEN);
    removeFromAllStorages(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
  },

  saveUser: (user: any): void => {
    if (!isBrowser()) return;
    removeFromAllStorages(STORAGE_KEYS.USER);
    const storage = getActiveStorage();
    storage?.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser: (): any => {
    const raw = readFromAnyStorage(STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};

/**
 * Options de requête
 */
interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  params?: Record<string, any>;
}

/**
 * Client API
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Méthode générique pour effectuer des requêtes
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, headers = {}, body, ...restOptions } = options;

    // Détecter si le body est un FormData
    const isFormData = body instanceof FormData;

    // Construction des headers
    const requestHeaders: Record<string, string> = isFormData
      ? { ...(headers as Record<string, string>) } // Ne pas inclure Content-Type pour FormData
      : {
          ...API_CONFIG.headers,
          ...(headers as Record<string, string>),
        };

    // Ajout du token d'authentification si nécessaire
    if (requiresAuth) {
      const token = tokenManager.getAccessToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Configuration de la requête
    const config: RequestInit = {
      ...restOptions,
      body,
      headers: requestHeaders,
    };

    try {
      // Construire l'URL avec les query params si fournis
      let url = `${this.baseURL}${endpoint}`;

      // Ajouter les params si fournis dans les options
      if (options.params) {
        const searchParams = new URLSearchParams();
        Object.entries(options.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value));
          }
        });
        const queryString = searchParams.toString();
        if (queryString) {
          const separator = url.includes('?') ? '&' : '?';
          url = `${url}${separator}${queryString}`;
        }
      }

      // Ne pas ajouter organization_subdomain pour les endpoints d'auth
      const isAuthEndpoint = endpoint.includes('/auth/') || endpoint.includes('/login') || endpoint.includes('/register');

      if (!isAuthEndpoint && typeof window !== 'undefined') {
        // Récupérer le slug depuis localStorage directement
        const orgSlug = localStorage.getItem('current_organization_slug');

        // Only append if not already present in queryString
        if (orgSlug && !url.includes('organization_subdomain=')) {
          const separator = url.includes('?') ? '&' : '?';
          url = `${url}${separator}organization_subdomain=${orgSlug}`;
          console.log('[API Client] Added organization_subdomain to URL:', url);
        } else if (!orgSlug) {
          // console.warn('[API Client] No organization slug found in localStorage');
        }
      }

      const response = await fetch(url, config);

      // Gestion des erreurs HTTP
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }

        // Si erreur 401, le token est peut-être expiré
        if (response.status === 401 && requiresAuth) {
          // Tentative de rafraîchissement du token
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Réessayer la requête originale
            return this.request<T>(endpoint, options);
          } else {
            // Impossible de rafraîchir, déconnexion
            const loginPath = '/auth';

            tokenManager.clearTokens();

            // Ne rediriger que si on est côté client
            if (typeof window !== 'undefined') {
              window.location.href = loginPath;
            }

            throw new ApiError('Session expirée', response.status, errorData);
          }
        }

        // Les 5xx remontent au monitoring (ErrorEvent + Sentry côté back).
        // Import dynamique pour casser le cycle client → logger → service →
        // client ; l'endpoint d'ingest est exclu pour éviter une boucle.
        if (
          response.status >= 500 &&
          !endpoint.includes('/monitoring/logs/frontend/ingest/')
        ) {
          void import('@/lib/monitoring/logger')
            .then(({ monLog }) =>
              monLog.error(
                `API ${response.status} sur ${options.method ?? 'GET'} ${endpoint}`,
                { status: response.status, endpoint }
              )
            )
            .catch(() => {});
        }

        throw new ApiError(
          errorData.message || errorData.detail || 'Une erreur est survenue',
          response.status,
          errorData
        );
      }

      // Retour vide pour les 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      // Parse et retour du JSON
      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Erreur réseau',
        0
      );
    }
  }

  /**
   * Rafraîchissement du token — accessible publiquement pour les modules
   * qui ne passent pas par `apiClient.request()` (ex: SSE EventSource).
   */
  async refreshToken(): Promise<boolean> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      // Utiliser l'endpoint de refresh unifié
      const refreshEndpoint = API_ENDPOINTS.AUTH.REFRESH;

      const response = await fetch(`${this.baseURL}${refreshEndpoint}`, {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      tokenManager.setTokens(data.access, data.refresh);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
      ...options,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }
}

// Instance du client API
export const apiClient = new ApiClient(API_CONFIG.baseURL);
