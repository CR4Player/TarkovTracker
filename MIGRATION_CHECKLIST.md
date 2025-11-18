# Nuxt Migration Checklist

## Current Nuxt Status — November 18, 2025
- [x] Nuxt 4 app scaffolded with `srcDir: app`, SPA mode (`ssr: false`), Vuetify auto-imported via `vite-plugin-vuetify`.
- [x] File-based routing in `app/pages` for dashboard (`index`), tasks, items, hideout, team, api (settings), login, and 404 (`NotFound`); placeholder `terms` and `privacy` added to clear router warnings.
- [x] Standard layout registered through `app/layouts/default.vue` using `StandardLayout` (drawer/app-bar/footer wired).
- [x] Pinia enabled via `@pinia/nuxt`; existing stores live in `app/stores` (app, progress, tarkov, user, system).
- [x] Vue I18n Vite plugin configured; locales present in `app/locales`.
- [x] Firebase plugin stub added (`app/plugins/firebase.ts`) to satisfy Nuxt plugin loading while re-exporting firebase helpers.
- [x] Nuxt Content config added (`content.config.ts`) with a default collection; warning resolved.
- [x] Path aliases `@` and `~` mapped to `app/` in `nuxt.config.ts`.
- [ ] Apollo client setup and GraphQL composables still need verification in Nuxt context.
- [ ] VueFire configuration and real-time listeners still need end-to-end validation.

## Quick Reference - What to Migrate from TarkovTracker

### Project Scope Summary
- **116 TypeScript/Vue files** (~1.1MB frontend source)
- **58 Vue components** across 12 feature modules
- **5 Pinia stores** for state management
- **8 routes** with nested layouts
- **6 languages** (i18n)
- **Multiple APIs**: GraphQL (Apollo) + Firebase Firestore + REST

---

## Core Systems to Migrate

### 1. State Management (Pinia)
**Location**: `frontend/src/stores/`
- [ ] app.ts - UI & settings state
- [ ] progress.ts - Player progression (PvP/PvE dual tracking)
- [ ] tarkov.ts - Game data
- [ ] user.ts - User account & preferences
- [ ] useSystemStore.ts - System state

**Special Notes**:
- Game mode split (PvP/PvE) - needs dual state tracking
- Firebase persistence via pinia-firestore plugin
- Data migration support for legacy formats

### 2. Routing System
**Location**: `frontend/src/router/`
- [ ] 8 routes: dashboard, tasks, items, hideout, settings, login, team, 404
- [ ] StandardLayout nested structure
- [ ] Route metadata (background images)
- [ ] Lazy-loaded components

**Nuxt Migration Strategy**: Convert to file-based routing (`pages/` directory)

### 3. API Integration
**Location**: `frontend/src/composables/api/`

**GraphQL (Apollo Client)**:
- [ ] Apollo client setup
- [ ] tarkovDataQuery - tasks, traders, levels
- [ ] tarkovHideoutQuery - hideout modules
- [ ] languageQuery - language detection

**Firebase Services**:
- [ ] Authentication (OAuth: Google, GitHub)
- [ ] Firestore Database
- [ ] Cloud Storage
- [ ] Cloud Functions

**Key Composables to Migrate**:
- [ ] useTarkovApi.ts - Apollo queries
- [ ] useTarkovDataQuery() - Main data fetching
- [ ] useTarkovHideoutQuery() - Hideout data
- [ ] useFirebaseListener.ts - Real-time listeners

### 4. Composables & Business Logic
**Location**: `frontend/src/composables/`

**Essential Composables**:
- [ ] api/useTarkovApi.ts
- [ ] data/useTaskData.ts - Task processing
- [ ] data/useHideoutData.ts - Hideout management
- [ ] data/useMapData.ts - Maps & traders
- [ ] firebase/useFirebaseListener.ts
- [ ] useDataMigration.ts - Legacy data conversion
- [ ] useTaskFiltering.ts - Task filtering logic
- [ ] useTarkovTime.ts - Tarkov time utils

**Utility Composables**:
- [ ] utils/graphHelpers.ts - Graph operations
- [ ] utils/i18nHelpers.ts - i18n integration
- [ ] utils/storeHelpers.ts - Store utilities

### 5. UI Components (58 Total)
**Location**: `frontend/src/features/`

**Feature Modules** (with component counts):
- [ ] auth/ - Login/OAuth (2 components)
- [ ] dashboard/ - Dashboard/home (2 components)
- [ ] drawer/ - Navigation (6 components)
- [ ] game/ - Game mode selection (4 components)
- [ ] hideout/ - Hideout tracking (2 components)
- [ ] layout/ - Layout wrapper (2 components)
- [ ] maps/ - Map visualization (3 components)
- [ ] neededitems/ - Items tracker (6 components)
- [ ] settings/ - Settings panel (7 components)
- [ ] tasks/ - Task management (13 components)
- [ ] team/ - Team collaboration (3 components)
- [ ] ui/ - Generic components (4 components)

