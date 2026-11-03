<script setup lang="ts">
import { computed } from 'vue';
import { useNow } from '@/composables/relativeTime';
import CardShell from '../../components/CardShell.vue';
import { sameValue, toNumber, useColors, useElement, type CardProps } from '../../sdk';
import type { StateElement, StateItem } from './index';

const props = defineProps<CardProps>();
const reading = useElement<StateElement>(props);
const now = useNow();
const { resolve } = useColors();

const expired = computed(() => {
  const minutes = reading.value.settings.expireMinutes;
  const updated = reading.value.updated;
  return minutes != null && minutes > 0 && updated != null && now.value - updated.getTime() > minutes * 60000;
});

const current = computed<StateItem | undefined>(() => {
  if (!reading.value.hasValue || expired.value)
    return undefined;
  const value = reading.value.value;
  // "1" and 1 are the same state: states are typed in a form.
  return (reading.value.settings.states ?? []).find(state => sameValue(state.value, value)
    || (Number.isFinite(toNumber(state.value)) && toNumber(state.value) === toNumber(value))
    || String(state.value) === String(value));
});

const state = computed(() => !reading.value.bound ? 'unbound' : 'ready');
</script>

<template>
  <CardShell :title="card.name || reading.element?.name" :subtitle="card.description" :icon="card.icon" :state="state" :updated="reading.hasValue ? reading.updated : undefined">
    <div class="state">
      <span class="state__badge" :style="current ? { color: resolve(current.color) } : undefined">
        <v-icon :icon="current?.icon || 'mdi-help-circle-outline'" size="34" />
      </span>
      <span class="state__name">{{ current?.name ?? (reading.hasValue && !expired ? reading.text : 'Unknown') }}</span>
    </div>
  </CardShell>
</template>

<style scoped>
.state {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
}

.state__badge {
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: color-mix(in srgb, currentColor 14%, transparent);
}

.state__name {
  font-size: clamp(1.1rem, 9cqi, 1.5rem);
  font-weight: 500;
  line-height: 1.2;
}
</style>
