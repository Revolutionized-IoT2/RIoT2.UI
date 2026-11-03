import { defineAsyncComponent } from 'vue';
import { ComponentSize, ComponentType } from '@/models/enums';
import type { JsonValue } from '@/models/generated/contracts';
import { isJsonObject } from '@/composables/jsonValue';
import { defineCard } from '../../sdk/types';
import { normalizeIcon } from '../../sdk/icons';

export type SwitchElement = {
  onLabel: string;
  offLabel: string;
  onIcon: string;
  offIcon: string;
  onColor: string;
  onValue: JsonValue;
  offValue: JsonValue;
};

export default defineCard<Record<string, never>, SwitchElement>({
  kind: 'switch',
  title: 'Switches',
  description: 'On and off switches in rows, each with its state from the device.',
  icon: 'mdi-toggle-switch-outline',
  category: 'controls',
  legacyType: ComponentType.switch,
  replaces: [ComponentType.switch],
  defaultSize: ComponentSize.small,
  defaults: {},
  elements: {
    each: {
      label: 'Switch',
      report: 'optional',
      command: 'required',
      accepts: ['boolean'],
      defaults: { onLabel: 'On', offLabel: 'Off', onIcon: '', offIcon: '', onColor: 'primary', onValue: null, offValue: null },
      settings: [
        { key: 'onLabel', type: 'text', label: 'On text' },
        { key: 'offLabel', type: 'text', label: 'Off text' },
        { key: 'onIcon', type: 'icon', label: 'On icon', hint: 'Empty: the element icon.' },
        { key: 'offIcon', type: 'icon', label: 'Off icon' },
        { key: 'onColor', type: 'color', label: 'On color' },
        { key: 'onValue', type: 'value', source: 'command', label: 'On value', visible: (_, context) => context.commandSchema?.type !== 'boolean' },
        { key: 'offValue', type: 'value', source: 'command', label: 'Off value', visible: (_, context) => context.commandSchema?.type !== 'boolean' },
      ],
    },
    min: 1,
    max: 6,
  },
  suits: schema => schema.type === 'boolean' ? 1 : 0,
  upgrade(card) {
    for (const element of card.elements) {
      const on = element.properties.on;
      const off = element.properties.off;
      if (isJsonObject(on)) {
        element.properties.onLabel = on.name ?? 'On';
        element.properties.onIcon = normalizeIcon(on.icon as string) ?? '';
        element.properties.onColor = on.color ?? 'primary';
      }
      if (isJsonObject(off)) {
        element.properties.offLabel = off.name ?? 'Off';
        element.properties.offIcon = normalizeIcon(off.icon as string) ?? '';
      }
      delete element.properties.on;
      delete element.properties.off;
    }
  },
  sample: {
    name: 'Sockets',
    elements: [
      { name: 'Coffee maker', icon: 'mdi-coffee-maker', values: [true], schema: { type: 'boolean' }, command: true },
      { name: 'Christmas lights', icon: 'mdi-string-lights', values: [false], schema: { type: 'boolean' }, command: true },
    ],
  },
  component: defineAsyncComponent(() => import('./SwitchCard.vue')),
});
