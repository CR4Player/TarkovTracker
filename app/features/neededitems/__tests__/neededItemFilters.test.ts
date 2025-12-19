import { describe, expect, it } from 'vitest';
import { isNonFirSpecialEquipment } from '@/features/neededitems/neededItemFilters';
import type { NeededItemTaskObjective, TarkovItem } from '@/types/tarkov';
const createItem = (overrides: Partial<TarkovItem> = {}): TarkovItem => {
  return {
    id: 'item-id',
    name: 'Item',
    ...overrides,
  };
};
const createNeed = (overrides: Partial<NeededItemTaskObjective> = {}): NeededItemTaskObjective => {
  return {
    id: 'need-id',
    needType: 'taskObjective',
    taskId: 'task-id',
    item: createItem(),
    count: 1,
    foundInRaid: false,
    ...overrides,
  };
};
describe('isNonFirSpecialEquipment', () => {
  it('returns true for marker items when non-FIR', () => {
    const need = createNeed({
      markerItem: createItem({ id: 'marker-id', name: 'MS2000 Marker' }),
      foundInRaid: false,
    });
    expect(isNonFirSpecialEquipment(need)).toBe(true);
  });
  it('returns false for FIR items even if they have a marker item', () => {
    const need = createNeed({
      markerItem: createItem({ id: 'marker-id', name: 'MS2000 Marker' }),
      foundInRaid: true,
    });
    expect(isNonFirSpecialEquipment(need)).toBe(false);
  });
  it('returns true when the item category matches "special equipment"', () => {
    const need = createNeed({
      item: createItem({
        category: { id: 'cat', name: 'Special Equipment' },
      }),
    });
    expect(isNonFirSpecialEquipment(need)).toBe(true);
  });
  it('returns true when the item types include "special equipment"', () => {
    const need = createNeed({
      item: createItem({
        types: ['Quest', 'Special Equipment'],
      }),
    });
    expect(isNonFirSpecialEquipment(need)).toBe(true);
  });
  it('returns false when item is not special equipment', () => {
    const need = createNeed({
      item: createItem({
        category: { id: 'cat', name: 'Keys' },
        types: ['Quest'],
      }),
    });
    expect(isNonFirSpecialEquipment(need)).toBe(false);
  });
});
