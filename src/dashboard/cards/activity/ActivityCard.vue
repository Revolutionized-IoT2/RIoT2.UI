<script setup lang="ts">
import { computed } from 'vue';
import { useNow } from '@/composables/relativeTime';
import CardShell from '../../components/CardShell.vue';
import { toBoolean, useCardSettings, useElement, type CardProps } from '../../sdk';
import type { ActivityElement, ActivitySettings } from './index';

const props = defineProps<CardProps>();
const settings = useCardSettings<ActivitySettings>(props);
const reading = useElement<ActivityElement>(props);
const now = useNow();

/** True reports per period, oldest period first; the last one ends now. */
const counts = computed(() => {
  const size = Math.max(1, settings.value.bucketSeconds) * 1000;
  const count = Math.min(48, Math.max(4, Math.trunc(settings.value.buckets) || 12));
  const end = Math.max(now.value, ...reading.value.history.map(point => point.time.getTime()));
  const bars = new Array<number>(count).fill(0);
  for (const point of reading.value.history) {
    if (toBoolean(point.value) !== true)
      continue;
    const age = Math.floor((end - point.time.getTime()) / size);
    if (age >= 0 && age < count)
      bars[count - 1 - age]++;
  }
  return bars;
});

const peak = computed(() => Math.max(1, ...counts.value));
const total = computed(() => counts.value.reduce((sum, n) => sum + n, 0));

function span(seconds: number) {
  if (seconds < 60)
    return `${seconds} s`;
  if (seconds < 3600)
    return `${Math.round(seconds / 60)} min`;
  return `${Math.round(seconds / 3600)} h`;
}

const period = computed(() => span(settings.value.bucketSeconds * counts.value.length));
const state = computed(() => !reading.value.bound ? 'unbound' : 'ready');
</script>

<template>
  <CardShell :title="card.name || reading.element?.name" :subtitle="card.description" :icon="card.icon || 'mdi-chart-timeline-variant'" :state="state" :updated="reading.hasValue ? reading.updated : undefined">
    <div class="activity">
      <div class="activity__total"><strong>{{ total }}</strong> in the last {{ period }}</div>
      <div class="activity__bars" role="img" :aria-label="`${total} events in the last ${period}`">
        <span v-for="(n, i) in counts" :key="i" class="activity__bar" :class="{ 'activity__bar--empty': n === 0 }" :style="{ height: `${Math.max(6, (n / peak) * 100)}%` }" :title="String(n)" />
      </div>
      <div class="activity__axis"><span>{{ period }} ago</span><span>now</span></div>
    </div>
  </CardShell>
</template>

<style scoped>
.activity {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity__total {
  font-size: 0.85rem;
  opacity: 0.8;
}

.activity__total strong {
  font-size: 1.6rem;
  font-weight: 600;
  margin-inline-end: 4px;
}

.activity__bars {
  flex: 1;
  min-height: 72px;
  display: flex;
  align-items: flex-end;
  gap: 4px;
}

.activity__bar {
  flex: 1;
  border-radius: 6px 6px 3px 3px;
  background: rgb(var(--v-theme-primary));
  transition: height 0.4s ease;
}

.activity__bar--empty {
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 10%, transparent);
}

.activity__axis {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  opacity: 0.6;
}
</style>
