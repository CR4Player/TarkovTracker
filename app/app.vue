<template>
  <div
    id="app"
    class="min-h-screen flex flex-col bg-background text-surface-200 font-sans"
  >
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- Portal target for modals -->
    <div id="modals"></div>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useUserStore } from "@/stores/user";
import { markDataMigrated } from "@/plugins/store-initializer";
import { useTarkovStore, initializeTarkovSync } from "@/stores/tarkov";
import { initializeProgressSync } from "@/stores/progress";
const { $supabase } = useNuxtApp();
const userStore = useUserStore();
const { locale } = useI18n({ useScope: "global" });
// Note: metadataStore is initialized via metadata.client.ts plugin
onMounted(async () => {
  const localeOverride = (userStore.$state as any).localeOverride;
  if (localeOverride) {
    locale.value = localeOverride;
  }
  if ($supabase.user.loggedIn) {
    await initializeTarkovSync();
    initializeProgressSync();
  }
  const wasMigrated = sessionStorage.getItem("tarkovDataMigrated") === "true";
  if (wasMigrated && $supabase.user.loggedIn) {
    markDataMigrated();
    try {
      const store = useTarkovStore();
      if (typeof store.migrateDataIfNeeded === "function") {
        store.migrateDataIfNeeded();
      }
    } catch (error) {
      console.error("Error initializing store in App component:", error);
    }
  }
});
</script>
