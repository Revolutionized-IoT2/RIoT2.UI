// Creates a new dashboard card type: src/dashboard/cards/<kind>/index.ts and <Name>Card.vue, ready to
// edit. The registry finds it by its folder; nothing else needs to change. See src/dashboard/README.md.
//
//   npm run new-card -- <kind> ["Title"]
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [kind, titleArgument] = process.argv.slice(2);

if (!kind || !/^[a-z][a-z0-9-]*$/.test(kind)) {
  console.error('Usage: npm run new-card -- <kind> ["Title"]   (kind: lower case, such as "thermostat" or "air-quality")');
  process.exit(1);
}

const pascal = kind.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('');
const title = titleArgument ?? pascal.replace(/([a-z])([A-Z])/g, '$1 $2');
const folder = join(root, 'src', 'dashboard', 'cards', kind);

if (existsSync(folder)) {
  console.error(`${relative(root, folder)} exists already.`);
  process.exit(1);
}

const definition = `import { defineAsyncComponent } from 'vue';
import { ComponentSize, ComponentType } from '@/models/enums';
import { defineCard } from '../../sdk/types';
import { isNumeric } from '../../sdk/capabilities';

/** The card's own settings: one field each below, with its default. */
export type ${pascal}Settings = {
  showTrend: boolean;
};

/** Each element's settings (stored in the element's properties). */
export type ${pascal}Element = {
  member: string;
  unit: string;
};

export default defineCard<${pascal}Settings, ${pascal}Element>({
  kind: '${kind}',
  title: '${title}',
  description: 'What the card shows, in one sentence, for the card gallery.',
  icon: 'mdi-card-outline',
  category: 'sensors',
  // What older UIs show instead: the closest of the original card types.
  legacyType: ComponentType.numericValue,
  defaultSize: ComponentSize.small,
  compact: true,
  defaults: { showTrend: true },
  settings: [
    { key: 'showTrend', type: 'boolean', label: 'Show the trend' },
  ],
  elements: {
    each: {
      label: 'Value',
      report: 'required',
      command: 'none',
      accepts: ['number', 'integer'],
      history: 24,
      defaults: { member: '', unit: '' },
      settings: [
        { key: 'member', type: 'member', label: 'Value', accepts: ['number', 'integer'], visible: (_, context) => context.reportSchema?.type === 'object' },
        { key: 'unit', type: 'unit', label: 'Unit' },
      ],
    },
    min: 1,
    max: 1,
  },
  // How well the card suits a value, from 0 to 1.
  suits: schema => isNumeric(schema) ? 0.5 : 0,
  sample: {
    name: '${title}',
    elements: [{ name: 'Value', values: [12, 14, 13, 15, 17], schema: { type: 'number', unit: '°C' } }],
  },
  component: defineAsyncComponent(() => import('./${pascal}Card.vue')),
});
`;

const component = `<script setup lang="ts">
import { computed } from 'vue';
import CardShell from '../../components/CardShell.vue';
import { formatNumber, trend, useCardSettings, useElement, type CardProps } from '../../sdk';
import type { ${pascal}Element, ${pascal}Settings } from './index';

const props = defineProps<CardProps>();
const settings = useCardSettings<${pascal}Settings>(props);
const reading = useElement<${pascal}Element>(props);

const direction = computed(() => settings.value.showTrend ? trend(reading.value.history.map(point => point.number)) : undefined);
const state = computed(() => !reading.value.bound ? 'unbound' : reading.value.hasValue ? 'ready' : 'waiting');
</script>

<template>
  <CardShell :title="card.name || reading.element?.name" :subtitle="card.description" :icon="card.icon || 'mdi-card-outline'" :state="state" :updated="reading.updated">
    <div class="${kind}">
      <span class="${kind}__value">{{ formatNumber(reading.number) }}</span>
      <span class="${kind}__unit">{{ reading.unit }}</span>
      <span v-if="direction">{{ direction }}</span>
    </div>
  </CardShell>
</template>

<style scoped>
.${kind} {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.${kind}__value {
  font-size: clamp(2rem, 16cqi, 3rem);
  font-weight: 500;
}

.${kind}__unit {
  opacity: 0.7;
}
</style>
`;

mkdirSync(folder, { recursive: true });
writeFileSync(join(folder, 'index.ts'), definition);
writeFileSync(join(folder, `${pascal}Card.vue`), component);
console.log(`Created ${relative(root, folder)}: index.ts and ${pascal}Card.vue.`);
console.log('It is in the card gallery now (npm run dev). Edit its definition and component; npm test checks every card renders.');
