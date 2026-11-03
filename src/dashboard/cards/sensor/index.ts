import { defineAsyncComponent } from 'vue';
import { ComponentSize, ComponentType } from '@/models/enums';
import { defineCard } from '../../sdk/types';
import { upgradeMember } from '../../sdk/upgrade';
import { isNumeric } from '../../sdk/capabilities';

export type SensorSettings = {
  showSparkline: boolean;
  showTrend: boolean;
  warnBelow: number | null;
  warnAbove: number | null;
};

export type SensorElement = {
  member: string;
  unit: string;
  digits: number | string;
};

export default defineCard<SensorSettings, SensorElement>({
  kind: 'sensor',
  title: 'Sensor',
  description: 'A reading in large type, with its trend and a sparkline of the recent values.',
  icon: 'mdi-thermometer',
  category: 'sensors',
  legacyType: ComponentType.numericValue,
  replaces: [ComponentType.numericValue],
  defaultSize: ComponentSize.small,
  compact: true,
  defaults: { showSparkline: true, showTrend: true, warnBelow: null, warnAbove: null },
  settings: [
    { key: 'showSparkline', type: 'boolean', label: 'Show a sparkline', hint: 'Needs a template that keeps a history.' },
    { key: 'showTrend', type: 'boolean', label: 'Show the trend' },
    { key: 'warnBelow', type: 'number', label: 'Warn below', hint: 'Shows the value in the error color below this.' },
    { key: 'warnAbove', type: 'number', label: 'Warn above', hint: 'Shows the value in the error color above this.' },
  ],
  elements: {
    each: {
      label: 'Sensor',
      report: 'required',
      command: 'none',
      accepts: ['number', 'integer'],
      history: 24,
      defaults: { member: '', unit: '', digits: 1 },
      settings: [
        { key: 'member', type: 'member', label: 'Value', accepts: ['number', 'integer'], visible: (_, context) => context.reportSchema?.type === 'object' },
        { key: 'unit', type: 'unit', label: 'Unit' },
        { key: 'digits', type: 'number', label: 'Decimals', min: 0, max: 6, step: 1 },
      ],
    },
    min: 1,
    max: 1,
  },
  suits: schema => isNumeric(schema) ? 1 : schema.type === 'object' ? 0.4 : 0,
  upgrade(card) {
    const first = card.elements[0];
    for (const element of card.elements)
      upgradeMember(element);
    card.settings = { ...card.settings, showTrend: first?.properties.useTrendIcon === true, showSparkline: true };
    if (first)
      delete first.properties.useTrendIcon;
  },
  sample: {
    name: 'Living room',
    elements: [{ name: 'Temperature', properties: { unit: '°C', digits: 1 }, values: [20.8, 21.0, 21.3, 21.2, 21.6, 21.9, 22.1, 22.0, 22.4], schema: { type: 'number', semantic: 'temperature', unit: '°C' } }],
  },
  component: defineAsyncComponent(() => import('./SensorCard.vue')),
});
