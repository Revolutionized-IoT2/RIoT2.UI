import { defineAsyncComponent } from 'vue';
import { ComponentSize, ComponentType } from '@/models/enums';
import { defineCard } from '../../sdk/types';
import { upgradeMember } from '../../sdk/upgrade';

export type ImageSettings = { aspectRatio: string, fit: 'cover' | 'contain', showHistory: boolean };

export type ImageElement = { member: string };

export default defineCard<ImageSettings, ImageElement>({
  kind: 'image',
  title: 'Image',
  description: 'An image from a URL in the report, such as a camera snapshot, with the earlier ones to swipe through.',
  icon: 'mdi-image-outline',
  category: 'media',
  legacyType: ComponentType.image,
  replaces: [ComponentType.image],
  defaultSize: ComponentSize.half,
  defaults: { aspectRatio: '16/9', fit: 'cover', showHistory: true },
  settings: [
    {
      key: 'aspectRatio', type: 'select', label: 'Shape', options: [
        { value: '16/9', title: 'Wide (16:9)' }, { value: '4/3', title: 'Standard (4:3)' }, { value: '1/1', title: 'Square' }, { value: '3/4', title: 'Portrait' },
      ],
    },
    { key: 'fit', type: 'select', label: 'Fit', options: [{ value: 'cover', title: 'Fill' }, { value: 'contain', title: 'Whole image' }] },
    { key: 'showHistory', type: 'boolean', label: 'Swipe through earlier images' },
  ],
  elements: {
    each: {
      label: 'Image',
      report: 'required',
      command: 'none',
      accepts: ['string'],
      history: 10,
      defaults: { member: '' },
      settings: [
        { key: 'member', type: 'member', label: 'Image URL', accepts: ['string'], visible: (_, context) => context.reportSchema?.type === 'object' },
      ],
    },
    min: 1,
    max: 1,
  },
  suits: schema => schema.semantic === 'image' ? 1 : 0,
  upgrade(card) {
    for (const element of card.elements)
      upgradeMember(element, 'url');
  },
  sample: {
    name: 'Front door',
    elements: [{ name: 'Snapshot', values: ['https://picsum.photos/seed/riot2/640/360'], schema: { type: 'string', semantic: 'image' } }],
  },
  component: defineAsyncComponent(() => import('./ImageCard.vue')),
});
