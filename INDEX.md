# TarkovTracker to Nuxt Migration - Documentation Index

## Quick Start

You have 4 comprehensive documentation files to guide the migration:

1. **EXPLORATION_SUMMARY.md** - Start here for overview
2. **TARKOV_TRACKER_ANALYSIS.md** - Deep dive into all systems
3. **MIGRATION_CHECKLIST.md** - Item-by-item checklist
4. **NUXT_STRUCTURE_MAPPING.md** - Implementation guide

---

## Documentation Overview

### EXPLORATION_SUMMARY.md (5 min read)
**Purpose**: High-level overview of the entire exploration
**Contains**:
- Project overview & statistics
- Summary of what documents exist
- Core systems to migrate table
- Complexity assessment
- Success criteria
- Recommended migration order

**Best for**: Getting oriented, understanding scope, planning timeline

---

### TARKOV_TRACKER_ANALYSIS.md (15-20 min read)
**Purpose**: Complete technical breakdown of TarkovTracker
**Contains**:
- Overall project structure (monorepo layout)
- Frontend architecture in detail
- All 5 Pinia stores explained
- All 12 feature modules (58 components)
- API integration systems (GraphQL + Firebase)
- All composables documented
- Types & interfaces
- Dependencies breakdown
- Configuration files explained
- Key features & functionality
- Testing infrastructure
- Build & deployment systems
- Notable implementation details

**Best for**: Understanding every system, reference during implementation

---

### MIGRATION_CHECKLIST.md (5 min read)
**Purpose**: Quick reference checklist of what to migrate
**Contains**:
- Project scope summary
- Checklist of stores to migrate
- Checklist of components to migrate
- Checklist of composables to migrate
- Checklist of configuration files
- Complexity classification per system
- Dependency compatibility table
- Effort estimation

**Best for**: Quick reference during actual migration work

---

### NUXT_STRUCTURE_MAPPING.md (10-15 min read)
**Purpose**: Step-by-step guide to reorganize code for Nuxt
**Contains**:
- Directory structure mapping (Current → Nuxt)
- Layout structure changes
- Components auto-import setup
- Plugins registration
- Composables auto-import
- Stores setup differences
- Environment variables migration
- TypeScript path aliases
- i18n setup in Nuxt
- Middleware setup
- Data fetching patterns
- Complete folder structure
- 10-step migration process
- Notes for complex features

**Best for**: Actual implementation, copy-paste ready examples

---

## How to Use These Documents

### Phase 1: Understanding (Day 1)
1. Read EXPLORATION_SUMMARY.md
2. Skim TARKOV_TRACKER_ANALYSIS.md (focus on sections 1-5)
3. Keep NUXT_STRUCTURE_MAPPING.md open for reference

### Phase 2: Planning (Day 1-2)
1. Use MIGRATION_CHECKLIST.md to create sprint tasks
2. Review complexity assessments in EXPLORATION_SUMMARY.md
3. Plan 2-3 week migration timeline

### Phase 3: Implementation (Days 3-15)
1. Follow 10-step process in NUXT_STRUCTURE_MAPPING.md
2. Check off items in MIGRATION_CHECKLIST.md as you go
3. Refer to TARKOV_TRACKER_ANALYSIS.md for deep dives
4. Use NUXT_STRUCTURE_MAPPING.md for code examples

### Phase 4: Verification (Days 16-21)
1. Run success criteria from EXPLORATION_SUMMARY.md
2. Test all items from MIGRATION_CHECKLIST.md
3. Verify against original in /home/lab/Github/TarkovTracker/

---

## Key Statistics at a Glance

```
Code to Migrate:
- 116 TypeScript/Vue files
- 58 Vue components (12 feature modules)
- 5 Pinia stores
- 15+ composables
- 8 page routes
- 6 language files

Architecture:
- Framework: Vue 3.5.18 + Vite 7.0.6
- State: Pinia 3.0.3
- UI: Vuetify 3.9.2
- API: Apollo 3.13.8 + Firebase 11-12
- i18n: Vue I18n 11.1.11
- Testing: Vitest + Playwright

Complexity:
- Low: Stores, composables, components, tests
- Medium: Routing, build config, plugins
- High: Firebase persistence, GraphQL, game mode split

Timeline: 2-3 weeks
```

---

## Special Attention Items

These systems require extra care during migration:

1. **Game Mode Split (PvP/PvE)**
   - Location: progress.ts store
   - Complex state structure - must preserve exactly
   - See: TARKOV_TRACKER_ANALYSIS.md #10

