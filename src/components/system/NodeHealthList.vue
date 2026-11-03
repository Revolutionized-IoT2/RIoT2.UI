<script setup lang="ts">
import { computed } from 'vue';
import type { NodeHealth } from '@/models/systemHealth';
import { deviceLook, historyLines, needsAttention, nodeSyncLook, nodeTypeLabel, presenceLook } from '@/composables/systemHealthLook';

// Every node, connector and workflow engine on the System page (I46): presence and its history since the
// orchestrator started, configuration sync, version, and each device's state and last error.
const props = defineProps<{ nodes: NodeHealth[]; started: string; now: number }>();

const deviceHeaders = [
  { title: 'Device', value: 'name' },
  { title: 'State', value: 'state' },
  { title: 'Message', value: 'message' },
  { title: 'Last error', value: 'lastError' }
];

const rows = computed(() => props.nodes.map(node => ({
  node,
  presence: presenceLook(node, props.started, props.now),
  sync: nodeSyncLook(node),
  attention: needsAttention(node),
  history: historyLines(node.history)
})));

function time(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : '';
}
</script>

<template>
  <v-expansion-panels multiple variant="accordion">
    <v-expansion-panel v-for="row in rows" :key="row.node.id">
      <v-expansion-panel-title>
        <v-icon :color="row.attention ? 'orange' : row.presence.color" class="me-2">{{ row.attention ? 'warning' : row.presence.icon }}</v-icon>
        <span class="font-weight-bold me-2">{{ row.node.name || row.node.id }}</span>
        <v-chip size="x-small" label class="me-2">{{ nodeTypeLabel(row.node.nodeType) }}</v-chip>
        <v-chip size="x-small" label :color="row.presence.color" class="me-2">{{ row.presence.label }}</v-chip>
        <v-chip v-if="row.sync" size="x-small" label :color="row.sync.color" :prepend-icon="row.sync.icon" class="me-2">{{ row.sync.label }}</v-chip>
        <span class="text-body-small text-medium-emphasis">{{ row.presence.detail[0] }}</span>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <div class="text-body-small mb-2">
          <div>Id: {{ row.node.id }}</div>
          <div v-if="row.node.version">Version {{ row.node.version }}</div>
          <div v-if="row.node.pluginVersion">Plugin {{ row.node.pluginVersion }}</div>
          <div v-for="line in row.sync?.detail ?? []" :key="line">{{ line }}</div>
          <div v-for="line in row.presence.detail.slice(1)" :key="line">{{ line }}</div>
        </div>
        <div v-if="row.history.length > 0" class="mb-3">
          <div class="text-title-small">Presence since the orchestrator started</div>
          <div v-for="(line, index) in row.history" :key="index" class="text-body-small">{{ line }}</div>
        </div>
        <template v-if="row.node.devices">
          <div v-if="row.node.devicesUnavailable" class="text-body-small mb-2">
            The node didn't report its devices{{ row.node.isOnline ? ' in time' : ': it is offline' }}; the last errors are what the orchestrator saw before.
          </div>
          <v-data-table :items="row.node.devices" :headers="deviceHeaders" density="compact" hide-default-footer :items-per-page="-1">
            <template v-slot:item.name="{ item }">{{ item.name || item.id }}</template>
            <template v-slot:item.state="{ item }">
              <v-chip size="x-small" label :color="deviceLook(item).color">{{ deviceLook(item).label }}</v-chip>
            </template>
            <template v-slot:item.lastError="{ item }">
              <span v-if="item.lastError">{{ item.lastError }} <span class="text-body-small text-medium-emphasis">({{ time(item.lastErrorAt) }})</span></span>
            </template>
            <template v-slot:no-data>
              <div>no devices</div>
            </template>
          </v-data-table>
        </template>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
