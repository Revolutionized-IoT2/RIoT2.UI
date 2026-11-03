<script setup lang="ts">
import { computed } from 'vue';
import type { ITemplate } from '@/models/itemplate';
import type { SchemaType } from '@/models/valueSchema';
import { accepts as suitsTypes, templateSchema } from '../sdk/capabilities';
import { iconFor } from '../sdk/icons';

/**
 * Picks the report or command template an element binds. Templates whose value suits the slot
 * (`accepts`) come first; each shows its node, device and what its value is.
 */
const props = defineProps<{ templates: ITemplate[], label: string, accepts?: SchemaType[], required?: boolean, hint?: string }>();
const template = defineModel<ITemplate | null | undefined>();

const typeIcons: Record<string, string> = {
  boolean: 'mdi-toggle-switch-outline', number: 'mdi-numeric', integer: 'mdi-numeric', string: 'mdi-format-text', object: 'mdi-code-braces', array: 'mdi-format-list-bulleted',
};

const items = computed(() => props.templates
  .map(t => {
    const schema = templateSchema(t);
    return {
      template: t,
      id: t.id,
      title: t.name,
      subtitle: [t.node, t.device].filter(Boolean).join(' · '),
      icon: iconFor(schema?.semantic) ?? typeIcons[schema?.type ?? ''] ?? 'mdi-help-circle-outline',
      detail: [schema?.semantic, schema?.unit].filter(Boolean).join(' · '),
      suits: suitsTypes(schema, props.accepts),
    };
  })
  .sort((a, b) => Number(b.suits) - Number(a.suits) || a.subtitle.localeCompare(b.subtitle) || a.title.localeCompare(b.title)));

const selected = computed({
  get: () => template.value?.id ?? null,
  set: id => { template.value = props.templates.find(t => t.id === id) ?? null; },
});

function filter(_: string, query: string, item?: { raw: { title: string, subtitle: string, detail: string } }) {
  const text = `${item?.raw.title} ${item?.raw.subtitle} ${item?.raw.detail}`.toLowerCase();
  return query.toLowerCase().split(/\s+/).every(word => text.includes(word));
}
</script>

<template>
  <v-autocomplete
    v-model="selected"
    :items="items"
    item-title="title"
    item-value="id"
    :label="label"
    :hint="hint"
    :persistent-hint="!!hint"
    :rules="required ? [(v: unknown) => !!v || 'Required'] : []"
    :custom-filter="filter"
    clearable
    auto-select-first
  >
    <template #selection="{ item }">
      <span class="d-flex align-center ga-2 text-truncate">
        <v-icon :icon="item.icon" size="18" />
        <span class="text-truncate">{{ item.title }}</span>
        <span class="text-medium-emphasis text-body-small text-truncate">{{ item.subtitle }}</span>
      </span>
    </template>
    <template #item="{ props: itemProps, item }">
      <v-list-item v-bind="itemProps" :subtitle="item.subtitle" :prepend-icon="item.icon" :class="{ 'opacity-60': !item.suits }">
        <template #append>
          <v-chip v-if="item.detail" size="x-small" variant="tonal" label>{{ item.detail }}</v-chip>
        </template>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>
