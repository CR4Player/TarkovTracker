<template>
  <header
    class="fixed top-0 inset-x-0 z-50 h-16 backdrop-blur-sm bg-linear-to-tr from-surface-800/95 to-surface-950/95 border-b border-surface-700/70"
  >
    <div class="h-full px-3 flex items-center gap-3">
      <!-- Left: Toggle Button -->
      <UButton
        :icon="navBarIcon"
        variant="ghost"
        color="neutral"
        size="xl"
        aria-label="Toggle Menu Drawer"
        title="Toggle Menu Drawer"
        @click.stop="changeNavigationDrawer"
      />

      <!-- Center: Page Title -->
      <span class="text-xl font-bold truncate text-white flex-1 min-w-0">
        {{ pageTitle }}
      </span>

      <!-- Right: Status Icons & Settings -->
      <div class="ml-auto flex items-center gap-2">
        <span v-if="dataError" title="Error Loading Tarkov Data">
          <UIcon name="i-mdi-database-alert" class="text-red-500 w-6 h-6" />
        </span>
        <span v-if="dataLoading || hideoutLoading" title="Loading Tarkov Data">
          <UIcon
            name="i-heroicons-arrow-path"
            class="animate-spin text-primary-500 w-6 h-6"
          />
        </span>
        <!-- Game mode quick toggle -->
        <div
          class="hidden sm:flex items-center rounded-md border border-white/15 ring-1 ring-white/10 overflow-hidden bg-surface-900/90"
          role="group"
          aria-label="Toggle game mode"
        >
          <button
            type="button"
            class="px-3 py-1.5 sm:px-3 md:px-3.5 lg:px-4 sm:py-1.5 md:py-1.75 lg:py-2 text-[11px] sm:text-xs md:text-sm lg:text-[15px] font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-pvp-400 focus:z-10 inline-flex items-center gap-2"
            :class="pvpClasses"
            @click="switchMode(GAME_MODES.PVP)"
          >
            <UIcon name="i-mdi-sword-cross" class="w-4 h-4 md:w-5 md:h-5" />
            PvP
          </button>
          <div class="w-[1.5px] h-9 bg-white/15" aria-hidden="true" />
          <button
            type="button"
            class="px-3 py-1.5 sm:px-3 md:px-3.5 lg:px-4 sm:py-1.5 md:py-1.75 lg:py-2 text-[11px] sm:text-xs md:text-sm lg:text-[15px] font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-pve-400 focus:z-10 inline-flex items-center gap-2"
            :class="pveClasses"
            @click="switchMode(GAME_MODES.PVE)"
          >
            <UIcon name="i-mdi-account-group" class="w-4 h-4 md:w-5 md:h-5" />
            PvE
          </button>
        </div>
        <UPopover
          mode="click"
          :popper="{ placement: 'bottom-end' }"
          @open="handlePopoverOpen"
          @close="handlePopoverClose"
        >
          <UButton
            ref="popoverTrigger"
            icon="i-mdi-cog"
            variant="ghost"
            color="neutral"
            size="xl"
            class="relative"
            :loading="overflowMenuLoading"
            @click="handlePopoverToggle"
          />
          <template #content>
            <OverflowMenu v-if="!overflowMenuLoading" />
            <div
              v-else
              class="w-80 max-w-[90vw] bg-surface-900 rounded-lg p-4 flex items-center justify-center"
            >
              <UIcon
                name="i-heroicons-arrow-path"
                class="animate-spin text-primary-500 w-6 h-6 mr-2"
              />
              <span class="text-surface-300">Loading...</span>
            </div>
          </template>
        </UPopover>
      </div>
    </div>
  </header>
