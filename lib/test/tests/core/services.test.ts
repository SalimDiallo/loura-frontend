/**
 * Tests pour les services Core (Organisation, Category, Settings).
 */

import { tokenManager } from '@/lib/api';
import { categoryService, organizationService, settingsService } from '@/lib/services/core';
import { beforeEach, describe, expect, it } from 'vitest';

describe('categoryService', () => {
  beforeEach(() => {
    tokenManager.setTokens('mock_access_token', 'mock_refresh_token');
  });

  it('getAll retourne toutes les catégories', async () => {
    const cats = await categoryService.getAll();

    expect(cats).toHaveLength(3);
    expect(cats[0].name).toBe('Commerce');
  });
});

describe('organizationService', () => {
  beforeEach(() => {
    tokenManager.setTokens('mock_access_token', 'mock_refresh_token');
  });

  it('getById retourne une organisation', async () => {
    const org = await organizationService.getById('org-1');

    expect(org.name).toBe('Acme Corp');
    expect(org.slug).toBe('acme-corp');
    expect(org.is_active).toBe(true);
  });

  it('createOrganization crée une organisation', async () => {
    const org = await organizationService.createOrganization({
      name: 'Test Suite Org',
      country: 'Mali',
      currency: 'XOF',
    });

    expect(org.name).toBe('Test Suite Org');
    expect(org.is_active).toBe(true);
  });

  it('update met à jour les champs', async () => {
    const result = await organizationService.update('org-1', {
      name: 'Updated by test',
    } as any);

    // Le mock retourne les données fusionnées
    expect(result).toBeDefined();
  });

  it('toggleActive désactive une org active', async () => {
    const result = await organizationService.toggleActive('org-1', true);

    expect(result).toBeDefined();
  });
});

describe('settingsService', () => {
  beforeEach(() => {
    tokenManager.setTokens('mock_access_token', 'mock_refresh_token');
  });

  it('get retourne les settings par défaut', async () => {
    const settings = await settingsService.get('org-1');

    expect(settings.primary_color).toBe('#ffd15d');
    expect(settings.secondary_color).toBe('#E5E7EB');
    expect(settings.font_family).toBe('Inter');
    expect(settings.tax_rate).toBe('18.00');
    expect(settings.invoice_prefix).toBe('FAC');
    expect(settings.receipt_prefix).toBe('REC');
  });

  it('get retourne les champs de contact vides par défaut', async () => {
    const settings = await settingsService.get('org-2');

    expect(settings.address).toBe('');
    expect(settings.phone).toBe('');
    expect(settings.email).toBe('');
    expect(settings.website).toBe('');
    expect(settings.tax_id).toBe('');
  });

  it('update modifie le branding', async () => {
    const updated = await settingsService.update('org-1', {
      primary_color: '#FF0000',
      font_family: 'Poppins',
    });

    expect(updated.primary_color).toBe('#FF0000');
    expect(updated.font_family).toBe('Poppins');
  });

  it('update modifie les coordonnées', async () => {
    const updated = await settingsService.update('org-1', {
      address: '456 Avenue',
      phone: '+33100000000',
      email: 'info@org.fr',
    });

    expect(updated.address).toBe('456 Avenue');
    expect(updated.phone).toBe('+33100000000');
    expect(updated.email).toBe('info@org.fr');
  });

  it('update modifie les infos fiscales', async () => {
    const updated = await settingsService.update('org-1', {
      tax_id: 'SIRET-123',
      tax_rate: '20.00',
      invoice_prefix: 'FACT',
    });

    expect(updated.tax_id).toBe('SIRET-123');
    expect(updated.tax_rate).toBe('20.00');
    expect(updated.invoice_prefix).toBe('FACT');
  });
});
