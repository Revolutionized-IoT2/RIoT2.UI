<script setup lang="ts">
import { computed } from 'vue';
import type { OutboxSummary } from '@/models/commandDelivery';

// The outbox (design 7.1 phase 4): messages per status, the oldest one waiting, and the last errors,
// for commands to nodes and workflow triggers to Elsa. Shown by the delivery queue dialog and the System page.
const props = defineProps<{ outbox: OutboxSummary | null }>();

const statuses = computed(() => Object.entries(props.outbox?.counts ?? {}));
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
</script>

<template>
  <div>
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
  </div>
</template>
