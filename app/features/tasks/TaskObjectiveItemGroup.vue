<template>
  <div class="space-y-2">
    <div class="grid grid-cols-[16px_1fr] items-start gap-2">
      <UIcon :name="`i-${iconName}`" aria-hidden="true" class="mt-0.5 h-4 w-4 text-gray-400" />
      <div class="min-w-0">
        <div class="text-sm font-medium text-gray-100">{{ title }}</div>
      </div>
    </div>
    <div class="flex flex-wrap gap-2 pl-6">
      <div
        v-for="row in objectiveRows"
        :key="row.objective.id"
        class="flex max-w-full items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1"
      >
        <img
          v-if="row.meta.itemIcon"
          :src="row.meta.itemIcon"
          :alt="row.meta.itemName"
          class="h-16 w-16 shrink-0 rounded-sm object-contain"
        />
        <span
          class="max-w-[12rem] truncate text-xs font-medium text-gray-100"
          :title="row.meta.itemName || row.objective.description"
        >
          {{ row.meta.itemName || row.objective.description }}
        </span>
        <span
          v-if="row.meta.foundInRaid"
          class="rounded bg-yellow-500/10 px-1 py-0.5 text-[10px] font-semibold text-yellow-300"
        >
          FiR
        </span>
        <ObjectiveCountControls
          v-if="row.meta.neededCount > 1"
          :current-count="row.meta.currentCount"
          :needed-count="row.meta.neededCount"
          @decrease="decreaseCount(row.objective.id)"
          @increase="increaseCount(row.objective.id)"
          @toggle="toggleCount(row.objective.id)"
        />
        <button
          v-else
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900"
          :aria-label="
            isObjectiveComplete(row.objective.id)
              ? t('page.tasks.questcard.uncomplete', 'Uncomplete')
              : t('page.tasks.questcard.complete', 'Complete')
          "
          :aria-pressed="isObjectiveComplete(row.objective.id)"
          :class="
            isObjectiveComplete(row.objective.id)
              ? 'bg-success-600 border-success-500 hover:bg-success-500 text-white'
              : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
          "
          :title="
            isObjectiveComplete(row.objective.id)
              ? t('page.tasks.questcard.uncomplete', 'Uncomplete')
              : t('page.tasks.questcard.complete', 'Complete')
          "
          @click="toggleCount(row.objective.id)"
        >
          <UIcon
            :name="isObjectiveComplete(row.objective.id) ? 'i-mdi-check' : 'i-mdi-circle-outline'"
            aria-hidden="true"
            class="h-4 w-4"
          />
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import ObjectiveCountControls from '@/features/tasks/ObjectiveCountControls.vue';
  import { useMetadataStore } from '@/stores/useMetadata';
  import { useTarkovStore } from '@/stores/useTarkov';
  import type { TaskObjective } from '@/types/tarkov';
  const props = defineProps<{
    title: string;
    iconName: string;
    objectives: TaskObjective[];
  }>();
  const { t } = useI18n({ useScope: 'global' });
  const tarkovStore = useTarkovStore();
  const metadataStore = useMetadataStore();
  type ObjectiveMeta = {
    neededCount: number;
    currentCount: number;
    itemName: string;
    itemIcon?: string;
    foundInRaid: boolean;
  };
  type ObjectiveRow = {
    objective: TaskObjective;
    meta: ObjectiveMeta;
  };
  const fullObjectives = computed(() => metadataStore.objectives);
  const objectiveMetaById = computed<Record<string, ObjectiveMeta>>(() => {
    const map: Record<string, ObjectiveMeta> = {};
    props.objectives.forEach((objective) => {
      const full = fullObjectives.value.find((o) => o.id === objective.id) as
        | TaskObjective
        | undefined;
      const neededCount = (full?.count ?? objective.count ?? 1) as number;
      const currentCount = tarkovStore.getObjectiveCount(objective.id);
      const item = full?.item;
      map[objective.id] = {
        neededCount,
        currentCount,
        itemName:
          item?.shortName ||
          item?.name ||
          objective.description ||
          t('page.tasks.questcard.item', 'Item'),
        itemIcon: item?.iconLink || item?.image8xLink || item?.image512pxLink || undefined,
        foundInRaid: full?.foundInRaid === true || objective.foundInRaid === true,
      };
    });
    return map;
  });
  const objectiveRows = computed<ObjectiveRow[]>(() => {
    return props.objectives.map((objective) => {
      const fallback: ObjectiveMeta = {
        neededCount: objective.count ?? 1,
        currentCount: tarkovStore.getObjectiveCount(objective.id),
        itemName: objective.description || t('page.tasks.questcard.item', 'Item'),
        itemIcon: undefined,
        foundInRaid: objective.foundInRaid === true,
      };
      return { objective, meta: objectiveMetaById.value[objective.id] ?? fallback };
    });
  });
  const isObjectiveComplete = (objectiveId: string) => {
    return tarkovStore.isTaskObjectiveComplete(objectiveId);
  };
  const decreaseCount = (objectiveId: string) => {
    const meta = objectiveMetaById.value[objectiveId];
    if (!meta) return;
    const currentCount = tarkovStore.getObjectiveCount(objectiveId);
    if (currentCount <= 0) return;
    const newCount = currentCount - 1;
    tarkovStore.setObjectiveCount(objectiveId, newCount);
    if (newCount < meta.neededCount && tarkovStore.isTaskObjectiveComplete(objectiveId)) {
      tarkovStore.setTaskObjectiveUncomplete(objectiveId);
    }
  };
  const increaseCount = (objectiveId: string) => {
    const meta = objectiveMetaById.value[objectiveId];
    if (!meta) return;
    const currentCount = tarkovStore.getObjectiveCount(objectiveId);
    if (currentCount >= meta.neededCount) return;
    const newCount = currentCount + 1;
    tarkovStore.setObjectiveCount(objectiveId, newCount);
    if (newCount >= meta.neededCount && !tarkovStore.isTaskObjectiveComplete(objectiveId)) {
      tarkovStore.setTaskObjectiveComplete(objectiveId);
    }
  };
  const toggleCount = (objectiveId: string) => {
    const meta = objectiveMetaById.value[objectiveId];
    if (!meta) return;
    const currentCount = tarkovStore.getObjectiveCount(objectiveId);
    if (currentCount >= meta.neededCount) {
      tarkovStore.setObjectiveCount(objectiveId, Math.max(0, meta.neededCount - 1));
      if (tarkovStore.isTaskObjectiveComplete(objectiveId)) {
        tarkovStore.setTaskObjectiveUncomplete(objectiveId);
      }
      return;
    }
    tarkovStore.setObjectiveCount(objectiveId, meta.neededCount);
    if (!tarkovStore.isTaskObjectiveComplete(objectiveId)) {
      tarkovStore.setTaskObjectiveComplete(objectiveId);
    }
  };
</script>
