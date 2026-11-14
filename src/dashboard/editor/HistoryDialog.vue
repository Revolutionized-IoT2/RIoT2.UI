<script setup lang="ts">
import { ref, watch } from 'vue';
import type { DashboardVersionInfo } from '@/composables/api/dashboardApi';

/**
 * The dashboard's saved versions (I60), newest first: when, by whom (the editor, an AI assistant, a restore) and what
 * changed. Restoring one makes it the dashboard again, as a new version; unsaved changes are lost.
 */
const props = defineProps<{ load: () => Promise<DashboardVersionInfo[]>, dirty: boolean }>();
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ restore: [string] }>();

const versions = ref<DashboardVersionInfo[]>([]);
const loading = ref(false);
const confirm = ref<string | null>(null);

const sources: Record<string, { title: string, icon: string }> = {
  ui: { title: 'Editor', icon: 'mdi-pencil-outline' },
  mcp: { title: 'AI assistant', icon: 'mdi-robot-outline' },
  restore: { title: 'Restore', icon: 'mdi-history' },
  backup: { title: 'Backup', icon: 'mdi-backup-restore' },
  baseline: { title: 'Before history', icon: 'mdi-flag-outline' },
};

watch(open, async isOpen => {
  if (!isOpen)
    return;
  confirm.value = null;
  loading.value = true;
  versions.value = await props.load();
  loading.value = false;
}, { immediate: true });

const when = (savedAt: string) => new Date(savedAt).toLocaleString();

function restore(id: string) {
  emit('restore', id);
  open.value = false;
}
</script>

<template>
  <v-dialog v-model="open" max-width="640" scrollable>
    <v-card title="Dashboard history" subtitle="The last saved versions; the newest is the dashboard now." rounded="xl">
      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" />
        <p v-else-if="versions.length === 0" class="text-body-medium">No versions yet: they are kept from the next save on.</p>
        <v-list v-else lines="three" density="compact">
          <v-list-item v-for="(version, index) in versions" :key="version.id" :data-version="version.id">
            <template #prepend>
              <v-icon :icon="sources[version.source]?.icon ?? 'mdi-content-save-outline'" />
            </template>
            <v-list-item-title>
              {{ when(version.savedAt) }}
              <v-chip size="x-small" class="ml-1" label>{{ sources[version.source]?.title ?? version.source }}</v-chip>
              <v-chip v-if="index === 0" size="x-small" class="ml-1" color="primary" label>Now</v-chip>
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ version.summary }}<span v-if="version.caller"> · {{ version.caller }}</span>
              · {{ version.pages }} pages, {{ version.cards }} cards
            </v-list-item-subtitle>
            <template v-if="index > 0" #append>
              <v-btn v-if="confirm !== version.id" class="text-none" variant="text" size="small" prepend-icon="mdi-restore" @click="confirm = version.id">Restore</v-btn>
              <v-btn v-else class="text-none" color="warning" variant="flat" size="small" @click="restore(version.id)">
                {{ dirty ? 'Restore, lose unsaved changes' : 'Restore this version' }}
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn class="text-none" variant="text" @click="open = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
