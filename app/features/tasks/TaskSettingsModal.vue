<template>
  <UModal
    v-model:open="isOpen"
    :title="t('page.tasks.settings.title', 'Task Settings')"
    :description="t('page.tasks.settings.description', 'Configure task filters and appearance')"
  >
    <UButton variant="ghost" color="neutral" size="sm" @click="isOpen = true">
      <UIcon name="i-mdi-tune" class="mr-1 h-4 w-4" />
      {{ t('page.tasks.settings.button', 'TASK SETTINGS') }}
    </UButton>
    <template #content>
      <UCard class="bg-contentbackground">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">{{ t('page.tasks.settings.title', 'Task Settings') }}</h3>
              <div class="mt-1 flex gap-4 text-sm text-gray-400">
                <button
                  :class="['hover:text-white', activeTab === 'filters' ? 'text-primary-400' : '']"
                  @click="activeTab = 'filters'"
                >
                  {{ t('page.tasks.settings.tabs.filters', 'TASK FILTERS') }}
                </button>
                <button
                  :class="['hover:text-white', activeTab === 'appearance' ? 'text-primary-400' : '']"
                  @click="activeTab = 'appearance'"
                >
                  {{ t('page.tasks.settings.tabs.appearance', 'APPEARANCE') }}
                </button>
              </div>
            </div>
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-mdi-close"
              size="sm"
              @click="isOpen = false"
            />
          </div>
        </template>
        <!-- TASK FILTERS Section -->
        <div v-show="activeTab === 'filters'" class="space-y-2">
          <p class="text-primary-400 mb-3 text-xs font-semibold uppercase tracking-wide">
            {{ t('page.tasks.settings.tabs.filters', 'TASK FILTERS') }}
          </p>
          <SettingsToggle
            :model-value="showGlobalTasks"
            :label="labelShowGlobalTasks"
            :tooltip="tooltipShowGlobalTasks"
            @update:model-value="preferencesStore.setHideGlobalTasks(!$event)"
          />
          <SettingsToggle
            v-model="showNonSpecialTasks"
            :label="labelShowNonSpecialTasks"
            :tooltip="tooltipShowNonSpecialTasks"
          />
          <SettingsToggle
            :model-value="showKappaTasks"
            :label="labelShowKappaTasks"
            :tooltip="tooltipShowKappaTasks"
            @update:model-value="preferencesStore.setHideNonKappaTasks(!$event)"
          />
          <SettingsToggle
            v-model="showEodTasks"
            :label="labelShowEodTasks"
            :tooltip="tooltipShowEodTasks"
          />
          <SettingsToggle
            v-model="showLightkeeperTasks"
            :label="labelShowLightkeeperTasks"
            :tooltip="tooltipShowLightkeeperTasks"
          />
        </div>
        <!-- APPEARANCE Section -->
        <div v-show="activeTab === 'appearance'" class="space-y-2">
          <p class="text-primary-400 mb-3 text-xs font-semibold uppercase tracking-wide">
            {{ t('page.tasks.settings.tabs.appearance', 'APPEARANCE') }}
          </p>
          <SettingsToggle
            v-model="showRequiredLabels"
            :label="labelShowRequiredLabels"
            :tooltip="tooltipShowRequiredLabels"
          />
          <SettingsToggle
            v-model="showNotRequiredLabels"
            :label="labelShowNotRequiredLabels"
            :tooltip="tooltipShowNotRequiredLabels"
          />
          <SettingsToggle
            v-model="showExperienceRewards"
            :label="labelShowExperienceRewards"
            :tooltip="tooltipShowExperienceRewards"
          />
          <SettingsToggle
            v-model="showTaskIds"
            :label="labelShowTaskIds"
            :tooltip="tooltipShowTaskIds"
          />
          <SettingsToggle
            v-model="showNextQuests"
            :label="labelShowNextQuests"
            :tooltip="tooltipShowNextQuests"
          />
          <SettingsToggle
            v-model="showPreviousQuests"
            :label="labelShowPreviousQuests"
            :tooltip="tooltipShowPreviousQuests"
          />
        </div>
      </UCard>
    </template>
  </UModal>
