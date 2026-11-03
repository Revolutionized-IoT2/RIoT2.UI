<script setup lang="ts">
import { computed } from 'vue';
import IconField from '@/components/IconField.vue';
import ColorField from '@/components/ColorField.vue';
import SchemaValueInput from '@/components/SchemaValueInput.vue';
import type { JsonValue } from '@/models/generated/contracts';
import { memberOptions } from '../sdk/capabilities';
import type { FieldContext, SettingField, Settings } from '../sdk/types';

/**
 * The form for a card's or an element's settings, built from the fields its card type declares
 * (src/dashboard/sdk/types.ts SettingField). Fields that don't apply (`visible`) are left out.
 */
defineOptions({ name: 'SettingsForm' });

const props = defineProps<{ fields: SettingField[], context?: FieldContext }>();
const settings = defineModel<Settings>({ required: true });

const context = computed<FieldContext>(() => props.context ?? {});
const shown = computed(() => props.fields.filter(field => field.visible?.(settings.value, context.value) ?? true));

const commonUnits = ['°C', '°F', '%', 'hPa', 'lx', 'W', 'kW', 'kWh', 'V', 'A', 'ppm', 'm³', 'l', 'km/h', 'm/s', 'dB', 's', 'min', 'h', '€', 'c/kWh'];

function set(key: string, value: JsonValue | undefined) {
  settings.value = { ...settings.value, [key]: value ?? null };
}