2. **Data Migration System**
   - Location: utils/DataMigrationService.ts
   - Converts legacy format to new structure
   - Handles Firebase sync
   - See: TARKOV_TRACKER_ANALYSIS.md #3.9

3. **Firebase Integration**
   - Real-time Firestore sync with Pinia
   - VueFire integration
   - Offline support
   - See: TARKOV_TRACKER_ANALYSIS.md #3.3

4. **GraphQL Caching**
   - Apollo cache-first strategy
   - Language-aware queries
   - Game mode parameters
   - See: TARKOV_TRACKER_ANALYSIS.md #3.3

5. **Real-time Synchronization**
   - VueFire integration
   - Firestore listeners
   - Auto-subscription management
   - See: NUXT_STRUCTURE_MAPPING.md "Complex Features"

---

## Original Project Location

All source code can be referenced at:
```
/home/lab/Github/TarkovTracker/
├── frontend/          # Vue 3 application (what we're migrating)
├── functions/         # Cloud Functions (keep as-is)
├── firebase.json      # Firebase config (keep)
├── firestore.rules    # Database rules (keep)
└── package.json       # Root workspace config
```

---

## Recommended Development Workflow

### Setup
```bash
# In TarkovTrackerNuxt directory
npm install
# Keep both projects open for reference
```

### During Migration
1. Keep NUXT_STRUCTURE_MAPPING.md window open
2. Reference original in /home/lab/Github/TarkovTracker/
3. Check items off in MIGRATION_CHECKLIST.md
4. Build frequently: `npm run build`

### Testing
```bash
npm run dev              # Start dev server
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
npm run lint             # Check code quality
npm run build            # Production build
```

---

## Documentation Files Summary

| File | Size | Read Time | Best For |
|------|------|-----------|----------|
| EXPLORATION_SUMMARY.md | 6KB | 5 min | Overview |
| TARKOV_TRACKER_ANALYSIS.md | 22KB | 15-20 min | Reference |
| MIGRATION_CHECKLIST.md | 6.6KB | 5 min | Tracking |
| NUXT_STRUCTURE_MAPPING.md | 13KB | 10-15 min | Implementation |
| INDEX.md | 4KB | 5 min | Navigation |

**Total**: 51.6KB of documentation
**Total Read Time**: 40-50 minutes for full understanding

---

## Next Steps

### Immediate (Day 1)
1. Read EXPLORATION_SUMMARY.md
2. Review NUXT_STRUCTURE_MAPPING.md
3. Understand complexity assessment

### Short-term (Days 1-2)
1. Setup nuxt.config.ts based on vite.config.ts
2. Create basic Nuxt project structure
3. Move stores to app/stores/
4. Move composables to app/composables/

### Medium-term (Days 3-10)
1. Migrate components to app/components/
2. Convert routing to file-based
3. Setup plugins (Firebase, Apollo, etc)
4. Configure i18n module

### Long-term (Days 11-21)
1. Integration testing
2. E2E testing
3. Performance verification
4. Data persistence testing

---

## Questions to Answer Before Starting

1. Will this be SSR/SSG? (Affects data fetching strategy)
2. Should we update dependencies during migration?
3. Any changes to feature set during migration?
4. Timeline constraints?
5. Team size working on migration?

**Assumption**: Client-side only (can add SSR later)

---

## Success Definition

Migration is complete when:

- [ ] All 8 routes are functional
- [ ] All 58 components render correctly
- [ ] All 5 stores are accessible
- [ ] Game mode PvP/PvE split works
- [ ] Firebase sync is operational
- [ ] GraphQL queries return data
- [ ] All 6 languages can be selected
- [ ] Authentication flow works
- [ ] Unit tests pass (>90% pass rate)
- [ ] E2E tests pass (>90% pass rate)
- [ ] No console errors in dev
- [ ] Production build completes successfully

---

## Support Documents

For additional information:
- Original TarkovTracker README: `/home/lab/Github/TarkovTracker/README.md`
- Frontend README: `/home/lab/Github/TarkovTracker/frontend/README.md`
- Nuxt Documentation: https://nuxt.com
- Pinia Documentation: https://pinia.vuejs.org

---

## Notes

- Keep original project intact for reference
- Don't delete Vue Router setup until Nuxt routing is 100% working
- Test Firebase integration early
- Verify game mode split frequently during migration
- Save git commits frequently with clear messages

---

**Last Updated**: November 18, 2025
**Status**: Exploration Complete
**Ready**: Yes, proceed with migration

