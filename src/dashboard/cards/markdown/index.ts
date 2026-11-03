import { defineAsyncComponent } from 'vue';
import { ComponentSize, ComponentType } from '@/models/enums';
import { defineCard } from '../../sdk/types';

export type MarkdownSettings = { content: string, tone: 'plain' | 'info' | 'warning' | 'success' };

export default defineCard<MarkdownSettings>({
  kind: 'markdown',
  title: 'Note',
  description: 'Text with Markdown formatting: headings, lists, links and emphasis. For instructions or a welcome.',
  icon: 'mdi-language-markdown-outline',
  category: 'other',
  legacyType: ComponentType.image,
  defaultSize: ComponentSize.half,
  defaults: { content: '## Welcome\nWrite **Markdown** here.', tone: 'plain' },
  settings: [
    { key: 'content', type: 'markdown', label: 'Text', rows: 8, hint: 'Markdown: # heading, **bold**, *italic*, - list, [link](https://…)' },
    {
      key: 'tone', type: 'select', label: 'Look', options: [
        { value: 'plain', title: 'Plain' }, { value: 'info', title: 'Info', icon: 'mdi-information-outline' },
        { value: 'warning', title: 'Warning', icon: 'mdi-alert-outline' }, { value: 'success', title: 'Success', icon: 'mdi-check-circle-outline' },
      ],
    },
  ],
  sample: {
    name: 'Note',
    settings: { content: '### Holiday mode\nHeating is **lowered** until Sunday.\n- Lights on a schedule\n- Alarm armed', tone: 'info' },
    elements: [],
  },
  component: defineAsyncComponent(() => import('./MarkdownCard.vue')),
});
