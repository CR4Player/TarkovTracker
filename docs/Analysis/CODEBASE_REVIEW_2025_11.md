# Codebase Review & Refactor Plan
**Date:** November 30, 2025
**Version:** 1.0

## A) Executive Summary

### Top 5 Issues (Impact & Root Causes)
1.  **"God Store" Pattern (`useMetadataStore`)**:
    *   **Symptom**: The store is 600+ lines mixing API fetching, caching logic, graph data processing, and state management.
    *   **Root Cause**: Lack of a dedicated "Service" or "Repository" layer. All logic related to static data was dumped into the Pinia store.
    *   **Impact**: Hard to test, hard to refactor, performance bottlenecks when the graph re-calculates on every state change.

2.  **Split-Brain Data Access**:
    *   **Symptom**: Data access is scattered between `useEdgeFunctions` (custom fetch wrappers), `useTarkovCache` (IndexedDB wrappers), and direct `$fetch` calls in stores.
    *   **Root Cause**: Organic growth of different backend strategies (Supabase Edge Functions vs. Cloudflare Workers vs. Nuxt Server Routes).
    *   **Impact**: Inconsistent error handling, auth token management, and caching strategies.

3.  **Component Logic Bloat (`TaskCard.vue`)**:
    *   **Symptom**: UI components contain complex business logic (e.g., `handleAlternatives`, `handleTaskObjectives`).
    *   **Root Cause**: Missing "Smart/Dumb" component separation or dedicated composables for task interactions.
    *   **Impact**: Logic is duplicated or hard to reuse; components are difficult to unit test.

4.  **Fragile Type Safety in Progress State**:
    *   **Symptom**: `progressState.ts` relies on `Record<string, unknown>` and manual casting (`as UserProgressData`) during migration logic.
    *   **Root Cause**: Handling legacy data structures mixed with new "Game Mode" support without a strict schema validation library (like Zod).
    *   **Impact**: Runtime errors if the data shape doesn't match expectations, especially for new users or corrupted local storage.

5.  **Security/Consistency Risk in Worker Fallbacks**:
    *   **Symptom**: The `team-gateway` worker manually implements fallback logic using the `SUPABASE_SERVICE_ROLE_KEY` to delete records when the Edge Function fails.
    *   **Root Cause**: Trying to work around Edge Function reliability or reachability issues by re-implementing logic in the Worker.
    *   **Impact**: Security risk (Service Role usage), logic duplication (two places to maintain "leave team" logic), and potential data inconsistencies.

### Top 5 Quick Wins (1-2 Days)
1.  **Extract Task Logic**: Move `handleTaskObjectives`, `handleAlternatives`, and completion logic from `TaskCard.vue` to a `useTaskActions` composable.
2.  **Strict Types for Progress**: Replace `Record<string, unknown>` in `progressState.ts` with Zod schemas to validate data at runtime during migration.
3.  **Centralize API Config**: Consolidate `teamGatewayUrl` and `tokenGatewayUrl` logic into a single `useApiClient` or `useGateway` composable that handles the base URL normalization and auth headers.
4.  **Fix Tailwind Hardcoding**: Replace `bg-[hsl(240,5%,5%)]!` in `TaskCard.vue` with a semantic token (e.g., `bg-surface-950`) defined in `tailwind.css`.
5.  **Standardize Store Resets**: The `resetTasksData` and `resetHideoutData` in `useMetadataStore` are manual. Use `store.$reset()` or a composition API pattern to handle resets cleaner.

### Top 3 Strategic Refactors (1-4 Weeks)
1.  **Service Layer Extraction**: Move all data fetching and graph processing out of `useMetadataStore` into `services/metadataService.ts` and `services/graphService.ts`. The store should only hold the *result*.
2.  **Unified API Layer (Nuxt Nitro)**: Instead of Client -> Worker -> Supabase, standardize on Client -> Nuxt Server API (/server/api) -> Worker/Supabase. This hides the complexity of "which backend" from the client and allows for better caching/validation on the Nuxt server.
3.  **Monorepo/Workspace Cleanup**: If `workers/` and `supabase/` are in the same repo, ensure shared types are actually shared (e.g., via a local npm package or workspace) to prevent type drift between backend and frontend.

---

## B) Architecture & Boundary Map

### Current Architecture
*   **Client**: Nuxt 3 SPA (mostly).
*   **State**: Pinia Stores (`useMetadata`, `useProgress`) doing heavy lifting.
*   **Data Access**: Mixed.
    *   `$fetch` -> `/api/tarkov/*` (Nuxt Server Routes) -> `tarkov.dev` API.
    *   `useEdgeFunctions` -> Cloudflare Worker (`team-gateway`) -> Supabase Edge Functions.
    *   `useEdgeFunctions` -> Supabase Client (Direct).
*   **Caching**: Custom `IndexedDB` implementation (`useTarkovCache`).

### Recommended Target Architecture

1.  **UI Layer (Components)**
    *   **Dumb Components**: `TaskCard`, `ObjectiveRow`. Receive props, emit events. No store access.
    *   **Smart Containers**: `TaskPage`, `Dashboard`. Connect to stores/composables.

