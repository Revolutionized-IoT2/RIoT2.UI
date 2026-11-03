<script setup lang="ts">
import { computed } from 'vue';
import { useNow } from '@/composables/relativeTime';
import RelativeTime from '@/components/RelativeTime.vue';
import CardShell from '../../components/CardShell.vue';
import { toBoolean, useCardSettings, useElement, type CardProps } from '../../sdk';
import type { MotionElement, MotionSettings } from './index';

const props = defineProps<CardProps>();
const settings = useCardSettings<MotionSettings>(props);
const reading = useElement<MotionElement>(props);
const now = useNow();

/** The last report that saw motion, from the history or the latest report. */
const lastMotion = computed(() => {
  const times = reading.value.history.filter(point => toBoolean(point.value) === true).map(point => point.time.getTime());
  if (reading.value.boolean === true && reading.value.updated)
    times.push(reading.value.updated.getTime());
  return times.length > 0 ? new Date(Math.max(...times)) : undefined;
});

const active = computed(() => reading.value.boolean === true
  || (lastMotion.value != null && now.value - lastMotion.value.getTime() < Math.max(0, settings.value.holdSeconds) * 1000));

const today = computed(() => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return reading.value.history.filter(point => toBoolean(point.value) === true && point.time >= start).length;
});

const state = computed(() => !reading.value.bound ? 'unbound' : reading.value.hasValue || lastMotion.value ? 'ready' : 'waiting');
</script>

<template>
  <CardShell :title="card.name || reading.element?.name" :subtitle="card.description" :icon="card.icon || (active ? 'mdi-motion-sensor' : 'mdi-motion-sensor-off')" :active="active" :state="state">
    <div class="motion">
      <div class="motion__status">
        <span class="motion__pulse" :class="{ 'motion__pulse--on': active }" />
        <span class="motion__label">{{ active ? settings.activeLabel : settings.idleLabel }}</span>
      </div>
      <div class="motion__detail">
        <template v-if="lastMotion">Last <RelativeTime :time="lastMotion" /></template>
        <template v-else>No motion seen</template>
        <span v-if="today > 0"> · {{ today }} today</span>
      </div>
    </div>
  </CardShell>
</template>

<style scoped>
.motion {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 4px;
}

.motion__status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.motion__label {
  font-size: clamp(1.2rem, 10cqi, 1.6rem);
  font-weight: 500;
}

.motion__pulse {
  position: relative;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: color-mix(in srgb, currentColor 35%, transparent);
}

.motion__pulse--on {
  background: rgb(var(--v-theme-primary));
}

.motion__pulse--on::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  animation: motion-pulse 1.6s ease-out infinite;
}

.motion__detail {
  font-size: 0.8rem;
  opacity: 0.75;
}

@keyframes motion-pulse {
  from { transform: scale(1); opacity: 0.6; }
  to { transform: scale(3); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .motion__pulse--on::after { animation: none; }
}
</style>
