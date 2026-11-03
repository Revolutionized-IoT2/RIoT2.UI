<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue';
import NodeEditorComponent from '@/components/NodeEditorComponent.vue';
import DeviceTemplatePicker from './DeviceTemplatePicker.vue';
import { useNodesStore } from '@/stores/nodesStore';
import { blankDevice, mergeDeviceTemplates } from '@/composables/deviceTemplates';
import { parameterDefinitionsKey, takeParameterDefinitions, type ParameterDefinitionMap } from '@/composables/deviceParameters';
import NodeConfiguration from '@/models/nodeConfiguration';
import type DeviceConfiguration from '@/models/deviceConfiguration';
import type SystemNode from '@/models/systemNode';

const open = defineModel<boolean>('open', { default: false });
const configuration = defineModel<NodeConfiguration>('configuration', { default: () => new NodeConfiguration() });

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

// Typed parameter editors for the devices of an online node (Core 1.16.0); an offline node or an older plugin
// leaves them as free text.
const parameterDefinitions = ref<ParameterDefinitionMap>({});
provide(parameterDefinitionsKey, parameterDefinitions);

/**
 * The node's device templates, with their parameter definitions moved into the editor's map. The map is
 * replaced, not merged, so another node's definitions never apply; a response for a node no longer
 * being edited is ignored.
 */
async function deviceTemplates(): Promise<DeviceConfiguration[]> {
  const id = configuration.value.id!;
  const templates = await nodes.getDeviceTemplates(id);
  const definitions: ParameterDefinitionMap = {};
  takeParameterDefinitions(templates, definitions);
  if (configuration.value.id == id)
    parameterDefinitions.value = definitions;
  return templates;
}

// The dialog is reused for every node: start each one with free text until its templates arrive.
watch(() => [open.value, configuration.value.id], async () => {
  parameterDefinitions.value = {};
  if (open.value && hasNodeId.value)
    await deviceTemplates();
}, { immediate: true });

/** Offers the node's device templates, plus a blank device for one it doesn't list. */
async function newDevice() {
  loadingTemplates.value = true;
  offeredDevices.value = [...await deviceTemplates(), blankDevice()];
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
  const offered = await deviceTemplates();
  mergeDeviceTemplates(device, offered.find(x => x.classFullName == device.classFullName));
}
</script>

<template>
  <v-dialog v-model="open" scrollable width="90%">
    <v-card>
      <v-toolbar color="primary" density="compact" flat>
        <v-toolbar-title class="text-body-medium font-weight-bold">
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
        <v-btn color="error" variant="outlined" @click="open = false">
          <v-icon size="small" icon="mdi-close-circle-outline" />
          cancel
        </v-btn>
        <v-btn :loading="loadingTemplates" :disabled="!hasNodeId" color="success" variant="outlined" @click="newDevice">
          <v-icon size="small" icon="mdi-plus" />
          new device
        </v-btn>
        <v-btn :loading="saving" :disabled="!hasNodeId" color="primary" variant="outlined" @click="emit('save')">
          <v-icon size="small" icon="mdi-content-save-outline" />
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <DeviceTemplatePicker v-model="pickerOpen" :templates="offeredDevices" @add="addDevices" />
</template>
