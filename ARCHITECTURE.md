# Loura Frontend Architecture & Authentication Implementation

## Executive Summary

**Project Type:** Next.js 16.1.7 with React 19 (TypeScript, Tailwind CSS)
**Authentication Model:** Unified JWT-based auth for Admin and Employee roles
**State Management:** TanStack Query for server state + localStorage for persistence
**API Integration:** Centralized fetch-based API client with automatic token refresh
**Offline Support:** Comprehensive offline-first architecture with caching & sync queues

---

## 1. PROJECT STRUCTURE

### Core Directories:
```
lourafrontend/
├── app/                          # Next.js App Router
│   ├── auth/
│   │   ├── page.tsx             # Login page (unified for admin/employee)
│   │   └── register/page.tsx    # Registration page (admin only)
│   ├── layout.tsx               # Root layout with ThemeProvider
│   └── page.tsx                 # Home page (placeholder)
├── components/
│   └── ui/                       # Reusable UI components (shadcn-based)
│       ├── form.tsx             # Form wrapper (react-hook-form integration)
│       ├── form-fields.tsx      # Field components (input, email, password, etc.)
│       ├── offline-indicator.tsx # Online/offline status badge
│       ├── cache-progress-indicator.tsx # Precache progress indicator
│       └── ... (30+ UI components)
├── lib/
│   ├── api/                      # API client & configuration
│   │   ├── client.ts            # ApiClient class, tokenManager, ApiError
│   │   ├── config.ts            # API_CONFIG, API_ENDPOINTS, STORAGE_KEYS
│   │   ├── base-service.ts      # BaseService & ActivatableService classes
│   │   └── index.ts             # Centralized exports
│   ├── services/
│   │   └── auth/
│   │       ├── auth.service.ts  # authService with unified auth methods
│   │       └── index.ts         # Auth service exports
│   ├── hooks/                    # Custom React hooks with TanStack Query
│   │   ├── auth/                # Authentication hooks (IMPLEMENTED)
│   │   │   ├── useLogin.ts      # Login mutation
│   │   │   ├── useRegister.ts   # Register mutation
│   │   │   ├── useLogout.ts     # Logout mutation
│   │   │   ├── useCurrentUser.ts # Current user query
│   │   │   └── useRefreshToken.ts # Token refresh
│   │   ├── useOnlineStatus.ts   # Online/offline status (PENDING)
│   │   ├── useSyncStatus.ts     # Sync queue status (PENDING)
│   │   ├── useUser.ts           # Current user hook (PENDING)
│   │   ├── useZodForm.ts        # Form hook with Zod validation (PENDING)
│   │   └── usePDF.ts            # PDF preview state (PENDING)
│   ├── offline/                  # Offline-first architecture (PARTIAL)
│   │   ├── cache-manager.ts     # Unified cache/API wrapper
│   │   ├── route-discovery.ts   # Route precaching
│   │   ├── api-discovery.ts     # API endpoint precaching
│   │   └── sync-queue.ts        # Offline mutation queue
│   ├── types/                    # TypeScript type definitions
│   ├── config.ts                # Site configuration & routes
│   └── utils.ts                 # Utility functions
├── components/
│   ├── providers.tsx            # QueryProvider (TanStack Query)
│   └── theme-provider.tsx       # Theme provider (next-themes)
├── hooks/                        # Empty directory (hooks in lib/hooks)
├── public/                       # Static assets
├── package.json                  # Dependencies & scripts
├── tsconfig.json                # TypeScript configuration
├── next.config.mjs              # Next.js configuration
└── eslint.config.mjs            # ESLint configuration
```

---

## 2. AUTHENTICATION IMPLEMENTATION

### Architecture Pattern: Unified Authentication Service

#### 2.1 Key Files:

**File:** `/mnt/data/Projets/loura/LOURATECH/lourafrontend/lib/services/auth/auth.service.ts`

