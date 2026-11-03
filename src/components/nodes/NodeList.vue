<script setup lang="ts">
import { ref } from 'vue';
import { nodeStateLook } from '@/composables/deviceState';
import { syncLook } from '@/composables/statusLook';
import DeviceStatusDialog from './DeviceStatusDialog.vue';
import type SystemNode from '@/models/systemNode';
import type DeviceStatus from '@/models/deviceStatus';

const props = defineProps<{
  nodes: SystemNode[],
  loading: boolean
}>();

const emit = defineEmits<{
  edit: [id: string, name: string],
  delete: [id: string],
  reapply: [id: string]
}>();

const headers = [
  { title: 'Name', value: 'name' },
  { title: 'Version', value: 'version' },
  { title: 'Status', value: 'isOnline' },
  { title: 'Configuration', value: 'syncState' },
  { title: 'Plugins', value: 'plugins' },
  { title: 'Devices', value: 'devices' },
  { title: 'Actions', value: 'id' }
];

const statusDialog = ref(false);
const statuses = ref<DeviceStatus[]>([]);

function showDeviceStatuses(node: SystemNode) {
  if (node.deviceStatuses == null || node.deviceStatuses.length == 0)
    return;
  statuses.value = node.deviceStatuses;
  statusDialog.value = true;
}
</script>

<template>
  <v-data-table :hide-default-footer="props.nodes.length < 10" :items="props.nodes" :headers="headers" :loading="props.loading" class="elevation-1 mt-2">
    <template v-slot:top>
      <v-toolbar flat color="transparent">
        <v-toolbar-title>System nodes</v-toolbar-title>
        <v-divider class="mx-4" inset vertical />
      </v-toolbar>
    </template>

    <template v-slot:header.isOnline>
      <div class="text-center">Node status</div>
    </template>
    <template v-slot:header.devices>
      <div class="text-center">Device status</div>
    </template>
    <template v-slot:header.id>
      <div class="text-end">Actions</div>
    </template>

    <template v-slot:item.name="{ item }">
      <div>{{ item.name }}{{ item.manifest != null ? " (" + item.manifest.name + ")" : "" }}
        <v-tooltip v-if="item.manifest != null" activator="parent" location="top">{{ item.manifest.installedPackageFilename }}</v-tooltip>
      </div>
    </template>

    <template v-slot:item.isOnline="{ item }">
      <div class="text-center">
        <v-chip :color="item.isOnline ? 'green' : 'red'" :text="item.isOnline ? 'online' : 'offline'" class="text-uppercase" label size="small"></v-chip>
      </div>
    </template>

    <template v-slot:header.syncState>
      <div class="text-center">Configuration</div>
    </template>

    <template v-slot:item.syncState="{ item }">
      <div class="text-center">
        <v-chip :color="syncLook(item).color" :prepend-icon="syncLook(item).icon" :text="syncLook(item).label" class="text-uppercase" label size="small"></v-chip>
        <v-tooltip v-if="syncLook(item).detail.length > 0" activator="parent" location="top">
          <div v-for="line in syncLook(item).detail" :key="line">{{ line }}</div>
        </v-tooltip>
      </div>
    </template>

    <template v-slot:item.plugins="{ item }">
      <div v-if="item.pluginManifest == null" class="text-left">n/a</div>
      <div v-else class="text-left">
        {{ item.pluginManifest.name }} ({{ item.pluginManifest.version }})
        <v-tooltip activator="parent" location="top">
          <div>{{ item.pluginManifest.installedPackageFilename }}</div>
          <div v-if="item.pluginManifest.coreVersion">Built on RIoT2.Core {{ item.pluginManifest.coreVersion }}</div>
        </v-tooltip>
      </div>
    </template>

    <template v-slot:item.version="{ item }">
      <div class="text-left">{{ item.manifest?.version ?? 'n/a' }}</div>
    </template>

    <template v-slot:item.devices="{ item }">
      <div class="text-center">
        <v-icon :color="nodeStateLook(item).color" @click="showDeviceStatuses(item)">{{ nodeStateLook(item).icon }}</v-icon>
      </div>
    </template>

    <template v-slot:item.id="{ item }">
      <div class="text-end">
        <v-icon v-if="item.syncState != null && item.syncState != 'legacy'" size="small" class="me-2" :disabled="!item.isOnline"
          title="Re-apply the configuration" @click="emit('reapply', item.id)" icon="mdi-sync" />
        <v-icon size="small" class="me-2" @click="emit('edit', item.id, item.name)" icon="mdi-pencil" />
        <v-icon size="small" @click="emit('delete', item.id)" icon="mdi-delete-outline" />
      </div>
    </template>

    <template v-slot:no-data>
      <div>no nodes</div>
    </template>
  </v-data-table>

  <DeviceStatusDialog v-model="statusDialog" :statuses="statuses" />
</template>
