/**
 * Tests pour les constantes Core (countries, currencies).
 */

import { COUNTRIES, CURRENCIES } from '@/lib/constants/core';
import { describe, it, expect } from 'vitest';

describe('COUNTRIES', () => {
  it('contient au moins 10 pays', () => {
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(10);
  });

  it('chaque pays a un id, un name', () => {
    for (const country of COUNTRIES) {
      expect(country.id).toBeTruthy();
      expect(country.name).toBeTruthy();
    }
  });

  it('id et name sont identiques (le nom EST l\'id)', () => {
    for (const country of COUNTRIES) {
      expect(country.id).toBe(country.name);
    }
  });

  it('contient Guinée comme premier pays', () => {
    expect(COUNTRIES[0].name).toBe('Guinée');
  });

  it('les noms sont uniques', () => {
    const names = COUNTRIES.map((c) => c.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

describe('CURRENCIES', () => {
  it('contient au moins 5 devises', () => {
    expect(CURRENCIES.length).toBeGreaterThanOrEqual(5);
  });

  it('chaque devise a un id, un name et un subtitle', () => {
    for (const currency of CURRENCIES) {
      expect(currency.id).toBeTruthy();
      expect(currency.name).toBeTruthy();
      expect(currency.subtitle).toBeTruthy();
    }
  });

  it('contient GNF comme première devise', () => {
    expect(CURRENCIES[0].id).toBe('GNF');
    expect(CURRENCIES[0].name).toBe('Franc guinéen');
  });

  it('les ids sont des codes de 3 lettres', () => {
    for (const currency of CURRENCIES) {
      expect(currency.id).toMatch(/^[A-Z]{3}$/);
    }
  });

  it('les ids sont uniques', () => {
    const ids = CURRENCIES.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