2.  **Composable Domain Boundaries**
    *   `useTaskActions`: Logic for completing/locking tasks.
    *   `useTeamActions`: Logic for team management.
    *   `useUserProgress`: Logic for local user state.

3.  **Data Access Layer (Client-Side)**
    *   `api/gateway.ts`: Typed client for the Team Gateway.
    *   `api/tarkov.ts`: Typed client for Tarkov Data.
    *   *Rule*: Stores import these, they don't make `$fetch` calls directly.

4.  **Server Layer (Nuxt Nitro)**
    *   Acts as the primary "Backend for Frontend" (BFF).
    *   Proxies requests to `tarkov.dev` (caching them).
    *   Proxies requests to Team Gateway (injecting secrets if needed, though currently client has token).

5.  **Cloudflare Worker (`team-gateway`)**
    *   **Responsibility**: Rate limiting, high-speed routing, simple KV lookups.
    *   **Change**: Remove complex business logic (like the "leave team" fallback). It should just be a gateway. Complex logic belongs in Supabase Edge Functions or a dedicated service.

---

## C) Findings: Prioritized & Actionable

### 1. The "God Store" (`useMetadataStore.ts`)
*   **Problem**: Violates Single Responsibility Principle. Handles fetching, caching, graph building, and state.
*   **Evidence**: `app/stores/useMetadata.ts` lines 214-619 (Actions are huge).
*   **Why it matters**: Any change to data fetching risks breaking the graph. Testing the graph logic requires mocking the entire store.
*   **Fix**:
    1.  Create `app/services/tarkovDataService.ts` for the `$fetch` and `IndexedDB` logic.
    2.  Create `app/services/graphService.ts` for the `graphology` logic.
    3.  Store calls `tarkovDataService.getTasks()`, then passes result to `graphService.buildGraph()`, then commits state.
*   **Scope**: Large / Med Risk.

### 2. Unsafe Progress Migration (`progressState.ts`)
*   **Problem**: `migrateToGameModeStructure` uses loose typing and assumes data shapes.
*   **Evidence**: `app/stores/progressState.ts` lines 78-150. `const data = legacyData as Record<string, unknown>;`
*   **Why it matters**: If a user has corrupted local storage or an old format you didn't anticipate, this could crash the app or lose data.
*   **Fix**: Use `zod` to define the expected schema for Legacy and New formats. `safeParse` the data. If it fails, fallback to default safely with a log.
*   **Scope**: Medium / Low Risk.

### 3. Hardcoded Styles & Logic in UI (`TaskCard.vue`)
*   **Problem**: `bg-[hsl(240,5%,5%)]!` and logic like `handleAlternatives` inside the view.
*   **Evidence**: `app/features/tasks/TaskCard.vue` line 4 and lines 199-212.
*   **Why it matters**: The color is a "magic string" that won't update with the theme. The logic is untestable.
*   **Fix**:
    1.  Add color to `tailwind.css` or `app.config.ts`.
    2.  Move `handleAlternatives` to `useTaskActions.ts`.
*   **Scope**: Small / Low Risk.

### 4. Worker "Service Role" Fallback (`workers/team-gateway`)
*   **Problem**: The worker falls back to using the `SUPABASE_SERVICE_ROLE_KEY` to manually delete rows if the Edge Function fails.
*   **Evidence**: `workers/team-gateway/src/index.ts` lines 155-253.
*   **Why it matters**: This exposes the "Keys to the Kingdom" (Service Role) in the Worker environment. If the Worker logic has a bug, it could delete wrong data. It duplicates the "Leave Team" logic which should live in one place (the DB/Edge Function).
*   **Fix**:

    **Observed Failure Modes to Investigate**:
    - Timeouts (Edge Function execution exceeds cold start + processing time)
    - 4xx authentication errors (JWT expired, invalid token, missing auth header)
    - 5xx internal errors (database connection failures, RLS policy violations)
    - Payload validation failures (malformed request body, missing required fields)
    - Rate limiting (Supabase Edge Function quotas exceeded)

    **Investigation Steps**:
    1. **Check Edge Function Logs**:
       - Access Supabase Dashboard → Edge Functions → `team-leave` (or relevant function)
       - Review recent invocations for error patterns and stack traces
       - Check deployment history for recent changes that correlate with failures

    2. **Reproduce with Same Payloads**:
       - Capture failing request payloads from Worker logs
       - Test Edge Function directly via `supabase functions invoke` with captured payloads
       - Verify JWT token validity and expiration times
       - Test with different user roles to isolate RLS policy issues

    3. **Enable Debug-Level Logging**:
       - Add detailed logging to Edge Function: log incoming requests, auth context, database queries
       - Add timing measurements to identify bottlenecks (cold start, DB query, transaction time)
       - Log full error objects including stack traces and context

    4. **Capture Request/Response Timing**:
       - Measure Edge Function cold start time vs. warm execution
       - Track database query latency within the function
       - Identify if timeouts occur during specific operations (e.g., cascading deletes)

    5. **Inspect Auth Token & Headers**:
       - Verify JWT expiry and refresh token flow
       - Check Authorization header format and Bearer token presence
       - Validate that RLS policies allow the user to perform the operation
       - Test with service role key directly to rule out permission issues

    **Interim Monitoring & Alerting** (implement before removing fallback):
    1. **Create Alerts**:
       - Alert on Edge Function 5xx error rate > 5% over 5-minute window
       - Alert on p95 latency > 3 seconds (indicates timeouts)
       - Alert on 401/403 auth failure rate spike
       - Alert on Worker fallback usage (log and count fallback invocations)

    2. **Add Distributed Tracing**:
       - Instrument Worker → Edge Function → Database call chain
       - Use trace IDs to correlate Worker requests with Edge Function logs
       - Track end-to-end latency from client → Worker → Edge Function → DB

    3. **Correlate with Worker Metrics**:
       - Compare Worker success rate with/without fallback
       - Identify if failures are concentrated in specific regions or time windows
       - Check if failures correlate with Supabase maintenance or deployments

    **Removal Plan** (execute only after root cause is fixed):
    1. Verify Edge Function failure rate < 0.1% over 7 days
    2. Confirm all alert channels are active and tested
    3. Deploy Worker change to remove Service Role fallback
    4. Monitor for 24 hours with rollback plan ready
    5. Return 500 error to client if Edge Function fails (let client retry with exponential backoff)

