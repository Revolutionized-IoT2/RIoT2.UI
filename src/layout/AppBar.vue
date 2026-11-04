<template>
  <v-app-bar flat color="surface" border="b">
    <v-app-bar-nav-icon aria-label="Toggle navigation" @click="mobile ? (drawer = !drawer) : (rail = !rail)" />
    <v-app-bar-title>
      <router-link to="/" class="brand" aria-label="RIoT2 home">
        <img src="../assets/riot_logo.png" alt="" class="brand__logo" />
        <span class="brand__name">RIoT2</span>
      </router-link>
    </v-app-bar-title>
    <v-menu location="bottom end">
      <template #activator="{ props: menu }">
        <v-btn v-bind="menu" :icon="themeIcon" aria-label="Theme" variant="text" />
      </template>
      <v-list density="compact" nav :selected="[choice]" color="primary" @update:selected="(v: unknown[]) => setTheme(v[0] as ThemeChoice)">
        <v-list-item v-for="option in themeOptions" :key="option.value" :value="option.value" :title="option.title" :prepend-icon="option.icon" rounded="lg" />
      </v-list>
    </v-menu>
    <v-chip class="mr-4" variant="tonal" prepend-icon="mdi-account-circle-outline">admin</v-chip>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" :rail="rail && !mobile" :temporary="mobile" color="surface-container-low" border="0">
    <v-list density="comfortable" nav color="primary">
      <v-list-item v-for="item in main" :key="item.to" :to="item.to" :exact="item.to === '/'" :title="item.title" :prepend-icon="item.icon" rounded="xl" />
      <v-divider class="my-2" />
      <v-list-subheader v-if="!rail || mobile">Automation</v-list-subheader>
      <v-list-item to="/workflows" title="Workflows" prepend-icon="mdi-sitemap-outline" rounded="xl" />
      <v-list-item to="/plans" title="Plans" prepend-icon="mdi-calendar-clock" rounded="xl" />
      <v-list-item to="/ai" exact title="AI models" prepend-icon="mdi-robot-outline" rounded="xl" />
      <v-list-item to="/ai/access" title="AI access" prepend-icon="mdi-connection" rounded="xl" />
      <v-divider class="my-2" />
      <v-list-subheader v-if="!rail || mobile">Administration</v-list-subheader>
      <v-list-item v-for="item in administration" :key="item.to" :to="item.to" :title="item.title" :prepend-icon="item.icon" rounded="xl" />
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useDisplay, useTheme } from 'vuetify';
import { themeStorageKey, type ThemeChoice } from '@/plugins/vuetify';

// The shell of Dls (ADR 0016): a flat app bar, and a navigation drawer that shrinks to a rail on wide screens and
// overlays the page on narrow ones.
const { mobile } = useDisplay();
const theme = useTheme();
const drawer = ref(true);
const rail = ref(false);
watch(mobile, isMobile => { drawer.value = !isMobile; }, { immediate: true });

const main = [
  { to: '/', title: 'Home', icon: 'mdi-home-outline' },
  { to: '/dash', title: 'Dashboard', icon: 'mdi-view-dashboard-outline' },
  { to: '/nodes', title: 'Configure', icon: 'mdi-cog-outline' },
  { to: '/variables', title: 'Variables', icon: 'mdi-variable' },
];
const administration = [
  { to: '/matter', title: 'Matter', icon: 'mdi-hub-outline' },
  { to: '/backup', title: 'Backup', icon: 'mdi-backup-restore' },
  { to: '/system', title: 'System', icon: 'mdi-heart-pulse' },
];

const themeOptions: { value: ThemeChoice, title: string, icon: string }[] = [
  { value: 'light', title: 'Light', icon: 'mdi-weather-sunny' },
  { value: 'dark', title: 'Dark', icon: 'mdi-weather-night' },
  { value: 'system', title: 'System', icon: 'mdi-theme-light-dark' },
];
const choice = ref<ThemeChoice>(theme.isSystem.value ? 'system' : theme.global.name.value as ThemeChoice);
const themeIcon = computed(() => themeOptions.find(option => option.value === choice.value)?.icon ?? 'mdi-theme-light-dark');

function setTheme(next: ThemeChoice | undefined) {
  if (next == null)
    return;
  choice.value = next;
  theme.change(next);
  try {
    globalThis.localStorage?.setItem(themeStorageKey, next);
  } catch {
    // Private browsing: the choice lasts until the page reloads.
  }
}
</script>

<style scoped>
.brand {
  color: inherit;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.brand__logo {
  height: 32px;
}

.brand__name {
  font-weight: 600;
  letter-spacing: 0.02em;
}
</style>
