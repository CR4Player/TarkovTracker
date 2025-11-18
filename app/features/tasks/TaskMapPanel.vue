<template>
  <v-col v-if="show" cols="12" class="my-1">
    <v-expansion-panels v-model="expandMap">
      <v-expansion-panel>
        <v-expansion-panel-title>
          Objective Locations
          <span v-show="activeMapView !== '55f2d3fd4bdc2d5f408b4567'">
            &nbsp;-&nbsp;{{ tarkovTime }}
          </span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <tarkov-map
            v-if="selectedMap"
            :map="selectedMap"
            :marks="visibleMarks"
          />
          <v-alert v-else type="error">
            No map data available for this selection.
          </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-col>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, computed } from "vue";
import { useTarkovTime } from "~/composables/useTarkovTime";
import type { TarkovMap } from "~/types/tarkov";

const TarkovMap = defineAsyncComponent(
  () => import("~/features/maps/TarkovMap.vue")
);

// Use structural types compatible with TarkovMap's expectations
interface Props {
  show: boolean;
  selectedMap?: TarkovMap;
  visibleMarkers: Array<{
    zones: Array<{ map: { id: string }; outline: { x: number; z: number }[] }>;
    possibleLocations?: Array<{ map: { id: string }; [key: string]: unknown }>;
  }>;
  activeMapView: string;
}

const props = defineProps<Props>();

const expandMap = ref([0]);
const { tarkovTime } = useTarkovTime();

// Alias for better readability in template
const visibleMarks = computed(() => props.visibleMarkers);
</script>
