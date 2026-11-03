<script setup lang="ts">
import { computed } from 'vue';
import CardShell from '../../components/CardShell.vue';
import { formatNumber, iconFor, toNumber, useCardSettings, useColors, useElement, type CardProps } from '../../sdk';
import type { GaugeElement, GaugeSettings } from './index';

const props = defineProps<CardProps>();
const settings = useCardSettings<GaugeSettings>(props);
const reading = useElement<GaugeElement>(props);
const { resolve } = useColors();

// A 240° dial: from 150° (lower left) clockwise to 30° (lower right).
const start = 150;
const sweep = 240;
const radius = 40;

const min = computed(() => settings.value.min ?? reading.value.schema?.minimum ?? 0);
const max = computed(() => {
  const configured = settings.value.max ?? reading.value.schema?.maximum ?? 100;
  return configured > min.value ? configured : min.value + 1;
});
const fraction = (value: number) => Math.min(1, Math.max(0, (value - min.value) / (max.value - min.value)));

function point(angle: number) {
  const radians = (angle * Math.PI) / 180;
  return `${50 + radius * Math.cos(radians)},${50 + radius * Math.sin(radians)}`;
}

function arc(from: number, to: number) {
  if (to <= from)
    return '';
  const a = start + sweep * from;
  const b = start + sweep * to;
  return `M${point(a)} A${radius},${radius} 0 ${b - a > 180 ? 1 : 0} 1 ${point(b)}`;
}

const severity = computed(() => {
  const n = reading.value.number;
  const { warning, critical, lowIsBad } = settings.value;
  const beyond = (threshold: number | null) => threshold != null && (lowIsBad ? n <= threshold : n >= threshold);
  return beyond(critical) ? 'error' : beyond(warning) ? 'warning' : 'success';
});

const digits = computed(() => toNumber(reading.value.setting('digits') ?? 0));
const value = computed(() => formatNumber(reading.value.number, digits.value));
const valueArc = computed(() => Number.isFinite(reading.value.number) ? arc(0, Math.max(0.001, fraction(reading.value.number))) : '');
const color = computed(() => settings.value.warning == null && settings.value.critical == null ? resolve('primary') : resolve(severity.value));
const icon = computed(() => props.card.icon || reading.value.element?.icon || iconFor(reading.value.schema?.semantic) || 'mdi-gauge');
const state = computed(() => !reading.value.bound ? 'unbound' : reading.value.hasValue ? 'ready' : 'waiting');
</script>

<template>
  <CardShell :title="card.name || reading.element?.name" :subtitle="card.description" :icon="icon" :state="state" :updated="state === 'ready' ? reading.updated : undefined">
    <div class="gauge">
      <svg viewBox="0 0 100 86" class="gauge__dial" role="img" :aria-label="`${value} ${reading.unit}`">
        <path :d="arc(0, 1)" class="gauge__track" />
        <path v-if="valueArc" :d="valueArc" class="gauge__value" :stroke="color" />
        <text x="50" y="52" class="gauge__number">{{ value }}</text>
        <text x="50" y="66" class="gauge__unit">{{ reading.unit }}</text>
        <text :x="50 + radius * Math.cos((start * Math.PI) / 180)" y="84" class="gauge__limit">{{ formatNumber(min) }}</text>
        <text :x="50 + radius * Math.cos(((start + sweep) * Math.PI) / 180)" y="84" class="gauge__limit">{{ formatNumber(max) }}</text>
      </svg>
    </div>
  </CardShell>
</template>

<style scoped>
.gauge {
  flex: 1;
  display: grid;
  place-items: center;
}

.gauge__dial {
  width: 100%;
  max-width: 220px;
}

.gauge__track,
.gauge__value {
  fill: none;
  stroke-width: 9;
  stroke-linecap: round;
}

.gauge__track {
  stroke: color-mix(in srgb, currentColor 10%, transparent);
}

.gauge__value {
  transition: d 0.6s ease, stroke 0.3s ease;
}

.gauge__number {
  font-size: 17px;
  font-weight: 600;
  text-anchor: middle;
  fill: currentColor;
  font-variant-numeric: tabular-nums;
}

.gauge__unit {
  font-size: 8px;
  text-anchor: middle;
  fill: currentColor;
  opacity: 0.65;
}

.gauge__limit {
  font-size: 6.5px;
  text-anchor: middle;
  fill: currentColor;
  opacity: 0.55;
}
</style>
