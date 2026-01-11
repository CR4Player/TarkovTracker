import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
const UButtonStub = {
  props: ['icon'],
  emits: ['click'],
  template: '<button :data-icon="icon" @click="$emit(\'click\')"><slot /></button>',
};
const UInputStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template:
    '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
};
const setup = async () => {
  vi.resetModules();
  const { default: NeededItemsFilterBar } =
    await import('@/features/neededitems/NeededItemsFilterBar.vue');
  return NeededItemsFilterBar;
};
describe('NeededItemsFilterBar', () => {
  it('emits updates for search and view controls', async () => {
    const NeededItemsFilterBar = await setup();
    const wrapper = mount(NeededItemsFilterBar, {
      props: {
        modelValue: 'all',
        search: '',
        viewMode: 'list',
        filterTabs: [{ label: 'All', value: 'all', icon: 'i-mdi-format-list-bulleted', count: 3 }],
        totalCount: 3,
        ungroupedCount: 3,
        firFilter: 'all',
        groupByItem: false,
        hideTeamItems: false,
        hideNonFirSpecialEquipment: false,
        kappaOnly: false,
      },
      global: {
        mocks: {
          $t: (key: string, fallback?: string) => fallback ?? key,
        },
        stubs: {
          AppTooltip: { template: '<span><slot /></span>' },
          UBadge: true,
          UButton: UButtonStub,
          UIcon: true,
          UInput: UInputStub,
          UPopover: { template: '<div><slot /><slot name="content" /></div>' },
        },
      },
    });
    await wrapper.find('input').setValue('gpu');
    expect(wrapper.emitted('update:search')).toEqual([['gpu']]);
    await wrapper.find('button[data-icon="i-mdi-view-list"]').trigger('click');
    expect(wrapper.emitted('update:viewMode')).toEqual([['list']]);
    expect(wrapper.emitted('update:groupByItem')).toEqual([[false]]);
    await wrapper.find('button[data-icon="i-mdi-group"]').trigger('click');
    expect(wrapper.emitted('update:groupByItem')).toEqual([[false], [true]]);
  });
});
