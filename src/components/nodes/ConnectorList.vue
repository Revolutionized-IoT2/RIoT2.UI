<script setup lang="ts">
import { connectorLook, spoolLine } from '@/composables/statusLook';
import type { ConnectorInfo } from '@/models/connectorInfo';

const props = defineProps<{
  connectors: ConnectorInfo[]
}>();

const headers = [
  { title: 'Name', value: 'name' },
  { title: 'Version', value: 'version' },
  { title: 'Health', value: 'health' },
  { title: 'Spool', value: 'spool' },
  { title: 'Id', value: 'id' }
];
</script>

<template>
  <v-data-table :hide-default-footer="props.connectors.length < 10" :items="props.connectors" :headers="headers" class="elevation-1 mt-4">
    <template v-slot:top>
      <v-toolbar flat color="transparent">
        <v-toolbar-title>Connectors</v-toolbar-title>
        <v-divider class="mx-4" inset vertical />
      </v-toolbar>
    </template>

    <template v-slot:item.name="{ item }">
      <div>{{ item.name }}{{ item.manifest?.name ? " (" + item.manifest.name + ")" : "" }}</div>
    </template>

    <template v-slot:item.version="{ item }">
      <div class="text-left">
        {{ item.manifest?.version || 'n/a' }}
        <v-tooltip v-if="item.manifest?.coreVersion" activator="parent" location="top">Connector SDK {{ item.manifest.coreVersion }}</v-tooltip>
      </div>
    </template>

    <template v-slot:header.health>
      <div class="text-center">Health</div>
    </template>

    <template v-slot:item.health="{ item }">
      <div class="text-center">
        <v-chip :color="connectorLook(item).color" :prepend-icon="connectorLook(item).icon" :text="connectorLook(item).label" class="text-uppercase" label size="small"></v-chip>
        <v-tooltip v-if="connectorLook(item).detail.length > 0" activator="parent" location="top">
          <div v-for="line in connectorLook(item).detail" :key="line">{{ line }}</div>
        </v-tooltip>
      </div>
    </template>

    <template v-slot:item.spool="{ item }">
      <div class="text-left">
        <span v-if="item.health == null || !item.health.spool.enabled">n/a</span>
        <span v-else>{{ item.health.spool.messages }}</span>
        <v-tooltip v-if="spoolLine(item) != null" activator="parent" location="top">{{ spoolLine(item) }}</v-tooltip>
      </div>
    </template>

    <template v-slot:no-data>
      <div>no connectors online</div>
    </template>
  </v-data-table>
</template>
