<script setup lang="ts">
import { computed, ref } from 'vue';
import CardHost from '../view/CardHost.vue';
import { cardDefinitions, categoryTitles } from '../sdk/registry';
import { sampleCard } from '../sdk/sample';
import type { AnyCardDefinition, CardCategory } from '../sdk/types';

/** Every card type, each with a live preview from its sample data. */
const props = defineProps<{ current?: string | null }>();
const emit = defineEmits<{ pick: [AnyCardDefinition] }>();

const search = ref('');
const category = ref<CardCategory | 'all'>('all');

const definitions = cardDefinitions();
const samples = new Map(definitions.map(definition => [definition.kind, sampleCard(definition)]));
const categories = computed(() => [...new Set(definitions.map(definition => definition.category))]);

const shown = computed(() => {
  const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return definitions.filter(definition => (category.value === 'all' || definition.category === category.value)
    && words.every(word => `${definition.title} ${definition.description} ${definition.kind}`.toLowerCase().includes(word)));
});
</script>

<template>
  <div class="gallery">
    <div class="gallery__filters">
      <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Search cards" hide-details clearable density="compact" class="gallery__search" />
      <v-chip-group v-model="category" mandatory selected-class="text-primary" column>
        <v-chip value="all" filter variant="outlined">All</v-chip>
        <v-chip v-for="name in categories" :key="name" :value="name" filter variant="outlined">{{ categoryTitles[name] }}</v-chip>
      </v-chip-group>
    </div>
    <div class="gallery__grid">
      <button
        v-for="definition in shown"
        :key="definition.kind"
        type="button"
        class="gallery__item"
        :class="{ 'gallery__item--current': props.current === definition.kind }"
        @click="emit('pick', definition)"
      >
        <div class="gallery__preview" aria-hidden="true" inert>
          <CardHost :card="samples.get(definition.kind)!" preview />
        </div>
        <div class="gallery__text">
          <div class="gallery__title"><v-icon :icon="definition.icon" size="18" /> {{ definition.title }}</div>
          <div class="gallery__description">{{ definition.description }}</div>
        </div>
      </button>
    </div>
    <div v-if="shown.length === 0" class="text-center text-medium-emphasis pa-8">No card matches.</div>
  </div>
</template>

<style scoped>
.gallery__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  margin-bottom: 12px;
}

.gallery__search {
  flex: 0 1 260px;
}

.gallery__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
  gap: 14px;
}

.gallery__item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-outline-variant)) 70%, transparent);
  border-radius: 20px;
  background: rgb(var(--v-theme-dashboard-background));
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.gallery__item:hover,
.gallery__item:focus-visible {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  outline: none;
}

.gallery__item--current {
  border: 2px solid rgb(var(--v-theme-primary));
}

/* The card at a typical small-card width, scaled down so the whole sample fits. */
.gallery__preview {
  width: 100%;
  max-width: 300px;
  height: 230px;
  margin-inline: auto;
  overflow: hidden;
  pointer-events: none;
  zoom: 0.82;
}

.gallery__preview > :deep(*) {
  height: 100%;
}

.gallery__text {
  padding: 0 4px 4px;
}

.gallery__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.gallery__description {
  font-size: 0.8rem;
  opacity: 0.75;
  line-height: 1.4;
}
</style>
