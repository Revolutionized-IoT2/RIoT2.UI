<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import PageHeader from '@/components/PageHeader.vue';
import RelativeTime from '@/components/RelativeTime.vue';
import PlanSteps from '@/components/plans/PlanSteps.vue';
import { usePlansStore } from '@/stores/plansStore';
import { useTemplatesStore } from '@/stores/templatesStore';
import type { CommandPlan, CommandPlanStatus } from '@/models/commandPlan';

// Command plans (ADR 0019): schedules of a command's future values that workflows, Run LLM steps or AI assistants
// made, and that the orchestrator carries out; and the forecasts it keeps for them.
const store = usePlansStore();
const templates = useTemplatesStore();
const confirming = ref<CommandPlan | null>(null);
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(async () => {
  await store.load();
  if (!templates.commandTemplates.length)
    await templates.load();
  timer = setInterval(() => void store.load(), 30000);
});
onUnmounted(() => clearInterval(timer));
watch(() => store.activeOnly, () => void store.load());

const commandName = (id: string) => {
  const template = templates.commandTemplates.find(t => t.id === id);
  return template ? [template.node, template.device, template.name].filter(Boolean).join(' · ') : id;
};

const statusColors: Record<CommandPlanStatus, string> = { active: 'primary', completed: 'success', cancelled: 'grey', replaced: 'grey' };
const sorted = computed(() => [...store.plans].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
const span = (from?: string | null, to?: string | null) => from && to
  ? `${new Date(from).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })} – ${new Date(to).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}`
  : '';

async function cancel() {
  const plan = confirming.value;
  confirming.value = null;
  if (plan)
    await store.cancel(plan.id);
}
</script>

<template>
  <div>
    <PageHeader title="Plans" icon="mdi-calendar-clock" subtitle="Commands planned ahead by workflows, language models and AI assistants, and the forecasts they use.">
      <v-switch v-model="store.activeOnly" label="Active only" color="primary" density="compact" hide-details inset class="mr-2" />
      <v-btn variant="tonal" prepend-icon="mdi-refresh" :loading="store.loading" @click="store.load()">Refresh</v-btn>
    </PageHeader>

    <v-alert v-if="!store.loading && sorted.length === 0" type="info" variant="tonal" class="mb-4"
      text="No plans. A workflow's RIoT Command Plan step, Run LLM's PlanCommands tool or an AI assistant's plan_command makes one." />

    <div class="plans">
      <v-card v-for="plan in sorted" :key="plan.id" class="plan" variant="outlined" rounded="xl">
        <v-card-item>
          <v-card-title>{{ plan.name || commandName(plan.commandId) }}</v-card-title>
          <v-card-subtitle>
            {{ plan.name ? commandName(plan.commandId) + ' · ' : '' }}{{ plan.source || 'unknown source' }} · <RelativeTime :time="Date.parse(plan.createdAt)" />
          </v-card-subtitle>
          <template #append>
            <v-chip size="small" variant="tonal" :color="statusColors[plan.status]">{{ plan.status }}</v-chip>
          </template>
        </v-card-item>
        <v-card-text>
          <div v-if="plan.next" class="text-body-medium mb-2">Next step <RelativeTime :time="Date.parse(plan.next)" /></div>
          <PlanSteps :steps="plan.steps" />
        </v-card-text>
        <v-card-actions v-if="plan.status === 'active'">
          <v-spacer />
          <v-btn color="error" variant="text" prepend-icon="mdi-cancel" @click="confirming = plan">End plan</v-btn>
        </v-card-actions>
      </v-card>
    </div>

    <h2 class="text-title-large mt-8 mb-3">Forecasts</h2>
    <v-table v-if="store.forecasts.length" density="comfortable" class="forecasts">
      <thead>
        <tr><th>Report</th><th>Kind</th><th>Covers</th><th>Points</th><th>Issued</th></tr>
      </thead>
      <tbody>
        <tr v-for="forecast in store.forecasts" :key="forecast.id">
          <td>{{ [forecast.node, forecast.device, forecast.name].filter(Boolean).join(' · ') || forecast.id }}</td>
          <td>{{ forecast.kind }}{{ forecast.unit ? ` (${forecast.unit})` : '' }}</td>
          <td>{{ span(forecast.from, forecast.to) }}</td>
          <td>{{ forecast.points }}</td>
          <td><RelativeTime :time="Date.parse(forecast.issuedAt)" /></td>
        </tr>
      </tbody>
    </v-table>
    <p v-else class="text-body-medium text-medium-emphasis">No forecasts yet. Add a Weather Forecast device, or the prices report of an Electricity Price device.</p>

    <v-dialog :model-value="confirming != null" max-width="420" @update:model-value="confirming = null">
      <v-card :title="`End ${confirming?.name || 'this plan'}?`" text="Its waiting steps aren't sent. The command keeps its current value.">
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirming = null">Keep</v-btn>
          <v-btn color="error" variant="tonal" @click="cancel">End plan</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.plans {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 380px), 1fr));
  gap: 16px;
}
</style>
