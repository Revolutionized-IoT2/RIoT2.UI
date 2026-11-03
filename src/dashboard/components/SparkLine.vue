<script setup lang="ts">
import { computed, useId } from 'vue';
import { useColors } from '../sdk/colors';

// A small trend line with a soft fill; points are spaced evenly, oldest on the left.
const props = withDefaults(defineProps<{ values: number[], color?: string | null, height?: number, fill?: boolean }>(), { height: 48, fill: true });
const { resolve } = useColors();
const gradientId = `spark-${useId()}`;

const points = computed(() => {
  const values = props.values.filter(Number.isFinite);
  if (values.length < 2)
    return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = 100 / (values.length - 1);
  // Two pixels of headroom, so the stroke isn't clipped at the top and bottom.
  return values.map((value, i) => [i * step, 2 + (1 - (value - min) / span) * (props.height - 4)] as const);
});

/** A smooth line through the points (Catmull-Rom as cubic Béziers). */
const line = computed(() => {
  const p = points.value;
  if (p.length < 2)
    return '';
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const [x0, y0] = p[Math.max(0, i - 1)];
    const [x1, y1] = p[i];
    const [x2, y2] = p[i + 1];
    const [x3, y3] = p[Math.min(p.length - 1, i + 2)];
    d += ` C${x1 + (x2 - x0) / 6},${y1 + (y2 - y0) / 6} ${x2 - (x3 - x1) / 6},${y2 - (y3 - y1) / 6} ${x2},${y2}`;
  }
  return d;
});

const area = computed(() => line.value ? `${line.value} L100,${props.height} L0,${props.height} Z` : '');
const stroke = computed(() => resolve(props.color));
</script>

<template>
  <svg v-if="line" class="sparkline" :viewBox="`0 0 100 ${height}`" preserveAspectRatio="none" :height="height" aria-hidden="true">
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="stroke" stop-opacity="0.28" />
        <stop offset="100%" :stop-color="stroke" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path v-if="fill" :d="area" :fill="`url(#${gradientId})`" />
    <path :d="line" fill="none" :stroke="stroke" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
  </svg>
</template>

<style scoped>
.sparkline {
  display: block;
  width: 100%;
  overflow: visible;
}
</style>
