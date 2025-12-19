import type { NeededItemTaskObjective } from '@/types/tarkov';
const isSpecialEquipmentText = (value: string): boolean => {
  const lower = value.toLowerCase();
  return lower.includes('special') && lower.includes('equipment');
};
/**
 * Returns `true` when a need is a non-FIR "special equipment" task objective that should be hidden.
 *
 * Marker items are treated as special equipment because they represent objective equipment (e.g. markers,
 * cameras) that is commonly non-FIR and can add a lot of noise to the Needed Items list.
 */
export const isNonFirSpecialEquipment = (need: NeededItemTaskObjective): boolean => {
  if (need.foundInRaid === true) return false;
  if (need.markerItem?.id) return true;
  const itemData = need.item;
  const categoryName = itemData?.category?.name ?? '';
  if (categoryName && isSpecialEquipmentText(categoryName)) {
    return true;
  }
  return itemData?.types?.some((type) => isSpecialEquipmentText(type)) ?? false;
};
