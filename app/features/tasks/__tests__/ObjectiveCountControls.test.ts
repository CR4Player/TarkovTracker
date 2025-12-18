import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import ObjectiveCountControls from '@/features/tasks/ObjectiveCountControls.vue';
vi.mock('vue-i18n', () => {
  return {
    useI18n: () => ({
      t: (key: string, ...args: unknown[]) => {
        const lastArg = args[args.length - 1];
        return typeof lastArg === 'string' ? lastArg : key;
      },
    }),
  };
});
describe('ObjectiveCountControls', () => {
  it('disables decrease at zero', () => {
    const wrapper = mount(ObjectiveCountControls, { props: { currentCount: 0, neededCount: 3 } });
    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(3);
    expect((buttons[0]!.element as HTMLButtonElement).disabled).toBe(true);
    expect((buttons[1]!.element as HTMLButtonElement).disabled).toBe(false);
    expect(buttons[2]!.attributes('aria-pressed')).toBe('false');
    expect(buttons[0]!.attributes('aria-label')).toBeTruthy();
    expect(buttons[1]!.attributes('aria-label')).toBeTruthy();
  });
  it('disables increase at needed count', () => {
    const wrapper = mount(ObjectiveCountControls, { props: { currentCount: 3, neededCount: 3 } });
    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(3);
    expect((buttons[0]!.element as HTMLButtonElement).disabled).toBe(false);
    expect((buttons[1]!.element as HTMLButtonElement).disabled).toBe(true);
    expect(buttons[2]!.attributes('aria-pressed')).toBe('true');
  });
  it('emits actions when clicked', async () => {
    const wrapper = mount(ObjectiveCountControls, { props: { currentCount: 1, neededCount: 3 } });
    const buttons = wrapper.findAll('button');
    await buttons[0]!.trigger('click');
    await buttons[1]!.trigger('click');
    await buttons[2]!.trigger('click');
    expect(wrapper.emitted('decrease')).toHaveLength(1);
    expect(wrapper.emitted('increase')).toHaveLength(1);
    expect(wrapper.emitted('toggle')).toHaveLength(1);
  });
});