**Migration Strategy**: Keep feature-based structure, use Nuxt's auto-imports

### 6. Pages (8 Routes)
**Location**: `frontend/src/pages/`
- [ ] TrackerDashboard.vue
- [ ] TaskList.vue
- [ ] NeededItems.vue
- [ ] HideoutList.vue
- [ ] TeamManagement.vue
- [ ] TrackerSettings.vue
- [ ] LoginInterface.vue
- [ ] NotFound.vue

**Nuxt Migration**: Convert to `app/pages/` with file-based routing

### 7. Internationalization (6 Languages)
**Location**: `frontend/src/locales/`
- [ ] en.json5 - English
- [ ] de.json5 - German
- [ ] es.json5 - Spanish
- [ ] fr.json5 - French
- [ ] ru.json5 - Russian
- [ ] uk.json5 - Ukrainian

**Setup to Migrate**:
- [ ] Vue I18n configuration
- [ ] i18n Vite plugin
- [ ] Language detection logic
- [ ] Locale switching in settings

### 8. Types & Interfaces
**Location**: `frontend/src/types/`
- [ ] tarkov.ts - Core domain types (extensive)
- [ ] ApiMigrationTypes.ts - API compatibility types

### 9. Utilities & Services
**Location**: `frontend/src/utils/`
- [ ] DataMigrationService.ts (20.7KB) - Legacy data handling
- [ ] DataValidationUtils.ts - Input validation
- [ ] GraphQL queries:
  - [ ] tarkovdataquery.ts
  - [ ] tarkovhideoutquery.ts
  - [ ] languagequery.ts

---

## Configuration & Build

### Configuration Files to Adapt
- [ ] tsconfig.json → Nuxt's tsconfig
- [ ] vite.config.ts → Nuxt's nuxt.config.ts
- [ ] Environment variables (.env files)
- [ ] eslint.config.js → Update for Nuxt
- [ ] .prettierrc.json → Keep as-is

### Plugins to Setup
- [ ] Firebase plugin
- [ ] Apollo GraphQL plugin
- [ ] Vuetify plugin
- [ ] Vue I18n plugin
- [ ] Pinia plugin

### TypeScript Path Aliases
- [ ] @/ → Use Nuxt's default resolution

---

## Testing Infrastructure (Compatible)
- [ ] Vitest - No major changes needed
- [ ] Playwright E2E tests - No major changes needed
- [ ] Vue Test Utils - Compatible with Nuxt
- [ ] ESLint + Prettier - Update config for Nuxt

---

## Data Files
- [ ] shared_state.ts - Game mode structure definitions
- [ ] api/maps.json - Static map data (in composables/api/)

---

## Special Considerations

### Game Mode Split (PvP/PvE)
- Progress store maintains separate state for each mode
- Requires careful migration of player data
- Switching logic must be preserved

### Data Migration System
- Handles legacy single-mode → dual-mode conversion
- Validates data integrity
- Syncs with Firebase
- **Keep as-is in Nuxt version**

### Real-time Sync
- VueFire integration for Firestore
- Real-time listeners in composables
- Offline support via Pinia
- Auto-subscription management

### GraphQL Caching
- Apollo cache-first strategy
- Language-aware query variables
- Game mode as query parameter

---

## Dependency Updates Needed
### Already Compatible:
- Pinia v3
- Vue I18n v11
- Firebase v11-12
- Apollo Client v3
- Vuetify v3
- D3.js v7
- Vitest, Playwright, ESLint

### Nuxt-Specific:
- Add `nuxt` (v3.x)
- Add `@nuxtjs/i18n` (if using Nuxt module)
- May need to adjust Apollo integration

---

## Summary of Effort

**Low Complexity** (Direct Migration):
- Pinia stores
- Composables
- UI components
- Types
- Tests

**Medium Complexity** (Some Adaptation):
- Routing (file-based → auto)
- Plugins (register with Nuxt)
- Build config (Vite → Nuxt)
- Path aliases (auto-configured)

**High Complexity** (Requires Testing):
- Firebase + Pinia persistence
- Apollo GraphQL setup
- Game mode dual-state handling
- Data migration system

**Estimated Timeline**: 2-3 weeks for full migration + testing

---

## Files to Keep Reference
- Full analysis: `TARKOV_TRACKER_ANALYSIS.md` (in this directory)
- Original project: `/home/lab/Github/TarkovTracker/`
