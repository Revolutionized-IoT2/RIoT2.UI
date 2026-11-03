import { defineAsyncComponent } from 'vue';
import { ComponentSize, ComponentType } from '@/models/enums';
import { defineCard } from '../../sdk/types';

export type EntitiesSettings = { showTime: boolean };

export type EntityElement = { member: string, unit: string, digits: number | string, onLabel: string, offLabel: string };

export default defineCard<EntitiesSettings, EntityElement>({
  kind: 'entities',
  title: 'Entities',
  description: 'A compact list of values, one row each, with switches for those that can be switched.',
  icon: 'mdi-format-list-bulleted',
  category: 'sensors',
  legacyType: ComponentType.numericValue,
  defaultSize: ComponentSize.small,
  defaults: { showTime: false },
  settings: [
    { key: 'showTime', type: 'boolean', label: 'Show when each value changed' },
  ],
  elements: {
    each: {
      label: 'Row',
      report: 'required',
      command: 'optional',
      hint: 'A row with a true/false command gets a switch.',
      defaults: { member: '', unit: '', digits: 1, onLabel: 'On', offLabel: 'Off' },
      settings: [
        { key: 'member', type: 'member', label: 'Value', visible: (_, context) => context.reportSchema?.type === 'object' },
        { key: 'unit', type: 'unit', label: 'Unit', visible: (_, context) => context.valueSchema?.type === 'number' || context.valueSchema?.type === 'integer' },
        { key: 'digits', type: 'number', label: 'Decimals', min: 0, max: 6, step: 1, visible: (_, context) => context.valueSchema?.type === 'number' },
        { key: 'onLabel', type: 'text', label: 'True as', visible: (_, context) => context.valueSchema?.type === 'boolean' },
        { key: 'offLabel', type: 'text', label: 'False as', visible: (_, context) => context.valueSchema?.type === 'boolean' },
      ],
    },
    min: 1,
    max: 20,
  },
  suits: schema => schema.type === 'object' ? 0.8 : 0.5,
  sample: {
    name: 'Bathroom',
    elements: [
      { name: 'Temperature', icon: 'mdi-thermometer', properties: { unit: '°C' }, values: [23.4], schema: { type: 'number', unit: '°C', semantic: 'temperature' } },
      { name: 'Humidity', icon: 'mdi-water-percent', properties: { unit: '%', digits: 0 }, values: [58], schema: { type: 'number', unit: '%', semantic: 'humidity' } },
      { name: 'Floor heating', icon: 'mdi-heating-coil', values: [true], schema: { type: 'boolean' }, command: true },
      { name: 'Window', icon: 'mdi-window-closed-variant', properties: { onLabel: 'Open', offLabel: 'Closed' }, values: [false], schema: { type: 'boolean', semantic: 'window' } },
    ],
  },
  component: defineAsyncComponent(() => import('./EntitiesCard.vue')),
});
