<template>
  <v-app color="rgba(0, 0, 0, 1)">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/stores/app';
import { fireuser } from '@/plugins/firebase.client';
import { markDataMigrated } from '@/plugins/store-initializer';
import { useTarkovStore } from '@/stores/tarkov';
import { useTarkovData } from '@/composables/tarkovdata';
import type { StoreWithFireswapExt } from '@/plugins/pinia-firestore';

const appStore = useAppStore();
const { locale } = useI18n({ useScope: 'global' });

// Initialize Tarkov data globally to ensure it's available for any route
useTarkovData();

onMounted(async () => {
  // Check our locale settings
  if (appStore.localeOverride) {
    locale.value = appStore.localeOverride;
  }
  // Check for migration flag in sessionStorage
  const wasMigrated = sessionStorage.getItem('tarkovDataMigrated') === 'true';
  if (wasMigrated && fireuser.loggedIn) {
    // Re-set the migration flag
    markDataMigrated();
    // Make sure data is properly loaded from Firebase
    try {
      const store = useTarkovStore();
      const extendedStore = store as unknown as StoreWithFireswapExt<typeof store>;
      if (store && typeof extendedStore.firebindAll === 'function') {
        extendedStore.firebindAll();
      }
    } catch (error) {
      console.error('Error rebinding store in App component:', error);
    }
  }
});
</script>

<style lang="scss">
// Set the font family for the application to Share Tech Mono
.v-application {
  [class*='text-'] {
    font-family: 'Share Tech Mono', sans-serif !important;
    font-display: swap;
  }
  font-family: 'Share Tech Mono', sans-serif !important;
  font-display: swap;
}
</style>
