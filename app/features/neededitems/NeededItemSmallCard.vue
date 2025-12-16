<template>
  <KeepAlive>
    <div class="flex h-full flex-col rounded-lg" :class="itemCardClasses">
      <!-- Item image with count badge -->
      <div
        class="relative aspect-square w-full shrink-0 overflow-hidden rounded-t-lg"
        :class="{
          'cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]':
            isSingleItem && !selfCompletedNeed,
        }"
        :title="
          isSingleItem && !selfCompletedNeed
            ? currentCount >= neededCount
              ? 'Click to uncollect'
              : 'Click to collect'
            : undefined
        "
        @click="isSingleItem && !selfCompletedNeed ? $emit('toggleCount') : null"
      >
        <div class="absolute top-0 left-0 z-10">
          <div
            class="flex items-center gap-1 rounded-br-lg px-2 py-1 text-sm font-bold shadow-lg"
            :class="itemCountTagClasses"
          >
            {{ currentCount }}/{{ neededCount }}
            <UIcon
              v-if="props.need.foundInRaid"
              name="i-mdi-checkbox-marked-circle-outline"
              class="h-4 w-4"
            />
          </div>
        </div>
        <GameItem
          v-if="imageItem"
          :image-item="imageItem"
          :src="imageItem.image512pxLink"
          :is-visible="true"
          :item-name="item.name"
          :wiki-link="item.wikiLink"
          :dev-link="item.link"
          :task-wiki-link="relatedTask?.wikiLink"
          size="small"
          simple-mode
          fill
          class="h-full w-full"
        />
      </div>
      <!-- Card content -->
      <div class="flex flex-1 flex-col p-2">
        <!-- Item name -->
        <div class="flex min-h-10 items-start justify-center">
          <span
            class="line-clamp-2 text-center text-[clamp(0.7rem,2.5vw,0.875rem)] leading-snug font-medium"
          >
            {{ item.name }}
          </span>
        </div>
        <!-- Task/Station link -->
        <div class="flex min-h-7 w-full items-center justify-center overflow-hidden">
          <template v-if="props.need.needType == 'taskObjective'">
            <TaskLink
              :task="relatedTask"
              compact
              class="max-w-full text-[clamp(0.625rem,2vw,0.75rem)]"
            />
          </template>
          <template v-else-if="props.need.needType == 'hideoutModule'">
            <StationLink
              v-if="relatedStation"
              :station="relatedStation"
              compact
              class="max-w-full text-[clamp(0.625rem,2vw,0.75rem)]"
            />
            <span class="ml-1 text-[clamp(0.625rem,2vw,0.75rem)] text-gray-400">
              {{ props.need.hideoutModule.level }}
            </span>
          </template>
        </div>
        <!-- Requirements (Level & Tasks Before) -->
        <div
          class="flex min-h-10 flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[clamp(0.625rem,1.8vw,0.75rem)] text-gray-400"
        >
          <span
            v-if="levelRequired > 0 && levelRequired > playerLevel"
            class="flex items-center gap-1"
          >
            <UIcon name="i-mdi-account" class="h-3.5 w-3.5" />
            Lvl {{ levelRequired }}
          </span>
          <span v-if="lockedBefore > 0" class="flex items-center gap-1">
            <UIcon name="i-mdi-lock-outline" class="h-3.5 w-3.5" />
            {{ lockedBefore }} before
          </span>
        </div>
        <!-- Controls - hide for single items since clicking image toggles -->
        <div v-if="!isSingleItem" class="mt-auto flex items-center justify-center pt-2">
          <template v-if="!selfCompletedNeed">
            <ItemCountControls
              :current-count="currentCount"
              :needed-count="neededCount"
              @decrease="$emit('decreaseCount')"
              @increase="$emit('increaseCount')"
              @toggle="$emit('toggleCount')"
              @set-count="(count) => $emit('setCount', count)"
            />
          </template>
          <span v-else class="text-success-400 text-sm font-bold">
            {{ currentCount }}/{{ neededCount }} ✓
          </span>
        </div>
      </div>
    </div>
  </KeepAlive>
</template>
<script setup>
  import { computed, defineAsyncComponent, inject } from 'vue';
  import { useTarkovStore } from '@/stores/useTarkov';
  import ItemCountControls from './ItemCountControls.vue';
  const TaskLink = defineAsyncComponent(() => import('@/features/tasks/TaskLink'));
  const StationLink = defineAsyncComponent(() => import('@/features/hideout/StationLink'));
  const props = defineProps({
    need: {
      type: Object,
      required: true,
    },
  });
  const tarkovStore = useTarkovStore();
  const playerLevel = computed(() => tarkovStore.playerLevel());
  const {
    selfCompletedNeed,
    relatedTask,
    relatedStation,
    neededCount,
    currentCount,
    levelRequired,
    lockedBefore,
    item,
    imageItem,
  } = inject('neededitem');
  // Simplified UI for single-quantity items
  const isSingleItem = computed(() => neededCount.value === 1);
  const itemCardClasses = computed(() => {
    return {
      'bg-gradient-to-t from-complete to-surface':
        selfCompletedNeed.value || currentCount.value >= neededCount.value,
      'bg-gray-800': !(selfCompletedNeed.value || currentCount.value >= neededCount.value),
    };
  });
  const itemCountTagClasses = computed(() => {
    return {
      'bg-clip-padding rounded-tl-[5px] rounded-br-[10px]': true,
      'bg-white text-black': !(selfCompletedNeed.value || currentCount.value >= neededCount.value),
      'bg-complete': selfCompletedNeed.value || currentCount.value >= neededCount.value,
    };
  });
  defineEmits(['decreaseCount', 'increaseCount', 'toggleCount', 'setCount']);
</script>
