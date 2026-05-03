/**
 * Service de soumission de feedback utilisateur.
 *
 * L'endpoint backend accepte les appels anonymes (AllowAny) : on n'exige
 * donc pas d'authentification. Si l'utilisateur est connecté, le token
 * JWT sera joint automatiquement par `apiClient` et le backend rattachera
 * le feedback au `BaseUser`.
 */
import { apiClient, tokenManager } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

export type FeedbackType = 'idea' | 'bug' | 'love' | 'other';

export interface FeedbackPayload {
  type: FeedbackType;
  message: string;
  rating?: number | null;
  email?: string;
  page_url?: string;
  user_agent?: string;
  organization_slug?: string;
}

export interface FeedbackCreateResponse {
  message: string;
  id: number;
}

export type FeedbackStatus = 'new' | 'reviewed' | 'resolved';

export interface FeedbackItem {
  id: number;
  type: FeedbackType;
  rating: number | null;
  message: string;
  status: FeedbackStatus;
  user: number | null;
  user_email: string | null;
  email: string;
  page_url: string;
  user_agent: string;
  organization_slug: string;
  created_at: string;
}

export interface FeedbackListFilters {
  page?: number;
  page_size?: number;
  type?: FeedbackType;
  status?: FeedbackStatus;
  q?: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

class FeedbackService {
  async submit(payload: FeedbackPayload): Promise<FeedbackCreateResponse> {
    // Si l'utilisateur est connecté, on attache le JWT pour que le
    // backend associe le feedback à son ``BaseUser``. Sinon, appel
    // anonyme (l'endpoint est AllowAny).
    const hasToken = !!tokenManager.getAccessToken();
    return apiClient.post<FeedbackCreateResponse>(
      API_ENDPOINTS.FEEDBACK.CREATE,
      payload,
      { requiresAuth: hasToken },
    );
  }

  async list(filters: FeedbackListFilters = {}) {
    return apiClient.get<PaginatedResponse<FeedbackItem>>(
      API_ENDPOINTS.FEEDBACK.LIST,
      { params: filters as Record<string, unknown> },
    );
  }

  async updateStatus(id: number, status: FeedbackStatus) {
    return apiClient.patch<FeedbackItem>(API_ENDPOINTS.FEEDBACK.DETAIL(id), {
      status,
    });
  }

  async remove(id: number) {
    return apiClient.delete<void>(API_ENDPOINTS.FEEDBACK.DETAIL(id));
  }
}

export const feedbackService = new FeedbackService();
