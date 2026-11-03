import { defineAsyncComponent } from 'vue';
import { ComponentSize, ComponentType } from '@/models/enums';
import { defineCard } from '../../sdk/types';

export type ActivitySettings = { bucketSeconds: number, buckets: number };

export type ActivityElement = { member: string };

export default defineCard<ActivitySettings, ActivityElement>({
  kind: 'activity',
  title: 'Activity',
  description: 'How often something happened (a true report) in each recent period, such as motion per minute.',
  icon: 'mdi-chart-timeline-variant',
  category: 'charts',
  legacyType: ComponentType.timeline,
  replaces: [ComponentType.timeline],
  defaultSize: ComponentSize.half,
  defaults: { bucketSeconds: 60, buckets: 12 },
  settings: [
    {
      key: 'bucketSeconds', type: 'select', label: 'Each bar', options: [
        { value: 5, title: '5 seconds' }, { value: 60, title: '1 minute' }, { value: 300, title: '5 minutes' },
        { value: 900, title: '15 minutes' }, { value: 3600, title: '1 hour' },
      ],
    },
    { key: 'buckets', type: 'number', label: 'Bars', min: 4, max: 48, step: 1 },
  ],
  elements: {
    each: {
      label: 'Event',
      hint: 'Keep a history on the template: the bars count the true reports in it.',
      report: 'required',
      command: 'none',
      accepts: ['boolean'],
      history: 100,
      defaults: { member: '' },
      settings: [
        { key: 'member', type: 'member', label: 'Value', accepts: ['boolean'], visible: (_, context) => context.reportSchema?.type === 'object' },
      ],
    },
    min: 1,
    max: 1,
  },
  suits: schema => schema.type === 'boolean' ? 0.5 : 0,
  upgrade(card) {
    card.settings = { ...card.settings, bucketSeconds: 60, buckets: 12 };
  },
  sample: {
    name: 'Hallway motion',
    elements: [{ name: 'Motion', values: [true, false, true, true, false, true, false, true, true, true], schema: { type: 'boolean', semantic: 'motion' } }],
  },
  component: defineAsyncComponent(() => import('./ActivityCard.vue')),
});
