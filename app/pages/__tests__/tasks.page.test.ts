import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import { isRef, ref } from 'vue';
import type { Task } from '@/types/tarkov';
const setup = async () => {
  const task: Task = { id: 'task-1', name: 'Sample Task' };
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
  vi.doMock('@/composables/useTaskFiltering', () => ({
    useTaskFiltering: () => ({
      visibleTasks: ref([task]),
      reloadingTasks: ref(false),
      updateVisibleTasks: vi.fn(() => Promise.resolve()),
    }),
  }));
  vi.doMock('@/composables/useInfiniteScroll', () => ({
    useInfiniteScroll: () => ({
      checkAndLoadMore: vi.fn(),
    }),
  }));
  vi.doMock('@/composables/useTarkovTime', () => ({
    useTarkovTime: () => ({
      tarkovTime: ref('12:00'),
    }),
  }));
  vi.doMock('@/stores/useMetadata', () => ({
    useMetadataStore: () => ({
      tasks: [task],
      loading: false,
      hasInitialized: true,
      mapsWithSvg: [],
      editions: [],
      objectiveMaps: {},
      objectiveGPS: {},
    }),
  }));
  vi.doMock('@/stores/usePreferences', () => ({
    usePreferencesStore: () => ({
      getTaskPrimaryView: 'all',
      getTaskSecondaryView: 'available',
      getTaskUserView: 'self',
      getTaskMapView: 'all',
      getTaskTraderView: 'all',
      getTaskSortMode: 'none',
      getTaskSortDirection: 'asc',
      getTaskSharedByAllOnly: false,
      getHideNonKappaTasks: false,
      getShowNonSpecialTasks: true,
      getShowLightkeeperTasks: true,
    }),
  }));
  vi.doMock('@/stores/useProgress', () => ({
    useProgressStore: () => ({
      tasksCompletions: {},
      tasksFailed: {},
      unlockedTasks: {},
    }),
  }));
  vi.doMock('@/stores/useTarkov', () => ({
    useTarkovStore: () => ({
      getGameEdition: () => 1,
      isTaskObjectiveComplete: () => false,
    }),
  }));
  vi.doMock('vue-i18n', () => ({
    useI18n: () => ({
      t: (_key: string, fallback?: string) => fallback ?? _key,
    }),
  }));
  vi.doMock('vue-router', () => ({
    useRoute: () => ({ query: {} }),
    useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  }));
  vi.doMock('@/features/maps/LeafletMap.vue', () => ({
    default: { template: '<div data-testid="leaflet-map" />' },
  }));
  const { default: TasksPage } = await import('@/pages/tasks.vue');
  return TasksPage;
};
describe('tasks page', () => {
  it('renders task cards when tasks are available', async () => {
    const TasksPage = await setup();
    const wrapper = await mountSuspended(TasksPage, {
      global: {
        stubs: {
          TaskCard: { template: '<div data-testid="task-card" />' },
          TaskFilterBar: { template: '<div data-testid="task-filter" />' },
          TaskEmptyState: true,
          TaskLoadingState: true,
          Teleport: true,
          Transition: false,
          UAlert: true,
          UButton: true,
          UCard: true,
          UIcon: true,
        },
      },
    });
    expect(wrapper.find('[data-testid="task-card"]').exists()).toBe(true);
  });
});
