import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './lib/test/tests/server';

// Démarrer le serveur MSW avant tous les tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Nettoyer après chaque test
afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
});

// Arrêter le serveur après tous les tests
afterAll(() => server.close());

// Mock de window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
