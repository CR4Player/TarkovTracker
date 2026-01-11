import { describe, expect, it, vi } from 'vitest';
import { isRef, ref } from 'vue';
import type { HideoutStation } from '@/types/tarkov';
const createStations = (): HideoutStation[] => [
  {
    id: 'station-available',
    name: 'Available Station',
    levels: [
      {
        id: 'station-available-1',
        level: 1,
        description: 'Level 1',
        constructionTime: 0,
        itemRequirements: [],
        stationLevelRequirements: [],
        skillRequirements: [],
        traderRequirements: [],
        crafts: [],
      },
      {
        id: 'station-available-2',
        level: 2,
        description: 'Level 2',
        constructionTime: 0,
        itemRequirements: [],
        stationLevelRequirements: [
          {
            id: 'req-station',
            station: { id: 'station-prereq', name: 'Prereq' },
            level: 1,
          },
        ],
        skillRequirements: [],
        traderRequirements: [],
        crafts: [],
      },
    ],
  },
  {
    id: 'station-maxed',
    name: 'Maxed Station',
    levels: [
      {
        id: 'station-maxed-1',
        level: 1,
        description: 'Level 1',
        constructionTime: 0,
        itemRequirements: [],
        stationLevelRequirements: [],
        skillRequirements: [],
        traderRequirements: [],
        crafts: [],
      },
    ],
  },
  {
    id: 'station-locked',
    name: 'Locked Station',
    levels: [
      {
        id: 'station-locked-1',
        level: 1,
        description: 'Level 1',
        constructionTime: 0,
        itemRequirements: [],
        stationLevelRequirements: [
          {
            id: 'req-missing',
            station: { id: 'station-missing', name: 'Missing' },
            level: 1,
          },
        ],
        skillRequirements: [],
        traderRequirements: [],
        crafts: [],
      },
      {
        id: 'station-locked-2',
        level: 2,
        description: 'Level 2',
        constructionTime: 0,
        itemRequirements: [],
        stationLevelRequirements: [],
        skillRequirements: [],
        traderRequirements: [],
        crafts: [],
      },
    ],
  },
];
const createProgressStore = () => ({
  hideoutLevels: {
    'station-available': { self: 1 },
    'station-maxed': { self: 1 },
    'station-locked': { self: 0 },
    'station-prereq': { self: 1 },
  },
  visibleTeamStores: { self: {} },
});
const setup = async (view: string) => {
  const hideoutStations = createStations();
  const metadataStore = {
    hideoutStations: ref(hideoutStations),
    hideoutLoading: ref(false),
    hasInitialized: true,
  };
  const progressStore = createProgressStore();
  const preferencesStore = {
    getTaskPrimaryView: view,
    setTaskPrimaryView: vi.fn(),
  };
  vi.resetModules();
  vi.doMock('pinia', async () => {
    const actual = await vi.importActual<typeof import('pinia')>('pinia');
    return {
      ...actual,
      storeToRefs: (store: Record<string, unknown>) => {
        const refs: Record<string, unknown> = {};
        Object.entries(store).forEach(([key, value]) => {
          refs[key] = isRef(value) ? value : ref(value);
        });
        return refs;
      },
    };
  });
  vi.doMock('@/stores/useMetadata', () => ({
    useMetadataStore: () => metadataStore,
  }));
  vi.doMock('@/stores/useProgress', () => ({
    useProgressStore: () => progressStore,
  }));
  vi.doMock('@/stores/usePreferences', () => ({
    usePreferencesStore: () => preferencesStore,
  }));
  const { useHideoutFiltering } = await import('@/composables/useHideoutFiltering');
  return {
    hideoutFiltering: useHideoutFiltering(),
  };
};
describe('useHideoutFiltering', () => {
  it('calculates station counts', async () => {
    const { hideoutFiltering } = await setup('all');
    expect(hideoutFiltering.stationCounts.value).toEqual({
      available: 1,
      maxed: 1,
      locked: 1,
      all: 3,
    });
  });
  it('shows available stations when filtered', async () => {
    const { hideoutFiltering } = await setup('available');
    expect(hideoutFiltering.visibleStations.value.map((station) => station.id)).toEqual([
      'station-available',
    ]);
  });
  it('shows maxed stations when filtered', async () => {
    const { hideoutFiltering } = await setup('maxed');
    expect(hideoutFiltering.visibleStations.value.map((station) => station.id)).toEqual([
      'station-maxed',
    ]);
  });
  it('shows locked stations when filtered', async () => {
    const { hideoutFiltering } = await setup('locked');
    expect(hideoutFiltering.visibleStations.value.map((station) => station.id)).toEqual([
      'station-locked',
    ]);
  });
});