**Core Interfaces:**
```typescript
// Unified login credentials (works for both admin and employee)
interface LoginCredentials {
  email: string;
  password: string;
}

// Registration (admin only)
interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

// Unified response
interface AuthResponse {
  user: UnifiedUser;
  user_type: 'admin' | 'employee';
  access: string;
  refresh: string;
  message: string;
  organization?: {
    id: string;
    name: string;
    subdomain: string;
  };
}

// Unified user type (supports both admin and employee fields)
interface UnifiedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: 'admin' | 'employee';
  is_active: boolean;
  // ... admin-specific fields (organizations[])
  // ... employee-specific fields (organization, employee_id, department, position)
}
```

#### 2.2 AuthService Methods:

```typescript
authService = {
  // Authentication
  register(data: RegisterData): Promise<AuthResponse>
  login(credentials: LoginCredentials): Promise<AuthResponse>
  logout(): Promise<void>
  
  // Token & User Management
  getStoredUser(): UnifiedUser | null
  getCurrentUser(): Promise<UnifiedUser>
  updateProfile(data: Partial<UnifiedUser>): Promise<UnifiedUser>
  changePassword(data: ChangePasswordData): Promise<{ message: string }>
  
  // State Checking
  isAuthenticated(): boolean
  isAdmin(): boolean
  isEmployee(): boolean
  getUserType(): 'admin' | 'employee' | null
  
  // Organization Management
  getCurrentOrganization()
  getMyOrganizations(): Promise<{organizations: [...], count: number}>
  selectOrganization(organizationId: string): Promise<AuthResponse>
  switchOrganization(organizationId: string): Promise<AuthResponse>
}
```

#### 2.3 Token Management:

**File:** `/mnt/data/Projets/loura/LOURATECH/lourafrontend/lib/api/client.ts`

```typescript
const tokenManager = {
  getAccessToken(): string | null
  getRefreshToken(): string | null
  setTokens(access: string, refresh: string): void
  clearTokens(): void
  saveUser(user: any): void
  getUser(): any
}

// Tokens stored in localStorage:
// - loura_access_token (JWT)
// - loura_refresh_token (JWT)
// - user (JSON serialized)
```

#### 2.4 Token Refresh Flow:

The `ApiClient` automatically handles:
1. **401 Unauthorized Response:** Attempts to refresh tokens
2. **Refresh Endpoint:** `/auth/refresh/` with refresh token
3. **Retry Logic:** Retries original request with new access token
4. **Fallback:** On refresh failure, clears tokens and redirects to `/auth`

---

## 3. API CLIENT ARCHITECTURE

### 3.1 API Client Class

**File:** `/mnt/data/Projets/loura/LOURATECH/lourafrontend/lib/api/client.ts`

```typescript
class ApiClient {
  private baseURL: string;
  
  // Generic method used by all HTTP verbs
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T>
  
  // HTTP Methods
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T>
  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T>
  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T>
  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T>
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T>
  
  // Token refresh (public for non-request flows like EventSource)
  async refreshToken(): Promise<boolean>
}

// Singleton instance
export const apiClient = new ApiClient(API_CONFIG.baseURL)
```

### 3.2 Request Options & Features:

```typescript
interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;        // Include auth header? (default: true)
  params?: Record<string, any>;  // Query parameters (auto-formatted)
}
```

**Key Features:**
- Automatic Bearer token injection in Authorization header
- Query parameter building from object
- Automatic organization_subdomain parameter injection (for non-auth endpoints)
- 401 handling with automatic token refresh + retry
- Error handling with custom `ApiError` class

### 3.3 API Configuration

**File:** `/mnt/data/Projets/loura/LOURATECH/lourafrontend/lib/api/config.ts`

