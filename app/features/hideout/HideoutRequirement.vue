<template>
  <!-- Compact Card Layout - Works for ALL items -->
  <div
    class="group relative flex cursor-pointer flex-col items-center rounded-lg border p-2 transition-all select-none hover:scale-105"
    :class="[
      isComplete
        ? 'border-success-500/50 bg-success-900/20'
        : 'border-gray-700 bg-gray-800/80 hover:border-gray-600 hover:bg-gray-800',
    ]"
    @click="toggleComplete"
    @contextmenu.prevent="openContextMenu"
  >
    <!-- Item Image -->
    <div class="relative mb-2 h-16 w-16 shrink-0">
      <GameItem
        :item-id="requirement.item.id"
        :item-name="requirement.item.name"
        :dev-link="requirement.item.link"
        :wiki-link="requirement.item.wikiLink"
        size="small"
        :show-actions="false"
        simple-mode
      />
      <!-- Complete Checkmark Overlay -->
      <div
        v-if="isComplete"
        class="absolute inset-0 flex items-center justify-center rounded bg-success-500/40"
      >
        <UIcon name="i-mdi-check-circle" class="h-8 w-8 text-success-300" />
      </div>
      <!-- FiR Badge -->
      <div
        v-if="isFoundInRaid"
        class="absolute -right-1 -top-1 rounded bg-yellow-500/90 p-0.5"
        :title="'Found in Raid required'"
      >
        <UIcon name="i-mdi-checkbox-marked-circle-outline" class="h-3 w-3 text-yellow-900" />
      </div>
      <!-- Count Badge for multi-count items -->
      <div
        v-if="requiredCount > 1"
        class="absolute -bottom-1 left-0 right-0 flex justify-center"
      >
        <div class="rounded bg-gray-900/90 px-1.5 py-0.5 text-[10px] font-bold border border-gray-700"
          :class="isComplete ? 'text-success-400' : 'text-gray-300'"
        >
          {{ currentCount.toLocaleString() }}/{{ requiredCount.toLocaleString() }}
        </div>
      </div>
    </div>
    <!-- Item Name -->
    <div class="w-full text-center text-xs font-medium leading-tight text-gray-200 line-clamp-2">
      {{ requirement.item.name }}
    </div>
  </div>

  <!-- Context Menu for Manual Count Adjustment -->
  <ContextMenu ref="contextMenu">
    <template #default="{ close }">
      <div class="px-2 py-1 text-xs font-medium text-gray-400 border-b border-gray-700">
        {{ requirement.item.name }}
      </div>
      <ContextMenuItem
        v-if="!isComplete"
        icon="i-mdi-check-circle"
        :label="`Mark Complete (${requiredCount.toLocaleString()})`"
        @click="
          markComplete();
          close();
        "
      />
      <ContextMenuItem
        v-if="isComplete"
        icon="i-mdi-close-circle"
        label="Mark Incomplete"
        @click="
          markIncomplete();
          close();
        "
      />
      <div v-if="requiredCount > 1" class="my-1 border-t border-gray-700" />
      <template v-if="requiredCount > 1">
        <div class="px-3 py-2 space-y-2">
          <div class="text-xs text-gray-400">Set Custom Amount:</div>
          <div class="flex items-center gap-2">
            <UButton
              size="xs"
              color="neutral"
              variant="soft"
              icon="i-mdi-minus"
              :disabled="currentCount === 0"
              @click.stop="decrementCount"
            />
            <input
              ref="inputRef"
              v-model.number="editValue"
              type="number"
              :min="0"
              :max="requirement.count"
              class="border-primary-500 focus:ring-primary-500 w-20 rounded border bg-gray-700 px-2 py-1 text-center text-sm font-bold focus:ring-1 focus:outline-none"
              :class="isComplete ? 'text-success-400' : 'text-gray-300'"
              @input="handleInput"
              @click.stop
            />
            <UButton
              size="xs"
              color="neutral"
              variant="soft"
              icon="i-mdi-plus"
              :disabled="currentCount >= requirement.count"
              @click.stop="incrementCount"
            />
          </div>
          <UButton
            size="xs"
            color="primary"
            variant="soft"
            block
            @click="
              applyCustomCount();
              close();
            "
          >
            Apply
          </UButton>
        </div>
      </template>
      <div class="my-1 border-t border-gray-700" />
      <ContextMenuItem
        v-if="requirement.item.link"
        icon="i-mdi-open-in-new"
        label="View on tarkov.dev"
        @click="
          openTarkovDev();
          close();
        "
      />
      <ContextMenuItem
        v-if="requirement.item.wikiLink"
        icon="i-mdi-wikipedia"
        label="View on Wiki"
        @click="
          openWiki();
          close();
        "
      />
    </template>
  </ContextMenu>
</template>
<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import ContextMenu from '@/components/ui/ContextMenu.vue';
  import ContextMenuItem from '@/components/ui/ContextMenuItem.vue';
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

  // Context menu
  const contextMenu = ref<InstanceType<typeof ContextMenu>>();
  const inputRef = ref<HTMLInputElement | null>(null);
  const editValue = ref(0);

  // Check if item requires Found in Raid status
  const isFoundInRaid = computed(() => {
    const firAttribute = props.requirement.attributes?.find(
      (attr) => attr.type === 'foundInRaid' || attr.name === 'foundInRaid'
    );
    return firAttribute?.value === 'true';
  });

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

  // Watch current count to update edit value
  watch(currentCount, (newCount) => {
    editValue.value = newCount;
  }, { immediate: true });

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

  const incrementCount = (): void => {
    editValue.value = Math.min(editValue.value + 1, requiredCount.value);
  };

  const decrementCount = (): void => {
    editValue.value = Math.max(editValue.value - 1, 0);
  };

  const handleInput = (): void => {
    // Clamp the value as user types
    if (editValue.value > requiredCount.value) {
      editValue.value = requiredCount.value;
    } else if (editValue.value < 0) {
      editValue.value = 0;
    }
  };

  const applyCustomCount = (): void => {
    setCount(editValue.value);
  };

  // Simple toggle between 0% and 100% completion (click on card)
  const toggleComplete = (): void => {
    if (isComplete.value) {
      // Mark as incomplete (set to 0)
      setCount(0);
    } else {
      // Mark as complete (set to required count)
      setCount(requiredCount.value);
    }
  };

  const markComplete = (): void => {
    setCount(requiredCount.value);
  };

  const markIncomplete = (): void => {
    setCount(0);
  };

  const openContextMenu = (event: MouseEvent): void => {
    editValue.value = currentCount.value;
    contextMenu.value?.open(event);
  };

  const openTarkovDev = (): void => {
    if (props.requirement.item.link) {
      window.open(props.requirement.item.link, '_blank');
    }
  };

  const openWiki = (): void => {
    if (props.requirement.item.wikiLink) {
      window.open(props.requirement.item.wikiLink, '_blank');
    }
  };
</script>
