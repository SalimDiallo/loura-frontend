# TanStack Query - Guide d'implémentation LOURA

## ✅ État actuel

TanStack Query est **entièrement configuré** et utilisé pour tous les fetches de l'application.

### Architecture en 3 couches

```
┌─────────────────────────────────────────┐
│  COMPOSANTS / PAGES                     │
│  - Utilisent les hooks                  │
│  - Pas de fetch direct                  │
└─────────────┬───────────────────────────┘
              │ appelle
┌─────────────▼───────────────────────────┐
│  HOOKS (lib/hooks/)                     │
│  - useQuery / useMutation               │
│  - Gestion du cache TanStack Query      │
│  - Invalidation des queries             │
└─────────────┬───────────────────────────┘
              │ appelle
┌─────────────▼───────────────────────────┐
│  SERVICES (lib/services/ ou lib/api/)   │
│  - Logique métier pure                  │
│  - Appels à apiClient                   │
│  - Types & transformations              │
└─────────────┬───────────────────────────┘
              │ appelle
┌─────────────▼───────────────────────────┐
│  API CLIENT (lib/api/client.ts)         │
│  - Fetch natif                          │
│  - Gestion tokens JWT                   │
│  - Auto-refresh des tokens              │
│  - Gestion des erreurs HTTP             │
└─────────────────────────────────────────┘
```

---

## 📦 Configuration

### 1. QueryProvider - `components/providers.tsx`

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,        // 5 minutes
        gcTime: 10 * 60 * 1000,          // 10 minutes
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
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
```

### 2. Intégration Layout - `app/layout.tsx`

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
```

---

## 🎯 Pattern d'implémentation

### Exemple complet : Authentication

#### 1. Service - `lib/services/auth/auth.service.ts`

```typescript
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UnifiedUser;
  access: string;
  refresh: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
      { requiresAuth: false }
    );

    // Logique métier (save tokens, etc.)
    if (response.access && response.refresh) {
      tokenManager.setTokens(response.access, response.refresh);
    }

    return response;
  },

  async getCurrentUser(): Promise<UnifiedUser> {
    return apiClient.get<UnifiedUser>(API_ENDPOINTS.AUTH.ME);
  },
};
```

#### 2. Hook Mutation - `lib/hooks/auth/useLogin.ts`

```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, type LoginCredentials, type AuthResponse } from '@/lib/services/auth/auth.service';

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      return authService.login(credentials);
    },

    onSuccess: (data) => {
      // Mettre à jour le cache immédiatement
      queryClient.setQueryData(['currentUser'], data.user);

      // Invalider les queries liées
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      // Events custom si nécessaire
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('loura:login', { detail: data }));
      }
    },

    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
}
```

#### 3. Hook Query - `lib/hooks/auth/useCurrentUser.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { authService, type UnifiedUser } from '@/lib/services/auth/auth.service';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<UnifiedUser> => {
      return authService.getCurrentUser();
    },

    // Ne fetch que si on a un token
    enabled: typeof window !== 'undefined'
      ? !!localStorage.getItem('loura_access_token')
      : false,

    staleTime: 2 * 60 * 1000,     // 2 minutes
    gcTime: 10 * 60 * 1000,       // 10 minutes
    retry: 1,
    refetchOnWindowFocus: true,
  });
}

// Hook utilitaire
export function useIsAuthenticated() {
  const { data: user, isLoading } = useCurrentUser();

  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}
```

#### 4. Utilisation dans un composant

```typescript
'use client';

import { useLogin } from '@/lib/hooks/auth/useLogin';
import { useCurrentUser } from '@/lib/hooks/auth/useCurrentUser';

export default function LoginPage() {
  const login = useLogin();
  const { data: user, isLoading } = useCurrentUser();

  const handleSubmit = async (data: LoginCredentials) => {
    try {
      await login.mutateAsync(data);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Logging in...' : 'Login'}
      </button>
      {login.isError && <p>Error: {login.error.message}</p>}
    </form>
  );
}
```

---

## 📋 Template pour nouvelle entité

### 1. Créer le service

```typescript
// lib/services/[entity]/[entity].service.ts
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';

export interface Entity {
  id: string;
  name: string;
  // ... autres champs
}

export interface CreateEntityData {
  name: string;
  // ... autres champs
}

export const entityService = {
  async getAll(): Promise<Entity[]> {
    return apiClient.get<Entity[]>(API_ENDPOINTS.ENTITY.LIST);
  },

  async getById(id: string): Promise<Entity> {
    return apiClient.get<Entity>(API_ENDPOINTS.ENTITY.DETAIL(id));
  },

  async create(data: CreateEntityData): Promise<Entity> {
    return apiClient.post<Entity>(API_ENDPOINTS.ENTITY.CREATE, data);
  },

  async update(id: string, data: Partial<CreateEntityData>): Promise<Entity> {
    return apiClient.patch<Entity>(API_ENDPOINTS.ENTITY.UPDATE(id), data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.ENTITY.DELETE(id));
  },
};
```

### 2. Créer les hooks

```typescript
// lib/hooks/entity/useEntities.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { entityService, type Entity } from '@/lib/services/entity/entity.service';

export function useEntities() {
  return useQuery({
    queryKey: ['entities'],
    queryFn: () => entityService.getAll(),
  });
}

export function useEntity(id: string) {
  return useQuery({
    queryKey: ['entities', id],
    queryFn: () => entityService.getById(id),
    enabled: !!id,
  });
}
```

```typescript
// lib/hooks/entity/useCreateEntity.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { entityService, type CreateEntityData, type Entity } from '@/lib/services/entity/entity.service';

export function useCreateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEntityData) => entityService.create(data),

    onSuccess: () => {
      // Invalider la liste pour forcer un refetch
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
  });
}
```

```typescript
// lib/hooks/entity/useUpdateEntity.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { entityService, type CreateEntityData, type Entity } from '@/lib/services/entity/entity.service';

