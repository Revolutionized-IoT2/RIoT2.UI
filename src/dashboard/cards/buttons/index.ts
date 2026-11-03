import { defineAsyncComponent } from 'vue';
import { ComponentSize, ComponentType } from '@/models/enums';
import { defineCard } from '../../sdk/types';
import type { JsonValue } from '@/models/generated/contracts';

export type ButtonsSettings = { layout: 'grid' | 'row' };

export type ButtonElement = { mode: 'toggle' | 'push', onValue: JsonValue, offValue: JsonValue };

const notBoolean = (_: unknown, context: { commandSchema?: { type?: string | null } }) => context.commandSchema?.type !== 'boolean';

export default defineCard<ButtonsSettings, ButtonElement>({
  kind: 'buttons',
  title: 'Buttons',
  description: 'Tiles that switch devices on and off or run commands, with their state from reports.',
  icon: 'mdi-gesture-tap-button',
  category: 'controls',
  legacyType: settings => settings.layout === 'row' ? ComponentType.slideButton : ComponentType.button,
  replaces: [ComponentType.button, ComponentType.slideButton],
  defaultSize: ComponentSize.half,
  defaults: { layout: 'grid' },
  settings: [
    {
      key: 'layout', type: 'select', label: 'Layout', options: [
        { value: 'grid', title: 'Grid', icon: 'mdi-view-grid-outline' },
        { value: 'row', title: 'Scrolling row', icon: 'mdi-view-column-outline' },
      ],
    },
  ],
  elements: {
    each: {
      label: 'Button',
      report: 'optional',
      command: 'required',
      hint: 'The report shows whether the button is on.',
      defaults: { mode: 'toggle', onValue: null, offValue: null },
      settings: [
        {
          key: 'mode', type: 'select', label: 'Pressing', options: [
            { value: 'toggle', title: 'Toggles on and off', icon: 'mdi-toggle-switch-outline' },
            { value: 'push', title: 'Sends one value', icon: 'mdi-gesture-tap' },
          ],
        },
        { key: 'onValue', type: 'value', source: 'command', label: 'On value', hint: 'Sent to switch on; also how the report shows on.', visible: (settings, context) => settings.mode === 'push' || notBoolean(settings, context) },
        { key: 'offValue', type: 'value', source: 'command', label: 'Off value', visible: (settings, context) => settings.mode !== 'push' && notBoolean(settings, context) },
      ],
    },
    min: 1,
    max: 12,
  },
  suits: schema => schema.type === 'boolean' ? 0.6 : 0,
  upgrade(card) {
    card.settings = { ...card.settings, layout: card.type === ComponentType.slideButton ? 'row' : 'grid' };
  },
  sample: {
    name: 'Lights',
    elements: [
      { name: 'Kitchen', icon: 'mdi-ceiling-light', values: [true], schema: { type: 'boolean' }, command: true },
      { name: 'Hall', icon: 'mdi-lightbulb-outline', values: [false], schema: { type: 'boolean' }, command: true },
      { name: 'Garden', icon: 'mdi-outdoor-lamp', values: [false], schema: { type: 'boolean' }, command: true },
    ],
  },
  component: defineAsyncComponent(() => import('./ButtonsCard.vue')),
});