function numberValue(text: string | number | null) {
  if (text === '' || text == null)
    return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

const wide = (field: SettingField) => ['textarea', 'markdown', 'list', 'value'].includes(field.type);
const segmented = (field: SettingField) => field.type === 'select' && field.options.length <= 4;

function list(key: string): Settings[] {
  const value = settings.value[key];
  return Array.isArray(value) ? value as Settings[] : [];
}

function setItem(key: string, index: number, item: Settings) {
  const items = list(key).slice();
  items[index] = item;
  set(key, items);
}

function addItem(field: Extract<SettingField, { type: 'list' }>) {
  set(field.key, [...list(field.key), field.newItem()]);
}

function removeItem(key: string, index: number) {
  set(key, list(key).filter((_, i) => i !== index));
}

function moveItem(key: string, index: number, offset: number) {
  const items = list(key).slice();
  const to = index + offset;
  if (to < 0 || to >= items.length)
    return;
  [items[index], items[to]] = [items[to], items[index]];
  set(key, items);
}

const members = computed(() => (accepts?: Extract<SettingField, { type: 'member' }>['accepts']) =>
  memberOptions(context.value.reportSchema, accepts).map(option => ({ title: option.path, value: option.path, subtitle: [option.schema.type, option.schema.unit].filter(Boolean).join(' · ') })));
</script>

<template>
  <div class="settings-form">
    <div v-for="field in shown" :key="field.key" class="settings-form__field" :class="{ 'settings-form__field--wide': wide(field) }">
      <v-text-field
        v-if="field.type === 'text'"
        :model-value="settings[field.key] ?? ''"
        :label="field.label"
        :placeholder="field.placeholder"
        :hint="field.hint"
        :persistent-hint="!!field.hint"
        @update:model-value="v => set(field.key, v)"
      />

      <v-textarea
        v-else-if="field.type === 'textarea' || field.type === 'markdown'"
        :model-value="String(settings[field.key] ?? '')"
        :label="field.label"
        :rows="field.rows ?? 3"
        :hint="field.hint"
        :persistent-hint="!!field.hint"
        auto-grow
        :class="{ 'settings-form__code': field.type === 'markdown' }"
        @update:model-value="v => set(field.key, v)"
      />

      <v-text-field
        v-else-if="field.type === 'number'"
        :model-value="settings[field.key] ?? ''"
        type="number"
        inputmode="decimal"
        :label="field.label"
        :min="field.min"
        :max="field.max"
        :step="field.step"
        :suffix="field.suffix"
        :hint="field.hint"
        :persistent-hint="!!field.hint"
        @update:model-value="v => set(field.key, numberValue(v))"
      />

      <v-switch
        v-else-if="field.type === 'boolean'"
        :model-value="settings[field.key] === true"
        :label="field.label"
        :hint="field.hint"
        :persistent-hint="!!field.hint"
        color="primary"
        inset
        density="comfortable"
        @update:model-value="v => set(field.key, !!v)"
      />

      <div v-else-if="segmented(field) && field.type === 'select'" class="settings-form__segmented">
        <div class="settings-form__label">{{ field.label }}</div>
        <v-btn-toggle
          :model-value="settings[field.key]"
          mandatory
          divided
          variant="outlined"
          color="primary"
          density="comfortable"
          rounded="xl"
          @update:model-value="v => set(field.key, v)"
        >
          <v-btn v-for="option in field.options" :key="String(option.value)" :value="option.value" :prepend-icon="option.icon" class="text-none">{{ option.title }}</v-btn>
        </v-btn-toggle>
        <div v-if="field.hint" class="settings-form__hint">{{ field.hint }}</div>
      </div>

      <v-select
        v-else-if="field.type === 'select'"
        :model-value="settings[field.key]"
        :items="field.options"
        item-title="title"
        item-value="value"
        :label="field.label"
        :hint="field.hint"
        :persistent-hint="!!field.hint"
        @update:model-value="v => set(field.key, v)"
      >
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps" :prepend-icon="item.icon" />
        </template>
      </v-select>

      <IconField
        v-else-if="field.type === 'icon'"
        :model-value="(settings[field.key] as string | null) ?? ''"
        :label="field.label"
        :hint="field.hint"
        @update:model-value="v => set(field.key, v)"
      />

      <ColorField
        v-else-if="field.type === 'color'"
        :model-value="(settings[field.key] as string | null) ?? ''"
        :label="field.label"
        :hint="field.hint"
        @update:model-value="v => set(field.key, v)"
      />

      <v-combobox
        v-else-if="field.type === 'unit'"
        :model-value="(settings[field.key] as string | null) || null"
        :items="commonUnits"
        :label="field.label"
        :placeholder="context.valueSchema?.unit ?? undefined"
        :hint="field.hint ?? (context.valueSchema?.unit ? `Empty: ${context.valueSchema.unit}, as the device declares.` : undefined)"
        persistent-hint
        clearable
        @update:model-value="v => set(field.key, v ?? '')"
      />

      <v-combobox
        v-else-if="field.type === 'member'"
        :model-value="(settings[field.key] as string | null) || null"
        :items="members(field.accepts)"
        :return-object="false"
        item-title="title"
        item-value="value"
        :label="field.label"
        :hint="field.hint ?? 'The member of the report to show.'"
        persistent-hint
        clearable
        @update:model-value="v => set(field.key, v ?? '')"
      >
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps" :subtitle="item.subtitle" />
        </template>
      </v-combobox>

      <SchemaValueInput
        v-else-if="field.type === 'value'"
        :model-value="settings[field.key] ?? undefined"
        :schema="field.source === 'command' ? context.commandSchema : context.valueSchema ?? context.reportSchema"
        :label="field.label"
        :hint="field.hint"
        @update:model-value="v => set(field.key, v)"
      />

      <div v-else-if="field.type === 'list'" class="settings-form__list">
        <div class="settings-form__label">{{ field.label }}</div>
        <div v-if="field.hint" class="settings-form__hint mb-2">{{ field.hint }}</div>
        <v-expansion-panels variant="accordion" multiple>
          <v-expansion-panel v-for="(item, index) in list(field.key)" :key="index" rounded="lg">
            <v-expansion-panel-title>
              <span class="flex-grow-1">{{ field.itemTitle?.(item, index) ?? `${index + 1}` }}</span>
              <template #actions="{ expanded }">
                <v-btn icon="mdi-arrow-up" size="x-small" variant="text" :disabled="index === 0" aria-label="Move up" @click.stop="moveItem(field.key, index, -1)" />
                <v-btn icon="mdi-arrow-down" size="x-small" variant="text" :disabled="index === list(field.key).length - 1" aria-label="Move down" @click.stop="moveItem(field.key, index, 1)" />
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" aria-label="Remove" @click.stop="removeItem(field.key, index)" />
                <v-icon :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
              </template>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <SettingsForm :model-value="item" :fields="field.fields" :context="context" @update:model-value="v => setItem(field.key, index, v)" />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-btn class="mt-2 text-none" variant="tonal" prepend-icon="mdi-plus" @click="addItem(field)">Add</v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-form {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  gap: 12px 16px;
  align-items: start;
}

.settings-form__field--wide {
  grid-column: 1 / -1;
}

.settings-form__label {
  font-size: 0.85rem;
  margin-bottom: 6px;
  opacity: 0.8;
}

.settings-form__hint {
  font-size: 0.75rem;
  opacity: 0.65;
  margin-top: 4px;
}

.settings-form__segmented :deep(.v-btn-group) {
  flex-wrap: wrap;
  height: auto;
}

.settings-form__code :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.85rem;
}
</style>
