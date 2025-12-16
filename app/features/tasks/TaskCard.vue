<template>
  <UCard
    :id="`task-${task.id}`"
    class="relative overflow-hidden border border-white/10 bg-[hsl(240_5%_7%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.35)]"
    :class="taskClasses"
    :ui="{ body: cardBodyClass }"
    @contextmenu.prevent="openOverflowMenu"
  >
    <div
      v-if="showBackgroundIcon"
      class="text-brand-200 pointer-events-none absolute inset-0 z-0 flex rotate-12 transform items-center justify-center p-8 opacity-15"
    >
      <UIcon
        :name="backgroundIcon.startsWith('mdi-') ? `i-${backgroundIcon}` : backgroundIcon"
        class="h-24 w-24"
      />
    </div>
    <div class="relative z-10 flex h-full flex-col" :class="isCompact ? 'gap-3' : 'gap-4'">
      <!--1) Header: identity + state -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <router-link
            :to="`/tasks?task=${task.id}`"
            class="text-primary-400 hover:text-primary-300 flex min-w-0 items-center gap-2 no-underline"
            :title="task?.name"
          >
            <div class="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-800">
              <img
                v-if="task?.trader?.imageLink"
                :src="task.trader.imageLink"
                :alt="task?.trader?.name || 'Trader'"
                class="h-full w-full object-cover"
              />
              <UIcon v-else name="i-mdi-account-circle" class="h-full w-full text-gray-400" />
            </div>
            <img
              v-if="isFactionTask"
              :src="factionImage"
              :alt="task?.factionName"
              class="h-6 w-6 shrink-0 object-contain invert"
            />
            <span class="min-w-0 truncate text-sm font-semibold text-gray-100 sm:text-base">
              {{ task?.name }}
            </span>
          </router-link>
          <!-- External link icons -->
          <div class="ml-2 flex shrink-0 items-center gap-1.5">
            <a
              v-if="task.wikiLink"
              :href="task.wikiLink"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center rounded p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-200"
              :title="t('page.tasks.questcard.viewOnWiki', 'View on Wiki')"
              @click.stop
            >
              <UIcon name="i-mdi-wikipedia" class="h-5 w-5" />
            </a>
            <a
              :href="tarkovDevTaskUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center rounded p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-200"
              :title="t('page.tasks.questcard.viewOnTarkovDev', 'View on tarkov.dev')"
              @click.stop
            >
              <UIcon name="i-mdi-open-in-new" class="h-5 w-5" />
            </a>
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-end gap-1.5">
          <UBadge
            v-if="(task.minPlayerLevel ?? 0) > 0"
            size="xs"
            color="neutral"
            variant="soft"
            class="text-[11px]"
          >
            {{ t('page.tasks.questcard.levelBadge', { count: task.minPlayerLevel }) }}
          </UBadge>
          <UBadge
            v-if="task?.map?.name"
            size="xs"
            color="neutral"
            variant="soft"
            class="inline-flex max-w-[10rem] items-center gap-1 text-[11px]"
            :title="task.map.name"
          >
            <UIcon name="i-mdi-map-marker" class="h-3 w-3" />
            <span class="truncate">{{ task.map.name }}</span>
          </UBadge>
          <UBadge
            v-if="objectiveProgress.total > 0"
            size="xs"
            color="neutral"
            variant="soft"
            class="inline-flex items-center gap-1 text-[11px]"
          >
            <UIcon name="i-mdi-progress-check" class="h-3 w-3" />
            {{ t('page.tasks.questcard.progress', objectiveProgress) }}
          </UBadge>
          <UBadge
            v-if="preferencesStore.getShowRequiredLabels && task.kappaRequired"
            size="xs"
            color="error"
            variant="soft"
            class="text-[11px]"
          >
            {{ t('page.tasks.questcard.kappa', 'Kappa') }}
          </UBadge>
          <UBadge
            v-if="preferencesStore.getShowRequiredLabels && task.lightkeeperRequired"
            size="xs"
            color="warning"
            variant="soft"
            class="text-[11px]"
          >
            {{ t('page.tasks.questcard.lightkeeper', 'Lightkeeper') }}
          </UBadge>
          <!-- Menu button moved to header -->
          <UButton
            v-if="isOurFaction"
            size="xs"
            color="neutral"
            variant="ghost"
            class="shrink-0"
            :title="t('page.tasks.questcard.more', 'More')"
            @click="openOverflowMenu"
          >
            <UIcon name="i-mdi-dots-horizontal" class="h-5 w-5" />
          </UButton>
        </div>
      </div>
      <!-- 2) Top strip: Before (only show when there are pending prerequisites) -->
      <div v-if="lockedBefore > 0" class="text-xs text-gray-400">
        <span class="text-gray-500">{{ t('page.tasks.questcard.requires', 'Requires') }}:</span>
        <template v-if="pendingParentTasks.length">
          <span class="ml-2 inline-flex flex-wrap items-center gap-1.5">
            <router-link
              v-for="parent in displayedPendingParents"
              :key="parent.id"
              :to="`/tasks?task=${parent.id}`"
              class="inline-flex max-w-[16rem] items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-200 hover:bg-white/10"
              :title="parent.name"
            >
              <span class="truncate">{{ parent.name }}</span>
            </router-link>
            <span v-if="extraPendingParentsCount > 0" class="text-gray-500">
              +{{ extraPendingParentsCount }}
            </span>
          </span>
        </template>
        <template v-else>
          <span class="ml-2 text-gray-300">{{ lockedBefore }}</span>
        </template>
      </div>
      <!-- 3) Body: objectives -->
      <div class="space-y-3">
        <QuestKeys v-if="task?.neededKeys?.length" :needed-keys="task.neededKeys" />
        <QuestObjectives
          :objectives="relevantViewObjectives"
          :irrelevant-count="irrelevantObjectives.length"
          :uncompleted-irrelevant="uncompletedIrrelevantObjectives.length"
        />
      </div>
      <!-- 4) Chain info -->
      <div v-if="afterHasContent" class="text-xs text-gray-400">
        <UTooltip
          v-if="unlocksNextCount > 0"
          :text="t('page.tasks.questcard.unlocksNextTooltip', 'Number of quests that become available after completing this task')"
        >
          <span class="cursor-help border-b border-dotted border-gray-500">
            {{ t('page.tasks.questcard.unlocksNext', 'Unlocks next') }}: {{ unlocksNextCount }}
          </span>
        </UTooltip>
        <span v-if="unlocksNextCount > 0 && impactCount > 0" class="mx-2 text-gray-600">•</span>
        <UTooltip
          v-if="impactCount > 0"
          :text="t('page.tasks.questcard.impactTooltip', 'Number of incomplete quests that depend on this task being completed')"
        >
          <span class="cursor-help border-b border-dotted border-gray-500">
            {{ t('page.tasks.questcard.impact', 'Impact') }}: {{ impactCount }}
          </span>
        </UTooltip>
      </div>
      <!--5) Rewards Summary Section with Complete Button -->
      <div
        v-if="hasRewardsSummary || isOurFaction"
        class="border-t border-white/5 pt-2 rounded-md transition-colors"
        :class="{
          'hover:bg-white/5 cursor-pointer': hasDetailedRewards || childTasks.length > 0
        }"
        @click="onRewardsAreaClick"
      >
        <div class="flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <!-- Rewards on the left -->
          <!-- Trader Standing Rewards -->
          <template v-for="standing in traderStandingRewards" :key="`standing-${standing.trader.id}`">
            <span class="inline-flex items-center gap-1.5 rounded bg-blue-500/10 px-2 py-0.5">
              <UIcon name="i-mdi-handshake" class="h-4 w-4 text-blue-300" />
              <span :class="standing.standing >= 0 ? 'text-green-400' : 'text-red-400'">
                {{ standing.standing >= 0 ? '+' : '' }}{{ standing.standing.toFixed(2) }}
              </span>
              <span class="text-gray-300">{{ standing.trader.name }}</span>
            </span>
          </template>
          <!-- Skill Rewards -->
          <template v-for="skill in skillRewards" :key="`skill-${skill.name}`">
            <span class="inline-flex items-center gap-1">
              <UIcon name="i-mdi-arm-flex" class="h-3.5 w-3.5 text-purple-400" />
              <span class="text-purple-300">+{{ skill.level }}</span>
              <span>{{ skill.name }}</span>
            </span>
          </template>
          <!-- Trader Unlock -->
          <span v-if="traderUnlockReward" class="inline-flex items-center gap-1.5 rounded bg-amber-500/10 px-2 py-0.5">
            <UIcon name="i-mdi-lock-open-variant" class="h-4 w-4 text-amber-400" />
            <span class="text-amber-300">{{ traderUnlockReward.name }}</span>
          </span>
          <!-- Dropdown chevron indicator (inline) -->
          <UIcon
            v-if="hasDetailedRewards || childTasks.length > 0"
            :name="showDetailedRewards ? 'i-mdi-chevron-up' : 'i-mdi-chevron-down'"
            class="h-5 w-5 text-gray-500 transition-transform"
          />
          <!-- Spacer to push action buttons to the right -->
          <div class="flex-1" />
          <!-- Action buttons inline -->
          <template v-if="!isOurFaction">
            <span class="text-xs text-gray-400">
              {{
                t(
                  'page.tasks.questcard.differentfaction',
                  'This quest is not available to your faction'
                )
              }}
            </span>
          </template>
          <template v-else>
            <UButton
              v-if="isLocked"
              :size="actionButtonSize"
              color="primary"
              variant="soft"
              class="shrink-0"
              @click.stop="markTaskAvailable()"
            >
              {{ t('page.tasks.questcard.availablebutton', 'Mark Available') }}
            </UButton>
            <UButton
              v-if="isComplete"
              :size="actionButtonSize"
              color="primary"
              variant="soft"
              class="shrink-0"
              @click.stop="markTaskUncomplete()"
            >
              {{ t('page.tasks.questcard.uncompletebutton', 'Mark Uncompleted') }}
            </UButton>
            <template v-if="!isComplete && !isLocked">
              <!-- XP display left of Complete button -->
              <div
                v-if="preferencesStore.getShowExperienceRewards && task.experience"
                class="flex items-center gap-1 text-xs text-gray-400"
              >
                <UIcon name="i-mdi-star" class="h-4 w-4 shrink-0 text-yellow-500" />
                <span>{{ task.experience.toLocaleString() }} XP</span>
              </div>
              <UButton
                :size="actionButtonSize"
                color="success"
                :ui="completeButtonUi"
                class="shrink-0"
                @click.stop="markTaskComplete()"
              >
                {{ t('page.tasks.questcard.completebutton', 'Complete').toUpperCase() }}
              </UButton>
            </template>
          </template>
        </div>
        <!-- Detailed Rewards and Next Quests (Collapsible) -->
        <div
          v-if="showDetailedRewards && (hasDetailedRewards || childTasks.length > 0 || parentTasks.length > 0)"
          class="mt-2 rounded-md bg-white/5 p-2"
        >
          <div class="flex flex-col lg:flex-row gap-4">
            <!-- Left: Previous Quests -->
            <div v-if="parentTasks.length > 0" class="lg:w-64 space-y-2">
              <div class="text-xs font-medium text-gray-400">
                {{ t('page.tasks.questcard.previousQuests', 'Previous Quests') }}:
              </div>
              <div class="flex flex-col gap-1">
                <router-link
                  v-for="parent in parentTasks"
                  :key="parent.id"
                  :to="`/tasks?task=${parent.id}`"
                  class="text-primary-400 hover:text-primary-300 inline-flex items-center gap-1.5 text-xs"
                >
                  <UIcon name="i-mdi-arrow-left" class="h-3 w-3 shrink-0" />
                  <span>{{ parent.name }}</span>
                </router-link>
              </div>
            </div>
            <!-- Middle: Item Rewards and Offer Unlocks -->
            <div
              v-if="itemRewards.length > 0 || offerUnlockRewards.length > 0"
              class="flex-1 flex flex-col sm:flex-row gap-4"
            >
              <!-- Item Rewards -->
              <div v-if="itemRewards.length > 0" class="flex-1 min-w-0 space-y-2">
                <div class="text-xs font-medium text-gray-400">
                  {{ t('page.tasks.questcard.rewardItems', 'Items') }}:
                </div>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="reward in itemRewards"
                    :key="`item-${reward.item.id}`"
                    class="group relative flex flex-col items-center gap-1 rounded-lg bg-white/5 p-2 hover:bg-white/10 cursor-pointer transition-colors"
                    @contextmenu.prevent.stop="openItemContextMenu($event, reward.item)"
                  >
                    <img
                      v-if="reward.item.iconLink"
                      :src="reward.item.iconLink"
                      :alt="reward.item.name"
                      class="h-16 w-16 object-contain"
                    />
                    <div class="flex flex-col items-center gap-0.5">
                      <span class="text-xs text-gray-300 text-center max-w-[72px] truncate" :title="reward.item.shortName || reward.item.name">
                        {{ reward.item.shortName || reward.item.name }}
                      </span>
                      <span v-if="reward.count > 1" class="text-xs font-medium text-gray-400">
                        x{{ formatNumber(reward.count) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Offer Unlocks -->
              <div v-if="offerUnlockRewards.length > 0" class="flex-1 min-w-0 space-y-2">
                <div class="text-xs font-medium text-gray-400">
                  {{ t('page.tasks.questcard.unlocksPurchase', 'Unlocks purchase') }}:
                </div>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="offer in offerUnlockRewards"
                    :key="`offer-${offer.id}`"
                    class="group relative flex flex-col items-center gap-1 rounded-lg bg-white/5 p-2 hover:bg-white/10 cursor-pointer transition-colors"
                    @contextmenu.prevent.stop="openItemContextMenu($event, offer.item)"
                  >
                    <img
                      v-if="offer.item?.iconLink"
                      :src="offer.item.iconLink"
                      :alt="offer.item.name"
                      class="h-16 w-16 object-contain"
                    />
                    <div class="flex flex-col items-center gap-0.5">
                      <span class="text-xs text-gray-300 text-center max-w-[72px] truncate" :title="offer.item?.shortName || offer.item?.name">
                        {{ offer.item?.shortName || offer.item?.name }}
                      </span>
                      <span class="text-xs text-gray-500">
                        {{ offer.trader.name }} LL{{ offer.level }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- Right: Next Quests -->
            <div v-if="childTasks.length > 0" class="lg:w-64 space-y-2">
              <div class="text-xs font-medium text-gray-400">
                {{ t('page.tasks.questcard.nextQuests', 'Next Quests') }}:
              </div>
              <div class="flex flex-col gap-1">
                <router-link
                  v-for="child in childTasks"
                  :key="child.id"
                  :to="`/tasks?task=${child.id}`"
                  class="text-primary-400 hover:text-primary-300 inline-flex items-center gap-1.5 text-xs"
                >
                  <UIcon name="i-mdi-arrow-right" class="h-3 w-3 shrink-0" />
                  <span>{{ child.name }}</span>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div></div>
    <!-- Overflow / Context Menu -->
    <ContextMenu ref="taskContextMenu">
      <template #default="{ close }">
        <ContextMenuItem
          icon="i-mdi-content-copy"
          :label="t('page.tasks.questcard.copyTaskId', 'Copy task ID')"
          @click="
            copyTaskId();
            close();
          "
        />
        <ContextMenuItem
          icon="i-mdi-link-variant"
          :label="t('page.tasks.questcard.copyTaskLink', 'Copy task link')"
          @click="
            copyTaskLink();
            close();
          "
        />
        <ContextMenuItem
          v-if="task.wikiLink"
          icon="i-mdi-wikipedia"
          label="View Task on Wiki"
          @click="
            openTaskWiki();
            close();
          "
        />
      </template>
    </ContextMenu>
    <!-- Item Context Menu -->
    <ContextMenu ref="itemContextMenu">
      <template #default="{ close }">
        <ContextMenuItem
          icon="i-mdi-open-in-new"
          :label="t('page.tasks.questcard.viewOnTarkovDev', 'View on tarkov.dev')"
          @click="
            openItemOnTarkovDev();
            close();
          "
        />
        <ContextMenuItem
          icon="i-mdi-wikipedia"
          :label="t('page.tasks.questcard.viewOnWiki', 'View on Wiki')"
          @click="
            openItemOnWiki();
            close();
          "
        />
      </template>
    </ContextMenu>
  </UCard>
</template>
<script setup lang="ts">
  import { computed, defineAsyncComponent, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import ContextMenu from '@/components/ui/ContextMenu.vue';
  import ContextMenuItem from '@/components/ui/ContextMenuItem.vue';
  import { useSharedBreakpoints } from '@/composables/useSharedBreakpoints';
  import { useMetadataStore } from '@/stores/useMetadata';
  import { usePreferencesStore } from '@/stores/usePreferences';
  import { useProgressStore } from '@/stores/useProgress';
  import { useTarkovStore } from '@/stores/useTarkov';
  import type { Task, TaskObjective } from '@/types/tarkov';
  // Conditionally rendered components - lazy load
  const QuestKeys = defineAsyncComponent(() => import('@/features/tasks/QuestKeys.vue'));
  const QuestObjectives = defineAsyncComponent(
    () => import('@/features/tasks/QuestObjectives.vue')
  );
  const props = defineProps<{
    task: Task;
    activeUserView: string;
    neededBy: string[];}>();
  const emit = defineEmits(['on-task-action']);
  const { t } = useI18n({ useScope: 'global' });
  const router = useRouter();
  // Shared breakpoints (xs/sm breakpoint at 600px)
  const { xs } = useSharedBreakpoints();
  const tarkovStore = useTarkovStore();
  const progressStore = useProgressStore();
  const preferencesStore = usePreferencesStore();
  const metadataStore = useMetadataStore();
  const tasks = computed(() => metadataStore.tasks);
  // Context menu refs
  const taskContextMenu = ref();
  const itemContextMenu = ref();
  const selectedItem = ref<{ id: string; wikiLink?: string } | null>(null);
  const showDetailedRewards = ref(false);
  // Computed properties
  const isComplete = computed(() => tarkovStore.isTaskComplete(props.task.id));
  const isFailed = computed(() => tarkovStore.isTaskFailed(props.task.id));
  const isLocked = computed(
    () => progressStore.unlockedTasks[props.task.id]?.self !== true && !isComplete.value
  );
  const isOurFaction = computed(() => {
    const taskFaction = props.task.factionName;
    return taskFaction === 'Any' || taskFaction === tarkovStore.getPMCFaction();
  });
  const taskClasses = computed(() => {
    if (isComplete.value && !isFailed.value) return 'border-success-500/25 bg-success-500/10';
    if (isLocked.value || isFailed.value) return 'border-error-500/25 bg-error-500/10';
    return 'border-white/10';
  });
  const isCompact = computed(() => preferencesStore.getTaskCardDensity === 'compact');
  const cardBodyClass = computed(() =>
    isCompact.value ? 'p-3 flex flex-col' : 'p-4 flex flex-col'
  );
  const showBackgroundIcon = computed(() => isLocked.value || isFailed.value || isComplete.value);
  const backgroundIcon = computed(() => {
    if (isComplete.value) return 'mdi-check';
    if (isLocked.value || isFailed.value) return 'mdi-lock';
    return '';
  });
  const lockedBehind = computed(
    () => props.task.successors?.filter((s) => !tarkovStore.isTaskComplete(s)).length || 0
  );
  const lockedBefore = computed(
    () => props.task.predecessors?.filter((s) => !tarkovStore.isTaskComplete(s)).length || 0
  );
  const isFactionTask = computed(() => props.task?.factionName != 'Any');
  const factionImage = computed(() => `/img/factions/${props.task.factionName}.webp`);
  const parentTasks = computed(() => {
    if (!props.task?.parents?.length) return [];
    return props.task.parents
      .map((id) => tasks.value.find((t) => t.id === id))
      .filter((t): t is Task => t !== undefined);
  });
  const pendingParentTasks = computed(() =>
    parentTasks.value.filter((p) => !tarkovStore.isTaskComplete(p.id))
  );
  const displayedPendingParents = computed(() => pendingParentTasks.value.slice(0, 2));
  const extraPendingParentsCount = computed(() =>
    Math.max(0, pendingParentTasks.value.length - displayedPendingParents.value.length)
  );
  const childTasks = computed(() => {
    if (!props.task?.children?.length) return [];
    return props.task.children
      .map((id) => tasks.value.find((t) => t.id === id))
      .filter((t): t is Task => t !== undefined);
  });
  const unlocksNextCount = computed(() => childTasks.value.length);
  const impactCount = computed(() => lockedBehind.value);
  const afterHasContent = computed(() => unlocksNextCount.value > 0 || impactCount.value > 0);
  // Reward computed properties
  const traderStandingRewards = computed(() => props.task.finishRewards?.traderStanding ?? []);
  const skillRewards = computed(() => props.task.finishRewards?.skillLevelReward ?? []);
  const traderUnlockReward = computed(() => props.task.finishRewards?.traderUnlock);
  const itemRewards = computed(() => props.task.finishRewards?.items ?? []);
  const offerUnlockRewards = computed(() => props.task.finishRewards?.offerUnlock ?? []);
  const hasRewardsSummary = computed(() =>
    traderStandingRewards.value.length > 0 ||
    skillRewards.value.length > 0 ||
    traderUnlockReward.value != null
  );
  const hasDetailedRewards = computed(() =>
    itemRewards.value.length > 0 || offerUnlockRewards.value.length > 0
  );
  const completeButtonUi = {
    base: 'bg-success-500 hover:bg-success-600 active:bg-success-700 text-white border border-success-700',
  };
  const actionButtonSize = computed(() => (xs.value ? 'xs' : 'sm'));
  const mapObjectiveTypes = [
    'mark',
    'zone',
    'extract',
    'visit',
    'findItem',
    'findQuestItem',
    'plantItem',
    'plantQuestItem',
    'shoot',
  ];
  const onMapView = computed(() => preferencesStore.getTaskPrimaryView === 'maps');
  const relevantViewObjectives = computed(() => {
    if (!onMapView.value) return props.task.objectives ?? [];
    return (props.task.objectives ?? []).filter((o) => {
      if (!Array.isArray(o.maps) || !o.maps.length) return true;
      return (
        o.maps.some((m) => m.id === preferencesStore.getTaskMapView) &&
        mapObjectiveTypes.includes(o.type ?? '')
      );
    });
  });
  const irrelevantObjectives = computed(() => {
    if (!onMapView.value) return [];
    return (props.task.objectives ?? []).filter((o) => {
      if (!Array.isArray(o.maps) || !o.maps.length) return false;
      const onSelectedMap = o.maps.some((m) => m.id === preferencesStore.getTaskMapView);
      const isMapType = mapObjectiveTypes.includes(o.type ?? '');
      return !(onSelectedMap && isMapType);
    });
  });
  const uncompletedIrrelevantObjectives = computed(() =>
    (props.task.objectives ?? [])
      .filter((o) => {
        const onCorrectMap = o?.maps?.some((m) => m.id === preferencesStore.getTaskMapView);
        const isMapObjectiveType = mapObjectiveTypes.includes(o.type ?? '');
        return !onCorrectMap || !isMapObjectiveType;
      })
      .filter((o) => !tarkovStore.isTaskObjectiveComplete(o.id))
  );
  const objectiveProgress = computed(() => {
    const total = relevantViewObjectives.value.length;
    const done = relevantViewObjectives.value.filter((o) =>
      tarkovStore.isTaskObjectiveComplete(o.id)
    ).length;
    return { done, total };
  });
  // Computed for tarkov.dev task URL
  const tarkovDevTaskUrl = computed(() => {
    // tarkov.dev uses the task's id for URLs
    return `https://tarkov.dev/task/${props.task.id}`;
  });const openOverflowMenu = (event: MouseEvent) => {
    taskContextMenu.value?.open(event);
  };
  const openItemContextMenu = (event: MouseEvent, item: { id: string; wikiLink?: string } | undefined) => {
    if (!item) return;
    selectedItem.value = item;
    itemContextMenu.value?.open(event);
  };
  const openItemOnTarkovDev = () => {
    if (selectedItem.value) {
      window.open(`https://tarkov.dev/item/${selectedItem.value.id}`, '_blank');
    }
  };
  const openItemOnWiki = () => {
    if (selectedItem.value?.wikiLink) {
      window.open(selectedItem.value.wikiLink, '_blank');
    } else if (selectedItem.value) {
      // Fallback: search on wiki using item ID
      window.open(`https://escapefromtarkov.fandom.com/wiki/Special:Search?query=${selectedItem.value.id}`, '_blank');
    }
  };
  // Format number with thousands separators
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  const copyTextToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // ignore and fall back
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };
  const copyTaskId = () => copyTextToClipboard(props.task.id);
  const copyTaskLink = () => {
    const href = router.resolve(`/tasks?task=${props.task.id}`).href;
    const absolute = `${window.location.origin}${href}`;
    return copyTextToClipboard(absolute);
  };
  // Methods
  const handleTaskObjectives = (
    objectives: TaskObjective[],
    action: 'setTaskObjectiveComplete' | 'setTaskObjectiveUncomplete'
  ) => {
    objectives.forEach((o) => {
      if (action === 'setTaskObjectiveComplete') {
        tarkovStore.setTaskObjectiveComplete(o.id);// When completing objectives, also set the count to the required amount
        if (o.count !== undefined && o.count > 0) {
          tarkovStore.setObjectiveCount(o.id, o.count);
        }
      } else {
        // When uncompleting, only uncomplete if count is below the required amount
        const currentCount = tarkovStore.getObjectiveCount(o.id);
        const requiredCount = o.count ?? 1;
        if (currentCount < requiredCount) {
          tarkovStore.setTaskObjectiveUncomplete(o.id);
        }
      }
    });
  };
  const handleAlternatives = (
    alternatives: string[] | undefined,
    taskAction: 'setTaskFailed' | 'setTaskUncompleted',
    objectiveAction: 'setTaskObjectiveComplete' | 'setTaskObjectiveUncomplete'
  ) => {
    if (!Array.isArray(alternatives)) return;
    alternatives.forEach((a) => {
      tarkovStore[taskAction](a);
      const alternativeTask = tasks.value.find((task) => task.id === a);
      if (alternativeTask?.objectives) {
        handleTaskObjectives(alternativeTask.objectives, objectiveAction);
      }
    });
  };
  const ensureMinLevel = () => {
    const minLevel = props.task.minPlayerLevel ?? 0;
    if (tarkovStore.playerLevel() < minLevel) {
      tarkovStore.setLevel(minLevel);
    }
  };
  const markTaskComplete = (isUndo = false) => {
    if (!isUndo) {
      emit('on-task-action', {
        taskId: props.task.id,
        taskName: props.task.name,
        action: 'complete',
        statusKey: 'page.tasks.questcard.statuscomplete',
      });
    }
    tarkovStore.setTaskComplete(props.task.id);if (props.task.objectives) {
      handleTaskObjectives(props.task.objectives, 'setTaskObjectiveComplete');
    }
    handleAlternatives(props.task.alternatives, 'setTaskFailed', 'setTaskObjectiveComplete');
    ensureMinLevel();
    if (isUndo) {
      emit('on-task-action', {
        taskId: props.task.id,
        taskName: props.task.name,
        action: 'complete',
        undoKey: 'page.tasks.questcard.undocomplete',
      });
    }
  };
  const markTaskUncomplete = (isUndo = false) => {
    if (!isUndo) {
      emit('on-task-action', {
        taskId: props.task.id,
        taskName: props.task.name,
        action: 'uncomplete',
        statusKey: 'page.tasks.questcard.statusuncomplete',
      });
    }
    tarkovStore.setTaskUncompleted(props.task.id);
    if (props.task.objectives) {
      handleTaskObjectives(props.task.objectives, 'setTaskObjectiveUncomplete');
    }
    handleAlternatives(props.task.alternatives, 'setTaskUncompleted', 'setTaskObjectiveUncomplete');
    if (isUndo) {
      emit('on-task-action', {
        taskId: props.task.id,
        taskName: props.task.name,
        action: 'uncomplete',
        undoKey: 'page.tasks.questcard.undouncomplete',
      });
    }
  };
  const markTaskAvailable = () => {
    props.task.predecessors?.forEach((p) => {
      tarkovStore.setTaskComplete(p);
      const predecessorTask = tasks.value.find((task) => task.id === p);
      if (predecessorTask?.objectives) {
        handleTaskObjectives(predecessorTask.objectives, 'setTaskObjectiveComplete');
      }
    });
    ensureMinLevel();
    emit('on-task-action', {
      taskId: props.task.id,
      taskName: props.task.name,
      action: 'available',
      undoKey: 'page.tasks.questcard.statusavailable',
    });
  };
  const openTaskWiki = () => {
    if (props.task.wikiLink) {
      window.open(props.task.wikiLink, '_blank');
    }
  };
  const onRewardsAreaClick = (event: MouseEvent) => {
    // Only toggle if there are details to show
    if (!hasDetailedRewards.value && childTasks.value.length === 0) {
      return;
    }// Ignore if user is selecting text
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }
    // Ignore clicks on interactive elements (buttons, links, inputs)
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) {
      return;
    }
    showDetailedRewards.value = !showDetailedRewards.value;
  };
</script>