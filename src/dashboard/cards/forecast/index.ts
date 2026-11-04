import { defineAsyncComponent } from 'vue';
import { ComponentSize, ComponentType } from '@/models/enums';
import type { JsonValue } from '@/models/generated/contracts';
import { defineCard } from '../../sdk/types';
import type { ForecastRange } from './forecast';

export type ForecastSettings = {
  chartType: 'line' | 'bar';
  range: ForecastRange;
  threshold: number | null;
};

export type ForecastElement = { unit: string, color: string, digits: number | string };

// A sample that moves with the clock: 36 hours from the start of this hour, like day-ahead prices.
function samplePrices(): JsonValue {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  const points = Array.from({ length: 36 }, (_, i) => {
    const from = new Date(start.getTime() + i * 3600 * 1000);
    const hour = from.getHours();
    const value = Math.round((6 + 5 * Math.sin((hour - 6) / 24 * 2 * Math.PI) + (hour >= 17 && hour <= 20 ? 6 : 0)) * 100) / 100;
    return { start: from.toISOString(), end: new Date(from.getTime() + 3600 * 1000).toISOString(), value };
  });
  return { issuedAt: start.toISOString(), kind: 'confirmed', unit: 'c/kWh', resolution: 'PT1H', points };
}

export default defineCard<ForecastSettings, ForecastElement>({
  kind: 'forecast',
  title: 'Forecast',
  description: 'Values ahead, such as a weather forecast or electricity prices for today and tomorrow, with the time now marked.',
  icon: 'mdi-chart-timeline-variant',
  category: 'charts',
  legacyType: settings => settings.chartType === 'bar' ? ComponentType.chart_bar : ComponentType.chart_line,
  defaultSize: ComponentSize.half,
  defaults: { chartType: 'bar', range: 'all', threshold: null },
  settings: [
    {
      key: 'chartType', type: 'select', label: 'Chart', options: [
        { value: 'bar', title: 'Bars', icon: 'mdi-chart-bar' },
        { value: 'line', title: 'Line', icon: 'mdi-chart-line' },
      ],
    },
    {
      key: 'range', type: 'select', label: 'Show', options: [
        { value: 'all', title: 'All' },
        { value: 'today', title: 'Today' },
        { value: 'tomorrow', title: 'Tomorrow' },
        { value: 'next24', title: 'Next 24 h' },
      ],
    },
    { key: 'threshold', type: 'number', label: 'Line at', hint: 'Draws a dashed line at this value, such as 3 °C or a price limit.' },
  ],
  elements: {
    each: {
      label: 'Forecast',
      hint: 'A report whose value is a forecast series, such as a Weather Forecast or Electricity Price device\'s.',
      report: 'required',
      command: 'none',
      accepts: ['object'],
      defaults: { unit: '', color: '', digits: 1 },
      settings: [
        { key: 'color', type: 'color', label: 'Color' },
        { key: 'unit', type: 'unit', label: 'Unit' },
        { key: 'digits', type: 'number', label: 'Decimals', min: 0, max: 6, step: 1 },
      ],
    },
    min: 1,
    max: 1,
  },
  suits: schema => schema.semantic === 'forecast' ? 1 : 0,
  sample: {
    name: 'Electricity prices',
    elements: [{ name: 'Prices', properties: { digits: 2 }, values: [samplePrices()], schema: { type: 'object', semantic: 'forecast', unit: 'c/kWh' } }],
  },
  component: defineAsyncComponent(() => import('./ForecastCard.vue')),
});
