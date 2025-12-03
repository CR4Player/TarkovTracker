<template>
  <div
    class="flex items-center gap-3 rounded-lg border p-3 transition-all select-none"
    :class="[
      isComplete
        ? 'border-green-500/50 bg-green-900/20'
        : 'border-gray-700 bg-gray-800/80 hover:border-gray-600',
    ]"
  >
    <!-- Item Icon -->
    <div class="shrink-0">
      <GameItem
        :item-id="requirement.item.id"
        :item-name="requirement.item.name"
        :dev-link="requirement.item.link"
        :wiki-link="requirement.item.wikiLink"
        size="medium"
        :show-actions="true"
        simple-mode
      />
    </div>
    <!-- Item Name and Count -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1 truncate text-sm font-medium text-white">
        <span class="truncate">{{ requirement.item.name }}</span>
        <UIcon
          v-if="isFoundInRaid"
          name="i-mdi-checkbox-marked-circle-outline"
          class="h-4 w-4 shrink-0"
          :title="'Found in Raid required'"
        />
      </div>
      <div class="mt-0.5 text-xs text-gray-400">
        Required: {{ requirement.count.toLocaleString() }}
      </div>
    </div>
    <!-- Progress Controls -->
    <div class="flex shrink-0 items-center gap-2">
      <div class="flex items-center gap-1">
        <UButton
          size="xs"
          color="neutral"
          variant="soft"
          icon="i-mdi-minus"
          :disabled="currentCount === 0"
          @click="decrementCount"
        />
        <div
          class="min-w-[60px] cursor-pointer rounded px-1 text-center transition-colors hover:bg-gray-700/50"
          :title="'Click to enter amount'"
          @click="startEditing"
        >
          <input
            v-if="isEditing"
            ref="inputRef"
            v-model.number="editValue"
            type="number"
            :min="0"
            :max="requirement.count"
            class="border-primary-500 focus:ring-primary-500 w-full rounded border bg-gray-700 px-1 text-center text-sm font-bold focus:ring-1 focus:outline-none"
            :class="isComplete ? 'text-success-400' : 'text-gray-300'"
            @blur="finishEditing"
            @keydown.enter="finishEditing"
            @keydown.esc="cancelEditing"
          />
          <template v-else>
            <span
              class="text-sm font-bold"
              :class="isComplete ? 'text-success-400' : 'text-gray-300'"
            >
              {{ currentCount }}
            </span>
            <span class="text-xs text-gray-500">/{{ requirement.count }}</span>
          </template>
        </div>
        <UButton
          size="xs"
          color="neutral"
          variant="soft"
          icon="i-mdi-plus"
          :disabled="currentCount >= requirement.count"
          @click="incrementCount"
        />
      </div>
      <UIcon
        v-if="isComplete"
        name="i-mdi-check-circle"
        class="h-6 w-6 cursor-pointer text-green-500 transition-transform hover:scale-110"
        :title="'Click to mark as incomplete'"
        @click="toggleComplete"
      />
      <UIcon
        v-else
        name="i-mdi-circle-outline"
        class="h-6 w-6 cursor-pointer text-gray-500 transition-transform hover:scale-110"
        :title="'Click to mark as complete'"
        @click="toggleComplete"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
  import { computed, nextTick, ref } from 'vue';
  import GameItem from '@/components/ui/GameItem.vue';
  import { useTarkovStore } from '@/stores/useTarkov';
  interface Props {
    requirement: {
      id: string;
      item: {
        id: string;
        name?: string;
        link?: string | null;
        wikiLink?: string | null;
      };
      count: number;
      attributes?: Array<{
        type: string;
        name: string;
        value: string;
      }>;
    };
    stationId: string;
    level: number;
  }
  const props = defineProps<Props>();
  const tarkovStore = useTarkovStore();
  const requirementId = computed(() => props.requirement.id);
  const requiredCount = computed(() => props.requirement.count);
  // Check if item requires Found in Raid status
  const isFoundInRaid = computed(() => {
    const firAttribute = props.requirement.attributes?.find(
      (attr) => attr.type === 'foundInRaid' || attr.name === 'foundInRaid'
    );
    return firAttribute?.value === 'true';
  });
  // Manual entry state
  const isEditing = ref(false);
  const editValue = ref(0);
  const inputRef = ref<HTMLInputElement | null>(null);
  // Get current count from store (synced with needed items page)
  const currentCount = computed(() => {
    const storeCount = tarkovStore.getHideoutPartCount(requirementId.value);
    // If marked as complete but no count set, return required count
    if (storeCount === 0 && tarkovStore.isHideoutPartComplete(requirementId.value)) {
      return requiredCount.value;
    }
    return storeCount;
  });
  const isComplete = computed(() => currentCount.value >= requiredCount.value);
  const clampCount = (value: number) => Math.max(0, Math.min(value, requiredCount.value));
  const setCount = (value: number): void => {
    const clampedValue = clampCount(value);
    tarkovStore.setHideoutPartCount(requirementId.value, clampedValue);
    if (clampedValue >= requiredCount.value) {
      tarkovStore.setHideoutPartComplete(requirementId.value);
    } else {
      tarkovStore.setHideoutPartUncomplete(requirementId.value);
    }
  };
  const incrementCount = (): void => setCount(currentCount.value + 1);
  const decrementCount = (): void => setCount(currentCount.value - 1);
  // Manual entry functions
  const startEditing = () => {
    editValue.value = currentCount.value;
    isEditing.value = true;
    nextTick(() => {
      inputRef.value?.focus();
      inputRef.value?.select();
    });
  };
  const finishEditing = (): void => {
    setCount(editValue.value);
    isEditing.value = false;
  };
  const cancelEditing = (): void => {
    isEditing.value = false;
  };
  // Toggle between 0% and 100% completion
  const toggleComplete = (): void => {
    if (isComplete.value) {
      // Mark as incomplete (set to 0)
      setCount(0);
    } else {
      // Mark as complete (set to required count)
      setCount(requiredCount.value);
    }
  };
</script>
