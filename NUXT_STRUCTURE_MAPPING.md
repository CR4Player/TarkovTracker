# Nuxt 3 Structure Mapping - TarkovTracker Migration

This document shows how TarkovTracker's current Vue 3 structure maps to Nuxt 3's conventions.

---

## Directory Structure Mapping

### Current Vue 3 Structure → Nuxt 3 Structure

```
CURRENT (Vue 3 + Vite)          NUXT 3 EQUIVALENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

frontend/src/
├── main.ts                     → app.vue (app root)
├── App.vue                     → (integrate into app.vue)
├── pages/                      → app/pages/
│   ├── TrackerDashboard.vue    → app/pages/index.vue (or app/pages/dashboard.vue)
│   ├── TaskList.vue            → app/pages/tasks.vue
│   ├── NeededItems.vue         → app/pages/items.vue
│   ├── HideoutList.vue         → app/pages/hideout.vue
│   ├── TeamManagement.vue      → app/pages/team.vue
│   ├── TrackerSettings.vue     → app/pages/api.vue
│   ├── LoginInterface.vue      → app/pages/login.vue
│   └── NotFound.vue            → app/pages/[...slug].vue (catch-all)
│
├── router/                     → (Remove - Nuxt handles routing)
│   ├── index.ts
│   └── routes.ts
│
├── features/                   → composables/features/ (or components/)
│   ├── auth/
│   ├── dashboard/
│   ├── drawer/
│   ├── game/
│   ├── hideout/
│   ├── layout/
│   ├── maps/
│   ├── neededitems/
│   ├── settings/
│   ├── tasks/
│   ├── team/
│   └── ui/
│
├── composables/                → app/composables/
│   ├── api/
│   │   └── useTarkovApi.ts
│   ├── data/
│   │   ├── useTaskData.ts
│   │   ├── useHideoutData.ts
│   │   └── useMapData.ts
│   ├── firebase/
│   │   └── useFirebaseListener.ts
│   ├── utils/
│   │   ├── graphHelpers.ts
│   │   ├── i18nHelpers.ts
│   │   └── storeHelpers.ts
│   ├── tarkovdata.ts
│   ├── useDataMigration.ts
│   ├── useTaskFiltering.ts
│   └── useTarkovTime.ts
│
├── stores/                     → app/stores/
│   ├── app.ts
│   ├── progress.ts
│   ├── tarkov.ts
│   ├── user.ts
│   └── useSystemStore.ts
│
├── plugins/                    → app/plugins/
│   ├── apollo.ts
│   ├── firebase.ts
│   ├── i18n.ts
│   ├── pinia.ts
│   ├── vuetify.ts
│   ├── pinia-firestore.ts
│   └── store-initializer.ts
│
├── types/                      → app/types/
│   ├── tarkov.ts
│   └── ApiMigrationTypes.ts
│
├── utils/                      → app/utils/
│   ├── DataMigrationService.ts
│   ├── DataValidationUtils.ts
│   ├── tarkovdataquery.ts
│   ├── tarkovhideoutquery.ts
│   └── languagequery.ts
│
├── locales/                    → app/locales/ (or public/locales/)
│   ├── en.json5
│   ├── de.json5
│   ├── es.json5
│   ├── fr.json5
│   ├── ru.json5
│   └── uk.json5
│
├── shared_state.ts             → app/stores/shared-state.ts
│
└── vite-env.d.ts               → (Nuxt auto-generates)
```

---

## Layout Structure

### Current Vue 3
```typescript
// src/router/routes.ts
const routes = [
  {
    path: '/',
    component: StandardLayout,
    children: [
      { path: '/', name: 'dashboard', component: TrackerDashboard },
      { path: '/tasks', component: TaskList },
      // ...
    ]
  }
]
```

### Nuxt 3 Equivalent
```
app/
├── layouts/
│   └── default.vue             // StandardLayout wrapper
├── pages/
│   ├── index.vue              // Dashboard (auto-route: /)
│   ├── tasks.vue              // (auto-route: /tasks)
│   ├── items.vue              // (auto-route: /items)
│   ├── hideout.vue            // (auto-route: /hideout)
│   ├── api.vue                // Settings (auto-route: /api)
│   ├── login.vue              // (auto-route: /login)
│   ├── team.vue               // (auto-route: /team)
│   └── [...slug].vue          // 404 fallback
```