```typescript
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
}

// Centralized endpoint definitions organized by module:
const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    LOGOUT: '/auth/logout/',
    REFRESH: '/auth/refresh/',
    ME: '/auth/me/',
    UPDATE_PROFILE: '/auth/profile/update/',
    CHANGE_PASSWORD: '/auth/profile/change-password/',
    MY_ORGANIZATIONS: '/auth/my-organizations/',
    SELECT_ORGANIZATION: '/auth/select-organization/',
    SWITCH_ORGANIZATION: '/auth/switch-organization/',
  },
  CORE: { ... },      // Organizations, Categories, Modules
  HR: { ... },        // Employees, Departments, Leaves, Payroll, etc.
  INVENTORY: { ... }, // Products, Stock, Orders, Sales, etc.
  AI: { ... },        // Chat & Conversations
  NOTIFICATIONS: { ... }
}
```

---

## 4. STATE MANAGEMENT

### 4.1 Architecture: TanStack Query + Service Layer

**Pattern:** TanStack Query for server state + localStorage for persistence

**Key Components:**
1. **QueryProvider** (`components/providers.tsx`) - TanStack Query provider with optimized config
2. **Hooks Layer** (`lib/hooks/`) - useQuery/useMutation hooks wrapping services
3. **Service Layer** (`lib/services/`, `lib/api/`) - Business logic using apiClient
4. **API Client** (`lib/api/client.ts`) - HTTP client with fetch + token management
5. **tokenManager** - JWT & user in localStorage
6. **Event System** - Custom events for state changes

### 4.2 TanStack Query Configuration

```typescript
// components/providers.tsx
const queryClient = new QueryClient({
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
```

**Voir le guide complet:** `TANSTACK_QUERY_GUIDE.md`

### 4.3 Storage Keys

```typescript
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'loura_access_token',
  REFRESH_TOKEN: 'loura_refresh_token',
  USER: 'loura_user',
}

// Plus custom keys:
localStorage.setItem('current_organization_slug', orgSlug)
```

### 4.4 State Access Pattern:

```typescript
// Get current user
const user = authService.getStoredUser()
const user = await authService.getCurrentUser()

// Get authentication status
const isAuth = authService.isAuthenticated()
const isAdmin = authService.isAdmin()
const isEmployee = authService.isEmployee()

// Get user type
const userType = authService.getUserType()

// Get current organization
const org = authService.getCurrentOrganization()
```

### 4.5 State Change Events:

```typescript
// Custom event fired on login (from auth.service.ts line 176):
window.dispatchEvent(new CustomEvent('loura:login'))

// This triggers offline-first warmup/precaching
```

---

## 5. FORM HANDLING

### 5.1 Form Components Architecture

**Pattern:** shadcn/ui + react-hook-form + Zod validation

**Key Files:**
- `/mnt/data/Projets/loura/LOURATECH/lourafrontend/components/ui/form.tsx` - Form wrapper & context
- `/mnt/data/Projets/loura/LOURATECH/lourafrontend/components/ui/form-fields.tsx` - Field components

### 5.2 Available Form Field Components:

```typescript
// Basic fields
<FormInputField name="field" label="Label" required />
<FormEmailField name="email" label="Email" required />
<FormPasswordField name="password" label="Password" required />
<FormTextareaField name="bio" label="Bio" />
<FormNumberField name="age" label="Age" min={0} max={120} />
<FormDateField name="birthDate" label="Birth Date" />
<FormSelectField 
  name="role" 
  label="Role"
  options={[
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' }
  ]}
/>
```

### 5.3 Form Context & Hooks:

```typescript
// From form.tsx
const Form = FormProvider  // react-hook-form's FormProvider

// Available hooks within <Form>
const { control } = useFormContext()
const fieldState = useFormField()

// Custom hook (PENDING IMPLEMENTATION):
const form = useZodForm({
  schema: mySchema,
  defaultValues: { ... }
})
```

### 5.4 Authentication Form Example

**File:** `/mnt/data/Projets/loura/LOURATECH/lourafrontend/app/auth/page.tsx`

