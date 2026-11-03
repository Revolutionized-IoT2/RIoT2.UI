<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useSystemStore } from '@/stores/systemStore';
import { bannerText, connection } from '@/composables/connectionState';

// The connection banner (I46): shown on every page, also the wall dashboard, when the UI loses its realtime
// connection or the orchestrator's API. Requests record the API's state; this also asks the API every
// 15 seconds, so an idle page notices too.
const probeMs = 15000;

const system = useSystemStore();
const now = ref(Date.now());
let clock: ReturnType<typeof setInterval> | undefined;
let probe: ReturnType<typeof setInterval> | undefined;

const text = computed(() => bannerText(connection, now.value));

const ping = () => system.ping();

onMounted(() => {
  clock = setInterval(() => { now.value = Date.now(); }, 1000);
  probe = setInterval(ping, probeMs);
});

onUnmounted(() => {
  if (clock)
    clearInterval(clock);
  if (probe)
    clearInterval(probe);
});
</script>

<template>
  <div v-if="text" class="connection-banner">
    <v-alert type="warning" density="compact" variant="flat" rounded="0" icon="mdi-cloud-off-outline">
      {{ text }}
      <template v-slot:append>
        <v-btn size="small" variant="text" @click="ping()">Retry</v-btn>
      </template>
    </v-alert>
  </div>
</template>

<style scoped>
.connection-banner {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 2000;
}
</style>
