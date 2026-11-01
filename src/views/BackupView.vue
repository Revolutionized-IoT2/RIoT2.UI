<script setup lang="ts">

import { backupFileName, useBackupApi } from '@/composables/api/backupApi';
import { BackupSummary, RestoreResult } from '@/models/backup';
import { computed, onMounted, ref } from 'vue';

const backupApi = useBackupApi();

const summary = ref<BackupSummary>(new BackupSummary());
const loading = ref(false);
const creating = ref(false);
const restoring = ref(false);
const restored = ref<RestoreResult | null>(null);

// The restore waiting for confirmation: a chosen file, or the name of a saved backup.
const pendingFile = ref<File | null>(null);
const pendingName = ref<string | null>(null);
const confirmDialog = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const headers: any[] = [
  { title: 'Backup', key: 'name', align: 'left', sortable: true },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Size', key: 'sizeBytes', sortable: true },
  { title: '', key: 'actions', align: 'end', sortable: false },
];

const pendingLabel = computed(() => pendingFile.value?.name ?? pendingName.value ?? '');

function formatTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : '-';
}

function formatSize(bytes: number): string {
  return bytes < 1024 ? bytes + ' B' : (bytes / 1024).toFixed(1) + ' kB';
}

function loadSummary() {
  loading.value = true;
  backupApi.getSummary((data: BackupSummary | null) => {
    if (data != null)
      summary.value = data;
  }, () => {
    loading.value = false;
  });
}

function createBackup() {
  creating.value = true;
  backupApi.createBackup((data: Blob | null) => {
    if (data == null)
      return;
    const href = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = href;
    link.download = backupFileName(new Date());
    link.click();
    // Revoked later: some browsers start the download only after click() returns.
    setTimeout(() => URL.revokeObjectURL(href), 10000);
  }, () => {
    creating.value = false;
  });
}

function chooseFile() {
  fileInput.value?.click();
}

function fileChosen(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  // Cleared, so choosing the same file again fires the event again.
  input.value = '';
  if (file == null)
    return;
  pendingFile.value = file;
  pendingName.value = null;
  confirmDialog.value = true;
}

function chooseSaved(name: string) {
  pendingFile.value = null;
  pendingName.value = name;
  confirmDialog.value = true;
}

function cancelRestore() {
  confirmDialog.value = false;
  pendingFile.value = null;
  pendingName.value = null;
}

function restore() {
  confirmDialog.value = false;
  restoring.value = true;
  restored.value = null;
  const done = (data: RestoreResult | null) => {
    restored.value = data;
  };
  const completed = () => {
    restoring.value = false;
    pendingFile.value = null;
    pendingName.value = null;
    loadSummary();
  };
  if (pendingFile.value != null)
    backupApi.restore(pendingFile.value, done, completed);
  else if (pendingName.value != null)
    backupApi.restoreSaved(pendingName.value, done, completed);
  else
    completed();
}

onMounted(() => {
  loadSummary();
});
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="elevation-1">
          <v-card-title>
            <span class="headline">Configuration backup</span>
          </v-card-title>
          <v-card-subtitle>
            Node configurations, dashboards, variables and the Matter pairing, in one zip.
          </v-card-subtitle>
          <v-card-text>
            <v-alert type="warning" density="compact" class="mb-4">
              A backup contains device credentials and the Matter keys. Store it like a password.
            </v-alert>
            Restoring replaces the whole configuration. The current configuration is saved on the
            orchestrator first, so a restore can be undone from the list below. Workflows (Elsa) and
            InfluxDB data are not included; the host backup script covers them.
            <v-alert v-if="restored" type="success" density="compact" class="mt-4" closable @click:close="restored = null">
              Restored the {{ restored.kind }} backup of {{ formatTime(restored.createdAt) }}:
              {{ restored.nodes }} node(s), {{ restored.variables }} variable(s),
              {{ restored.matterCredentials }} Matter file(s). The replaced configuration is
              {{ restored.safetyBackup }}.
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue" variant="text" prepend-icon="download" :loading="creating" @click="createBackup">
              Download backup
            </v-btn>
            <v-btn color="red" variant="text" prepend-icon="restore" :loading="restoring" @click="chooseFile">
              Restore from file
            </v-btn>
            <input ref="fileInput" type="file" accept=".zip,application/zip" hidden @change="fileChosen" />
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="elevation-1">
          <v-card-title>
            <span class="headline">Scheduled backups</span>
          </v-card-title>
          <v-card-text>
            <div v-if="summary.schedule">
              <div>Schedule: <code>{{ summary.schedule }}</code> (RIOT2_BACKUP_SCHEDULE)</div>
              <div>Next backup: {{ formatTime(summary.nextRunAt) }}</div>
              <div>Backups kept: {{ summary.retention }}</div>
              <div v-if="summary.lastRun">
                Last backup: {{ formatTime(summary.lastRun.at) }}
                <span v-if="summary.lastRun.error" class="text-red">failed: {{ summary.lastRun.error }}</span>
                <span v-else>({{ summary.lastRun.name }})</span>
              </div>
            </div>
            <div v-else>
              Scheduled backups are off. Set RIOT2_BACKUP_SCHEDULE on the orchestrator to turn them on,
              for example <code>0 0 3 * * ?</code> for 03:00 every day.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-data-table
          :hide-default-footer="summary.backups.length < 10"
          item-value="name"
          :headers="headers"
          :items="summary.backups"
          :loading="loading"
          dense
          class="elevation-1"
        >
          <template v-slot:top>
            <v-toolbar flat color="white">
              <v-toolbar-title>Saved backups</v-toolbar-title>
              <v-divider class="mx-4" inset vertical />
              <v-spacer />
              <v-btn variant="text" prepend-icon="refresh" @click="loadSummary">Refresh</v-btn>
            </v-toolbar>
          </template>
          <template v-slot:[`item.createdAt`]="{ item }">
            {{ formatTime(item.createdAt) }}
          </template>
          <template v-slot:[`item.sizeBytes`]="{ item }">
            {{ formatSize(item.sizeBytes) }}
          </template>
          <template v-slot:[`item.actions`]="{ item }">
            <v-btn variant="text" size="small" icon="download" :href="backupApi.getDownloadUrl(item.name)" :download="item.name" />
            <v-btn variant="text" size="small" icon="restore" :disabled="restoring" @click="chooseSaved(item.name)" />
          </template>
          <template v-slot:no-data>
            <v-alert class="mt-3" :value="true" color="white" icon="info">
              <b>No saved backups.</b> Scheduled backups and the copy taken before each restore are kept here.
            </v-alert>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>

  <!-- restore confirmation -->
  <v-dialog v-model="confirmDialog" persistent max-width="600px">
    <v-card>
      <v-card-title>
        <span class="headline">Restore {{ pendingLabel }}</span>
      </v-card-title>
      <v-card-text>
        Every node configuration, dashboard, variable and the Matter pairing are replaced with the
        backup's. Nodes receive their restored configuration at once. The current configuration is
        saved first.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="red" variant="text" @click="restore">Restore</v-btn>
        <v-btn color="blue darken-1" variant="text" @click="cancelRestore">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
