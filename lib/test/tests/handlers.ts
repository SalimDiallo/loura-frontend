import { API_CONFIG } from '@/lib/api';
import { http, HttpResponse } from 'msw';

const API_URL = API_CONFIG.baseURL;

/**
 * Handlers MSW pour mocker les endpoints d'authentification
 * Structure des réponses conforme au backend Django
 */
export const handlers = [
  // Login
  http.post(`${API_URL}/auth/login/`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        message: 'Login successful',
        data: {
          access: 'mock_access_token',
          refresh: 'mock_refresh_token',
          user: {
            id: '1',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            phone: null,
            avatar_url: null,
            language: null,
            timezone: null,
            date_of_birth: null,
            address: null,
            city: null,
            country: null,
            emergency_contact: null,
            email_verified: false,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
      });
    }

    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 });
  }),

  // Register
  http.post(`${API_URL}/auth/register/`, async ({ request }) => {
    const body = (await request.json()) as {
      email: string;
      password: string;
      password_confirm: string;
      first_name: string;
      last_name: string;
    };

    // Simuler une validation basique
    if (!body.email || !body.password || !body.first_name || !body.last_name) {
      return HttpResponse.json({ detail: 'Missing required fields' }, { status: 400 });
    }

    if (body.email === 'existing@example.com') {
      return HttpResponse.json({ detail: 'Email already exists' }, { status: 400 });
    }

    return HttpResponse.json({
      message: 'Registration successful',
      data: {
        access: 'mock_access_token',
        refresh: 'mock_refresh_token',
        user: {
          id: '2',
          email: body.email,
          first_name: body.first_name,
          last_name: body.last_name,
          phone: null,
          avatar_url: null,
          language: null,
          timezone: null,
          date_of_birth: null,
          address: null,
          city: null,
          country: null,
          emergency_contact: null,
          email_verified: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      },
    });
  }),

  // Logout
  http.post(`${API_URL}/auth/logout/`, () => {
    return HttpResponse.json({
      message: 'Logout successful',
    });
  }),

  // Refresh Token
  http.post(`${API_URL}/auth/token/refresh/`, async ({ request }) => {
    const body = (await request.json()) as { refresh: string };

    if (body.refresh === 'mock_refresh_token') {
      return HttpResponse.json({
        access: 'new_mock_access_token',
      });
    }

    return HttpResponse.json({ detail: 'Invalid refresh token' }, { status: 401 });
  }),

  // Current User (GET /auth/me/)
  http.get(`${API_URL}/auth/me/`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    // Retourne un BaseUser (pas wrapped dans data)
    return HttpResponse.json({
      id: '1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      phone: null,
      avatar_url: null,
      language: null,
      timezone: null,
      date_of_birth: null,
      address: null,
      city: null,
      country: null,
      emergency_contact: null,
      email_verified: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),
];
