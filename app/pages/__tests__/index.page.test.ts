import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
const setup = async () => {
  vi.resetModules();
  vi.doMock('@/composables/useDashboardStats', () => ({
    useDashboardStats: () => ({
      completedTasks: computed(() => 5),
      totalTasks: computed(() => 10),
      availableTasksCount: computed(() => 2),
      failedTasksCount: computed(() => 1),
      completedObjectives: computed(() => 3),
      totalObjectives: computed(() => 6),
      completedTaskItems: computed(() => 4),
      totalTaskItems: computed(() => 8),
      completedKappaTasks: computed(() => 1),
      totalKappaTasks: computed(() => 2),
      completedLightkeeperTasks: computed(() => 0),
      totalLightkeeperTasks: computed(() => 1),
      traderStats: ref([
        {
          id: 'trader-1',
          name: 'Trader One',
          imageLink: null,
          completedTasks: 2,
          totalTasks: 4,
          percentage: '50.0',
        },
      ]),
    }),
  }));
  vi.doMock('@/composables/useXpCalculation', () => ({
    useXpCalculation: () => ({ derivedLevel: ref(10) }),
  }));
  vi.doMock('@/stores/useTarkov', () => ({
    useTarkovStore: () => ({
      playerLevel: () => 8,
    }),
  }));
  vi.doMock('@/stores/usePreferences', () => ({
    usePreferencesStore: () => ({
      getEnableHolidayEffects: false,
      getUseAutomaticLevelCalculation: false,
      setTaskPrimaryView: vi.fn(),
      setTaskTraderView: vi.fn(),
    }),
  }));
  vi.doMock('vue-router', () => ({
    useRouter: () => ({ push: vi.fn() }),
  }));
  const { default: DashboardPage } = await import('@/pages/index.vue');
  return DashboardPage;
};
describe('dashboard page', () => {
  it('renders dashboard cards', async () => {
    const DashboardPage = await setup();
    const wrapper = await mountSuspended(DashboardPage, {
      global: {
        stubs: {
          AppTooltip: { template: '<span><slot /></span>' },
          DashboardProgressCard: { template: '<div data-testid="progress-card" />' },
          DashboardMilestoneCard: { template: '<div data-testid="milestone-card" />' },
          UIcon: true,
        },
      },
    });
    expect(wrapper.find('[data-testid="progress-card"]').exists()).toBe(true);
  });
});
