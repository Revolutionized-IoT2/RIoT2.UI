<script setup lang="ts">
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useCommandsStore } from '@/stores/commandsStore';

// The outbox (design 7.1 phase 4): messages per status, the oldest one waiting, and the last errors,
// for commands to nodes and workflow triggers to Elsa.
const open = defineModel<boolean>('open', { default: false });

const commands = useCommandsStore();
const { outbox, loading } = storeToRefs(commands);

const statuses = computed(() => Object.entries(outbox.value?.counts ?? {}));
const errorHeaders = [
  { title: 'Updated', value: 'updated' },
  { title: 'Kind', value: 'kind' },
  { title: 'Target', value: 'target' },
  { title: 'Subject', value: 'subject' },
  { title: 'Status', value: 'status' },
  { title: 'Error', value: 'lastError' }
];

function statusColor(status: string): string {
  if (status == 'pending')
    return 'blue';
  if (status == 'failed' || status == 'expired')
    return 'red';
  return 'green';
}

function time(value: string): string {
  return new Date(value).toLocaleString();
}

watch(open, value => {
  if (value)
    commands.loadOutbox();
}, { immediate: true });
</script>

<template>
  <v-dialog v-model="open" max-width="900">
    <v-card>
      <v-toolbar color="primary" density="compact" flat>
        <v-toolbar-title class="text-body-2 font-weight-bold">Delivery queue</v-toolbar-title>
        <v-spacer />
        <v-btn icon="refresh" variant="text" :loading="loading" @click="commands.loadOutbox()" />
      </v-toolbar>
      <v-card-text class="pa-4">
        <div class="text-caption mb-2">Commands to nodes and workflow triggers; delivered messages are kept for 24 hours.</div>
        <div class="mb-4">
          <v-chip v-for="[status, count] in statuses" :key="status" :color="statusColor(status)" class="me-2 mb-1" label size="small">
            {{ status }}: {{ count }}
          </v-chip>
        </div>
        <div v-if="outbox?.oldestPending" class="mb-4">
          Oldest waiting: {{ outbox.oldestPending.kind }} {{ outbox.oldestPending.subject ?? outbox.oldestPending.id }}
          to {{ outbox.oldestPending.target }}, {{ Math.round(outbox.oldestPending.ageSeconds) }} s,
          {{ outbox.oldestPending.attempts }} attempt(s){{ outbox.oldestPending.lastError ? ': ' + outbox.oldestPending.lastError : '' }}
        </div>
        <div v-else class="mb-4">Nothing is waiting.</div>
        <v-data-table :items="outbox?.lastErrors ?? []" :headers="errorHeaders" density="compact" hide-default-footer>
          <template v-slot:top>
            <div class="text-subtitle-2">Last errors</div>
          </template>
          <template v-slot:item.updated="{ item }">{{ time(item.updated) }}</template>
          <template v-slot:no-data>
            <div>no errors</div>
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-actions class="pt-3">
        <v-spacer></v-spacer>
        <v-btn color="primary" class="body-2 font-weight-bold" @click="open = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