```typescript
const loginSchema = z.object({
  email: z.string().min(1).email('Invalid email'),
  password: z.string().min(1),
})

// Form usage (PENDING - hook not yet implemented)
const form = useZodForm({
  schema: loginSchema,
  defaultValues: { email: '', password: '' }
})

const onSubmit = form.handleSubmit(async (data) => {
  const response = await authService.login(data)
  router.push(redirectUrl)
})

<Form {...form}>
  <form onSubmit={onSubmit}>
    <FormEmailField name="email" label="Email" />
    <FormPasswordField name="password" label="Password" />
    <Button type="submit">Sign In</Button>
  </form>
</Form>
```

---

## 6. OFFLINE-FIRST ARCHITECTURE

### 6.1 Overview

The frontend implements comprehensive offline-first capabilities:
1. **API Response Caching** - Automatic caching with TTL
2. **Route Precaching** - Static pages cached via service worker
3. **Data Precaching** - API endpoints cached on login
4. **Mutation Queue** - Offline mutations queued for sync
5. **Sync Management** - Automatic sync when online

### 6.2 Cache Manager

**File:** Imported from `@/lib/offline` (partially implemented)

```typescript
// Methods used throughout codebase:
const cacheManager = {
  // Cache-aware API calls
  get<T>(endpoint, options): Promise<T>
  post<T>(endpoint, data, options): Promise<T>
  patch<T>(endpoint, data, options): Promise<T>
  delete(endpoint, options): Promise<void>
  
  // Cache control
  clearAllCache(): Promise<void>
  
  // Options
  {
    ttl?: number              // Time-to-live for cache
    invalidateCache?: string[] // Endpoints to invalidate
    requiresOnline?: boolean   // Must be online
  }
}
```

### 6.3 Online Status Hook

**File:** `@/lib/hooks/useOnlineStatus` (referenced in offline-indicator.tsx)

```typescript
const { isOnline, wasOffline } = useOnlineStatus()
```

### 6.4 Sync Status Hook

**File:** `@/lib/hooks/useSyncStatus` (referenced in offline-indicator.tsx)

```typescript
const {
  status,              // 'idle' | 'syncing' | 'success' | 'error'
  pendingCount,        // Number of pending mutations
  progress,            // 0-100 sync progress
  forceSync,           // Function to trigger sync
  completedMutations,  // Count of successful syncs
  failedMutations      // Count of failed syncs
} = useSyncStatus()
```

### 6.5 Offline UI Components

**File:** `/mnt/data/Projets/loura/LOURATECH/lourafrontend/components/ui/offline-indicator.tsx`

Displays:
- Online/offline status badge
- Pending mutations count
- Sync progress with spinner
- Error indicators
- Manual sync button

**File:** `/mnt/data/Projets/loura/LOURATECH/lourafrontend/components/ui/cache-progress-indicator.tsx`

Displays during first visit:
- Route precaching progress
- API data precaching progress
- Overall completion percentage
- Auto-hides after 3 seconds when complete

### 6.6 Route Discovery & Precaching

**File:** `@/lib/offline/route-discovery` (referenced in cache-progress-indicator.tsx)

```typescript
getCacheProgress()        // Get current precache progress
isPrecacheComplete()      // Check if routes cached
precacheAllRoutes(callback) // Start precaching with progress callback

// Progress object
{
  inProgress: boolean
  cached: number
  total: number
}
```

### 6.7 API Discovery & Precaching

**File:** `@/lib/offline/api-discovery` (referenced in cache-progress-indicator.tsx)

```typescript
getDataCacheProgress()     // Get API precache progress
isDataCacheComplete()      // Check if API data cached
precacheAllApiData(callback) // Start precaching with progress callback

// Progress object
{
  inProgress: boolean
  cached: number
  total: number
}
```

---

## 7. TESTING

### 7.1 Current State: NO TESTS

