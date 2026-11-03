<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { loadIconNames, normalizeIcon, suggestedIcons } from '@/dashboard/sdk/icons';

/** An icon setting: a text field with the icon, and a searchable picker of every MDI icon. */
const props = defineProps<{ label: string, hint?: string, clearable?: boolean }>();
const icon = defineModel<string | null | undefined>();

const { smAndDown } = useDisplay();
const open = ref(false);
const search = ref('');
const all = ref<string[]>([]);
const loading = ref(false);

watch(open, async isOpen => {
  if (!isOpen || all.value.length > 0)
    return;
  loading.value = true;
  try {
    all.value = await loadIconNames();
  } finally {
    loading.value = false;
  }
});

const limit = 240;
const results = computed(() => {
  const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0)
    return suggestedIcons;
  return all.value.filter(name => words.every(word => name.includes(word))).slice(0, limit);
});

function pick(name: string) {
  icon.value = name;
  open.value = false;
}

const shown = computed(() => normalizeIcon(icon.value));
</script>

<template>
  <v-text-field
    v-model="icon"
    :label="props.label"
    :hint="props.hint"
    :persistent-hint="!!props.hint"
    :clearable="props.clearable ?? true"
    placeholder="mdi-…"
    autocomplete="off"
  >
    <template #prepend-inner>
      <v-icon :icon="shown || 'mdi-shape-outline'" :class="{ 'opacity-40': !shown }" />
    </template>
    <template #append-inner>
      <v-btn icon="mdi-magnify" size="small" variant="text" aria-label="Choose an icon" @click="open = true" />
    </template>
  </v-text-field>

  <v-dialog v-model="open" :fullscreen="smAndDown" max-width="640" scrollable>
    <v-card :title="`Choose: ${props.label}`">
      <template #append>
        <v-btn icon="mdi-close" variant="text" aria-label="Close" @click="open = false" />
      </template>
      <v-card-text class="pt-0">
        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Search, e.g. lamp, door, fan" autofocus hide-details clearable class="mb-3" />
        <div v-if="!search" class="text-body-small text-medium-emphasis mb-2">Suggested</div>
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" />
        <div class="icon-grid">
          <button v-for="name in results" :key="name" type="button" class="icon-grid__item" :class="{ 'icon-grid__item--current': name === shown }" :title="name.slice(4)" @click="pick(name)">
            <v-icon :icon="name" size="26" />
          </button>
        </div>
        <div v-if="search && !loading && results.length === 0" class="text-center text-medium-emphasis pa-6">No icons match.</div>
        <div v-if="results.length === limit" class="text-body-small text-medium-emphasis mt-2">Showing the first {{ limit }}; type more to narrow down.</div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(48px, 1fr));
  gap: 4px;
}

.icon-grid__item {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.icon-grid__item:hover {
  background: color-mix(in srgb, rgb(var(--v-theme-primary)) 10%, transparent);
}

.icon-grid__item--current {
  background: rgb(var(--v-theme-primary-container));
  color: rgb(var(--v-theme-on-primary-container));
}
</style>
