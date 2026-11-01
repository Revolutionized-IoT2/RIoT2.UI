<script setup lang="ts">
import DeviceConfigurationComponent from '@/components/DeviceConfigurationComponent.vue';
import type DeviceConfiguration from '@/models/deviceConfiguration';
import type DeviceStatus from '@/models/deviceStatus';

const devices = defineModel<DeviceConfiguration[]>({ default: () => [] });

const props = defineProps<{
  statuses: DeviceStatus[] | null
}>();

const emit = defineEmits<{
  reload: [deviceId: string]
}>();

function stateOf(deviceId: string): DeviceStatus | null {
  return props.statuses?.find(x => x.id == deviceId) ?? null;
}

function deleteDevice(deviceId: string) {
  const index = devices.value.findIndex(x => x.id == deviceId);
  if (index != -1)
    devices.value.splice(index, 1);
}
</script>

<template>
  <div v-if="devices.length > 0" class="text-subtitle-1 mb-2 font-weight-bold">Device configurations
    <v-divider class="border-opacity-100 mb-3" color="black" />
  </div>
  <v-expansion-panels class="mt-6">
    <template v-for="(device, i) in devices" :key="i">
      <DeviceConfigurationComponent v-model="devices[i]" :state="stateOf(device.id)" @delete="deleteDevice" @reload="id => emit('reload', id)" />
    </template>
  </v-expansion-panels>
</template>
