import { defineAsyncComponent } from 'vue';
import { ComponentSize, ComponentType } from '@/models/enums';
import { defineCard } from '../../sdk/types';

export type MotionSettings = { holdSeconds: number, activeLabel: string, idleLabel: string };

export type MotionElement = { member: string };

export default defineCard<MotionSettings, MotionElement>({
  kind: 'motion',
  title: 'Motion',
  description: 'Whether a motion or presence sensor sees someone now, and when it last did.',
  icon: 'mdi-motion-sensor',
  category: 'sensors',
  legacyType: ComponentType.state,
  defaultSize: ComponentSize.small,
  compact: true,
  defaults: { holdSeconds: 60, activeLabel: 'Motion', idleLabel: 'Clear' },
  settings: [
    { key: 'holdSeconds', type: 'number', label: 'Stay active for (seconds)', min: 0, hint: 'After the last motion report, for sensors that report motion only once.' },
    { key: 'activeLabel', type: 'text', label: 'Active text' },
    { key: 'idleLabel', type: 'text', label: 'Idle text' },
  ],
  elements: {
    each: {
      label: 'Sensor',
      report: 'required',
      command: 'none',
      accepts: ['boolean'],
      history: 50,
      defaults: { member: '' },
      settings: [
        { key: 'member', type: 'member', label: 'Motion', accepts: ['boolean'], visible: (_, context) => context.reportSchema?.type === 'object' },
      ],
    },
    min: 1,
    max: 1,
  },
  suits: schema => schema.semantic === 'motion' || schema.semantic === 'occupancy' ? 1 : schema.type === 'boolean' ? 0.3 : 0,
  sample: {
    name: 'Hallway',
    elements: [{ name: 'Motion', values: [false, true, false, true], schema: { type: 'boolean', semantic: 'motion' } }],
  },
  component: defineAsyncComponent(() => import('./MotionCard.vue')),
});