- No `.test.ts` or `.spec.ts` files in project (only in node_modules)
- No test runner configured (Jest/Vitest)
- No test setup files

### 7.2 Testing Infrastructure Needed:

```json
// Would need to add to package.json:
{
  "devDependencies": {
    "jest": "^29.x",
    "@testing-library/react": "^14.x",
    "@testing-library/jest-dom": "^6.x",
    "ts-jest": "^29.x"
  }
}
```

---

## 8. PENDING IMPLEMENTATIONS

### 8.1 Custom Hooks Status

**Location:** `/mnt/data/Projets/loura/LOURATECH/lourafrontend/lib/hooks/`

#### ✅ Implemented (avec TanStack Query)

1. **useLogin** (`lib/hooks/auth/useLogin.ts`)
   - Mutation pour connexion
   - Gestion cache utilisateur + invalidation
   - Events custom 'loura:login'

2. **useRegister** (`lib/hooks/auth/useRegister.ts`)
   - Mutation pour inscription
   - Auto-authentification après inscription

3. **useLogout** (`lib/hooks/auth/useLogout.ts`)
   - Mutation pour déconnexion
   - Clear cache complet

4. **useCurrentUser** (`lib/hooks/auth/useCurrentUser.ts`)
   - Query pour utilisateur courant
   - Auto-refetch conditionnel
   - Helpers: useIsAuthenticated, useIsAdmin

5. **useRefreshToken** (`lib/hooks/auth/useRefreshToken.ts`)
   - Mutation pour refresh token

#### ⏳ Pending

1. **useZodForm** (auth/page.tsx line 54, register/page.tsx line 14)
   - Wrapper around react-hook-form with Zod integration
   - Returns form object with handleSubmit method

2. **useUser** (auth/register/page.tsx line 14, auth/page.tsx line 37 commented)
   - Current user context/state hook
   - Returns UnifiedUser | null

3. **useOnlineStatus** (offline-indicator.tsx line 7)
   - Online/offline detection
   - Returns { isOnline, wasOffline }

4. **useSyncStatus** (offline-indicator.tsx line 8)
   - Sync queue status tracking
   - Returns { status, pendingCount, forceSync, progress, completedMutations, failedMutations }

5. **usePDF** (pdf-preview.tsx line 8)
   - PDF preview state management

### 8.2 Offline-First Modules (PARTIAL)

**Location:** `/mnt/data/Projets/loura/LOURATECH/lourafrontend/lib/offline/`

1. **cache-manager.ts** - Unified cache/API wrapper
2. **route-discovery.ts** - Static page precaching
3. **api-discovery.ts** - API endpoint precaching
4. **sync-queue.ts** - Offline mutation queue management

---

## 9. DEPENDENCIES SUMMARY

### Core Dependencies:
```json
{
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "next": "16.1.7",
  "typescript": "^5.9.3",
  "zod": "^4.3.6",
  "@tanstack/react-query": "^5.62.11",
  "@tanstack/react-query-devtools": "^5.62.11",
  "react-hook-form": "[not listed but used]",
  "tailwindcss": "^4.2.1",
  "radix-ui": "^1.4.3",
  "lucide-react": "^1.8.0",
  "next-themes": "^0.4.6",
  "shadcn": "^4.3.1"
}
```

### Dev Dependencies:
```json
{
  "eslint": "^9.39.4",
  "prettier": "^3.8.1",
  "tailwindcss": "^4.2.1",
  "@tailwindcss/postcss": "^4.2.1"
}
```

---

## 10. KEY FILES REFERENCE TABLE

