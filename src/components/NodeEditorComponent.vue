<script setup lang="ts">
import NodeConfiguration from '@/models/nodeConfiguration';
import { computed, nextTick, onMounted, ref } from 'vue';
import systemNode from '@/models/systemNode';
import { useOrchestrator } from '@/composables/orchestratorService';
import type { PluginFile } from '@/models/rules/pluginFile';
import DeviceConfigurationComponent from '@/components/DeviceConfigurationComponent.vue';

const model = defineModel<NodeConfiguration>({ default: new NodeConfiguration() });
const orchestrator = useOrchestrator();

const props = defineProps<{
  enabled: boolean,
  title: string
}>();

const emit = defineEmits<{
    delete: [number],
}>();

const valid = ref(false);
const nodeIdOptions = ref<systemNode[]>([]);

const newSaved = ref(false);
const validatingUrl = ref(false);
const checkedPluginFile = ref<PluginFile|null>(null);

function deleteDevice(deviceid: string) {
  let idx = model.value.deviceConfigurations.findIndex(x => x.id == deviceid);
  if(idx == -1)
    return;

  model.value.deviceConfigurations.splice(idx, 1);
}

function validatePluginUrl(focused: boolean) {
  if(focused || model.value.pluginPackageUrl == null || model.value.pluginPackageUrl == "")
    return;

  validatingUrl.value = true;

  orchestrator.checkPlugin({
    url: model.value.pluginPackageUrl
    },
    (data: PluginFile | null) => {
      checkedPluginFile.value = data;
    },
    () => {
      validatingUrl.value = false;
    });
}

const isPluginValid = computed(()=> {
  if(checkedPluginFile.value == null || checkedPluginFile.value == undefined)
    return null;

  if(checkedPluginFile.value.name == undefined || checkedPluginFile.value.name == "")
    return false;

  return true;
});

onMounted(() => {
  newSaved.value = model.value.id != null && model.value.id != "";
  if(!newSaved.value) {
    orchestrator.getOnlineNodes((data: systemNode[] | null) => {
      if(data != null) {
        nodeIdOptions.value = data.filter(x => x.name == null || x.name == '');
        /* debugging
        nodeIdOptions.value.push({
          deviceStatuses:[],
          id:"1234-66765-35345-2342",
          isOnline:true,
          manifest: {
            date:"",
            installedPackageFilename:"",
            name:"manifest",
            version:"0.5.5"
          },
          name:"",
          pluginManifest:null
        });*/
      }
    });
  }
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
          :disabled="newSaved"
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
        <template v-slot:selection="{ item, index }">
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

    <div v-if="model?.deviceConfigurations.length > 0" class="text-subtitle-1 mb-2 font-weight-bold">Device configurations
      <v-divider class="border-opacity-100 mb-3" color="black" />
    </div>
    <v-expansion-panels class="mt-6">
      <template v-for="(device, i) in model.deviceConfigurations" :key="i">
        <DeviceConfigurationComponent v-model="model.deviceConfigurations[i]" @delete="deleteDevice" />
      </template>
    </v-expansion-panels>
  </v-container>
</v-form>
</template>

<style scoped>

</style>