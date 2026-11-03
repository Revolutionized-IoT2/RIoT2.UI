<template>
  <v-main>
    <router-view v-if="route.meta.fullBleed" />
    <v-container v-else fluid class="pa-4 pa-md-6">
      <router-view />
    </v-container>
  </v-main>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';

const route = useRoute();
</script>
