import { defineAsyncComponent } from 'vue';
import { ComponentSize, ComponentType } from '@/models/enums';
import type { JsonValue } from '@/models/generated/contracts';
import { defineCard } from '../../sdk/types';

export type LightElement = {
  member: string;
  onValue: JsonValue;
  offValue: JsonValue;
  min: number | null;
  max: number | null;
  /** How the color command takes a color: "#ff8800", { r, g, b } or "255,136,0". */
  format: 'hex' | 'rgb' | 'csv';
};

export default defineCard<Record<string, never>, LightElement>({
  kind: 'light',
  title: 'Light',
  description: 'A light to switch on and off, with brightness and color when the device has them.',
  icon: 'mdi-lightbulb-on-outline',
  category: 'controls',
  legacyType: ComponentType.switch,
  defaultSize: ComponentSize.small,
  defaults: {},
  elements: {
    slots: [
      {
        role: 'power', label: 'On and off', report: 'optional', command: 'required', accepts: ['boolean'],
        defaults: { member: '', onValue: null, offValue: null, min: null, max: null, format: 'hex' },
        settings: [
          { key: 'member', type: 'member', label: 'State', accepts: ['boolean'], visible: (_, context) => context.reportSchema?.type === 'object' },
          { key: 'onValue', type: 'value', source: 'command', label: 'On value', visible: (_, context) => context.commandSchema?.type !== 'boolean' },
          { key: 'offValue', type: 'value', source: 'command', label: 'Off value', visible: (_, context) => context.commandSchema?.type !== 'boolean' },
        ],
      },
      {
        role: 'brightness', label: 'Brightness', report: 'optional', command: 'optional', accepts: ['number', 'integer'],
        defaults: { member: '', onValue: null, offValue: null, min: null, max: null, format: 'hex' },
        settings: [
          { key: 'member', type: 'member', label: 'Brightness', accepts: ['number', 'integer'], visible: (_, context) => context.reportSchema?.type === 'object' },
          { key: 'min', type: 'number', label: 'Lowest', hint: 'Empty: the declared minimum, or 0.' },
          { key: 'max', type: 'number', label: 'Highest', hint: 'Empty: the declared maximum, or 100.' },
        ],
      },
      {
        role: 'color', label: 'Color', report: 'optional', command: 'optional',
        defaults: { member: '', onValue: null, offValue: null, min: null, max: null, format: 'hex' },
        settings: [
          { key: 'member', type: 'member', label: 'Color', visible: (_, context) => context.reportSchema?.type === 'object' },
          {
            key: 'format', type: 'select', label: 'Sent as', options: [
              { value: 'hex', title: 'Hex text (#ff8800)' }, { value: 'rgb', title: 'Object { r, g, b }' }, { value: 'csv', title: 'Text (255,136,0)' },
            ],
          },
        ],
      },
    ],
  },
  suits: schema => schema.semantic === 'light' ? 1 : schema.type === 'boolean' ? 0.4 : 0,
  sample: {
    name: 'Sofa lamp',
    elements: [
      { name: 'Power', properties: { role: 'power' }, values: [true], schema: { type: 'boolean' }, command: true },
      { name: 'Brightness', properties: { role: 'brightness' }, values: [70], schema: { type: 'integer', minimum: 0, maximum: 100 }, command: true },
      { name: 'Color', properties: { role: 'color' }, values: ['#ffb74d'], schema: { type: 'string', semantic: 'color' }, command: true },
    ],
  },
  component: defineAsyncComponent(() => import('./LightCard.vue')),
});
