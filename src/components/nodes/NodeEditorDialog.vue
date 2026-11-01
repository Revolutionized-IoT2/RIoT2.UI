<script setup lang="ts">
import { computed, ref } from 'vue';
import NodeEditorComponent from '@/components/NodeEditorComponent.vue';
import DeviceTemplatePicker from './DeviceTemplatePicker.vue';
import { useNodesStore } from '@/stores/nodesStore';
import { blankDevice, mergeDeviceTemplates } from '@/composables/deviceTemplates';
import NodeConfiguration from '@/models/nodeConfiguration';
import type DeviceConfiguration from '@/models/deviceConfiguration';
import type SystemNode from '@/models/systemNode';

const open = defineModel<boolean>('open', { default: false });
const configuration = defineModel<NodeConfiguration>('configuration', { default: new NodeConfiguration() });

defineProps<{
  onlineNodes: SystemNode[],
  saving: boolean
}>();

const emit = defineEmits<{
  save: []
}>();

const nodes = useNodesStore();
const pickerOpen = ref(false);
const offeredDevices = ref<DeviceConfiguration[]>([]);
const loadingTemplates = ref(false);

// Devices are offered by the node with this id, so it must be chosen first.
const hasNodeId = computed(() => configuration.value.id != null && configuration.value.id != '');

/** Offers the node's device templates, plus a blank device for one it doesn't list. */
async function newDevice() {
  loadingTemplates.value = true;
  offeredDevices.value = [...await nodes.getDeviceTemplates(configuration.value.id!), blankDevice()];
  loadingTemplates.value = false;
  pickerOpen.value = true;
}

function addDevices(devices: DeviceConfiguration[]) {
  configuration.value.deviceConfigurations.push(...devices);
}

/** Adds the templates the running device offers and its configuration lacks. */
async function reloadDevice(deviceId: string) {
  const device = configuration.value.deviceConfigurations.find(x => x.id == deviceId);
  if (device == null || !hasNodeId.value)
    return;
  const offered = await nodes.getDeviceTemplates(configuration.value.id!);
  mergeDeviceTemplates(device, offered.find(x => x.classFullName == device.classFullName));
}
</script>

<template>
  <v-dialog v-model="open" scrollable width="90%">
    <v-card>
      <v-toolbar color="primary" density="compact" flat>
        <v-toolbar-title class="text-body-2 font-weight-bold">
          Configurator for {{ configuration.name }}
        </v-toolbar-title>
      </v-toolbar>
      <v-divider></v-divider>
      <v-card-text style="height: 90%;">
        <NodeEditorComponent v-model="configuration" :onlineNodes="onlineNodes" @reload-device="reloadDevice" />
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn rounded="0" color="error" variant="outlined" @click="open = false">
          <v-icon size="small">cancel</v-icon>
          cancel
        </v-btn>
        <v-btn :loading="loadingTemplates" :disabled="!hasNodeId" rounded="0" color="success" variant="outlined" @click="newDevice">
          <v-icon size="small">add</v-icon>
          new device
        </v-btn>
        <v-btn :loading="saving" :disabled="!hasNodeId" rounded="0" color="primary" variant="outlined" @click="emit('save')">
          <v-icon size="small">save</v-icon>
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <DeviceTemplatePicker v-model="pickerOpen" :templates="offeredDevices" @add="addDevices" />
</template>
