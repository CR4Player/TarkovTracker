# Tarkov Data Overlay Repo Plan (tarkov.dev “Proxy Layer”)

## Problem Summary

The `tarkov.dev` GraphQL API is currently missing and/or serving outdated game data (notably after the
1.0 update). Multiple apps (including this Nuxt app) are forced to apply manual overrides in
code (for example in [`app/utils/constants.ts`](app/utils/constants.ts:1)) which:

- Diverges across projects and developers
- Is hard to review, version, and validate
- Makes “data fixes” require app releases

## Goals

- Maintain a **small, open-source** repo that contains only **overrides/patches** to apply on top of
  `tarkov.dev` responses.
- Make updates easy: contributors can **push a PR** with a small JSON/JSON5 change.
- Keep consumer implementations consistent: a **standardized merge/patch spec** + a tiny reference
  implementation.
- Allow apps to pin to a specific overlay version, while still supporting “latest” if desired.

## Non-Goals

- Replacing `tarkov.dev` entirely (base truth still comes from their API).
- Modeling every Tarkov mechanic (XP curves, hidden modifiers, etc.) unless we have a reliable
  data source.
- Implementing a full data pipeline. This should remain a lightweight overlay system.

## Proposed New Repo

### Repo Name

Example: `tarkov-data-overlay` (or `tarkov-data-proxy`).

### High-Level Structure

```
tarkov-data-overlay/
  manifest.json
  schema/
    overlay.schema.json
  overlays/
    v1/
      global/
        overrides/
          tasks/
            <taskId>.json5
          traders/
            <traderId>.json5
          maps/
            <mapId>.json5
          skills/
            <skillId>.json5
        patches/
          tasks/
            <taskId>.json
  scripts/
    build-overlay.mjs
    validate-overlay.mjs
  dist/
    overlay.v1.json
  README.md
  LICENSE
```

### Manifest Contract (`manifest.json`)

Minimal metadata that consumers can use to fetch and validate:

```jsonc
{
  "schemaVersion": 1,
  "overlayVersion": "1.2.0",
  "generatedAt": "2025-12-18T00:00:00Z",
  "dist": {
    "path": "dist/overlay.v1.json",
    "sha256": "<sha256>",
  },
  "compat": {
    "tarkovDevApi": "https://api.tarkov.dev/graphql",
    "notes": "Overlay targets post-1.0 data gaps",
  },
}
```

### Overlay Data Model (V1)

Use a single “dist” JSON file for easy consumption, generated from human-friendly files.

```ts
type OverlayV1 = {
  schemaVersion: 1;
  overrides: Record<EntityType, Record<string, unknown>>; // deep-merge object overrides
  patches: Record<EntityType, Record<string, JsonPatchOp[]>>; // RFC6902 patch ops
};

type EntityType = 'tasks' | 'traders' | 'maps' | 'skills' | 'items' | 'hideout';
```

#### Merge/Patch Rules (must be standardized)

1. Start with `base` data from `tarkov.dev`.
2. Apply `overrides` via **deep-merge** (object fields override base; `undefined` does nothing).
3. Apply `patches` via **JSON Patch (RFC6902)** for edge cases:
   - Arrays
   - Removing fields
   - Fixing nested paths without replacing whole objects
4. If an overlay includes `disabled: true`, consumers MAY filter the entity from UI, but should
   never delete it automatically unless explicitly patched/removed (avoid breaking referential
   integrity).

### Human-Friendly Files

#### Object Overrides (`overrides/**/<id>.json5`)

Good for simple “field is wrong/missing” changes:

```json5
// overlays/v1/global/overrides/tasks/66058cb22cee99303f1ba067.json5
{
  // Example: fix min player level for a task
  minPlayerLevel: 10,
}
```

#### JSON Patch (`patches/**/<id>.json`)

Good for arrays or precise nested edits:

```json
[
  { "op": "replace", "path": "/requirements/0/value", "value": 10 },
  { "op": "remove", "path": "/someDeprecatedField" }
]
```

