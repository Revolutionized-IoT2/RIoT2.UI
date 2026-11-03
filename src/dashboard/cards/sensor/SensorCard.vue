<script setup lang="ts">
import { computed } from 'vue';
import CardShell from '../../components/CardShell.vue';
import SparkLine from '../../components/SparkLine.vue';
import { formatNumber, iconFor, toNumber, trend, useCardSettings, useElement, type CardProps } from '../../sdk';
import type { SensorElement, SensorSettings } from './index';

const props = defineProps<CardProps>();
const settings = useCardSettings<SensorSettings>(props);
const reading = useElement<SensorElement>(props);

const digits = computed(() => toNumber(reading.value.setting('digits') ?? 1));
const value = computed(() => formatNumber(reading.value.number, digits.value));
const numbers = computed(() => reading.value.history.map(point => point.number).filter(Number.isFinite));
const direction = computed(() => settings.value.showTrend ? trend(numbers.value) : undefined);
const trendIcon = computed(() => ({ up: 'mdi-trending-up', down: 'mdi-trending-down', flat: 'mdi-trending-neutral' })[direction.value ?? 'flat']);
const warning = computed(() => {
  const n = reading.value.number;
  const { warnBelow, warnAbove } = settings.value;
  return Number.isFinite(n) && ((warnBelow != null && n < warnBelow) || (warnAbove != null && n > warnAbove));
});
const icon = computed(() => props.card.icon || reading.value.element?.icon || iconFor(reading.value.schema?.semantic) || 'mdi-gauge');
const state = computed(() => !reading.value.bound ? 'unbound' : reading.value.hasValue ? 'ready' : 'waiting');
const range = computed(() => numbers.value.length < 2 ? undefined
  : `${formatNumber(Math.min(...numbers.value), digits.value)} – ${formatNumber(Math.max(...numbers.value), digits.value)}`);
</script>

<template>
  <CardShell
    :title="card.name || reading.element?.name"
    :subtitle="card.description"
    :icon="icon"
    :accent="warning ? 'error' : undefined"
    :state="state"
    :updated="state === 'ready' ? reading.updated : undefined"
  >
    <div class="sensor">
      <div class="sensor__value" :class="{ 'text-error': warning }">
        <span class="sensor__number">{{ value }}</span>
        <span v-if="reading.unit" class="sensor__unit">{{ reading.unit }}</span>
        <v-icon v-if="direction" class="sensor__trend" :icon="trendIcon" size="22" />
      </div>
      <SparkLine v-if="settings.showSparkline && numbers.length > 1" class="sensor__spark" :values="numbers" :color="warning ? 'error' : 'primary'" :height="44" />
    </div>
    <template v-if="range && settings.showSparkline" #footer>
      <span class="sensor__range">{{ range }}</span>
    </template>
  </CardShell>
</template>

<style scoped>
.sensor {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}

.sensor__value {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px;
  line-height: 1;
}

.sensor__number {
  font-size: clamp(2rem, 16cqi, 3.25rem);
  font-weight: 500;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.sensor__unit {
  font-size: clamp(1rem, 7cqi, 1.4rem);
  opacity: 0.7;
}

.sensor__trend {
  align-self: center;
  margin-inline-start: auto;
  opacity: 0.75;
}

.sensor__spark {
  margin-inline: -16px;
  margin-bottom: -4px;
  width: calc(100% + 32px);
}

.sensor__range {
  font-variant-numeric: tabular-nums;
}
</style>
