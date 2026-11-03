<template>
  <div class="home">
    <div class="d-flex align-center ga-4 mb-6">
      <img alt="RIoT Logo" src="../assets/riot_logo.png" class="home__logo" />
      <div>
        <div class="text-headline-small font-weight-medium">RIoT2 Controller</div>
        <div class="text-body-medium text-medium-emphasis">Flexible and scalable IoT system</div>
      </div>
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
.home__logo {
  height: 56px;
}
</style>
