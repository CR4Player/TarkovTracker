<template>
  <div class="flex items-center gap-1">
    <div class="flex items-center rounded-md border border-white/10 bg-white/5">
      <button
        type="button"
        :disabled="currentCount <= 0"
        :aria-label="t('page.tasks.questcard.decrease', 'Decrease')"
        class="focus-visible:ring-primary-500 focus-visible:ring-offset-surface-900 flex h-7 w-7 items-center justify-center rounded-l-md text-gray-300 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
        :title="t('page.tasks.questcard.decrease', 'Decrease')"
        @click="$emit('decrease')"
      >
        <UIcon name="i-mdi-minus" aria-hidden="true" class="h-4 w-4" />
      </button>
      <div
        class="flex h-7 min-w-14 items-center justify-center px-2 text-[11px] font-semibold text-gray-100 tabular-nums"
      >
        {{ currentCount }}/{{ neededCount }}
      </div>
      <button
        type="button"
        :disabled="currentCount >= neededCount"
        :aria-label="t('page.tasks.questcard.increase', 'Increase')"
        class="focus-visible:ring-primary-500 focus-visible:ring-offset-surface-900 flex h-7 w-7 items-center justify-center rounded-r-md text-gray-300 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
        :title="t('page.tasks.questcard.increase', 'Increase')"
        @click="$emit('increase')"
      >
        <UIcon name="i-mdi-plus" aria-hidden="true" class="h-4 w-4" />
      </button>
    </div>
    <button
      type="button"
      class="focus-visible:ring-primary-500 focus-visible:ring-offset-surface-900 flex h-7 w-7 items-center justify-center rounded-md border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      :aria-label="
        currentCount >= neededCount
          ? t('page.tasks.questcard.complete', 'Complete')
          : t('page.tasks.questcard.markComplete', 'Mark complete')
      "
      :aria-pressed="currentCount >= neededCount"
      :class="
        currentCount >= neededCount
          ? 'bg-success-600 border-success-500 hover:bg-success-500 text-white'
          : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
      "
      :title="
        currentCount >= neededCount
          ? t('page.tasks.questcard.complete', 'Complete')
          : t('page.tasks.questcard.markComplete', 'Mark complete')
      "
      @click="$emit('toggle')"
    >
      <UIcon name="i-mdi-check" aria-hidden="true" class="h-4 w-4" />
    </button>
  </div>
</template>
<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  defineProps<{
    currentCount: number;
    neededCount: number;
  }>();
  defineEmits<{
    decrease: [];
    increase: [];
    toggle: [];
  }>();
  const { t } = useI18n({ useScope: 'global' });
</script>
