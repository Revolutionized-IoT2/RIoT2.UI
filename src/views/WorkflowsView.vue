<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useWorkflowsStore } from '@/stores/workflowsStore';
import type { WorkflowModel, WorkflowSummary } from '@/models/workflow';
import WorkflowRunsPanel from '@/components/workflows/WorkflowRunsPanel.vue';

// The workflows (ADR 0016): where they run, each workflow with its latest and published versions, and making,
// importing (an Elsa export or a RIoT2.Elsa template), exporting and deleting them.
const store = useWorkflowsStore();
const router = useRouter();
const tab = ref<'workflows' | 'runs'>('workflows');
const search = ref('');
const importing = ref(false);
const importFile = ref<File | File[] | null>(null);
const publishImport = ref(false);
const importErrors = ref<string[]>([]);
const deleting = ref<WorkflowSummary | null>(null);

onMounted(() => store.load());

const shown = computed(() => {
  const text = search.value.trim().toLowerCase();
  return text ? store.workflows.filter(x => `${x.name ?? ''} ${x.description ?? ''} ${x.definitionId}`.toLowerCase().includes(text)) : store.workflows;
});
const statusText = computed(() => {
  const status = store.status;
  if (!status)
    return 'Workflow engine';
  const where = status.mode === 'embedded' ? 'in the orchestrator' : `on ${status.host ?? 'the workflow host'}`;
  return `${status.engine} runs ${where}${status.available ? '' : ' — unavailable'}`;
});

async function importWorkflow() {
  const file = Array.isArray(importFile.value) ? importFile.value[0] : importFile.value;
  if (!file)
    return;
  importErrors.value = [];
  let model: WorkflowModel;
  try {
    model = JSON.parse(await file.text()) as WorkflowModel;
  } catch {
    importErrors.value = ['The file is not JSON.'];
    return;
  }
  const result = await store.importModel(model, publishImport.value);
  if (result?.succeeded && result.workflow) {
    importing.value = false;
    await router.push(`/workflows/${encodeURIComponent(result.workflow.definitionId)}`);
  } else if (result) {
    importErrors.value = result.errors;
  }
}

async function exportWorkflow(workflow: WorkflowSummary) {
  const exported = await store.exportModel(workflow.definitionId);
  if (!exported)
    return;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(exported.model, null, 2)], { type: 'application/json' }));
  link.download = exported.fileName || `${workflow.definitionId}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function confirmDelete() {
  if (deleting.value)
    await store.remove(deleting.value.definitionId);
  deleting.value = null;
}

const time = (value: string) => new Date(value).toLocaleString();
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center ga-3 mb-4">
      <div>
        <div class="text-headline-small font-weight-medium">Workflows</div>
        <div class="text-body-medium text-medium-emphasis d-flex align-center ga-1">
          <v-icon :icon="store.status?.available === false ? 'mdi-alert-circle-outline' : 'mdi-check-circle-outline'"
                  :color="store.status?.available === false ? 'error' : 'success'" size="16" />{{ statusText }}
        </div>
      </div>
      <v-spacer />
      <v-btn-toggle v-model="tab" mandatory density="compact" variant="outlined" divided color="primary">
        <v-btn value="workflows" prepend-icon="mdi-sitemap-outline">Workflows</v-btn>
        <v-btn value="runs" prepend-icon="mdi-history">Runs</v-btn>
      </v-btn-toggle>
      <v-btn variant="tonal" prepend-icon="mdi-file-import-outline" @click="importing = true; importErrors = []">Import</v-btn>
      <v-btn color="primary" prepend-icon="mdi-plus" to="/workflows/new">New workflow</v-btn>
    </div>

    <v-card v-if="tab === 'workflows'" color="surface-container-low" variant="flat">
      <v-card-text>
        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Search workflows" density="compact" hide-details clearable class="mb-3" style="max-width: 420px" />
        <v-progress-linear v-if="store.loading" indeterminate color="primary" class="mb-2" />
        <v-list bg-color="transparent" lines="two">
          <v-list-item v-for="workflow in shown" :key="workflow.definitionId" :to="`/workflows/${encodeURIComponent(workflow.definitionId)}`" rounded="lg"
                       prepend-icon="mdi-sitemap-outline" :title="workflow.name ?? workflow.definitionId"
                       :subtitle="workflow.description || `Changed ${time(workflow.updatedAt)}`">
            <template #append>
              <v-chip :color="workflow.publishedVersion ? 'success' : 'secondary'" size="small" variant="tonal" class="mr-2">
                {{ workflow.publishedVersion ? `v${workflow.publishedVersion} published` : 'Not published' }}
              </v-chip>
              <v-chip v-if="workflow.latestVersion !== workflow.publishedVersion" size="small" variant="outlined" class="mr-2">Draft v{{ workflow.latestVersion }}</v-chip>
              <v-btn icon="mdi-download-outline" variant="text" size="small" aria-label="Export" @click.prevent.stop="exportWorkflow(workflow)" />
              <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" aria-label="Delete" :disabled="workflow.isReadonly"
                     @click.prevent.stop="deleting = workflow" />
            </template>
          </v-list-item>
        </v-list>
        <div v-if="!shown.length && !store.loading" class="text-body-medium text-medium-emphasis pa-6 text-center">
          No workflows yet. Make one, or import a template from RIoT2.Elsa's templates folder.
        </div>
      </v-card-text>
    </v-card>
    <WorkflowRunsPanel v-else :definition-id="null" />

    <v-dialog v-model="importing" max-width="520">
      <v-card title="Import a workflow" subtitle="An Elsa export or a template (JSON)">
        <v-card-text>
          <v-file-input v-model="importFile" accept=".json,application/json" label="Workflow file" prepend-icon="" prepend-inner-icon="mdi-paperclip" />
          <v-switch v-model="publishImport" color="primary" label="Publish it" density="compact" hide-details />
          <v-alert v-for="message in importErrors" :key="message" type="error" density="compact" class="mt-2" :text="message" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="importing = false">Cancel</v-btn>
          <v-btn color="primary" :disabled="!importFile" :loading="store.loading" @click="importWorkflow">Import</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog :model-value="deleting !== null" max-width="440" @update:model-value="!$event && (deleting = null)">
      <v-card :title="`Delete ${deleting?.name ?? deleting?.definitionId}?`" text="Every version is deleted and its triggers stop. Runs in progress continue.">
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleting = null">Cancel</v-btn>
          <v-btn color="error" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
