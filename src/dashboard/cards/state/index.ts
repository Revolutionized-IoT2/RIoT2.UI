import { defineAsyncComponent } from 'vue';
import { ComponentSize, ComponentType } from '@/models/enums';
import type { JsonValue } from '@/models/generated/contracts';
import { defineCard } from '../../sdk/types';
import { normalizeIcon } from '../../sdk/icons';
import { upgradeMember } from '../../sdk/upgrade';

export type StateItem = { value: JsonValue, name: string, icon: string, color: string };

export type StateElement = { member: string, states: StateItem[], expireMinutes: number | null };

export default defineCard<Record<string, never>, StateElement>({
  kind: 'state',
  title: 'State',
  description: 'Shows which of its states a device is in, each with its own icon, color and name.',
  icon: 'mdi-state-machine',
  category: 'sensors',
  legacyType: ComponentType.state,
  replaces: [ComponentType.state],
  defaultSize: ComponentSize.small,
  compact: true,
  defaults: {},
  elements: {
    each: {
      label: 'State',
      report: 'required',
      command: 'none',
      defaults: { member: '', states: [{ value: 1, name: 'On', icon: 'mdi-check-circle', color: 'success' }, { value: 0, name: 'Off', icon: 'mdi-circle-outline', color: 'grey' }], expireMinutes: null },
      settings: [
        { key: 'member', type: 'member', label: 'Value', visible: (_, context) => context.reportSchema?.type === 'object' },
        {
          key: 'states', type: 'list', label: 'States',
          hint: 'The first state whose value equals the report is shown.',
          itemTitle: item => String(item.name || item.value),
          newItem: () => ({ value: '', name: '', icon: 'mdi-circle', color: 'primary' }),
          fields: [
            { key: 'value', type: 'value', source: 'report', label: 'Value' },
            { key: 'name', type: 'text', label: 'Name' },
            { key: 'icon', type: 'icon', label: 'Icon' },
            { key: 'color', type: 'color', label: 'Color' },
          ],
        },
        { key: 'expireMinutes', type: 'number', label: 'Forget after (minutes)', min: 0, hint: 'Shows "Unknown" when no report came for this long. Empty: never.' },
      ],
    },
    min: 1,
    max: 1,
  },
  suits: schema => schema.enum != null ? 1 : schema.type === 'integer' || schema.type === 'string' ? 0.4 : 0,
  upgrade(card) {
    for (const element of card.elements) {
      upgradeMember(element);
      const states = Array.isArray(element.properties.states) ? element.properties.states as StateItem[] : [];
      element.properties.states = states.map(state => ({ ...state, icon: normalizeIcon(state.icon) ?? 'mdi-circle' }));
      // Before card kinds, a state card with one state forgot it after 12 minutes.
      element.properties.expireMinutes = states.length === 1 ? 12 : null;
    }
  },
  sample: {
    name: 'Alarm',
    elements: [{
      name: 'Alarm', values: [2],
      properties: { states: [
        { value: 0, name: 'Disarmed', icon: 'mdi-shield-off-outline', color: 'grey' },
        { value: 1, name: 'Armed home', icon: 'mdi-shield-home', color: 'warning' },
        { value: 2, name: 'Armed away', icon: 'mdi-shield-lock', color: 'success' },
      ] },
      schema: { type: 'integer', enum: [0, 1, 2] },
    }],
  },
  component: defineAsyncComponent(() => import('./StateCard.vue')),
});
