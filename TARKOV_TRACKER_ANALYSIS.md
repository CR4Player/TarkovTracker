# TarkovTracker Project Analysis - Migration to Nuxt Overview

## Project Summary

TarkovTracker is a sophisticated web application for tracking player progress in the game Escape from Tarkov. It's a full-stack monorepo project with a Firebase backend, Cloud Functions API, and a modern Vue 3 frontend with Vuetify UI framework.

**Project Size**: ~1.2GB (with node_modules)
**Frontend Source**: ~1.1MB (116 TypeScript/Vue files)
**Main Pages**: 8 routes
**Components**: 58 Vue components across 12 feature modules

---

## 1. Overall Project Structure

### Monorepo Layout
```
TarkovTracker/
├── frontend/              # Vue 3 + Vite application
│   ├── src/
│   ├── public/
│   ├── e2e/              # Playwright E2E tests
│   ├── package.json
│   └── vite.config.ts
├── functions/            # Firebase Cloud Functions
│   ├── src/
│   ├── lib/              # Compiled output
│   └── package.json
├── docs/                 # Documentation
├── firebase.json         # Firebase configuration
├── firestore.rules       # Firestore security rules
└── package.json          # Monorepo root

Technology Stack:
- Node.js 22 (backend)
- npm workspaces (monorepo management)
- Firebase 12.0.0 (backend services)
- Vue 3.5.18 (frontend framework)
- Vite 7.0.6 (build tool)
- TypeScript 5.8.3
```

---

## 2. Frontend Architecture (Vue 3 Application)

### Core Setup & Configuration

**Main Entry Point**: `src/main.ts`
```typescript
// Initializes:
- Vue app instance with Composition API
- Pinia store (state management)
- Vue Router (routing)
- Vuetify (UI components)
- Firebase (auth, database, functions)
- Apollo Client (GraphQL)
- Vue I18n (internationalization)
- VueFire (Firebase real-time integration)
```

**App Root**: `src/App.vue`
- Global error handling
- Tarkov data initialization
- Data migration tracking
- Locale override support