*   **Scope**: Medium / High Risk.

### 5. Immediate IDE Errors (New)
*   **Problem**: Type mismatches in `MapMarker.vue` (style props) and `AccountDeletionCard.vue` (invalid color props, missing `provider` on User).
*   **Evidence**:
    - `app/features/maps/MapMarker.vue` lines 3, 14, 128-150: Style bindings return objects with `as unknown as Record<string, string>` casts that cause type mismatches with HTMLAttributes
    - `app/features/settings/AccountDeletionCard.vue` line 6: `highlight-color="red"` uses non-theme color
    - `app/features/settings/AccountDeletionCard.vue` lines 126-142: `($supabase.user as any).provider` uses unsafe type cast to access `provider` property not defined on SupabaseUser type
*   **Why it matters**: Type casts suppress compiler errors and mask potential runtime failures. Builds may fail or produce unstable code. Non-theme colors break design system consistency.
*   **Fix**:
    1.  `MapMarker.vue` lines 128-150: Remove `as unknown as Record<string, string>` casts from `markerStyle` and `tooltipStyle`. Use proper CSS-in-JS typing (e.g., `CSSProperties` from Vue or define explicit return type).
    2.  `AccountDeletionCard.vue` line 6: Replace `highlight-color="red"` with theme color `highlight-color="error"`.
    3.  `AccountDeletionCard.vue` lines 126-142: Extend SupabaseUser type definition to include `app_metadata.provider` field or create a type guard function to safely access provider without `as any` cast.

---

## D) Refactor Plan

### PR 1: "Fix: Immediate Type Safety & UI Bugs"
*   **Goal**: Clear existing IDE errors to ensure a clean baseline.
*   **Files**: `app/features/maps/MapMarker.vue`, `app/features/settings/AccountDeletionCard.vue`.
*   **Steps**:
    1.  `MapMarker.vue` lines 128-150: Remove unsafe type casts (`as unknown as Record<string, string>`) from `markerStyle` and `tooltipStyle` computed properties. Replace with proper CSS-in-JS typing.
    2.  `AccountDeletionCard.vue` line 6: Replace `highlight-color="red"` with theme color `highlight-color="error"`.
    3.  `AccountDeletionCard.vue` lines 126-142: Fix unsafe `($supabase.user as any).provider` type cast. Either extend the SupabaseUser type definition or create a type guard function for safe access.

### PR 2: "Refactor: Extract Task Logic to Composable"
*   **Goal**: Clean up `TaskCard.vue` and make task actions reusable.
*   **Files**: `app/features/tasks/TaskCard.vue`, `app/composables/useTaskActions.ts` (NEW).
*   **Steps**:
    1.  Create `useTaskActions`.
    2.  Move `markTaskComplete`, `markTaskUncomplete`, `handleAlternatives` into it.
    3.  Update `TaskCard` to use the composable.
*   **Tests**: Unit test `useTaskActions`.

### PR 3: "Chore: Strict Types for Progress State"
*   **Goal**: Safe data migration.
*   **Files**: `app/stores/progressState.ts`.
*   **Steps**:
    1.  Install `zod`.
    2.  Define `LegacyProgressSchema` and `ModernProgressSchema`.
    3.  Rewrite `migrateToGameModeStructure` to use `schema.safeParse`.

### PR 4: "Refactor: Service Layer for Metadata"
*   **Goal**: Decompose `useMetadataStore`.
*   **Files**: `app/stores/useMetadata.ts`, `app/services/tarkovData.ts` (NEW).
*   **Steps**:
    1.  Move `fetchTasksData`, `fetchHideoutData` logic to `tarkovData.ts`.
    2.  Inject `tarkovData` service into the store.