**Key Differences**:
- No need for explicit router setup
- Nuxt auto-generates routes from file structure
- Layout nesting is automatic
- Route metadata via route.ts (if needed)

---

## Components Auto-Import

### Current Vue 3
```typescript
// manual import in each component
import TaskCard from '@/features/tasks/TaskCard.vue'
```

### Nuxt 3
```typescript
// app/components/ directory structure:
app/
├── composables/
│   └── features/
│       ├── Auth/
│       │   └── AuthButtons.vue
│       ├── Task/
│       │   ├── TaskCard.vue
│       │   ├── TaskList.vue
│       │   └── TaskInfo.vue
│       // ... other features
```

**Auto-imports enabled in nuxt.config.ts**:
```typescript
export default defineNuxtConfig({
  components: {
    dirs: ['~/components', '~/composables/features']
  }
})
```

Components automatically available without imports!

---

## Plugins Registration

### Current Vue 3 (main.ts)
```typescript
const app = createApp(App)
app
  .use(i18n)
  .use(pinia)
  .use(router)
  .use(vuetify)
  .use(VueFire, { firebaseApp })
  .provide(DefaultApolloClient, apolloClient)
  .mount('#app')
```

### Nuxt 3 Equivalent

**app/plugins/**:
```
app/plugins/
├── 01.firebase.ts
├── 02.apollo.client.ts
├── 03.vuetify.ts
├── 04.i18n.ts
├── 05.pinia-firestore.ts
└── 06.store-initializer.ts
```

Each plugin auto-registered! No manual registration needed.

**Example plugin** (`app/plugins/firebase.ts`):
```typescript
export default defineNuxtPlugin(() => {
  // Firebase setup
  const app = initializeApp(firebaseConfig)
  // Plugin runs on app startup
})
```

---

## Composables Auto-Import

### Current Vue 3
```typescript
import { useTarkovApi } from '@/composables/api/useTarkovApi'
import { useTaskData } from '@/composables/data/useTaskData'
```

### Nuxt 3
```typescript
// In pages or components - NO IMPORT NEEDED!
const { availableLanguages } = useTarkovApi()
const { tasks, loading } = useTaskData()
// Nuxt auto-imports composables from app/composables/
```

---

## Stores Setup

### Current Vue 3
```typescript
// main.ts
import pinia from '@/plugins/pinia'
app.use(pinia)
```

### Nuxt 3
```typescript
// Pinia auto-integrated! Just use stores:
import { useAppStore } from '@/stores/app'

export default definePageComponent({
  setup() {
    const appStore = useAppStore()
  }
})
```

---

## Environment Variables

### Current Vue 3
```typescript
// vite.config.ts
define: {
  'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(getCommitHash()),
}

// In component
console.log(import.meta.env.VITE_FIREBASE_API_KEY)
```

### Nuxt 3
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      commitHash: process.env.VITE_COMMIT_HASH,
      firebaseApiKey: process.env.VITE_FIREBASE_API_KEY,
    }
  }
})

// In component using useRuntimeConfig()
const config = useRuntimeConfig()
console.log(config.public.firebaseApiKey)
```

---

## TypeScript Path Aliases

### Current Vue 3
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Nuxt 3
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  alias: {
    '@': '<srcDir>'
  }
})
```

Or Nuxt auto-creates `~` and `#` aliases:
- `~` or `@` = srcDir (default: src/)
- `#` = Build utilities

---

## i18n Setup

### Current Vue 3
```typescript
// plugins/i18n.ts
import { createI18n } from 'vue-i18n'
export default createI18n({
  legacy: false,
  locale: 'en',
  messages
})

// main.ts
app.use(i18n)
```

### Nuxt 3 with @nuxtjs/i18n
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: ['en', 'de', 'es', 'fr', 'ru', 'uk'],
    defaultLocale: 'en',
    vueI18n: './i18n.config.ts'
  }
})

// i18n.config.ts (new)
export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'en',
  // messages loaded automatically from locales/
}))
```

---

## Middleware

Nuxt introduces middleware for route guards:

### Current Vue 3
```typescript
// router/routes.ts (with beforeEach guard)
router.beforeEach((to, from, next) => {
  if (to.name === 'login' && !fireuser.loggedIn) {
    next()
  } else {
    next()
  }
})
```

### Nuxt 3
```typescript
// app/middleware/auth.ts
export default defineRouteMiddleware((to, from) => {
  const { fireuser } = useFirebase()
  if (!fireuser.loggedIn && to.path !== '/login') {
    navigateTo('/login')
  }
})

// In page component:
definePageMeta({
  middleware: 'auth'
})
```

---

## Layouts

### Current Vue 3
```typescript
// features/layout/StandardLayout.vue
export default {
  name: 'StandardLayout'
}
```

### Nuxt 3
```vue
<!-- app/layouts/default.vue -->
<template>
  <div class="layout">
    <DrawerNavigation />
    <main>
      <slot /> <!-- Page content -->
    </main>
  </div>
</template>

<!-- In page component: -->
<script setup>
definePageMeta({
  layout: 'default'
})
</script>
```

---

## Data Fetching

### Current Vue 3
```typescript
// composable
onMounted(() => {
  const { result } = useQuery(tarkovDataQuery)
  // Manual subscription management
})
```

### Nuxt 3 Composables
```typescript
// composable or page
const { data: tasks } = await useFetch('/api/tasks')
// OR with Apollo:
const { result } = useAsyncQuery(tarkovDataQuery)
```

Nuxt provides `useFetch()`, `useAsyncData()`, `useLazyAsyncData()` for better SSR support.

---

## Folder Structure Summary

```
nuxt-app/
├── app/
│   ├── app.vue              # Root component (from App.vue)
│   ├── pages/               # File-based routes
│   ├── layouts/             # Layout templates
│   ├── components/          # Vue components (auto-imported)
│   ├── composables/         # Composables (auto-imported)
│   │   ├── features/        # Feature composables
│   │   ├── api/
│   │   ├── data/
│   │   ├── firebase/
│   │   └── utils/
│   ├── stores/              # Pinia stores (auto-imported)
│   ├── plugins/             # Nuxt plugins (auto-registered)
│   ├── utils/               # Utilities
│   ├── types/               # TypeScript types
│   ├── locales/             # i18n translations
│   ├── middleware/          # Route middleware
│   └── server/              # Server-side code (if needed)
│
├── public/                  # Static assets
├── nuxt.config.ts           # Nuxt configuration
├── tsconfig.json            # TypeScript config
├── package.json             # Dependencies
└── .env                      # Environment variables
```

---

## Key Migration Benefits

1. **Auto-Routing**: No need for manual route definitions
2. **Auto-Imports**: Components & composables auto-available
3. **Auto-Plugins**: Plugins auto-registered
4. **Simpler Config**: Less boilerplate in config files
5. **Better DX**: File-based structure = more intuitive
6. **Built-in SSR**: If you want server rendering later
7. **Nuxi CLI**: Better project setup & management
8. **Optimized Builds**: Out-of-the-box performance

---

## Migration Steps Summary

1. Create `nuxt.config.ts` from `vite.config.ts`
2. Move `src/` → `app/`
3. Move `pages/` files to `app/pages/`
4. Convert `router/routes.ts` → `app/pages/` structure
5. Move `features/` → `app/components/` (or keep as sub-dir)
6. Plugins move to `app/plugins/` (auto-registered)
7. Remove explicit `main.ts` setup (Nuxt handles it)
8. Update imports to use Nuxt's auto-import system
9. Update environment variable access (useRuntimeConfig)
10. Test all routes and functionality

---

## Notes for Complex Features

### Game Mode State
- Pinia store structure remains identical
- Just move to `app/stores/progress.ts`
- Auto-imported in components

### Firebase Integration
- Create plugin: `app/plugins/firebase.ts`
- Import in composables as needed
- Firestore persistence stays the same

### GraphQL Caching
- Apollo plugin: `app/plugins/apollo.client.ts`
- Composables (useTarkovApi) stay same
- Caching strategy unchanged

### Real-time Sync
- Firebase listeners in composables
- VueFire integration stays same
- Auto-import composables as needed