**Config Files**:
- `tsconfig.json` - TypeScript configuration with path aliases (@/*)
- `vite.config.ts` - Build configuration with vendor code splitting
- `.env.*` - Environment variables for Firebase

### Directory Structure

```
src/
├── composables/          # Vue 3 Composition API logic
│   ├── api/             # API integration (useTarkovApi)
│   ├── data/            # Data management (tasks, hideout, maps)
│   ├── firebase/        # Firebase listeners & handlers
│   ├── utils/           # Helpers (i18n, store, graph utilities)
│   ├── tarkovdata.ts    # Main data initialization composable
│   ├── useDataMigration.ts
│   ├── useTaskFiltering.ts
│   └── useTarkovTime.ts
├── features/            # Feature-based modules (12 features)
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard/home page
│   ├── drawer/          # Navigation drawer
│   ├── game/            # Game-related features
│   ├── hideout/         # Hideout tracking
│   ├── layout/          # Layout wrapper
│   ├── maps/            # Map visualization
│   ├── neededitems/     # Items tracker
│   ├── settings/        # User settings
│   ├── tasks/           # Task management
│   ├── team/            # Team collaboration
│   └── ui/              # Generic UI components
├── pages/               # Top-level page components (8 pages)
│   ├── TrackerDashboard.vue      # Main dashboard
│   ├── TaskList.vue               # Task tracker
│   ├── NeededItems.vue            # Items needed tracker
│   ├── HideoutList.vue            # Hideout upgrades
│   ├── TeamManagement.vue         # Team features
│   ├── TrackerSettings.vue        # Settings/API
│   ├── LoginInterface.vue         # Authentication
│   └── NotFound.vue               # 404 page
├── plugins/             # Plugin configurations
│   ├── apollo.ts        # Apollo GraphQL client
│   ├── firebase.ts      # Firebase initialization & auth
│   ├── i18n.ts          # Vue I18n setup
│   ├── pinia.ts         # Pinia store setup
│   ├── vuetify.ts       # Vuetify UI framework
│   ├── pinia-firestore.ts  # Firestore persistence
│   └── store-initializer.ts # Store lifecycle
├── router/              # Vue Router configuration
│   ├── index.ts         # Router instance
│   └── routes.ts        # Route definitions (8 routes)
├── stores/              # Pinia stores (state management)
│   ├── app.ts           # App settings store
│   ├── progress.ts      # Player progress tracker
│   ├── tarkov.ts        # Tarkov data store
│   ├── user.ts          # User preferences & UI state
│   └── useSystemStore.ts
├── types/               # TypeScript interfaces
│   ├── tarkov.ts        # Core domain types
│   └── ApiMigrationTypes.ts
├── utils/               # Utility functions
│   ├── DataMigrationService.ts
│   ├── DataValidationUtils.ts
│   ├── tarkovdataquery.ts      # GraphQL query
│   ├── tarkovhideoutquery.ts   # GraphQL query
│   └── languagequery.ts        # GraphQL query
├── locales/             # Internationalization (6 languages)
│   ├── en.json5
│   ├── de.json5
│   ├── es.json5
│   ├── fr.json5
│   ├── ru.json5
│   └── uk.json5
├── shared_state.ts      # Global state definitions & migrations
└── vite-env.d.ts        # Vite environment types
```

---

## 3. Core Systems & Components

### 3.1 State Management (Pinia Stores)

**4 Main Stores**:

1. **app.ts** - Application settings
   - Locale overrides
   - Tip visibility
   - Streamer mode
   - View preferences (task views, item views)
   - Team visibility settings

2. **progress.ts** - Player progress data (LARGE - 17,924 bytes)
   - Task completions & objectives
   - Hideout progress
   - Quest status tracking
   - GameMode-specific progress (PvP/PvE)

3. **tarkov.ts** - Game data store
   - Tasks, hideout modules, objectives
   - Maps and traders
   - Real-time Firebase bindings
   - Data graph structures

4. **user.ts** - User account info
   - Authentication state
   - User preferences
   - Display name, faction selection
   - Level progression
   - Firebase persistence

5. **useSystemStore.ts** - System-level state

**Data Persistence**: 
- Pinia + Firebase Firestore integration via `pinia-firestore.ts`
- Real-time synchronization with `useFirebaseListener.ts`
- Migration support in `shared_state.ts` for legacy data structures

### 3.2 Routing (Vue Router)

**8 Routes** in StandardLayout:
```
/ (dashboard)             → TrackerDashboard.vue
/items                   → NeededItems.vue
/tasks                   → TaskList.vue
/hideout                 → HideoutList.vue
/api (settings)          → TrackerSettings.vue
/login                   → LoginInterface.vue
/team                    → TeamManagement.vue
/* (catch-all)           → NotFound.vue
```

**Route Features**:
- Background metadata per route
- Lazy-loaded components
- Nested layout structure
- StandardLayout wrapper with drawer & header

### 3.3 API & Data Integration

**GraphQL (Apollo Client)**
- Endpoint: `https://api.tarkov.dev/graphql`
- Uses `@apollo/client` & `@vue/apollo-composable`
- 3 main GraphQL queries:
  1. `tarkovDataQuery` - Tasks, traders, player levels
  2. `tarkovHideoutQuery` - Hideout stations & modules
  3. `languageQuery` - Available language support

**Firebase Integration**
- Authentication (Google OAuth, GitHub OAuth)
- Firestore Database (real-time data)
- Cloud Storage
- Cloud Functions API
- Local emulator support for development

**Key API Files**:
```
composables/
├── api/
│   └── useTarkovApi.ts         # Apollo queries, language detection
├── data/
│   ├── useTaskData.ts          # Task processing & filtering
│   ├── useHideoutData.ts       # Hideout module management
│   └── useMapData.ts           # Map & trader data, player levels
└── firebase/
    └── useFirebaseListener.ts  # Real-time Firebase listeners
```

### 3.4 Authentication System

**Location**: `features/auth/`
- Google OAuth integration
- GitHub OAuth integration
- Firebase Auth state management
- Custom auth buttons component

**User State in Firebase**:
```typescript
interface FireUser {
  uid: string | null
  loggedIn: boolean
  displayName: string | null
  email: string | null
  photoURL: string | null
  emailVerified: boolean
  phoneNumber: string | null
  lastLoginAt: string | null
  createdAt: string | null
}
```

### 3.5 Feature Modules (12 Total)

1. **auth/** (2 files)
   - Login/logout flows
   - OAuth provider setup

2. **dashboard/** (2 files)
   - Main landing page
   - Overview/summary

3. **drawer/** (6 files)
   - Navigation drawer
   - User account info
   - External links
   - Level display

4. **game/** (4 files)
   - Game mode selection (PvP/PvE)
   - Edition selection
   - PMC faction selection

5. **hideout/** (2 files)
   - Hideout upgrade tracking
   - Station-specific components

6. **layout/** (2 files)
   - StandardLayout wrapper
   - Router view container

7. **maps/** (3 files)
   - Map visualization
   - Task location display
   - D3.js integration

8. **neededitems/** (6 files)
   - Items needed tracker
   - Filtering & sorting
   - Multi-view support

9. **settings/** (7 files)
   - User preferences
   - API token management
   - Data export/import
   - Account deletion

10. **tasks/** (13 files)
    - Task listing & filtering
    - Objective tracking
    - Task completion
    - Multiple view modes

11. **team/** (3 files)
    - Team collaboration
    - Member management
    - Shared progress tracking

12. **ui/** (4 files)
    - Generic reusable components
    - Dialog, card, button variants

### 3.6 Data Types

**Main Types** (`types/tarkov.ts`):
```typescript
// Game data
- TarkovItem (with images, wiki links)
- Task (with objectives, rewards)
- TaskObjective (with locations, GPS)
- HideoutStation, HideoutModule, HideoutLevel
- Trader, PlayerLevel
- TarkovMap (with static data)

// Requirements & dependencies
- ItemRequirement, TraderRequirement
- SkillRequirement, StationLevelRequirement
- TaskTraderLevelRequirement

// Progress tracking
- UserProgressData (from shared_state.ts)
  - level, faction, displayName
  - taskCompletions, taskObjectives
  - hideoutParts, hideoutModules

// API Results
- TarkovDataQueryResult (GraphQL)
- TarkovHideoutQueryResult (GraphQL)
```

### 3.7 Internationalization (i18n)

**Supported Languages**: 6
- English (en)
- German (de)
- Spanish (es)
- French (fr)
- Russian (ru)
- Ukrainian (uk)

**Implementation**:
- Vue I18n v11
- JSON5 locale files (15-23KB each)
- Locale switching in settings
- Per-route locale detection
- Language-aware GraphQL queries

### 3.8 UI Framework - Vuetify 3

**Components Used**:
- Material Design components
- Data tables for lists
- Cards for layouts
- Dialogs/modals
- Navigation drawer
- App bars & toolbars
- Forms & inputs
- Progress indicators
- Chips & badges

**Custom Theme**:
- "Share Tech Mono" font family
- Dark theme (black background)
- Custom color scheme

### 3.9 Key Utilities & Services

**DataMigrationService.ts** (20.7KB)
- Legacy data conversion
- Game mode migration (PvP/PvE split)
- Data validation & healing
- Firebase sync handling

**DataValidationUtils.ts**
- Input validation
- Data integrity checks

**Graph Utilities** (`composables/utils/graphHelpers.ts`)
- Graph data processing (graphology library)
- Prerequisite chain calculation
- Objective mapping

**Store Helpers** (`composables/utils/storeHelpers.ts`)
- Store access utilities
- Pinia integration helpers

**i18n Helpers** (`composables/utils/i18nHelpers.ts`)
- Language detection
- Locale safe access
- i18n initialization tracking

---

## 4. Dependencies & Package.json

### Frontend Dependencies (Frontend/package.json)

**State Management**:
- `pinia@^3.0.3` - Store management
- `firebase@^11.10.0` - Backend services
- `vuefire@^3.2.2` - Firebase Vue integration

**API & Data**:
- `@apollo/client@^3.13.8` - GraphQL client
- `@vue/apollo-composable@^4.2.2` - Apollo integration
- `graphql@^16.11.0` - GraphQL utilities
- `graphql-tag@^2.12.6` - GraphQL template literals
- `graphology@^0.26.0` - Graph data structure
- `graphology-types@^0.24.8` - Graph types
- `d3@^7.9.0` - Data visualization

**UI & Framework**:
- `vue@^3.5.18` - Vue framework
- `vue-router@^4.5.1` - Routing
- `vuetify@^3.9.2` - Material Design components
- `@mdi/font@^7.4.47` - Material Design Icons

**Utilities**:
- `vue-i18n@^11.1.11` - Internationalization
- `@vueuse/core@^13.6.0` - Vue composition utilities
- `uuid@^11.1.0` - UUID generation
- `qrcode@^1.5.4` - QR code generation

**Build Tools** (devDependencies):
- `vite@^7.0.6` - Build tool
- `@vitejs/plugin-vue@^6.0.1` - Vue plugin
- `vite-plugin-vuetify@^2.1.1` - Vuetify plugin
- `@intlify/unplugin-vue-i18n@^6.0.8` - i18n plugin
- `sass@^1.89.2` - SCSS support

**Testing** (devDependencies):
- `vitest@^3.2.4` - Unit tests
- `@vitest/ui@^3.2.4` - Test UI
- `@testing-library/vue@^8.1.0` - Vue testing
- `@testing-library/jest-dom@^6.6.4` - DOM assertions
- `@testing-library/user-event@^14.6.1` - User interactions
- `@playwright/test@^1.54.1` - E2E tests
- `playwright@^1.54.1` - Browser automation

**Code Quality**:
- `eslint@^9.32.0` - Linting
- `prettier@^3.6.2` - Code formatting
- `typescript@^5.8.3` - Type checking
- `vue-tsc@^3.0.4` - Vue type checking

### Backend Dependencies (Functions/package.json)

**Framework & Server**:
- `express@^5.1.0` - HTTP server
- `firebase-functions@^6.4.0` - Cloud Functions
- `firebase-admin@^13.4.0` - Admin SDK

**API & Data**:
- `graphql-request@^7.2.0` - GraphQL client
- `cors@^2.8.5` - CORS middleware
- `body-parser@^2.2.0` - Request parsing

**Utilities**:
- `uid-generator@^2.0.0` - UID generation

**Build & Dev**:
- `typescript@^5.8.3`
- `@types/express@^5.0.3`
- `@types/node@^22.16.5`
- `swagger-jsdoc@^6.2.8` - API documentation

### Root package.json

**Commands**:
```
dev              - Start frontend + Firebase emulators
build            - Build all workspaces
build:functions  - Build Cloud Functions
build:frontend   - Build Vue app
emulators        - Start Firebase emulators
docs             - Generate API docs (Swagger)
deploy:dev       - Deploy to dev environment
deploy:prod      - Deploy to production
lint             - ESLint check
format           - Code formatting
```

**Dev Tools**:
- `firebase@^12.0.0` - CLI & SDK
- `firebase-tools@^14.11.1` - Deployment tools
- `concurrently@^9.2.0` - Run multiple commands
- `eslint` + `prettier` - Code quality

---

## 5. Configuration Files

### Frontend Configs

**tsconfig.json**
- Target: ESNext
- Module: ESNext
- Strict mode enabled
- Path alias: `@/ → src/`
- Module resolution: bundler

**vite.config.ts**
- HMR enabled for development
- Code splitting for vendors (Vuetify, Apollo, Firebase, D3)
- Source maps enabled
- Dynamic git commit hash injection
- Build time injection
- Port 3000 for dev server

**Environment Variables** (.env files)
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

### Backend Configs

**firebase.json**
- Firestore configuration
- Functions configuration
- Hosting configuration
- Emulator settings

**firestore.rules**
- Security rules for database access
- Role-based permissions

**firestore.indexes.json**
- Custom Firestore indexes

**apollo.config.js**
- Apollo GraphQL endpoint
- Schema configuration

### Root Configs

**eslint.config.js**
- ESLint rules for Vue & TypeScript
- Prettier integration

**.prettierrc.json**
- Code formatting rules

---

## 6. Key Features & Functionality

### 1. Task Tracking
- View all game tasks with GraphQL
- Mark tasks as complete/failed
- Track task objectives
- Task filtering by trader, type, status
- Multiple view modes (list, details, map)
- Task prerequisites & dependencies

### 2. Hideout Progression
- Track hideout module upgrades
- View station levels & requirements
- Item requirements visualization
- Craft tracking
- Station dependency visualization

### 3. Needed Items Tracker
- Aggregate items from tasks & hideout
- Filter by found-in-raid status
- Show item sources
- Quantity tracking
- Hideout vs task items separation

### 4. Map Integration
- D3.js-based map visualization
- Task locations on maps
- Objective GPS coordinates
- Map-specific task filtering

### 5. Game Mode Support
- PvP/PvE progression tracking
- Separate progress per game mode
- Game edition selection
- PMC faction tracking

### 6. Team Collaboration
- Share progress with team
- Hide items/tasks from team view
- Team member management
- Shared objectives

### 7. User Settings
- Language selection (6 languages)
- Streamer mode (hide sensitive info)
- View preferences
- Data import/export
- Account management
- API token generation

### 8. Data Persistence
- Real-time Firebase sync
- Automatic offline support
- Data migration handling
- Progress backup

---

## 7. Testing Infrastructure

**Unit Tests** (Vitest)
- Component tests with Vue Test Utils
- Composable tests
- Utility function tests
- `npm run test` - Watch mode
- `npm run test:ui` - Visual test UI
- `npm run test:run` - Single run
- `npm run test:coverage` - Coverage report

**E2E Tests** (Playwright)
- End-to-end scenarios
- `npm run test:e2e` - Headless tests
- `npm run test:e2e:ui` - Visual mode
- `npm run test:e2e:headed` - Browser view

**Code Quality**
- ESLint for linting
- Prettier for formatting
- Type checking with vue-tsc
- Pre-commit hooks ready

---

## 8. Build & Deployment

### Development
```bash
npm run dev          # Start dev server + emulators
npm run build:frontend  # Build Vue app only
npm run test         # Run tests
npm run lint         # Check code quality
```

### Production
```bash
npm run build:prod   # Production build
npm run deploy:prod  # Deploy to production Firebase
```

### Docker/Emulators
- Firebase local emulators
- Firestore emulator (port 5002)
- Auth emulator (port 9099)
- Functions emulator (port 5001)
- Storage emulator (port 9199)

---

## 9. Systems That Need Migration to Nuxt

### Must Migrate (Core Systems)

1. **State Management**
   - Pinia stores (app, progress, tarkov, user)
   - Firebase persistence layer
   - Game mode handling

2. **Routing**
   - 8 routes with StandardLayout wrapper
   - Nested layout structure
   - Route metadata (backgrounds)

3. **API Integration**
   - Apollo GraphQL client
   - Firebase services (Auth, Firestore, Functions)
   - GraphQL queries (data, hideout, language)

4. **Authentication**
   - Firebase Auth setup
   - Google/GitHub OAuth
   - User state management

5. **Data Management**
   - Composables (API, data, firebase)
   - Type definitions
   - GraphQL query builders

6. **UI Components**
   - 58 Vue components organized in 12 feature modules
   - Vuetify integration
   - Custom styling

7. **Internationalization**
   - 6 language files (150+ locale files)
   - Vue I18n setup
   - Language detection & switching

### Configuration to Adapt

1. **Build Config** (Vite → Nuxt)
   - Code splitting strategy
   - Environment variables
   - Asset handling

2. **TypeScript**
   - Path aliases (@/)
   - Type definitions
   - Strict mode

3. **Environment Files**
   - Firebase configuration
   - API endpoints
   - Build-time variables

### Testing Infrastructure

1. **Vitest** - Unit tests (compatible with Nuxt)
2. **Playwright** - E2E tests (compatible)
3. **ESLint/Prettier** - Code quality (compatible)

---

## 10. Notable Implementation Details

### Game Mode Split (PvP/PvE)
- `shared_state.ts` defines dual-progress structure
- Each mode has separate: level, faction, tasks, hideout progress
- Migration handles legacy single-mode data
- Current game mode is tracked & switchable

### Data Migration System
- `DataMigrationService.ts` handles legacy format conversion
- Supports partial migrations
- Data validation & healing
- Firebase sync integration

### Real-time Sync
- VueFire for Firestore integration
- Real-time listeners in composables
- Offline support through Pinia
- Automatic subscription management

### GraphQL Caching
- Apollo cache-first strategy
- Language-aware query variables
- Game mode as query parameter
- Cache invalidation on language/mode change

### Component Architecture
- Feature-based module organization
- Composable-based business logic
- Presentational components in features/
- Page components as route targets
- Layout wrapper pattern

---

## Summary

TarkovTracker is a comprehensive, well-structured Vue 3 application with:
- **58 Vue components** across **12 feature modules**
- **5 Pinia stores** managing complex state
- **Multiple data sources**: GraphQL API + Firebase Firestore + local storage
- **Advanced features**: Real-time sync, offline support, game mode splitting
- **Internationalization**: 6 languages with dynamic detection
- **Full test coverage**: Unit + E2E testing setup
- **Production-ready**: Deployed to Firebase with CI/CD

The migration to Nuxt should maintain this structure while leveraging Nuxt's:
- Auto-routing (file-based routes)
- Auto-imports (composables, components)
- Built-in SSR support (if needed)
- Improved performance through optimizations
- Enhanced DX with .env support
