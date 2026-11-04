<script setup lang="ts">
import NodeConfiguration from '@/models/nodeConfiguration';
import { computed, onMounted, provide, ref } from 'vue';
import type SystemNode from '@/models/systemNode';
import type { PluginFile } from '@/models/pluginFile';
import type DeviceStatus from '@/models/deviceStatus';
import DeviceList from '@/components/nodes/DeviceList.vue';
import { useNodesStore } from '@/stores/nodesStore';
import { NodeType } from '@/models/enums';
import { deviceStatusContextKey } from '@/composables/deviceAuthorization';

const model = defineModel<NodeConfiguration>({ default: () => new NodeConfiguration() });
const nodes = useNodesStore();

const props = defineProps<{
  onlineNodes: SystemNode[]
}>();

const emit = defineEmits<{
    reloadDevice: [string]
}>();

const valid = ref(false);
const deviceStatuses = ref<DeviceStatus[] | null>(null);
// The node the statuses were read for: a device's account section signs in on that node only.
const statusNodeId = ref<string | null>(null);

/** Reloads the device statuses quietly (the account section's refresh and poll). */
async function refreshDeviceStatuses() {
  const id = statusNodeId.value;
  if (id == null)
    return;
  const statuses = await nodes.pollDeviceStatuses(id);
  if (statuses != null && statusNodeId.value == id)
    deviceStatuses.value = statuses;
}

provide(deviceStatusContextKey, { nodeId: statusNodeId, refresh: refreshDeviceStatuses });

// Online device nodes without a name have no configuration yet, so their ids can be chosen; connectors,
// workflow engines and dashboards are never configured here.
const nodeIdOptions = computed(() => props.onlineNodes.filter(x =>
  (x.nodeType == null || x.nodeType == NodeType.device || x.nodeType == NodeType.unknown) && (x.name == null || x.name == '')));

const validatingUrl = ref(false);
const checkedPluginFile = ref<PluginFile | null>(null);

async function validatePluginUrl(focused: boolean) {
  if (focused || model.value.pluginPackageUrl == null || model.value.pluginPackageUrl == "")
    return;

  validatingUrl.value = true;
  checkedPluginFile.value = await nodes.checkPlugin(model.value.pluginPackageUrl);
  validatingUrl.value = false;
}

const isPluginValid = computed(() => {
  if (checkedPluginFile.value == null)
    return null;
  return checkedPluginFile.value.name != undefined && checkedPluginFile.value.name != "";
});

onMounted(async () => {
  if (model.value.id != null) {
    statusNodeId.value = model.value.id;
    deviceStatuses.value = await nodes.getDeviceStatuses(model.value.id);
  }
});
</script>

<template>
  <v-form v-model="valid">
  <v-container>
    <div class="text-body-large mb-2 font-weight-bold">Node settings
      <v-divider class="border-opacity-100 mb-6" color="black" />
    </div>
    <v-row>
      <v-col cols="4">
        <v-text-field v-model="model.name" required hide-details density="compact"
          label="Node Name" />
      </v-col>
      <v-col cols="4">
        <v-combobox
          density="compact"
          required
          :return-object="false"
          item-value="id"
          item-title="id"
          v-model="model.id"
          :items="nodeIdOptions"
          label="Node Id"
        >
        <template v-slot:selection="{ internalItem }">
        <v-chip
          size="small"
          variant="flat"
          label
          color="secondary"
        >
        {{ internalItem.value }}
      </v-chip>
      </template>

      <template v-slot:item="{ props, item }">
         <v-list-item v-bind="props" title="">
          <v-chip
            color="secondary"
            variant="flat"
            label
          >{{ item.manifest != null?item.manifest.name +" ("+item.id+")" : item.id }}</v-chip>
        </v-list-item>
      </template>
      </v-combobox>
      </v-col>
  
      <v-col cols="4">
        <v-text-field v-model="model.pluginPackageUrl" hide-details density="compact"
          :append-inner-icon="(isPluginValid != null)?isPluginValid?'check':'error' : ''"
          label="Plugin package Url" @update:focused="validatePluginUrl"> 
        <template v-slot:loader>
          <v-progress-linear
            :active="validatingUrl"
            color="secondary"
            model-value="progress"
            height="5"
            indeterminate
          ></v-progress-linear>
      </template>
        </v-text-field>
      </v-col>
    </v-row>

    <DeviceList v-model="model.deviceConfigurations" :statuses="deviceStatuses" @reload="id => emit('reloadDevice', id)" />
  </v-container>
</v-form>
</template>

<style scoped>

</style>