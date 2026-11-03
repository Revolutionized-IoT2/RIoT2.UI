<script setup lang="ts">
import { ref, watch } from 'vue';
import IconField from '@/components/IconField.vue';
import type { DashboardPage } from '@/models/dashboard';

/** Adds or edits a page: its name and icon; an existing page can also be moved or deleted. */
const props = defineProps<{ page: DashboardPage | null, canDelete: boolean, first?: boolean, last?: boolean }>();
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ save: [{ name: string, icon: string | null }], remove: [], move: [number] }>();

const name = ref('');
const icon = ref<string | null | undefined>('');
const confirmDelete = ref(false);

watch(open, isOpen => {
  if (!isOpen)
    return;
  name.value = props.page?.name ?? '';
  icon.value = props.page?.icon ?? '';
  confirmDelete.value = false;
}, { immediate: true });

function save() {
  if (!name.value.trim())
    return;
  emit('save', { name: name.value.trim(), icon: icon.value || null });
  open.value = false;
}
</script>

<template>
  <v-dialog v-model="open" max-width="520">
    <v-card :title="page ? 'Edit page' : 'New page'" rounded="xl">
      <v-card-text class="d-flex flex-column ga-3">
        <v-text-field v-model="name" label="Name" autofocus :rules="[(v: string) => !!v.trim() || 'Required']" @keydown.enter="save" />
        <IconField v-model="icon" label="Icon" hint="Shown in the page navigation." />
        <div v-if="page" class="d-flex flex-wrap ga-2">
          <v-btn class="text-none" variant="tonal" prepend-icon="mdi-arrow-left" :disabled="first" @click="emit('move', -1)">Move left</v-btn>
          <v-btn class="text-none" variant="tonal" append-icon="mdi-arrow-right" :disabled="last" @click="emit('move', 1)">Move right</v-btn>
        </div>
        <v-alert v-if="confirmDelete" type="warning" density="compact" title="Delete this page and its cards?">
          <template #append>
            <v-btn class="text-none" color="error" variant="flat" size="small" @click="emit('remove'); open = false">Delete</v-btn>
          </template>
        </v-alert>
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-btn v-if="page && canDelete && !confirmDelete" class="text-none" color="error" variant="text" prepend-icon="mdi-delete-outline" @click="confirmDelete = true">Delete page</v-btn>
        <v-spacer />
        <v-btn class="text-none" variant="text" @click="open = false">Cancel</v-btn>
        <v-btn class="text-none" color="primary" variant="flat" :disabled="!name.trim()" @click="save">{{ page ? 'Save' : 'Add page' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
