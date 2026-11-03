<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useSystemStore } from '@/stores/systemStore';
import { connection } from '@/composables/connectionState';
import { checkColor, formatDuration, healthSummary } from '@/composables/systemHealthLook';
import NodeHealthList from '@/components/system/NodeHealthList.vue';
import OutboxSummaryPanel from '@/components/system/OutboxSummaryPanel.vue';

// The System page (I46): the UI's own connections, the orchestrator's checks, every node with its history and
// devices, and the delivery queue. Reloads every 10 seconds while it is open.
const refreshMs = 10000;

const system = useSystemStore();
// A failed load keeps the last report; the banner reports an unreachable API.
const { health, loading, error: loadError } = storeToRefs(system);
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;

const summary = computed(() => health.value ? healthSummary(health.value) : null);

async function load() {
  await system.load();
  now.value = Date.now();
}

onMounted(() => {
  load();
  timer = setInterval(load, refreshMs);
});

onUnmounted(() => {
  if (timer)
    clearInterval(timer);
});

function time(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : '';
}
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="text-subtitle-1">This browser</v-card-title>
          <v-card-text>
            <div>
              <v-icon :color="connection.mqttConnected ? 'green' : 'red'" class="me-1">{{ connection.mqttConnected ? 'sync' : 'sync_disabled' }}</v-icon>
              Live updates: {{ connection.mqttConnected ? 'connected' : 'disconnected' }}
            </div>
            <div>
              <v-icon :color="connection.apiReachable ? 'green' : 'red'" class="me-1">{{ connection.apiReachable ? 'cloud_done' : 'cloud_off' }}</v-icon>
              Orchestrator API: {{ connection.apiReachable ? 'answers' : 'no answer' }}{{ connection.apiError && !connection.apiReachable ? ': ' + connection.apiError : '' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="text-subtitle-1">
            Orchestrator
            <v-chip v-if="health" size="small" label :color="checkColor(health.orchestrator.status)" class="ms-2">{{ health.orchestrator.status }}</v-chip>
            <v-btn icon="refresh" variant="text" size="small" class="float-right" :loading="loading" @click="load()" />
          </v-card-title>
          <v-card-text v-if="health">
            <div>Version {{ health.orchestrator.version ?? 'unknown' }}, running for {{ formatDuration(now - Date.parse(health.orchestrator.started)) }} (since {{ time(health.orchestrator.started) }})</div>
            <div class="mt-2">
              <v-chip v-for="check in health.orchestrator.checks" :key="check.name" size="small" label :color="checkColor(check.status)" class="me-2 mb-1" :title="check.description ?? ''">
                {{ check.name }}: {{ check.description ?? check.status }}
              </v-chip>
            </div>
            <div v-if="summary" class="mt-2">
              {{ summary.online }} of {{ summary.nodes }} online, {{ summary.deviceErrors }} device(s) in error, {{ summary.attention }} need attention.
              Report at {{ time(health.generatedAt) }}.
            </div>
          </v-card-text>
          <v-card-text v-else-if="!loadError">Loading…</v-card-text>
          <v-card-text v-if="loadError" class="text-error">Could not load the health report: {{ loadError }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-if="health">
      <v-col cols="12">
        <div class="text-subtitle-1 mb-2">Nodes, connectors and workflow engines</div>
        <NodeHealthList :nodes="health.nodes" :started="health.orchestrator.started" :now="now" />
      </v-col>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-subtitle-1">Delivery queue</v-card-title>
          <v-card-text>
            <OutboxSummaryPanel :outbox="health.outbox" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
