import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import { isRef, ref } from 'vue';
import type { NeededItemTaskObjective } from '@/types/tarkov';
const setup = async () => {
  const neededItem: NeededItemTaskObjective = {
    id: 'need-1',
    needType: 'taskObjective',
    taskId: 'task-1',
    item: { id: 'item-1', name: 'Item' },
    count: 1,
    foundInRaid: false,
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
  vi.doMock('@/composables/useInfiniteScroll', () => ({
    useInfiniteScroll: () => ({ checkAndLoadMore: vi.fn() }),
  }));
  vi.doMock('@/composables/useSharedBreakpoints', () => ({
    useSharedBreakpoints: () => ({
      belowMd: ref(false),
      xs: ref(false),
    }),
  }));
  vi.doMock('@/stores/useMetadata', () => ({
    useMetadataStore: () => ({
      neededItemTaskObjectives: ref([neededItem]),
      neededItemHideoutModules: ref([]),
      itemsFullLoaded: ref(true),
      items: ref([neededItem]),
      itemsLoading: ref(false),
      editions: [],
      getTaskById: () => ({ id: 'task-1', factionName: 'Any' }),
      getStationById: () => null,
    }),
  }));
  vi.doMock('@/stores/useProgress', () => ({
    useProgressStore: () => ({
      playerFaction: { self: 'USEC' },
      objectiveCompletions: {},
      tasksCompletions: {},
      hideoutLevels: {},
    }),
  }));
  vi.doMock('@/stores/usePreferences', () => ({
    usePreferencesStore: () => ({
      getNeededItemsViewMode: 'list',
      setNeededItemsViewMode: vi.fn(),
      getNeededTypeView: 'all',
      setNeededTypeView: vi.fn(),
      getNeededItemsFirFilter: 'all',
      setNeededItemsFirFilter: vi.fn(),
      getNeededItemsGroupByItem: false,
      setNeededItemsGroupByItem: vi.fn(),
      getNeededItemsHideNonFirSpecialEquipment: false,
      setNeededItemsHideNonFirSpecialEquipment: vi.fn(),
      getNeededItemsKappaOnly: false,
      setNeededItemsKappaOnly: vi.fn(),
      itemsTeamAllHidden: false,
      setItemsTeamHideAll: vi.fn(),
    }),
  }));
  vi.doMock('@/stores/useTarkov', () => ({
    useTarkovStore: () => ({
      getGameEdition: () => 1,
      getObjectiveCount: () => 0,
      getHideoutPartCount: () => 0,
    }),
  }));
  vi.doMock('vue-i18n', () => ({
    useI18n: () => ({
      t: (_key: string, fallback?: string) => fallback ?? _key,
    }),
  }));
  const { default: NeededItemsPage } = await import('@/pages/neededitems.vue');
  return NeededItemsPage;
};
describe('needed items page', () => {
  it('renders needed items list', async () => {
    const NeededItemsPage = await setup();
    const wrapper = await mountSuspended(NeededItemsPage, {
      global: {
        stubs: {
          NeededItemsFilterBar: { template: '<div data-testid="filter-bar" />' },
          NeededItem: { template: '<div data-testid="needed-item" />' },
          NeededItemGroupedCard: { template: '<div data-testid="grouped-item" />' },
          UCard: true,
          UIcon: true,
        },
      },
    });
    expect(wrapper.find('[data-testid="filter-bar"]').exists()).toBe(true);
  });
});