</template>
<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  ref,
  onErrorCaptured,
  onMounted,
  onUnmounted,
} from "vue";
import type { ComponentPublicInstance } from "vue";
import { storeToRefs } from "pinia";
import { useAppStore } from "@/stores/app";
import { useTarkovStore } from "@/stores/tarkov";
import { useMetadataStore } from "@/stores/metadata";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { GAME_MODES, type GameMode } from "@/utils/constants";
import { useWindowSize } from "@vueuse/core";
const { t } = useI18n({ useScope: "global" });
const appStore = useAppStore();
const tarkovStore = useTarkovStore();
const metadataStore = useMetadataStore();
const route = useRoute();
const { width } = useWindowSize();
const mdAndDown = computed(() => width.value < 960); // Vuetify md breakpoint is 960px
const navBarIcon = computed(() => {
  return appStore.drawerShow && appStore.drawerRail
    ? "i-mdi-menu-open"
    : "i-mdi-menu";
});
const currentGameMode = computed(() => {
  return tarkovStore.getCurrentGameMode();
});
const pveClasses = computed(() =>
  currentGameMode.value === GAME_MODES.PVE
    ? "bg-pve-500 hover:bg-pve-600 text-white shadow-[0_0_0_4px_rgba(0,0,0,0.45)] ring-2 ring-white/60 ring-inset outline outline-2 outline-white/40"
    : "bg-pve-950/80 text-pve-400 hover:bg-pve-900/90"
);
const pvpClasses = computed(() =>
  currentGameMode.value === GAME_MODES.PVP
    ? "bg-pvp-800 hover:bg-pvp-700 text-pvp-100 shadow-[0_0_0_4px_rgba(0,0,0,0.45)] ring-2 ring-white/60 ring-inset outline outline-2 outline-white/40"
    : "bg-pvp-950/80 text-pvp-400 hover:bg-pvp-900/90"
);
async function switchMode(mode: GameMode) {
  if (mode !== currentGameMode.value) {
    await tarkovStore.switchGameMode(mode);
    metadataStore.updateLanguageAndGameMode();
    await metadataStore.fetchAllData();
  }
}
// Async component with error handling
const overflowMenuLoading = ref(false);
const OverflowMenu = defineAsyncComponent({
  loader: async () => {
    overflowMenuLoading.value = true;
    try {
      return await import("@/features/layout/OverflowMenu.vue");
    } finally {
      overflowMenuLoading.value = false;
    }
  },
  loadingComponent: {
    template:
      '<div class="w-80 max-w-[90vw] bg-surface-900 rounded-lg p-4 flex items-center justify-center"><UIcon name="i-heroicons-arrow-path" class="animate-spin text-primary-500 w-6 h-6 mr-2" /><span class="text-surface-300">Loading...</span></div>',
  },
  errorComponent: {
    template:
      '<div class="w-80 max-w-[90vw] bg-surface-900 rounded-lg p-4 flex items-center justify-center"><UIcon name="i-mdi-alert" class="text-red-500 w-6 h-6 mr-2" /><span class="text-red-400">Error loading menu</span></div>',
  },
  delay: 200,
  timeout: 3000,
});
const { loading: dataLoading, hideoutLoading } = storeToRefs(metadataStore);
const dataError = ref(false); // Placeholder - TODO: implement error handling
const pageTitle = computed(() =>
  t(`page.${String(route.name || "index").replace("-", "_")}.title`)
);
// Ref for popover trigger button
const popoverTrigger = ref<HTMLElement | ComponentPublicInstance | null>(null);
const popoverOpen = ref(false);
// Handle async component errors
onErrorCaptured((err) => {
  console.error("[AppBar] Async component error:", err);
  return false; // Prevent error from propagating
});
// Prevent focus issues by intercepting keydown events when popover is open
function handleKeydown(event: KeyboardEvent) {
  if (popoverOpen.value && event.key === "Escape") {
    event.preventDefault();
    closePopover();
  }
}
onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});
onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
function changeNavigationDrawer() {
  if (mdAndDown.value) {
    appStore.toggleDrawerShow();
  } else {
    appStore.toggleDrawerRail();
  }
}
function closePopover() {
  // Move focus immediately and synchronously to prevent aria-hidden conflicts
  if (popoverTrigger.value) {
    // Access the underlying DOM element from the component ref
    const el =
      popoverTrigger.value && "$el" in popoverTrigger.value
        ? (popoverTrigger.value.$el as HTMLElement | null)
        : popoverTrigger.value;
    if (el && typeof el.focus === "function") {
      el.focus();
    }
  }
  // Mark as closed to prevent focus management conflicts
  popoverOpen.value = false;
}
function handlePopoverOpen() {
  popoverOpen.value = true;
}
function handlePopoverClose() {
  // Use closePopover for consistent focus management
  closePopover();
}
function handlePopoverToggle() {
  if (popoverOpen.value) {
    handlePopoverClose();
  } else {
    handlePopoverOpen();
  }
}
</script>