</template>
<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import SettingsToggle from '@/features/tasks/SettingsToggle.vue';
  import { usePreferencesStore } from '@/stores/usePreferences';
  const { t } = useI18n({ useScope: 'global' });
  const preferencesStore = usePreferencesStore();
  const isOpen = ref(false);
  const activeTab = ref<'filters' | 'appearance'>('filters');
  // Labels and tooltips (defined in script to avoid template quoting issues)
  const labelShowGlobalTasks = computed(() => t('page.tasks.settings.filters.showGlobalTasks', 'Show global tasks on map view'));
  const tooltipShowGlobalTasks = computed(() => t('page.tasks.settings.filters.showGlobalTasksTooltip', 'Show tasks that are not specific to any map when viewing tasks by map'));
  const labelShowNonSpecialTasks = computed(() => t('page.tasks.settings.filters.showNonSpecialTasks', 'Show tasks without Lightkeeper, Kappa, or EOD requirement'));
  const tooltipShowNonSpecialTasks = computed(() => t('page.tasks.settings.filters.showNonSpecialTasksTooltip', 'Show regular tasks that do not require Kappa, Lightkeeper, or EOD edition'));
  const labelShowKappaTasks = computed(() => t('page.tasks.settings.filters.showKappaTasks', 'Show "Kappa Required" tasks'));
  const tooltipShowKappaTasks = computed(() => t('page.tasks.settings.filters.showKappaTasksTooltip', 'Show tasks required for Kappa container'));
  const labelShowEodTasks = computed(() => t('page.tasks.settings.filters.showEodTasks', 'Show EOD-only tasks'));
  const tooltipShowEodTasks = computed(() => t('page.tasks.settings.filters.showEodTasksTooltip', 'Show tasks exclusive to Edge of Darkness edition owners'));
  const labelShowLightkeeperTasks = computed(() => t('page.tasks.settings.filters.showLightkeeperTasks', 'Show Lightkeeper Tasks and Lightkeeper-required Tasks'));
  const tooltipShowLightkeeperTasks = computed(() => t('page.tasks.settings.filters.showLightkeeperTasksTooltip', 'Show tasks from Lightkeeper trader and tasks required for Lightkeeper'));
  const labelShowRequiredLabels = computed(() => t('page.tasks.settings.appearance.showRequiredLabels', 'Show "Required" labels'));
  const tooltipShowRequiredLabels = computed(() => t('page.tasks.settings.appearance.showRequiredLabelsTooltip', 'Show labels indicating Kappa or Lightkeeper requirements'));
  const labelShowNotRequiredLabels = computed(() => t('page.tasks.settings.appearance.showNotRequiredLabels', 'Show "Not Required" labels'));
  const tooltipShowNotRequiredLabels = computed(() => t('page.tasks.settings.appearance.showNotRequiredLabelsTooltip', 'Show Non-Kappa labels on tasks not required for Kappa'));
  const labelShowExperienceRewards = computed(() => t('page.tasks.settings.appearance.showExperienceRewards', 'Show experience rewards'));
  const tooltipShowExperienceRewards = computed(() => t('page.tasks.settings.appearance.showExperienceRewardsTooltip', 'Display experience points rewarded for completing tasks'));
  const labelShowTaskIds = computed(() => t('page.tasks.settings.appearance.showTaskIds', 'Show task IDs'));
  const tooltipShowTaskIds = computed(() => t('page.tasks.settings.appearance.showTaskIdsTooltip', 'Display internal task ID at the bottom of each task card'));
  const labelShowNextQuests = computed(() => t('page.tasks.settings.appearance.showNextQuests', 'Show next quests'));
  const tooltipShowNextQuests = computed(() => t('page.tasks.settings.appearance.showNextQuestsTooltip', 'Display tasks that will be unlocked after completing this task'));
  const labelShowPreviousQuests = computed(() => t('page.tasks.settings.appearance.showPreviousQuests', 'Show previous quests'));
  const tooltipShowPreviousQuests = computed(() => t('page.tasks.settings.appearance.showPreviousQuestsTooltip', 'Display tasks that must be completed before this task'));
  // Task filter preferences (inverted for show/hide semantics)
  const showGlobalTasks = computed(() => !preferencesStore.getHideGlobalTasks);
  const showKappaTasks = computed(() => !preferencesStore.getHideNonKappaTasks);
  // New filter preferences with two-way binding
  const showNonSpecialTasks = computed({
    get: () => preferencesStore.getShowNonSpecialTasks,
    set: (value) => preferencesStore.setShowNonSpecialTasks(value),
  });
  const showEodTasks = computed({
    get: () => preferencesStore.getShowEodTasks,
    set: (value) => preferencesStore.setShowEodTasks(value),
  });
  const showLightkeeperTasks = computed({
    get: () => preferencesStore.getShowLightkeeperTasks,
    set: (value) => preferencesStore.setShowLightkeeperTasks(value),
  });
  // Appearance preferences
  const showRequiredLabels = computed({
    get: () => preferencesStore.getShowRequiredLabels,
    set: (value) => preferencesStore.setShowRequiredLabels(value),
  });
  const showNotRequiredLabels = computed({
    get: () => preferencesStore.getShowNotRequiredLabels,
    set: (value) => preferencesStore.setShowNotRequiredLabels(value),
  });
  const showExperienceRewards = computed({
    get: () => preferencesStore.getShowExperienceRewards,
    set: (value) => preferencesStore.setShowExperienceRewards(value),
  });
  const showTaskIds = computed({
    get: () => preferencesStore.getShowTaskIds,
    set: (value) => preferencesStore.setShowTaskIds(value),
  });
  const showNextQuests = computed({
    get: () => preferencesStore.getShowNextQuests,
    set: (value) => preferencesStore.setShowNextQuests(value),
  });
  const showPreviousQuests = computed({
    get: () => preferencesStore.getShowPreviousQuests,
    set: (value) => preferencesStore.setShowPreviousQuests(value),
  });
</script>
