<template>
  <div class="flex items-center justify-between rounded-lg bg-[hsl(240,5%,8%)] px-4 py-3">
    <div class="flex items-center gap-2">
      <USwitch
        :model-value="modelValue"
        size="lg"
        @update:model-value="$emit('update:modelValue', $event)"
      />
      <span class="text-sm text-gray-200">{{ label }}</span>
    </div>
    <AppTooltip v-if="tooltip" :text="tooltip">
      <UIcon name="i-mdi-help-circle-outline" class="h-5 w-5 text-gray-500" />
    </AppTooltip>
  </div>
</template>
<script setup lang="ts">
  defineProps<{
    modelValue: boolean;
    label: string;
    tooltip?: string;
  }>();
  defineEmits<{
    'update:modelValue': [value: boolean];
  }>();
</script>
