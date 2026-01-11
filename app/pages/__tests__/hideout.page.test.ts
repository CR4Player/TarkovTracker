import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import type { HideoutStation } from '@/types/tarkov';
const setup = async () => {
  const station: HideoutStation = {
    id: 'station-1',
    name: 'Workbench',
    levels: [
      {
        id: 'station-1-1',
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
  };
  vi.resetModules();
  vi.doMock('@/composables/useHideoutFiltering', () => ({
    useHideoutFiltering: () => ({
      activePrimaryView: ref('available'),
      isStoreLoading: ref(false),
      visibleStations: ref([station]),
      stationCounts: ref({ available: 1, maxed: 0, locked: 0, all: 1 }),
    }),
  }));
  vi.doMock('@/stores/useMetadata', () => ({
    useMetadataStore: () => ({
      hideoutStations: [station],
    }),
  }));
  vi.doMock('@/stores/useProgress', () => ({
    useProgressStore: () => ({
      hideoutLevels: { 'station-1': { self: 1 } },
    }),
  }));
  vi.doMock('vue-router', () => ({
    useRoute: () => ({ query: {} }),
    useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  }));
  vi.doMock('vue-i18n', () => ({
    useI18n: () => ({
      t: (_key: string, fallback?: string) => fallback ?? _key,
    }),
  }));
  const { default: HideoutPage } = await import('@/pages/hideout.vue');
  return HideoutPage;
};
describe('hideout page', () => {
  it('renders hideout cards', async () => {
    const HideoutPage = await setup();
    const wrapper = await mountSuspended(HideoutPage, {
      global: {
        stubs: {
          HideoutCard: { template: '<div data-testid="hideout-card" />' },
          RefreshButton: true,
          UAlert: true,
          UButton: true,
          UIcon: true,
        },
      },
    });
    expect(wrapper.find('[data-testid="hideout-card"]').exists()).toBe(true);
  });
});