| File | Purpose | Key Exports |
|------|---------|-------------|
| `/lib/api/client.ts` | HTTP client & token management | `apiClient`, `tokenManager`, `ApiError` |
| `/lib/api/config.ts` | API endpoints & configuration | `API_CONFIG`, `API_ENDPOINTS`, `STORAGE_KEYS` |
| `/lib/api/base-service.ts` | Reusable CRUD service class | `BaseService`, `ActivatableService` |
| `/lib/services/auth/auth.service.ts` | Authentication business logic | `authService` |
| `/lib/config.ts` | Site routes & feature flags | `siteConfig` |
| `/app/auth/page.tsx` | Login page (unified) | Login form for admin/employee |
| `/app/auth/register/page.tsx` | Registration page | Admin registration form |
| `/components/ui/form.tsx` | Form context & hooks | `Form`, `FormField`, `useFormField` |
| `/components/ui/form-fields.tsx` | Reusable field components | All field types |
| `/components/providers.tsx` | TanStack Query provider | `QueryProvider` |
| `/components/ui/offline-indicator.tsx` | Online/sync status badge | `OfflineIndicator` |
| `/components/ui/cache-progress-indicator.tsx` | Precache progress display | `CacheProgressIndicator` |
| `/lib/hooks/auth/*.ts` | Authentication hooks | All auth hooks with TanStack Query |

---

## 11. AUTHENTICATION FLOW DIAGRAM

```
User Login
    ↓
[Form Submit] → authService.login(credentials)
    ↓
[API Call] → apiClient.post('/auth/login/', credentials)
    ↓
[Response] → { user, user_type, access, refresh, organization }
    ↓
[Save Tokens] → tokenManager.setTokens(access, refresh)
[Save User] → tokenManager.saveUser(user)
[Save Org] → localStorage.setItem('current_organization_slug', orgSlug)
    ↓
[Event] → window.dispatchEvent(new CustomEvent('loura:login'))
    ↓
[Redirect] → router.push(redirectUrl) // /core/dashboard or /apps/{subdomain}/dashboard
    ↓
[Precache] → Offline-first module triggered to cache routes & API data
```

---

## 12. MULTI-ORGANIZATION FLOW

```
User Logins
    ↓
[Multiple Orgs] → authService.getMyOrganizations()
    ↓
[Display List] → User selects organization
    ↓
[Switch Org] → authService.switchOrganization(orgId)
    ↓
[New Tokens] → New JWT with selected org context
[Clear Cache] → await cacheManager.clearAllCache()
[Reload User] → New user data with org-specific data
    ↓
[Redirect] → Application dashboard for new org
```

---

## 13. NOTES & OBSERVATIONS

### Strengths:
1. **Clean separation of concerns** - API client, auth service, UI components clearly separated
2. **Type safety** - Full TypeScript with comprehensive interfaces
3. **Unified authentication** - Single login for both admin and employee roles
4. **Centralized configuration** - All endpoints in one file
5. **Offline-first ready** - Architecture supports offline capabilities
6. **Form validation** - Zod + react-hook-form integration
7. **Token refresh** - Automatic 401 handling with retry
8. **TanStack Query integration** - Server state management with caching, auto-refetch, and devtools
9. **3-layer architecture** - Hooks → Services → API Client (voir `TANSTACK_QUERY_GUIDE.md`)

### Areas Needing Work:
1. **Some custom hooks not implemented** - useZodForm, useOnlineStatus, useSyncStatus pending
2. **Offline modules partial** - Cache manager, sync queue need implementation
3. **No tests** - Zero test coverage
4. **No error boundaries** - No React error boundaries for error UI
5. **Hooks for other entities** - Only auth hooks implemented, need CRUD hooks for other entities

### Recommendations:
1. Implement missing utility hooks (useZodForm, useOnlineStatus, useSyncStatus)
2. Create TanStack Query hooks for other entities following the pattern in `TANSTACK_QUERY_GUIDE.md`
3. Complete offline-first implementation
4. Create comprehensive test suite (unit + integration + e2e)
5. Add error boundaries in main layout
6. Implement loading states at route level
7. Add proper error pages (404, 500)

**Guide de référence:** Voir `TANSTACK_QUERY_GUIDE.md` pour implémenter de nouveaux hooks avec TanStack Query

