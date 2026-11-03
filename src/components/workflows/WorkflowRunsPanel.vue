<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useWorkflowsStore } from '@/stores/workflowsStore';
import type { WorkflowRunDetails, WorkflowRunSummary } from '@/models/workflow';

// A workflow's runs (or every workflow's), newest first, each with the activities it executed (after Dls's runs tab).
const props = defineProps<{ definitionId: string | null }>();

const workflows = useWorkflowsStore();
const pageSize = 20;
const runs = ref<WorkflowRunSummary[]>([]);
const total = ref(0);
const page = ref(1);
const status = ref<string | null>(null);
const opened = ref<string[]>([]);
const details = ref<Record<string, WorkflowRunDetails | null>>({});
const statuses = ['Running', 'Finished', 'Suspended', 'Faulted', 'Cancelled'];

async function load() {
  const result = await workflows.runs(props.definitionId, status.value, page.value - 1, pageSize);
  runs.value = result?.items ?? [];
  total.value = result?.totalCount ?? 0;
}

onMounted(load);
watch([page, status, () => props.definitionId], load);
watch(opened, async ids => {
  for (const id of ids.filter(x => !(x in details.value)))
    details.value = { ...details.value, [id]: await workflows.runDetails(id) };
});

async function cancel(run: WorkflowRunSummary) {
  if (await workflows.cancelRun(run.id)) {
    delete details.value[run.id];
    setTimeout(load, 500);
  }
}

function color(run: WorkflowRunSummary): string {
  return { Faulted: 'error', Cancelled: 'secondary', Suspended: 'info', Finished: 'success' }[run.subStatus] ?? 'primary';
}

const time = (value: string | null) => value ? new Date(value).toLocaleString() : '';
</script>

<template>
  <v-card color="surface-container-low" variant="flat">
    <v-card-item prepend-icon="mdi-history" title="Runs" :subtitle="`${total} run(s); finished runs are kept for 24 hours`">
      <template #append>
        <div class="d-flex ga-2 align-center">
          <v-select v-model="status" :items="statuses" placeholder="Every status" clearable density="compact" hide-details style="width: 180px" />
          <v-btn icon="mdi-refresh" variant="text" aria-label="Refresh runs" @click="load" />
        </div>
      </template>
    </v-card-item>
    <v-card-text>
      <v-expansion-panels v-model="opened" multiple variant="accordion">
        <v-expansion-panel v-for="run in runs" :key="run.id" :value="run.id">
          <v-expansion-panel-title>
            <div class="d-flex align-center ga-3 flex-wrap w-100">
              <v-chip :color="color(run)" size="small" variant="tonal" label>{{ run.subStatus }}</v-chip>
              <span class="text-body-medium">{{ time(run.createdAt) }}</span>
              <span v-if="!definitionId" class="text-body-medium text-medium-emphasis">{{ run.name ?? run.definitionId }}</span>
              <span class="text-body-small text-medium-emphasis">v{{ run.version }}</span>
              <v-chip v-if="run.incidentCount" color="error" size="x-small" prepend-icon="mdi-alert-outline">{{ run.incidentCount }}</v-chip>
              <v-spacer />
              <v-btn v-if="run.status === 'Running'" size="small" variant="text" color="error" prepend-icon="mdi-stop-circle-outline"
                     @click.stop="cancel(run)">Cancel</v-btn>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-progress-linear v-if="details[run.id] === undefined" indeterminate color="primary" />
            <template v-else-if="details[run.id]">
              <v-alert v-for="incident in details[run.id]!.incidents" :key="incident" type="error" density="compact" class="mb-2" :text="incident" />
              <v-table density="compact">
                <thead><tr><th>Activity</th><th>Status</th><th>Outcomes</th><th>Started</th><th>Completed</th></tr></thead>
                <tbody>
                  <tr v-for="(activity, index) in details[run.id]!.activities" :key="index">
                    <td>{{ activity.activityName ?? activity.activityId }} <span class="text-body-small text-medium-emphasis">{{ activity.activityType }}</span>
                      <div v-if="activity.error" class="text-error text-body-small">{{ activity.error }}</div></td>
                    <td>{{ activity.status }}<v-icon v-if="activity.hasBookmarks" icon="mdi-pause-circle-outline" size="14" class="ml-1" title="Waiting" /></td>
                    <td>{{ activity.outcomes.join(', ') }}</td>
                    <td>{{ time(activity.startedAt) }}</td>
                    <td>{{ time(activity.completedAt) }}</td>
                  </tr>
                </tbody>
              </v-table>
            </template>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      <div v-if="!runs.length" class="text-body-medium text-medium-emphasis pa-4 text-center">No runs.</div>
      <v-pagination v-if="total > pageSize" v-model="page" :length="Math.ceil(total / pageSize)" density="compact" class="mt-2" />
    </v-card-text>
  </v-card>
</template>
