import { defineAsyncComponent } from 'vue';
import { ComponentSize, ComponentType } from '@/models/enums';
import { defineCard } from '../../sdk/types';
import { isNumeric } from '../../sdk/capabilities';

export type GaugeSettings = {
  min: number | null;
  max: number | null;
  warning: number | null;
  critical: number | null;
  /** Low values are bad (a battery): the warning and critical zones are below their thresholds. */
  lowIsBad: boolean;
};

export type GaugeElement = { member: string, unit: string, digits: number | string };

export default defineCard<GaugeSettings, GaugeElement>({
  kind: 'gauge',
  title: 'Gauge',
  description: 'A value on a dial between a minimum and a maximum, with warning and critical zones.',
  icon: 'mdi-gauge',
  category: 'sensors',
  legacyType: ComponentType.numericValue,
  defaultSize: ComponentSize.small,
  compact: true,
  defaults: { min: null, max: null, warning: null, critical: null, lowIsBad: false },
  settings: [
    { key: 'min', type: 'number', label: 'Minimum', hint: 'Empty: the declared minimum, or 0.' },
    { key: 'max', type: 'number', label: 'Maximum', hint: 'Empty: the declared maximum, or 100.' },
    { key: 'warning', type: 'number', label: 'Warning from' },
    { key: 'critical', type: 'number', label: 'Critical from' },
    { key: 'lowIsBad', type: 'boolean', label: 'Low values are bad', hint: 'For a battery or a tank: the zones are below the thresholds.' },
  ],
  elements: {
    each: {
      label: 'Value',
      report: 'required',
      command: 'none',
      accepts: ['number', 'integer'],
      defaults: { member: '', unit: '', digits: 0 },
      settings: [
        { key: 'member', type: 'member', label: 'Value', accepts: ['number', 'integer'], visible: (_, context) => context.reportSchema?.type === 'object' },
        { key: 'unit', type: 'unit', label: 'Unit' },
        { key: 'digits', type: 'number', label: 'Decimals', min: 0, max: 6, step: 1 },
      ],
    },
    min: 1,
    max: 1,
  },
  suits: schema => isNumeric(schema) ? (schema.minimum != null && schema.maximum != null ? 1 : schema.unit === '%' ? 0.9 : 0.6) : 0,
  sample: {
    name: 'Battery',
    settings: { min: 0, max: 100, warning: 30, critical: 15, lowIsBad: true },
    elements: [{ name: 'Battery', values: [81, 79, 78, 76], schema: { type: 'integer', unit: '%', semantic: 'battery', minimum: 0, maximum: 100 } }],
  },
  component: defineAsyncComponent(() => import('./GaugeCard.vue')),
});
