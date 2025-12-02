<template>
  <icon-card icon="mdi-account-group" icon-background="secondary" icon-color="white">
    <template #stat>
      {{ $t('page.team.card.manageteam.title') }}
    </template>
    <template #content>
      <template v-if="allMembers.length > 0">
        <div class="p-4">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div v-for="teammate in allMembers" :key="teammate">
              <team-member-card
                :teammember="teammate"
                :is-team-owner-view="isCurrentUserTeamOwner"
              ></team-member-card>
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="allMembers.length === 0">
        <div class="p-4 text-center">
          {{ $t('page.team.card.manageteam.no_members') }}
        </div>
      </template>
      <template v-else></template>
    </template>
  </icon-card>
</template>
<script setup lang="ts">
  import { computed, onUnmounted, ref } from 'vue';
import IconCard from '@/components/ui/IconCard.vue';
import TeamMemberCard from '@/features/team/TeamMemberCard.vue';
import { useTeamStoreWithSupabase } from '@/stores/useTeamStore';
  const { $supabase } = useNuxtApp();
  const { teamStore } = useTeamStoreWithSupabase();
  const teamMembers = ref<string[]>([]);
  // Initialize with current store state before subscribing
  teamMembers.value = teamStore.members || [];
  // Subscribe to team store changes and store unsubscribe function
  const unsubscribe = teamStore.$subscribe((_mutation, state) => {
    if (state.members) {
      teamMembers.value = state.members;
    } else {
      teamMembers.value = [];
    }
  });
  // Cleanup subscription on component unmount to prevent memory leaks
  onUnmounted(() => {
    unsubscribe();
  });
  const isCurrentUserTeamOwner = computed(() => {
    const currentTeamOwner = teamStore.owner;
    const currentSupabaseUID = $supabase.user.id;
    return currentTeamOwner === currentSupabaseUID;
  });
  // Ensure current user is always included in the members list
  const allMembers = computed(() => {
    const currentUID = $supabase.user.id;
    if (!currentUID) return teamMembers.value;
    // Check if current user is already in the members list
    const hasCurrentUser = teamMembers.value.includes(currentUID);
    if (hasCurrentUser) {
      // Sort so current user (owner) appears first
      return [...teamMembers.value].sort((a, b) => {
        if (a === currentUID) return -1;
        if (b === currentUID) return 1;
        return 0;
      });
    } else {
      // Add current user to the beginning of the list
      return [currentUID, ...teamMembers.value];
    }
  });
</script>