export function useUpdateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEntityData> }) =>
      entityService.update(id, data),

    onSuccess: (data) => {
      // Mettre à jour l'entité dans le cache
      queryClient.setQueryData(['entities', data.id], data);

      // Invalider la liste
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
  });
}
```

```typescript
// lib/hooks/entity/useDeleteEntity.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { entityService } from '@/lib/services/entity/entity.service';

export function useDeleteEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => entityService.delete(id),

    onSuccess: () => {
      // Invalider la liste
      queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
  });
}
```

### 3. Créer l'index des hooks

```typescript
// lib/hooks/entity/index.ts
export { useEntities, useEntity } from './useEntities';
export { useCreateEntity } from './useCreateEntity';
export { useUpdateEntity } from './useUpdateEntity';
export { useDeleteEntity } from './useDeleteEntity';
```

---

## 🔑 Concepts clés TanStack Query

### Query Keys

Les query keys sont des identifiants uniques pour chaque requête :

```typescript
// Hiérarchiques et organisés
['entities']                    // Liste de toutes les entités
['entities', id]                // Une entité spécifique
['entities', id, 'details']     // Détails d'une entité
['entities', { status: 'active' }] // Entités filtrées
```

### Invalidation du cache

```typescript
// Invalider toutes les queries qui commencent par 'entities'
queryClient.invalidateQueries({ queryKey: ['entities'] });

// Invalider une query spécifique
queryClient.invalidateQueries({ queryKey: ['entities', id] });

// Invalider toutes les queries
queryClient.invalidateQueries();
```

### Mise à jour optimiste

```typescript
export function useUpdateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => entityService.update(id, data),

    // Avant la requête
    onMutate: async ({ id, data }) => {
      // Annuler les refetch en cours
      await queryClient.cancelQueries({ queryKey: ['entities', id] });

      // Snapshot de l'ancienne valeur
      const previousEntity = queryClient.getQueryData(['entities', id]);

      // Mise à jour optimiste
      queryClient.setQueryData(['entities', id], (old) => ({
        ...old,
        ...data,
      }));

      // Retourner le snapshot pour rollback si erreur
      return { previousEntity };
    },

    // Si erreur, rollback
    onError: (err, variables, context) => {
      if (context?.previousEntity) {
        queryClient.setQueryData(
          ['entities', variables.id],
          context.previousEntity
        );
      }
    },

    // Toujours invalider après
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entities', variables.id] });
    },
  });
}
```

### Pagination

```typescript
export function useEntities(page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: ['entities', { page, pageSize }],
    queryFn: () => entityService.getAll({ page, pageSize }),
    keepPreviousData: true, // Garde les données de la page précédente pendant le chargement
  });
}
```

### Infinite Queries

```typescript
export function useInfiniteEntities() {
  return useInfiniteQuery({
    queryKey: ['entities', 'infinite'],
    queryFn: ({ pageParam = 1 }) => entityService.getAll({ page: pageParam }),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined;
    },
  });
}
```

---

## 🚫 Anti-patterns à éviter

### ❌ NE PAS utiliser fetch directement dans les composants

```typescript
// ❌ MAUVAIS
export default function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/entities')
      .then(res => res.json())
      .then(setData);
  }, []);
}
```

### ❌ NE PAS utiliser apiClient directement dans les composants

```typescript
// ❌ MAUVAIS
export default function MyComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiClient.get('/entities').then(setData);
  }, []);
}
```

### ✅ TOUJOURS utiliser les hooks TanStack Query

```typescript
// ✅ BON
export default function MyComponent() {
  const { data, isLoading, error } = useEntities();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Render data */}</div>;
}
```

---

## 📊 DevTools

En développement, les React Query DevTools sont activées automatiquement :

- Bouton en bas de l'écran
- Voir toutes les queries actives
- État du cache
- Refetch manuel
- Invalider des queries

---

## 🔗 Références

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Query Patterns](https://tkdodo.eu/blog/practical-react-query)
- Provider: `components/providers.tsx`
- Hooks auth existants: `lib/hooks/auth/`
- Services: `lib/services/` et `lib/api/`
