<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { useDisplay } from 'vuetify';

export type PreviewWidth = 'phone' | 'tablet' | 'full';

/**
 * The dashboard editor's toolbar: preview (at phone, tablet or full width), page actions, import
 * and export, discard, save (also Ctrl+S) and done.
 */
const props = defineProps<{ dirty: boolean, saving: boolean, hasPage: boolean }>();
const previewing = defineModel<boolean>('previewing', { required: true });
const previewWidth = defineModel<PreviewWidth>('previewWidth', { required: true });
const emit = defineEmits<{ newPage: [], editPage: [], transfer: [], discard: [], save: [], done: [] }>();

const { smAndDown } = useDisplay();

function onKey(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    if (props.dirty)
      emit('save');
  }
}
onMounted(() => globalThis.addEventListener('keydown', onKey));
onBeforeUnmount(() => globalThis.removeEventListener('keydown', onKey));
</script>

<template>
  <div class="editor-toolbar">
    <div class="editor-toolbar__title">
      <v-icon icon="mdi-view-dashboard-edit-outline" />
      <span>Edit dashboard</span>
      <v-chip v-if="dirty" size="small" color="warning" variant="tonal" label>Unsaved</v-chip>
    </div>
    <v-spacer />
    <v-btn-toggle v-if="previewing" v-model="previewWidth" mandatory density="compact" variant="outlined" divided rounded="xl">
      <v-btn value="phone" icon="mdi-cellphone" aria-label="Phone width" />
      <v-btn value="tablet" icon="mdi-tablet" aria-label="Tablet width" />
      <v-btn value="full" icon="mdi-monitor" aria-label="Full width" />
    </v-btn-toggle>
    <v-btn
      class="text-none"
      :variant="previewing ? 'tonal' : 'text'"
      color="primary"
      :prepend-icon="previewing ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
      :aria-pressed="previewing"
      @click="previewing = !previewing"
    >
      {{ smAndDown ? '' : previewing ? 'End preview' : 'Preview' }}
    </v-btn>
    <v-menu>
      <template #activator="{ props: menu }">
        <v-btn v-bind="menu" icon="mdi-dots-vertical" variant="text" aria-label="More" />
      </template>
      <v-list density="compact" nav>
        <v-list-item title="New page" prepend-icon="mdi-file-plus-outline" @click="emit('newPage')" />
        <v-list-item title="Edit page" prepend-icon="mdi-file-edit-outline" :disabled="!hasPage" @click="emit('editPage')" />
        <v-list-item title="Import and export" prepend-icon="mdi-swap-vertical" @click="emit('transfer')" />
        <v-list-item title="Discard changes" prepend-icon="mdi-undo-variant" :disabled="!dirty" @click="emit('discard')" />
      </v-list>
    </v-menu>
    <v-btn class="text-none" variant="tonal" color="primary" prepend-icon="mdi-content-save-outline" :disabled="!dirty" :loading="saving" @click="emit('save')">Save</v-btn>
    <v-btn class="text-none" variant="flat" color="primary" prepend-icon="mdi-check" @click="emit('done')">Done</v-btn>
  </div>
</template>

<style scoped>
.editor-toolbar {
  position: sticky;
  top: 64px;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: -12px -12px 12px;
  padding: 8px 12px;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 92%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid color-mix(in srgb, rgb(var(--v-theme-outline-variant)) 60%, transparent);
}

@media (min-width: 600px) {
  .editor-toolbar {
    margin: -16px -20px 16px;
    padding: 8px 20px;
  }
}

.editor-toolbar__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
</style>
