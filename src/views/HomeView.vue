<template>
  <div class="home">
    <div class="d-flex justify-center mb-8">
      <img alt="RIoT Logo" src="../assets/riot_logo.png" class="home__logo" :class="{ 'home__logo--dark': theme.current.value.dark }" />
    </div>
    <v-row>
      <v-col v-for="item in sections" :key="item.to" cols="12" sm="6" lg="4">
        <v-card :to="item.to" color="surface-container-low" variant="flat" class="h-100">
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary-container" rounded="lg">
                <v-icon :icon="item.icon" color="on-primary-container" />
              </v-avatar>
            </template>
            <v-card-title>{{ item.title }}</v-card-title>
            <v-card-subtitle class="text-wrap">{{ item.text }}</v-card-subtitle>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import { useTheme } from 'vuetify';

const theme = useTheme();
const sections = [
  { to: '/dash', title: 'Dashboard', icon: 'mdi-view-dashboard-outline', text: 'Visualize and control the system state' },
  { to: '/nodes', title: 'Configure', icon: 'mdi-cog-outline', text: 'System nodes, devices and dashboard settings' },
  { to: '/workflows', title: 'Workflows', icon: 'mdi-sitemap-outline', text: 'Automate with workflows: design, publish and follow their runs' },
  { to: '/ai', title: 'AI models', icon: 'mdi-robot-outline', text: 'Language model connections for the Run LLM step, and their usage' },
  { to: '/variables', title: 'Variables', icon: 'mdi-variable', text: 'Settings for system state variables' },
  { to: '/matter', title: 'Matter', icon: 'mdi-hub-outline', text: 'Expose devices to Matter controllers such as Google Home' },
  { to: '/backup', title: 'Backup', icon: 'mdi-backup-restore', text: 'Back up and restore the configuration' },
];
</script>

<style scoped>
/* The logo is dark on an opaque, nearly white (#fafafa) background: brightness makes that white, and multiply
   drops it into the page's background. */
.home__logo {
  width: min(100%, 400px);
  height: auto;
  filter: brightness(1.03);
  mix-blend-mode: multiply;
}

/* Dark themes invert it to light on black, and screen drops the black. */
.home__logo--dark {
  filter: brightness(1.03) invert(1);
  mix-blend-mode: screen;
}
</style>
