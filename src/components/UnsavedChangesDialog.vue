<script setup lang="ts">
import type { UnsavedChoice } from '@/composables/unsavedChanges';

/** Asks what to do with unsaved changes (useUnsavedChanges): save, discard, or keep editing. */
withDefaults(defineProps<{ saving?: boolean, what?: string }>(), { what: 'changes' });
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ choose: [UnsavedChoice] }>();
</script>

<template>
  <v-dialog v-model="open" max-width="440" persistent>
    <v-card prepend-icon="mdi-content-save-alert-outline" title="Unsaved changes" rounded="xl">
      <v-card-text>You have unsaved {{ what }}. Save them before you go on?</v-card-text>
      <v-card-actions class="flex-wrap ga-2 pa-4 pt-0">
        <v-btn class="text-none" variant="text" @click="emit('choose', 'cancel')">Keep editing</v-btn>
        <v-spacer />
        <v-btn class="text-none" color="error" variant="text" :disabled="saving" @click="emit('choose', 'discard')">Discard</v-btn>
        <v-btn class="text-none" color="primary" variant="flat" :loading="saving" prepend-icon="mdi-content-save-outline" @click="emit('choose', 'save')">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
