<script setup lang="ts">
import { deviceStateLook } from '@/composables/deviceState';
import type DeviceStatus from '@/models/deviceStatus';

const open = defineModel<boolean>({ default: false });

defineProps<{
  statuses: DeviceStatus[]
}>();

const headers = [
  { title: 'Name', value: 'name' },
  { title: 'State', value: 'state' },
  { title: 'Message', value: 'message' }
];
</script>

<template>
  <v-dialog v-model="open" width="80%" scrollable>
    <v-card prepend-icon="checklist" title="Device Statuses">
      <v-divider class="mt-3"></v-divider>
      <v-card-text class="px-4" style="height: 300px;">
        <v-data-table hide-default-footer density="compact" :items="statuses" :headers="headers">
          <template v-slot:header.name>
            <div class="font-weight-bold">Name</div>
          </template>
          <template v-slot:header.state>
            <div class="text-center font-weight-bold">State</div>
          </template>
          <template v-slot:header.message>
            <div class="font-weight-bold">Message</div>
          </template>
          <template v-slot:item.state="{ item }">
            <div class="text-center">
              <v-icon :color="deviceStateLook(item.state).color">{{ deviceStateLook(item.state).icon }}</v-icon>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-btn text="Close" @click="open = false"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
