<script setup lang="ts">
import { computed } from 'vue';
import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip,
  type ChartData, type ChartOptions,
} from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'vue-chartjs';
import CardShell from '../../components/CardShell.vue';
import { memberValue, toText, useCardSettings, useColors, useElements, type CardProps } from '../../sdk';
import { withAlpha } from '../../sdk/colors';
import type { ChartElement, ChartSettings } from './index';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

const props = defineProps<CardProps>();
const settings = useCardSettings<ChartSettings>(props);
const elements = useElements<ChartElement>(props);
const { colors, resolve } = useColors();

const series = ['primary', 'tertiary', 'secondary', 'success', 'warning', 'info', 'error'];
const round = computed(() => settings.value.chartType === 'doughnut' || settings.value.chartType === 'pie');

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
function timeLabel(time: Date) {
  return new Intl.DateTimeFormat(undefined, sameDay(time, new Date())
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }).format(time);
}

const first = computed(() => elements.value[0]);

const labels = computed(() => {
  const view = first.value;
  if (view == null)
    return [];
  const labelMember = view.settings.labelMember;
  const reports = view.element?.previousReportsAsc ?? [];
  return labelMember
    ? reports.map(report => toText(memberValue(report.value, labelMember)))
    : view.history.map(point => timeLabel(point.time));
});

const data = computed(() => {
  if (round.value) {
    const view = first.value;
    const reports = view?.element?.previousReportsAsc ?? [];
    const pointColors = view?.settings.colorMember
      ? reports.map(report => resolve(toText(memberValue(report.value, view.settings.colorMember))))
      : reports.map((_, i) => resolve(series[i % series.length]));
    return {
      labels: labels.value,
      datasets: [{ label: view?.element?.name ?? '', data: view?.history.map(point => point.number) ?? [], backgroundColor: pointColors, borderColor: colors.value['dashboard-card'], borderWidth: 2 }],
    };
  }
  return {
    labels: labels.value,
    datasets: elements.value.map((view, i) => {
      const color = resolve(view.settings.color || series[i % series.length]);
      return {
        label: view.unit ? `${view.element?.name} (${view.unit})` : view.element?.name ?? '',
        data: view.history.map(point => point.number),
        borderColor: color,
        backgroundColor: settings.value.chartType === 'bar' ? withAlpha(color, 0.75) : withAlpha(color, 0.14),
        fill: elements.value.length === 1,
        tension: settings.value.smooth ? 0.35 : 0,
        pointRadius: 0,
        pointHitRadius: 12,
        borderWidth: 2,
        borderRadius: 6,
      };
    }),
  };
});

const options = computed(() => {
  const text = withAlpha(resolve('on-surface'), 0.65);
  const grid = withAlpha(resolve('on-surface'), 0.08);
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: settings.value.showLegend && (round.value || elements.value.length > 1), position: 'bottom', labels: { color: text, usePointStyle: true, boxWidth: 8, padding: 14 } },
      tooltip: { cornerRadius: 8, padding: 10 },
    },
    scales: round.value ? {} : {
      x: { ticks: { color: text, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }, grid: { display: false }, border: { display: false } },
      y: { ticks: { color: text, maxTicksLimit: 5 }, grid: { color: grid }, border: { display: false } },
    },
    cutout: settings.value.chartType === 'doughnut' ? '68%' : undefined,
  };
});

const hasData = computed(() => elements.value.some(view => view.history.length > 0 || view.hasValue));
const state = computed(() => !elements.value.some(view => view.bound) ? 'unbound' : hasData.value ? 'ready' : 'waiting');
const updated = computed(() => elements.value.map(view => view.updated).filter(time => time != null).sort((a, b) => b!.getTime() - a!.getTime())[0]);
const icon = computed(() => props.card.icon || { line: 'mdi-chart-line', bar: 'mdi-chart-bar', doughnut: 'mdi-chart-donut', pie: 'mdi-chart-pie' }[settings.value.chartType]);
</script>

<template>
  <CardShell :title="card.name" :subtitle="card.description" :icon="icon" :state="state" :updated="state === 'ready' ? updated : undefined">
    <div class="chart" :class="{ 'chart--round': round }">
      <Line v-if="settings.chartType === 'line'" :data="data as ChartData<'line'>" :options="options as ChartOptions<'line'>" />
      <Bar v-else-if="settings.chartType === 'bar'" :data="data as ChartData<'bar'>" :options="options as ChartOptions<'bar'>" />
      <Doughnut v-else-if="settings.chartType === 'doughnut'" :data="data as ChartData<'doughnut'>" :options="options as ChartOptions<'doughnut'>" />
      <Pie v-else :data="data as ChartData<'pie'>" :options="options as ChartOptions<'pie'>" />
    </div>
  </CardShell>
</template>

<style scoped>
.chart {
  position: relative;
  flex: 1;
  min-height: 200px;
}

.chart--round {
  min-height: 220px;
}
</style>
