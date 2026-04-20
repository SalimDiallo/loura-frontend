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

  // Update Profile (PATCH /auth/profile/update/)
  http.patch(`${API_URL}/auth/profile/update/`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as Record<string, unknown>;

    // Retourner le profil mis à jour
    return HttpResponse.json({
      message: 'Profil mis à jour avec succès.',
      data: {
        id: '1',
        email: 'test@example.com',
        first_name: body.first_name || 'Test',
        last_name: body.last_name || 'User',
        phone: body.phone || null,
        avatar_url: body.avatar_url || null,
        language: body.language || 'fr',
        timezone: body.timezone || 'Africa/Conakry',
        date_of_birth: body.date_of_birth || null,
        address: body.address || null,
        city: body.city || null,
        country: body.country || null,
        emergency_contact: body.emergency_contact || null,
        email_verified: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  }),

  // Change Password (POST /auth/profile/change-password/)
  http.post(`${API_URL}/auth/profile/change-password/`, async ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      old_password: string;
      new_password: string;
      new_password_confirm: string;
    };

    // Vérifier que l'ancien mot de passe est correct (mock)
    if (body.old_password !== 'OldPassword123!') {
      return HttpResponse.json(
        {
          message: 'Erreur lors du changement de mot de passe.',
          errors: {
            old_password: ["L'ancien mot de passe est incorrect."],
          },
        },
        { status: 400 }
      );
    }

    // Vérifier que les nouveaux mots de passe correspondent
    if (body.new_password !== body.new_password_confirm) {
      return HttpResponse.json(
        {
          message: 'Erreur lors du changement de mot de passe.',
          errors: {
            new_password_confirm: ['Les mots de passe ne correspondent pas.'],
          },
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      message: 'Mot de passe modifié avec succès.',
    });
  }),
];
