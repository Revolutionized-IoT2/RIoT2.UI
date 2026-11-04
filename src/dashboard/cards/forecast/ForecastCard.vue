<script setup lang="ts">
import { computed } from 'vue';
import {
  BarElement, CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Tooltip,
  type ChartData, type ChartOptions,
} from 'chart.js';
import { Bar, Line } from 'vue-chartjs';
import CardShell from '../../components/CardShell.vue';
import { formatNumber, toNumber, useCardSettings, useColors, useElement, type CardProps } from '../../sdk';
import { withAlpha } from '../../sdk/colors';
import { currentPoint, extremes, pointsIn, readForecast } from './forecast';
import type { ForecastElement, ForecastSettings } from './index';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip);

const props = defineProps<CardProps>();
const settings = useCardSettings<ForecastSettings>(props);
const reading = useElement<ForecastElement>(props);
const { resolve } = useColors();

const now = new Date();
const forecast = computed(() => readForecast(reading.value.value));
const points = computed(() => pointsIn(forecast.value?.points ?? [], settings.value.range, now));
const current = computed(() => currentPoint(forecast.value?.points ?? [], now));
const range = computed(() => extremes(points.value));
const digits = computed(() => toNumber(reading.value.setting('digits') ?? 1));
const unit = computed(() => reading.value.unit || forecast.value?.unit || '');
const format = (value: number | undefined | null) => value == null ? '–' : formatNumber(value, digits.value);

function label(time: Date) {
  const sameDay = time.toDateString() === now.toDateString();
  return new Intl.DateTimeFormat(undefined, sameDay ? { hour: '2-digit', minute: '2-digit' } : { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(time);
}

const data = computed(() => {
  const color = resolve(reading.value.settings.color || 'primary');
  const past = withAlpha(color, 0.35);
  const datasets: Record<string, unknown>[] = [{
    label: unit.value ? `${reading.value.element?.name ?? ''} (${unit.value})` : reading.value.element?.name ?? '',
    data: points.value.map(point => point.value),
    borderColor: color,
    backgroundColor: settings.value.chartType === 'bar'
      ? points.value.map(point => point === current.value ? color : point.end <= now ? past : withAlpha(color, 0.7))
      : withAlpha(color, 0.14),
    pointRadius: points.value.map(point => point === current.value ? 4 : 0),
    pointBackgroundColor: color,
    fill: true,
    tension: 0.3,
    borderWidth: 2,
    borderRadius: 3,
    spanGaps: false,
  }];
  if (settings.value.threshold != null)
    datasets.push({ type: 'line', label: 'Limit', data: points.value.map(() => settings.value.threshold), borderColor: resolve('error'), borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false });
  return { labels: points.value.map(point => label(point.start)), datasets };
});

const options = computed(() => {
  const text = withAlpha(resolve('on-surface'), 0.65);
  const grid = withAlpha(resolve('on-surface'), 0.08);
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false }, tooltip: { cornerRadius: 8, padding: 10 } },
    scales: {
      x: { ticks: { color: text, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }, grid: { display: false }, border: { display: false } },
      y: { ticks: { color: text, maxTicksLimit: 5 }, grid: { color: grid }, border: { display: false } },
    },
  };
});

const state = computed(() => !reading.value.bound ? 'unbound' : points.value.length > 0 ? 'ready' : 'waiting');
const icon = computed(() => props.card.icon || reading.value.element?.icon || 'mdi-chart-timeline-variant');
</script>

<template>
  <CardShell :title="card.name || reading.element?.name" :subtitle="card.description" :icon="icon" :state="state" :updated="state === 'ready' ? forecast?.issuedAt : undefined">
    <div class="forecast">
      <div class="forecast__figures">
        <span v-if="current" class="forecast__now"><span class="forecast__number">{{ format(current.value) }}</span> {{ unit }} <span class="forecast__label">now</span></span>
        <span class="forecast__range">{{ format(range.min) }} – {{ format(range.max) }} {{ unit }}</span>
      </div>
      <div class="forecast__chart">
        <Bar v-if="settings.chartType === 'bar'" :data="data as unknown as ChartData<'bar'>" :options="options as ChartOptions<'bar'>" />
        <Line v-else :data="data as unknown as ChartData<'line'>" :options="options as ChartOptions<'line'>" />
      </div>
    </div>
  </CardShell>
</template>

<style scoped>
.forecast {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.forecast__figures {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  font-variant-numeric: tabular-nums;
}

.forecast__number {
  font-size: 1.6rem;
  font-weight: 500;
}

.forecast__label,
.forecast__range {
  opacity: 0.7;
}

.forecast__chart {
  position: relative;
  flex: 1;
  min-height: 180px;
}
</style>
