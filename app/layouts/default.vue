<template>
  <div class="bg-background text-surface-200 flex min-h-screen flex-col">
    <!-- Navigation Drawer (fixed) -->
    <NavDrawer />
    <!-- Application Bar (fixed header) -->
    <AppBar
      class="transition-all duration-300 ease-in-out"
      :style="{
        left: mainMarginLeft,
      }"
    />
    <!-- Main content area -->
    <main
      class="flex flex-1 flex-col pt-16 transition-all duration-300 ease-in-out"
      :style="{
        marginLeft: mainMarginLeft,
      }"
    >
      <div class="min-h-0 flex-1 overflow-y-auto p-2 pt-0">
        <slot />
      </div>
    </main>
    <!-- Footer pinned to bottom when content is short -->
    <AppFooter
      class="shrink-0"
      :style="{
        marginLeft: mainMarginLeft,
        width: `calc(100% - ${mainMarginLeft})`,
      }"
    />
  </div>
</template>
<script setup lang="ts">
  import { computed, defineAsyncComponent } from 'vue';
  import { useSharedBreakpoints } from '@/composables/useSharedBreakpoints';
  import { useAppStore } from '@/stores/useApp';
  const appStore = useAppStore();
  // Use shared breakpoints to avoid duplicate listeners
  const { belowMd } = useSharedBreakpoints();
  // Calculate margin-left based on sidebar state
  const mainMarginLeft = computed(() => {
    if (belowMd.value) return '56px'; // Rail width on mobile
    return appStore.drawerRail ? '56px' : '224px';
  });
  // Lazy-load shell components
  const NavDrawer = defineAsyncComponent(() => import('@/shell/NavDrawer.vue'));
  const AppFooter = defineAsyncComponent(() => import('@/shell/AppFooter.vue'));
  const AppBar = defineAsyncComponent(() => import('@/shell/AppBar.vue'));
</script>
