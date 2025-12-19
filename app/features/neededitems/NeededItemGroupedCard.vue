<template>
  <div class="flex h-full flex-col rounded-lg bg-gray-800">
    <!-- Top section: Image + Name side by side -->
    <div class="flex items-center gap-3 p-3">
      <!-- Item image -->
      <div class="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-gray-900">
        <GameItem
          :src="groupedItem.item.image512pxLink || groupedItem.item.iconLink"
          :item-name="groupedItem.item.name"
          :wiki-link="groupedItem.item.wikiLink"
          :dev-link="groupedItem.item.link"
          :is-visible="true"
          background-color="grey"
          size="small"
          simple-mode
          fill
          class="h-full w-full"
        />
      </div>
      <!-- Item name + Total -->
      <div class="min-w-0 flex-1">
        <div class="flex min-w-0 items-start gap-1">
          <div class="line-clamp-2 min-w-0 text-sm leading-tight font-semibold">
            {{ groupedItem.item.name }}
          </div>
          <UTooltip v-if="isCraftable" :text="craftableTitle">
            <button type="button" class="inline-flex" @click.stop="goToCraftStation">
              <UIcon name="i-mdi-hammer-wrench" class="h-4 w-4" :class="craftableIconClass" />
            </button>
          </UTooltip>
        </div>
        <div class="mt-1 flex items-center gap-1">
          <span class="text-xs text-gray-400">Total:</span>
          <span class="text-primary-400 text-lg font-bold">
            {{ formatNumber(groupedItem.total) }}
          </span>
        </div>
      </div>
    </div>
    <!-- Breakdown grid -->
    <div class="grid grid-cols-2 gap-px border-t border-white/10 bg-white/5 text-xs">
      <!-- Tasks section -->
      <div class="bg-gray-800 p-2">
        <div class="mb-1.5 flex items-center gap-1 text-gray-400">
          <UIcon name="i-mdi-clipboard-list" class="h-3.5 w-3.5" />
          <span class="font-medium">Tasks</span>
        </div>
        <div class="flex gap-3">
          <div v-if="groupedItem.taskFir > 0" class="flex items-center gap-1">
            <UIcon name="i-mdi-checkbox-marked-circle" class="text-success-400 h-3 w-3" />
            <span class="text-success-400 font-semibold">{{ groupedItem.taskFir }}</span>
          </div>
          <div v-if="groupedItem.taskNonFir > 0" class="flex items-center gap-1">
            <UIcon name="i-mdi-checkbox-blank-circle-outline" class="h-3 w-3 text-gray-400" />
            <span class="font-semibold text-white">{{ groupedItem.taskNonFir }}</span>
          </div>
          <span
            v-if="groupedItem.taskFir === 0 && groupedItem.taskNonFir === 0"
            class="text-gray-500"
          >
            -
          </span>
        </div>
      </div>
      <!-- Hideout section -->
      <div class="bg-gray-800 p-2">
        <div class="mb-1.5 flex items-center gap-1 text-gray-400">
          <UIcon name="i-mdi-home" class="h-3.5 w-3.5" />
          <span class="font-medium">Hideout</span>
        </div>
        <div class="flex gap-3">
          <div v-if="groupedItem.hideoutFir > 0" class="flex items-center gap-1">
            <UIcon name="i-mdi-checkbox-marked-circle" class="text-success-400 h-3 w-3" />
            <span class="text-success-400 font-semibold">{{ groupedItem.hideoutFir }}</span>
          </div>
          <div v-if="groupedItem.hideoutNonFir > 0" class="flex items-center gap-1">
            <UIcon name="i-mdi-checkbox-blank-circle-outline" class="h-3 w-3 text-gray-400" />
            <span class="font-semibold text-white">{{ groupedItem.hideoutNonFir }}</span>
          </div>
          <span
            v-if="groupedItem.hideoutFir === 0 && groupedItem.hideoutNonFir === 0"
            class="text-gray-500"
          >
            -
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { useMetadataStore, type CraftSource } from '@/stores/useMetadata';
  import { useProgressStore } from '@/stores/useProgress';
  interface GroupedItem {
    itemId: string;
    item: {
      id: string;
      name: string;
      iconLink?: string;
      image512pxLink?: string;
      wikiLink?: string;
      link?: string;
    };
    taskFir: number;
    taskNonFir: number;
    hideoutFir: number;
    hideoutNonFir: number;
    total: number;
  }
  const props = defineProps<{
    groupedItem: GroupedItem;
  }>();
  const metadataStore = useMetadataStore();
  const progressStore = useProgressStore();
  const craftSources = computed(() => {
    return metadataStore.craftSourcesByItemId.get(props.groupedItem.itemId) ?? [];
  });
  const isCraftable = computed(() => {
    return craftSources.value.length > 0;
  });
  const craftSourceStatuses = computed(() => {
    return craftSources.value.map((source: CraftSource) => {
      const currentLevel = progressStore.hideoutLevels?.[source.stationId]?.self ?? 0;
      return {
        ...source,
        currentLevel,
        isAvailable: currentLevel >= source.stationLevel,
        missingLevels: Math.max(0, source.stationLevel - currentLevel),
      };
    });
  });
  const isCraftableAvailable = computed(() => {
    return craftSourceStatuses.value.some((source) => source.isAvailable);
  });
  const craftStationTargetId = computed(() => {
    if (!isCraftable.value) {
      return '';
    }
    const available = craftSourceStatuses.value
      .filter((source) => source.isAvailable)
      .sort((a, b) => a.stationLevel - b.stationLevel);
    if (available.length > 0) {
      return available[0]?.stationId ?? '';
    }
    const closest = [...craftSourceStatuses.value].sort((a, b) => {
      if (a.missingLevels !== b.missingLevels) {
        return a.missingLevels - b.missingLevels;
      }
      return a.stationLevel - b.stationLevel;
    });
    return closest[0]?.stationId ?? craftSources.value[0]?.stationId ?? '';
  });
  const craftableIconClass = computed(() => {
    return isCraftableAvailable.value ? 'text-success-400' : 'text-red-400';
  });
  const goToCraftStation = async () => {
    if (!craftStationTargetId.value) {
      return;
    }
    await navigateTo({
      path: '/hideout',
      query: { station: craftStationTargetId.value },
    });
  };
  const craftableTitle = computed(() => {
    if (!isCraftable.value) {
      return '';
    }
	    const prefix = isCraftableAvailable.value ? 'Craftable now' : 'Craftable (station level too low)';
	    const preview = craftSourceStatuses.value
	      .slice(0, 3)
	      .map((source) => `${source.stationName} ${source.stationLevel} (you: ${source.currentLevel})`);
	    const remainingCount = craftSourceStatuses.value.length - preview.length;
	    const remainingText = remainingCount > 0 ? ` +${remainingCount} more` : '';
	    return `${prefix}: ${preview.join(', ')}${remainingText}`;
	  });
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num.toString();
  };
</script>
