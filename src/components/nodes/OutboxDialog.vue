<script setup lang="ts">
import { watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useCommandsStore } from '@/stores/commandsStore';
import OutboxSummaryPanel from '@/components/system/OutboxSummaryPanel.vue';

// The outbox (design 7.1 phase 4) in a dialog on the Configure page; the System page shows it too.
const open = defineModel<boolean>('open', { default: false });

const commands = useCommandsStore();
const { outbox, loading } = storeToRefs(commands);

watch(open, value => {
  if (value)
    commands.loadOutbox();
}, { immediate: true });
</script>

<template>
  <v-dialog v-model="open" max-width="900">
    <v-card>
      <v-toolbar color="primary" density="compact" flat>
        <v-toolbar-title class="text-body-medium font-weight-bold">Delivery queue</v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-refresh" variant="text" :loading="loading" @click="commands.loadOutbox()" />
      </v-toolbar>
      <v-card-text class="pa-4">
        <OutboxSummaryPanel :outbox="outbox" />
      </v-card-text>
      <v-card-actions class="pt-3">
        <v-spacer></v-spacer>
        <v-btn color="primary" class="body-2 font-weight-bold" @click="open = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
