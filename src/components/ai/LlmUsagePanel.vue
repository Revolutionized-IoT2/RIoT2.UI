<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useLlmStore } from '@/stores/llmStore';

// What the Run LLM steps used: per connection, per day, and the latest steps with where they ran.
const store = useLlmStore();
const days = ref(30);

onMounted(() => store.loadUsage(days.value));
watch(days, value => store.loadUsage(value));

const time = (value: string) => new Date(value).toLocaleString();
const tokens = (value: number) => value.toLocaleString();
</script>

<template>
  <v-card color="surface-container-low" variant="flat">
    <v-card-item prepend-icon="mdi-chart-bar" title="Usage" subtitle="Tokens of the Run LLM steps; records are kept 90 days">
      <template #append>
        <v-select v-model="days" :items="[1, 7, 30, 90].map(x => ({ title: `${x} day${x > 1 ? 's' : ''}`, value: x }))" density="compact" hide-details style="width: 140px" />
      </template>
    </v-card-item>
    <v-card-text v-if="store.usage">
      <v-row>
        <v-col v-for="total in store.usage.connections" :key="total.key" cols="12" sm="6" md="4">
          <v-card variant="outlined">
            <v-card-item :title="total.connection" :subtitle="`${total.runs} step(s), ${total.failures} failed`" />
            <v-card-text class="text-body-medium">In {{ tokens(total.inputTokens) }} · out {{ tokens(total.outputTokens) }} tokens</v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <div v-if="!store.usage.connections.length" class="text-body-medium text-medium-emphasis pa-4 text-center">No Run LLM steps in this period.</div>
      <v-table v-else density="compact" class="mt-4 bg-transparent">
        <thead><tr><th>When</th><th>Connection</th><th>Workflow</th><th>Result</th><th>Tokens</th><th>Tools</th><th>Commands</th><th>Time</th></tr></thead>
        <tbody>
          <tr v-for="(record, index) in store.usage.recent" :key="index">
            <td>{{ time(record.at) }}</td>
            <td>{{ record.connection }} <span class="text-body-small text-medium-emphasis">{{ record.model }}</span></td>
            <td><router-link v-if="record.workflowDefinitionId" :to="`/workflows/${encodeURIComponent(record.workflowDefinitionId)}`">{{ record.workflowDefinitionId }}</router-link>
              <span v-if="record.activityId" class="text-body-small text-medium-emphasis"> · {{ record.activityId }}</span></td>
            <td><v-chip :color="record.succeeded ? 'success' : 'error'" size="x-small" variant="tonal" label>{{ record.succeeded ? 'Done' : record.errorCode }}</v-chip></td>
            <td>{{ tokens(record.inputTokens + record.outputTokens) }}</td>
            <td>{{ record.toolCalls }}</td>
            <td>{{ record.commands }}</td>
            <td>{{ (record.durationMs / 1000).toFixed(1) }} s</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>
