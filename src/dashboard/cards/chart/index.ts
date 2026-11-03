import { defineAsyncComponent } from 'vue';
import { ComponentSize, ComponentType } from '@/models/enums';
import { defineCard } from '../../sdk/types';
import { memberOfExpression, upgradeMember } from '../../sdk/upgrade';
import { isNumeric } from '../../sdk/capabilities';

export type ChartKind = 'line' | 'bar' | 'doughnut' | 'pie';

export type ChartSettings = { chartType: ChartKind, showLegend: boolean, smooth: boolean };

export type ChartElement = { member: string, labelMember: string, color: string, colorMember: string, unit: string };

const legacyTypes: Record<ChartKind, ComponentType> = {
  line: ComponentType.chart_line, bar: ComponentType.chart_bar, doughnut: ComponentType.chart_doughnut, pie: ComponentType.chart_pie,
};

const isRound = (settings: { card?: { chartType?: unknown } }) => settings.card?.chartType === 'doughnut' || settings.card?.chartType === 'pie';

export default defineCard<ChartSettings, ChartElement>({
  kind: 'chart',
  title: 'Chart',
  description: 'The history of one or more values as a line, bar, doughnut or pie chart.',
  icon: 'mdi-chart-line',
  category: 'charts',
  legacyType: settings => legacyTypes[settings.chartType] ?? ComponentType.chart_line,
  replaces: [ComponentType.chart_line, ComponentType.chart_bar, ComponentType.chart_doughnut, ComponentType.chart_pie],
  defaultSize: ComponentSize.half,
  defaults: { chartType: 'line', showLegend: true, smooth: true },
  settings: [
    {
      key: 'chartType', type: 'select', label: 'Chart', options: [
        { value: 'line', title: 'Line', icon: 'mdi-chart-line' },
        { value: 'bar', title: 'Bar', icon: 'mdi-chart-bar' },
        { value: 'doughnut', title: 'Doughnut', icon: 'mdi-chart-donut' },
        { value: 'pie', title: 'Pie', icon: 'mdi-chart-pie' },
      ],
    },
    { key: 'showLegend', type: 'boolean', label: 'Show the legend' },
    { key: 'smooth', type: 'boolean', label: 'Smooth lines', visible: settings => settings.chartType === 'line' },
  ],
  elements: {
    each: {
      label: 'Series',
      hint: 'Each series is the history of one value. A doughnut or pie shows the latest values of the first series.',
      report: 'required',
      command: 'none',
      accepts: ['number', 'integer'],
      history: 24,
      defaults: { member: '', labelMember: '', color: '', colorMember: '', unit: '' },
      settings: [
        { key: 'member', type: 'member', label: 'Value', accepts: ['number', 'integer'], visible: (_, context) => context.reportSchema?.type === 'object' },
        { key: 'color', type: 'color', label: 'Color' },
        { key: 'unit', type: 'unit', label: 'Unit' },
        { key: 'labelMember', type: 'member', label: 'Labels from', hint: 'Empty: the report times.', visible: (_, context) => context.reportSchema?.type === 'object' },
        { key: 'colorMember', type: 'member', label: 'Colors from', accepts: ['string'], visible: (_, context) => context.reportSchema?.type === 'object' && isRound(context) },
      ],
    },
    min: 1,
    max: 6,
  },
  suits: schema => isNumeric(schema) ? 0.7 : 0,
  upgrade(card) {
    const chartType = (Object.entries(legacyTypes).find(([, type]) => type === card.type)?.[0] ?? 'line') as ChartKind;
    card.settings = { ...card.settings, chartType };
    for (const element of card.elements) {
      upgradeMember(element);
      const label = memberOfExpression(element.properties.label);
      if (label != null)
        element.properties.labelMember = label;
      const color = memberOfExpression(element.properties.color);
      if (color != null) {
        element.properties.colorMember = color;
        element.properties.color = '';
      }
      delete element.properties.label;
    }
  },
  sample: {
    name: 'Power',
    elements: [
      { name: 'House', properties: { color: 'primary', unit: 'W' }, values: [820, 760, 910, 1340, 1210, 980, 1050, 1420, 1180], schema: { type: 'number', unit: 'W' } },
      { name: 'Heat pump', properties: { color: 'tertiary', unit: 'W' }, values: [420, 380, 410, 640, 610, 400, 450, 700, 520], schema: { type: 'number', unit: 'W' } },
    ],
  },
  component: defineAsyncComponent(() => import('./ChartCard.vue')),
});
