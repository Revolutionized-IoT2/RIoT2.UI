<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { JsonValue } from '@/models/generated/contracts';
import type { ValueSchema } from '@/models/valueSchema';
import { isJsonObject } from '@/composables/jsonValue';

/**
 * A value edited as its schema describes (device capability discovery): a switch for a boolean, a
 * slider for a number with a range, a list for an enum, a field per member for an entity. Without a
 * schema, or for arrays, it is JSON text.
 */
defineOptions({ name: 'SchemaValueInput' });

const props = defineProps<{ schema?: ValueSchema | null, label: string, hint?: string }>();
const value = defineModel<JsonValue | undefined>();

const type = computed(() => props.schema?.type ?? undefined);
const numeric = computed(() => type.value === 'number' || type.value === 'integer');
const ranged = computed(() => numeric.value && props.schema?.minimum != null && props.schema?.maximum != null);
const step = computed(() => props.schema?.multipleOf ?? (type.value === 'integer' ? 1 : undefined));
const fieldHint = computed(() => [props.hint, props.schema?.description].filter(Boolean).join(' '));
const enumItems = computed(() => (props.schema?.enum ?? []).map(item => ({ title: String(item), value: item })));

function setNumber(text: string | number | null) {
  if (text === '' || text == null) {
    value.value = null;
    return;
  }
  const n = Number(text);
  value.value = Number.isFinite(n) ? (type.value === 'integer' ? Math.round(n) : n) : value.value;
}

function setMember(name: string, member: JsonValue | undefined) {
  value.value = { ...(isJsonObject(value.value) ? value.value : {}), [name]: member ?? null };
}

// JSON text for values the schema doesn't describe: kept as typed while it isn't valid JSON yet.
const json = ref('');
const jsonError = ref<string>();

function sameAsText(current: JsonValue | undefined, text: string): boolean {
  try {
    return JSON.stringify(current ?? null) === JSON.stringify(JSON.parse(text || 'null'));
  } catch {
    return typeof current === 'string' && current === text.trim();
  }
}

watch(value, current => {
  if (!sameAsText(current, json.value))
    json.value = current === undefined || current === null ? '' : JSON.stringify(current, null, 2);
}, { immediate: true });

function setJson(text: string) {
  json.value = text;
  if (text.trim() === '') {
    value.value = null;
    jsonError.value = undefined;
    return;
  }
  try {
    value.value = JSON.parse(text);
    jsonError.value = undefined;
  } catch {
    // Plain words are text values: on, off, open.
    if (/^[\p{L}\p{N}_ .-]+$/u.test(text.trim())) {
      value.value = text.trim();
      jsonError.value = undefined;
    } else {
      jsonError.value = 'Not valid JSON';
    }
  }
}
</script>

<template>
  <v-text-field
    v-if="schema?.readOnly"
    :model-value="value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)"
    :label="label"
    :suffix="schema?.unit ?? undefined"
    :hint="fieldHint || 'Read only'"
    persistent-hint
    readonly
  />

  <div v-else-if="type === 'boolean'" class="schema-value">
    <v-switch :model-value="value === true" :label="label" :hint="fieldHint" :persistent-hint="!!fieldHint" color="primary" inset @update:model-value="v => (value = !!v)" />
  </div>

  <v-select
    v-else-if="enumItems.length > 0"
    :model-value="value"
    :items="enumItems"
    :label="label"
    :hint="fieldHint"
    :persistent-hint="!!fieldHint"
    @update:model-value="v => (value = v)"
  />

  <div v-else-if="ranged" class="schema-value">
    <div class="schema-value__label">{{ label }}<span v-if="schema?.unit"> ({{ schema.unit }})</span></div>
    <v-slider
      :model-value="typeof value === 'number' ? value : Number(schema!.minimum)"
      :min="schema!.minimum!"
      :max="schema!.maximum!"
      :step="step ?? (schema!.maximum! - schema!.minimum! > 20 ? 1 : 0.1)"
      thumb-label
      hide-details
      color="primary"
      @update:model-value="setNumber"
    >
      <template #append>
        <v-text-field :model-value="value" type="number" density="compact" hide-details style="width: 96px" @update:model-value="setNumber" />
      </template>
    </v-slider>
    <div v-if="fieldHint" class="schema-value__hint">{{ fieldHint }}</div>
  </div>

  <v-text-field
    v-else-if="numeric"
    :model-value="value"
    type="number"
    inputmode="decimal"
    :label="label"
    :suffix="schema?.unit ?? undefined"
    :step="step"
    :hint="fieldHint"
    :persistent-hint="!!fieldHint"
    @update:model-value="setNumber"
  />

  <v-text-field
    v-else-if="type === 'string'"
    :model-value="value == null ? '' : String(value)"
    :label="label"
    :hint="fieldHint"
    :persistent-hint="!!fieldHint"
    @update:model-value="v => (value = v)"
  />

  <fieldset v-else-if="type === 'object' && schema?.properties" class="schema-value schema-value--object">
    <legend>{{ label }}</legend>
    <SchemaValueInput
      v-for="(member, name) in schema.properties"
      :key="name"
      :schema="member"
      :label="member.title ?? String(name)"
      :model-value="isJsonObject(value) ? value[name] : undefined"
      @update:model-value="v => setMember(String(name), v)"
    />
  </fieldset>

  <v-textarea
    v-else
    :model-value="json"
    :label="label"
    :hint="fieldHint || 'A JSON value, such as true, 42, &quot;on&quot; or {&quot;red&quot;: 255}'"
    persistent-hint
    :error-messages="jsonError"
    rows="1"
    auto-grow
    class="schema-value__json"
    @update:model-value="setJson"
  />
</template>

<style scoped>
.schema-value__label {
  font-size: 0.85rem;
  opacity: 0.8;
}

.schema-value__hint {
  font-size: 0.75rem;
  opacity: 0.65;
}

.schema-value--object {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px 12px;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-outline-variant)) 80%, transparent);
  border-radius: 12px;
}

.schema-value--object legend {
  padding-inline: 4px;
  font-size: 0.85rem;
  opacity: 0.8;
}

.schema-value__json :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.85rem;
}
</style>
