<script setup lang="ts">
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import type Dashboard from '@/models/dashboard';
import { useTemplatesStore } from '@/stores/templatesStore';
import { exportDashboard, importDashboard, type ImportResult } from '../sdk/model';

/**
 * Exports the dashboard as a JSON file, or imports one: in place of this dashboard or as extra
 * pages. Templates are bound again by id, else by node, device and name; the rest are listed.
 */
const props = defineProps<{ dashboard: Dashboard | null }>();
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ import: [Dashboard, 'replace' | 'append'] }>();

const { reportTemplates, commandTemplates, variableTemplates } = storeToRefs(useTemplatesStore());
const file = ref<File | File[] | null>(null);
const result = ref<ImportResult>();
const problem = ref<string>();
const mode = ref<'replace' | 'append'>('append');

watch(open, isOpen => {
  if (isOpen) {
    file.value = null;
    result.value = undefined;
    problem.value = undefined;
  }
});

function download() {
  if (props.dashboard == null)
    return;
  const blob = new Blob([exportDashboard(props.dashboard)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `riot2-dashboard-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

watch(file, async selected => {
  const chosen = Array.isArray(selected) ? selected[0] : selected;
  result.value = undefined;
  problem.value = undefined;
  if (chosen == null)
    return;
  try {
    result.value = importDashboard(await chosen.text(), {
      reports: [...reportTemplates.value, ...variableTemplates.value],
      commands: [...commandTemplates.value, ...variableTemplates.value],
    });
  } catch (error) {
    problem.value = error instanceof Error ? error.message : String(error);
  }
});

function apply() {
  if (result.value == null)
    return;
  emit('import', result.value.dashboard, mode.value);
  open.value = false;
}
</script>

<template>
  <v-dialog v-model="open" max-width="600" scrollable>
    <v-card title="Import and export" prepend-icon="mdi-swap-vertical" rounded="xl">
      <v-card-text class="d-flex flex-column ga-4">
        <section>
          <div class="font-weight-medium mb-1">Export</div>
          <div class="text-body-medium text-medium-emphasis mb-2">Saves the pages and cards as a file, to keep or to use on another RIoT2.</div>
          <v-btn class="text-none" variant="tonal" prepend-icon="mdi-download" :disabled="!dashboard" @click="download">Download dashboard</v-btn>
        </section>
        <v-divider />
        <section class="d-flex flex-column ga-3">
          <div>
            <div class="font-weight-medium mb-1">Import</div>
            <div class="text-body-medium text-medium-emphasis">Nothing changes until you save the dashboard.</div>
          </div>
          <v-file-input v-model="file" accept=".json,application/json" label="Dashboard file" prepend-icon="" prepend-inner-icon="mdi-file-upload-outline" show-size :error-messages="problem" />
          <template v-if="result">
            <v-alert :type="result.unresolved.length ? 'warning' : 'success'" density="compact">
              {{ result.pages }} pages with {{ result.cards }} cards.
              <template v-if="result.unresolved.length">
                {{ result.unresolved.length }} devices aren't on this system; their cards stay unconnected until you edit them:
                <ul class="mt-1 ml-4"><li v-for="name in result.unresolved.slice(0, 8)" :key="name">{{ name }}</li></ul>
                <span v-if="result.unresolved.length > 8">and {{ result.unresolved.length - 8 }} more.</span>
              </template>
            </v-alert>
            <v-radio-group v-model="mode" hide-details>
              <v-radio value="append" label="Add its pages to this dashboard" />
              <v-radio value="replace" label="Replace this dashboard" />
            </v-radio-group>
          </template>
        </section>
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn class="text-none" variant="text" @click="open = false">Close</v-btn>
        <v-btn class="text-none" color="primary" variant="flat" :disabled="!result" prepend-icon="mdi-upload" @click="apply">Import</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
