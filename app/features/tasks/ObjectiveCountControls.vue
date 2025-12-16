<template>
  <div class="flex items-center gap-1">
    <div class="flex items-center rounded-md border border-white/10 bg-white/5">
      <button
        type="button"
        class="hover:bg-white/10 active:bg-white/15 flex h-7 w-7 items-center justify-center rounded-l-md text-gray-300"
        :title="t('page.tasks.questcard.decrease', 'Decrease')"
        @click="$emit('decrease')"
      >
        <UIcon name="i-mdi-minus" class="h-4 w-4" />
      </button>
      <div class="flex h-7 min-w-14 items-center justify-center px-2 text-[11px] font-semibold tabular-nums text-gray-100">
        {{ currentCount }}/{{ neededCount }}
      </div>
      <button
        type="button"
        class="hover:bg-white/10 active:bg-white/15 flex h-7 w-7 items-center justify-center rounded-r-md text-gray-300"
        :title="t('page.tasks.questcard.increase', 'Increase')"
        @click="$emit('increase')"
      >
        <UIcon name="i-mdi-plus" class="h-4 w-4" />
      </button>
    </div>
    <button
      type="button"
      class="flex h-7 w-7 items-center justify-center rounded-md border transition-colors"
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
      <UIcon name="i-mdi-check" class="h-4 w-4" />
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
