import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Serveur MSW pour mocker les API pendant les tests
 */
export const server = setupServer(...handlers);
