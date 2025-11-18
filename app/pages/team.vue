<template>
  <div class="team-management-page">
    <tracker-tip :tip="{ id: 'team' }"></tracker-tip>
    <v-container v-if="fireuser.loggedIn">
    <v-row v-if="route?.query?.team && route?.query?.code" justify="center">
      <v-col cols="12">
        <team-invite></team-invite>
      </v-col>
    </v-row>
    <v-row v-if="fireuser.loggedIn" justify="center">
      <v-col v-if="systemStore.$state.team" cols="12">
        <team-members></team-members>
      </v-col>
      <v-col cols="12" sm="12" md="12" lg="6" xl="6">
        <my-team></my-team>
      </v-col>
      <v-col cols="12" sm="12" md="12" lg="6" xl="6">
        <team-options></team-options>
      </v-col>
    </v-row>
    </v-container>
  </div>
</template>
<script setup>
  import { fireuser } from '@/plugins/firebase.client';
  import { useLiveData } from '@/composables/livedata';
  import { useRoute } from 'vue-router';
  import { defineAsyncComponent } from 'vue';
  const TeamMembers = defineAsyncComponent(() => import('@/features/team/TeamMembers'));
  const TeamOptions = defineAsyncComponent(() => import('@/features/team/TeamOptions'));
  const MyTeam = defineAsyncComponent(() => import('@/features/team/MyTeam'));
  const TrackerTip = defineAsyncComponent(() => import('@/features/ui/TrackerTip'));
  const TeamInvite = defineAsyncComponent(() => import('@/features/team/TeamInvite'));
  const { useSystemStore } = useLiveData();
  const { systemStore } = useSystemStore();
  const route = useRoute();

  definePageMeta({
    background: 'busstation',
  });
</script>
<style lang="scss" scoped></style>
