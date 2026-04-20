'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * Configuration TanStack Query optimisée pour LOURA
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Données considérées fraîches pendant 5 minutes
        staleTime: 5 * 60 * 1000,
        // Garde les données en cache pendant 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry une fois en cas d'erreur
        retry: 1,
        // Ne pas refetch automatiquement au focus
        refetchOnWindowFocus: false,
        // Refetch à la reconnexion
        refetchOnReconnect: true,
        // Refetch en arrière-plan quand stale
        refetchOnMount: true,
      },
      mutations: {
        // Ne pas retry les mutations
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: toujours créer un nouveau client
    return makeQueryClient();
  } else {
    // Browser: réutiliser le client singleton
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Provider TanStack Query pour l'application
 * Inclut les devtools en développement
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
