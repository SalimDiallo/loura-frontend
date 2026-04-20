/**
 * MSW Handlers pour le module Core (organisations + catégories + settings).
 */

import { API_CONFIG } from '@/lib/api';
import { http, HttpResponse } from 'msw';

const API_URL = API_CONFIG.baseURL;

// ============================================================================
// MOCK DATA
// ============================================================================

const mockCategories = [
  { id: 'cat-1', name: 'Commerce', description: 'Activités commerciales', icon: 'store' },
  { id: 'cat-2', name: 'Santé', description: 'Activités de santé', icon: 'heart-pulse' },
  { id: 'cat-3', name: 'Technologie', description: 'IT et services tech', icon: 'monitor' },
];

const mockOrganizations = [
  {
    id: 'org-1',
    name: 'Acme Corp',
    slug: 'acme-corp',
    logo: null,
    category: mockCategories[0],
    owner_email: 'test@example.com',
    country: 'Guinée',
    currency: 'GNF',
    is_active: true,
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'org-2',
    name: 'Tech Lab',
    slug: 'tech-lab',
    logo: null,
    category: mockCategories[2],
    owner_email: 'test@example.com',
    country: 'Sénégal',
    currency: 'XOF',
    is_active: true,
    created_at: '2026-02-10T10:00:00Z',
    updated_at: '2026-02-10T10:00:00Z',
  },
  {
    id: 'org-3',
    name: 'Inactive Inc',
    slug: 'inactive-inc',
    logo: null,
    category: null,
    owner_email: 'test@example.com',
    country: 'France',
    currency: 'EUR',
    is_active: false,
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:00:00Z',
  },
];

const mockSettingsStore: Record<string, Record<string, unknown>> = {};

function getDefaultSettings(orgId: string) {
  return {
    id: `settings-${orgId}`,
    organization: orgId,
    primary_color: '#6366F1',
    secondary_color: '#E5E7EB',
    font_family: 'Inter',
    address: '',
    phone: '',
    email: '',
    website: '',
    tax_id: '',
    tax_rate: '18.00',
    invoice_footer: '',
    invoice_prefix: 'FAC',
    receipt_prefix: 'REC',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
  };
}

function getSettings(orgId: string) {
  if (!mockSettingsStore[orgId]) {
    mockSettingsStore[orgId] = getDefaultSettings(orgId);
  }
  return mockSettingsStore[orgId];
}

// ============================================================================
// HANDLERS
// ============================================================================