## CI + Validation (keep contributions safe)

### Schema Validation

- Maintain `schema/overlay.schema.json`.
- CI runs:
  - Validate every `*.json5` (parse) and `*.json` (parse)
  - Validate generated `dist/overlay.v1.json` against the schema

### Deterministic Build

`scripts/build-overlay.mjs`:

- Reads `overlays/v1/**`
- Produces `dist/overlay.v1.json` with stable key ordering
- Updates `manifest.json` sha + generatedAt

### PR Checks

- Lint (optional)
- Validate (required)
- Build (required) and ensure `dist/` matches inputs

## Distribution Strategy (simple + flexible)

### Option A (recommended): GitHub Releases

- Every tag publishes `dist/overlay.v1.json` as a release asset.
- Consumers fetch:
  1. `manifest.json` from `raw` (or as a release asset)
  2. `dist/overlay.v1.json`
- Apps can pin to:
  - A specific tag (`v1.2.0`)
  - Or `main` (“latest”, less deterministic)

### Option B: npm package

- Publish `@org/tarkov-data-overlay`.
- Consumers import JSON directly.
- Pros: deterministic installs, no runtime fetch.
- Cons: requires app releases to update.

## Consumer Integration (Nuxt app example)

### Apply Overlay in the Server Proxy (preferred)

Apply overlay inside the existing Nuxt server API routes under `app/server/api/tarkov/` so the client
only ever sees “patched” data.

1. Fetch base `tarkov.dev` data (current behavior).
2. Fetch overlay once (cache on edge / in memory) keyed by overlay version.
3. Run `applyOverlay(base, overlay)` before returning.

### Runtime Config

Add config keys (example names):

- `public.overlayVersion` (e.g., `v1.2.0` or `main`)
- `public.overlayUrl` (optional override)

### Reference Implementation (share across codebases)

Publish a tiny `applyOverlay` implementation in the overlay repo (or a sibling repo), ideally:

- TypeScript, no framework dependencies
- JSON Patch support via a small, well-known library (or a minimal internal implementation)
- Deterministic behavior and good error messages

## Migrating Existing Local Overrides

### What likely stays app-local

These are app UX / integration details rather than “game data correctness”:

- `LIMITS`, `CACHE_CONSTANTS`, `API_PERMISSIONS`
- `API_SUPPORTED_LANGUAGES`, `LOCALE_TO_API_MAPPING`
- UI-only mappings

### What likely moves to the overlay repo

These reflect game data gaps/outdated values:

- `MANUAL_TASKS_OVERRIDE` (task-level corrections)
- `EXCLUDED_SCAV_KARMA_TASKS` (if it’s truly data-driven; otherwise keep local)
- `MAP_NAME_MAPPING` (if it’s compensating for API inconsistencies)
- Any “missing trader / wrong order / wrong requirements” style adjustments

## Standardization Guidelines (so multiple apps stay compatible)

- Prefer IDs (taskId/itemId/traderId) over names whenever possible.
- Keep overrides minimal: patch only the fields needed.
- Use JSON Patch for arrays; avoid replacing large objects unless necessary.
- Always include a short reason in the JSON5 file comment header.
- Maintain a `CHANGELOG.md` (or GitHub Releases notes) describing what changed and why.

## First Milestone Checklist

- [ ] Create repo skeleton and README
- [ ] Define Overlay V1 schema + merge rules in README
- [ ] Implement `build-overlay.mjs` + `validate-overlay.mjs`
- [ ] Add CI workflow (validate + build)
- [ ] Add first real overrides migrated from [`app/utils/constants.ts`](app/utils/constants.ts:1)
- [ ] Add “Nuxt integration” example snippet in README

## Stretch Goals (optional)

- Per-mode overlays (`pvp` vs `pve`) if data diverges meaningfully
- Locale-specific overrides only when unavoidable
- A small web diff viewer (base vs patched) for maintainers
