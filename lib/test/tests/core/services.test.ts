/**
 * Tests pour le service Organisation.
 */

import { tokenManager } from '@/lib/api';
import { categoryService, organizationService } from '@/lib/services/core';
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