export const coreHandlers = [
  // GET /core/categories/ — Liste des catégories (pas de pagination)
  http.get(`${API_URL}/core/categories/`, () => {
    return HttpResponse.json(mockCategories);
  }),

  // GET /core/organizations/ — Liste paginée
  http.get(`${API_URL}/core/organizations/`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('page_size') || '20');

    let filtered = mockOrganizations;
    if (search) {
      filtered = filtered.filter(
        (org) =>
          org.name.toLowerCase().includes(search) ||
          org.country.toLowerCase().includes(search)
      );
    }

    const start = (page - 1) * pageSize;
    const results = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      count: filtered.length,
      total_pages: Math.ceil(filtered.length / pageSize),
      current_page: page,
      page_size: pageSize,
      next: page * pageSize < filtered.length ? `${API_URL}/core/organizations/?page=${page + 1}` : null,
      previous: page > 1 ? `${API_URL}/core/organizations/?page=${page - 1}` : null,
      results,
    });
  }),

  // GET /core/organizations/:id/ — Détail
  http.get(`${API_URL}/core/organizations/:id/`, ({ params }) => {
    const org = mockOrganizations.find((o) => o.id === params.id);
    if (!org) {
      return HttpResponse.json({ message: 'Non trouvé.' }, { status: 404 });
    }
    return HttpResponse.json(org);
  }),

  // POST /core/organizations/ — Création
  http.post(`${API_URL}/core/organizations/`, async ({ request }) => {
    const body = (await request.json()) as { name: string; category_id?: string; country?: string; currency?: string };

    if (!body.name || body.name.trim().length === 0) {
      return HttpResponse.json(
        { name: ['Ce champ est obligatoire.'] },
        { status: 400 }
      );
    }

    const category = body.category_id
      ? mockCategories.find((c) => c.id === body.category_id) || null
      : null;

    const newOrg = {
      id: 'org-new-' + Date.now(),
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      logo: null,
      category,
      owner_email: 'test@example.com',
      country: body.country || '',
      currency: body.currency || 'GNF',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json(
      { message: 'Organisation créée avec succès.', data: newOrg },
      { status: 201 }
    );
  }),

  // PATCH /core/organizations/:id/ — Mise à jour
  http.patch(`${API_URL}/core/organizations/:id/`, async ({ params, request }) => {
    const org = mockOrganizations.find((o) => o.id === params.id);
    if (!org) {
      return HttpResponse.json({ message: 'Non trouvé.' }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const updated = { ...org, ...body, updated_at: new Date().toISOString() };

    return HttpResponse.json({
      message: 'Organisation mise à jour.',
      data: updated,
    });
  }),

  // POST /core/organizations/:id/activate/
  http.post(`${API_URL}/core/organizations/:id/activate/`, ({ params }) => {
    const org = mockOrganizations.find((o) => o.id === params.id);
    if (!org) {
      return HttpResponse.json({ message: 'Non trouvé.' }, { status: 404 });
    }
    return HttpResponse.json({
      message: 'Organisation activée.',
      data: { ...org, is_active: true },
    });
  }),

  // POST /core/organizations/:id/deactivate/
  http.post(`${API_URL}/core/organizations/:id/deactivate/`, ({ params }) => {
    const org = mockOrganizations.find((o) => o.id === params.id);
    if (!org) {
      return HttpResponse.json({ message: 'Non trouvé.' }, { status: 404 });
    }
    return HttpResponse.json({
      message: 'Organisation désactivée.',
      data: { ...org, is_active: false },
    });
  }),

  // POST /core/organizations/:id/logo/
  http.post(`${API_URL}/core/organizations/:id/logo/`, ({ params }) => {
    const org = mockOrganizations.find((o) => o.id === params.id);
    if (!org) {
      return HttpResponse.json({ message: 'Non trouvé.' }, { status: 404 });
    }
    return HttpResponse.json({
      message: 'Logo mis à jour.',
      data: { ...org, logo: '/media/organizations/logos/test.png' },
    });
  }),

  // DELETE /core/organizations/:id/logo/
  http.delete(`${API_URL}/core/organizations/:id/logo/`, ({ params }) => {
    const org = mockOrganizations.find((o) => o.id === params.id);
    if (!org) {
      return HttpResponse.json({ message: 'Non trouvé.' }, { status: 404 });
    }
    return HttpResponse.json({
      message: 'Logo supprimé.',
      data: { ...org, logo: null },
    });
  }),

  // ========================================================================
  // ORGANIZATION SETTINGS
  // ========================================================================

  // GET /core/organizations/:id/settings/
  http.get(`${API_URL}/core/organizations/:id/settings/`, ({ params }) => {
    const orgId = params.id as string;
    const org = mockOrganizations.find((o) => o.id === orgId);
    if (!org) {
      return HttpResponse.json({ message: 'Non trouvé.' }, { status: 404 });
    }
    return HttpResponse.json(getSettings(orgId));
  }),

  // PATCH /core/organizations/:id/settings/
  http.patch(`${API_URL}/core/organizations/:id/settings/`, async ({ params, request }) => {
    const orgId = params.id as string;
    const org = mockOrganizations.find((o) => o.id === orgId);
    if (!org) {
      return HttpResponse.json({ message: 'Non trouvé.' }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const current = getSettings(orgId);
    const updated = { ...current, ...body, updated_at: new Date().toISOString() };
    mockSettingsStore[orgId] = updated;

    return HttpResponse.json(updated);
  }),
];

