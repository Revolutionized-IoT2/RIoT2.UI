<script setup lang="ts">
import { ref, watch } from 'vue';
import type DeviceConfiguration from '@/models/deviceConfiguration';

const open = defineModel<boolean>({ default: false });

const props = defineProps<{
  templates: DeviceConfiguration[]
}>();

const emit = defineEmits<{
  add: [devices: DeviceConfiguration[]]
}>();

const headers = [
  { title: 'Id', value: 'id' },
  { title: 'Name', value: 'name' },
  { title: 'Class name', value: 'classFullName' }
];

const selected = ref<DeviceConfiguration[]>([]);

// Every opening starts without a selection.
watch(open, isOpen => { if (isOpen) selected.value = []; });

function add() {
  emit('add', selected.value);
  open.value = false;
}
</script>

<template>
  <v-dialog v-model="open" scrollable width="80%">
    <v-card>
      <v-toolbar color="primary" density="compact" flat>
        <v-toolbar-title class="text-body-medium font-weight-bold">
          Select device template
        </v-toolbar-title>
      </v-toolbar>
      <v-divider></v-divider>
      <v-card-text style="height: 90%;">
        <v-data-table :headers="headers" v-model="selected" :items="props.templates" return-object show-select></v-data-table>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn color="error" variant="outlined" @click="open = false">
          <v-icon size="small" icon="mdi-close-circle-outline" />
          cancel
        </v-btn>
        <v-btn :disabled="selected.length < 1" rounded="0" color="success" variant="outlined" @click="add">
          <v-icon size="small" icon="mdi-plus" />
          add
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
