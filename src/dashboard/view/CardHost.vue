<script setup lang="ts">
import { computed, onErrorCaptured, ref, watch } from 'vue';
import type { DashboardCard } from '@/models/dashboard';
import CardShell from '../components/CardShell.vue';
import { findCard } from '../sdk/registry';

/**
 * Shows a card with the component of its kind. A card whose kind this UI doesn't know, or whose
 * component fails, shows that instead of breaking the dashboard.
 */
const props = defineProps<{ card: DashboardCard, preview?: boolean }>();

const definition = computed(() => findCard(props.card.kind));
const failure = ref<string>();
watch(() => props.card, () => { failure.value = undefined; });

onErrorCaptured(error => {
  failure.value = error instanceof Error ? error.message : String(error);
  console.error(error);
  return false;
});
</script>

<template>
  <CardShell v-if="definition == null" :title="card.name" icon="mdi-puzzle-remove-outline" accent="warning">
    <div class="card-host__problem">This UI has no "{{ card.kind }}" card. Update the UI, or change the card's type.</div>
  </CardShell>
  <CardShell v-else-if="failure" :title="card.name" icon="mdi-alert-circle-outline" accent="error">
    <div class="card-host__problem">The card failed: {{ failure }}</div>
  </CardShell>
  <component :is="definition.component" v-else :card="card" :preview="preview" />
</template>

<style scoped>
.card-host__problem {
  font-size: 0.85rem;
  opacity: 0.8;
}
</style>
