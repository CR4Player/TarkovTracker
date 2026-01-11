import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
const setup = async () => {
  vi.resetModules();
  vi.doMock('@/stores/usePreferences', () => ({
    usePreferencesStore: () => ({
      getEnableHolidayEffects: false,
    }),
  }));
  const { default: DashboardProgressCard } =
    await import('@/features/dashboard/DashboardProgressCard.vue');
  return DashboardProgressCard;
};
describe('DashboardProgressCard', () => {
  it('renders progress values and emits click', async () => {
    const DashboardProgressCard = await setup();
    const wrapper = mount(DashboardProgressCard, {
      props: {
        icon: 'i-mdi-check',
        label: 'Tasks',
        completed: 5,
        total: 10,
        percentage: 50,
        color: 'primary',
      },
      global: {
        stubs: {
          UIcon: true,
        },
      },
    });
    expect(wrapper.text()).toContain('Tasks');
    expect(wrapper.text()).toContain('5/10');
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('50');
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
