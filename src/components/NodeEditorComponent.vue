<script setup lang="ts">
import NodeConfiguration from '@/models/nodeConfiguration';
import { computed, onMounted, ref } from 'vue';
import type SystemNode from '@/models/systemNode';
import type { PluginFile } from '@/models/pluginFile';
import type DeviceStatus from '@/models/deviceStatus';
import DeviceList from '@/components/nodes/DeviceList.vue';
import { useNodesStore } from '@/stores/nodesStore';

const model = defineModel<NodeConfiguration>({ default: new NodeConfiguration() });
const nodes = useNodesStore();

const props = defineProps<{
  onlineNodes: SystemNode[]
}>();

const emit = defineEmits<{
    reloadDevice: [string]
}>();

const valid = ref(false);
const deviceStatuses = ref<DeviceStatus[] | null>(null);

// Online nodes without a name have no configuration yet, so their ids can be chosen.
const nodeIdOptions = computed(() => props.onlineNodes.filter(x => x.name == null || x.name == ''));

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
  if (model.value.id != null)
    deviceStatuses.value = await nodes.getDeviceStatuses(model.value.id);
});
</script>

<template>
  <v-form v-model="valid">
  <v-container>
    <div class="text-subtitle-1 mb-2 font-weight-bold">Node settings
      <v-divider class="border-opacity-100 mb-6" color="black" />
    </div>
    <v-row>
      <v-col cols="4">
        <v-text-field v-model="model.name" required hide-details variant="solo" dense
          label="Node Name" />
      </v-col>
      <v-col cols="4">
        <v-combobox
          dense
          required
          variant="solo"
          :return-object="false"
          item-value="id"
          item-title="id"
          v-model="model.id"
          :items="nodeIdOptions"
          label="Node Id"
        >
        <template v-slot:selection="{ item }">
        <v-chip
          size="small"
          variant="flat"
          label
          color="secondary"
        >
        {{ item.value }}
      </v-chip>
      </template>

      <template v-slot:item="{ props, item }">
         <v-list-item @click="props.onClick as MouseEventInit">
          <v-chip
            color="secondary"
            variant="flat"
            label
          >{{ item.raw.manifest != null?item.raw.manifest.name +" ("+item.raw.id+")" : item.raw.id }}</v-chip>
        </v-list-item>
      </template>
      </v-combobox>
      </v-col>
  
      <v-col cols="4">
        <v-text-field v-model="model.pluginPackageUrl" hide-details variant="solo" dense
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