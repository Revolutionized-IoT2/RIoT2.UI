<script setup lang="ts">
import { computed } from 'vue';
import { DeviceState } from '@/models/enums';
import DeviceConfiguration from '@/models/deviceConfiguration';
import type DeviceStatus from '@/models/deviceStatus';
import DeviceParametersForm from '@/components/devices/DeviceParametersForm.vue';
import ReportTemplateTable from '@/components/devices/ReportTemplateTable.vue';
import CommandTemplateTable from '@/components/devices/CommandTemplateTable.vue';

/** One device of a node configuration: its parameters and its report and command templates. */
const model = defineModel<DeviceConfiguration>({ default: new DeviceConfiguration() });

const props = defineProps<{
  state: DeviceStatus | null,
}>();

const emit = defineEmits<{
  delete: [deviceId: string],
  reload: [deviceId: string]
}>();

// A device the node hasn't reported yet is new.
const titleState = computed(() => props.state == null ? "[new]" : "[" + DeviceState[props.state.state] + "]");
</script>

<template>
  <v-expansion-panel>
    <v-expansion-panel-title color="info" class="font-weight-bold">{{ model.name }} {{ titleState }}
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <DeviceParametersForm v-model="model" :state="props.state" @reload="id => emit('reload', id)" />
      <ReportTemplateTable v-model="model" />
      <CommandTemplateTable v-model="model" />
      <v-spacer />
      <v-btn size="small" class="mt-4" rounded="0" color="error" variant="outlined" @click="emit('delete', model.id)">
        <v-icon>delete</v-icon>
        delete {{ model.name }}
      </v-btn>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>
