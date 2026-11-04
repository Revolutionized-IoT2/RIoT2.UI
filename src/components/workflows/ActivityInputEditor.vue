<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { JsonValue } from '@/models/generated/contracts';
import { isJsonObject } from '@/composables/jsonValue';
import { inputLanguage, inputText, splitList, withInput, SelectorHint, type ActivityModel } from '@/composables/workflowGraph';
import { useLlmStore } from '@/stores/llmStore';
import { useWorkflowsStore } from '@/stores/workflowsStore';
import { TemplateType, type WorkflowInputDefinition, type WorkflowTemplateItem } from '@/models/workflow';
import RiotSelectorInput from './RiotSelectorInput.vue';

// One input of the selected activity (after Dls's inspector): the editor its UI hint asks for, and the expression
// language for inputs that take one. Changes come back as a changed activity.
const props = defineProps<{ activity: ActivityModel; input: WorkflowInputDefinition; languages: string[]; readOnly: boolean }>();
const emit = defineEmits<{ change: [activity: ActivityModel] }>();

const llm = useLlmStore();
const workflows = useWorkflowsStore();
const commands = ref<WorkflowTemplateItem[]>([]);

const hint = computed(() => props.input.uiHint ?? '');
const language = computed(() => inputLanguage(props.activity, props.input));
const value = computed(() => inputText(props.activity, props.input));
const custom = computed(() => [SelectorHint, 'riot-llm-connection', 'riot-llm-tools', 'riot-command-list', 'checkbox', 'dropdown'].includes(hint.value));
// Expressions only where Elsa wraps the input and the editor isn't a picker.
const usesLanguage = computed(() => props.input.isWrapped && (!custom.value || language.value !== 'Literal'));
const code = computed(() => language.value !== 'Literal' || ['multiline', 'code-editor', 'json-editor', 'riot-json-schema'].includes(hint.value));
const numeric = computed(() => /^(Int16|Int32|Int64|Single|Double|Decimal)\??$/.test(props.input.typeName));
const label = computed(() => props.input.displayName ?? props.input.key);

const dropdownItems = computed(() => {
  const options = isJsonObject(props.input.options) ? props.input.options.dropdown : undefined;
  const items = isJsonObject(options) && Array.isArray(options.items) ? options.items : [];
  return items.map(item => isJsonObject(item) ? { title: String(item.text ?? item.value ?? ''), value: String(item.value ?? item.text ?? '') } : { title: String(item), value: String(item) });
});
const schemaError = computed(() => {
  if (hint.value !== 'riot-json-schema' || !value.value.trim())
    return '';
  try {
    JSON.parse(value.value);
    return '';
  } catch {
    return 'Enter a JSON schema, such as {"type":"object"}.';
  }
});

onMounted(async () => {
  if (hint.value === 'riot-llm-connection' && !llm.connections.length)
    await llm.load();
  if (hint.value === 'riot-command-list')
    commands.value = await workflows.loadTemplates([TemplateType.Command]);
});

function set(next: JsonValue, nextLanguage = language.value) {
  emit('change', withInput(props.activity, props.input, nextLanguage, next));
}

/** A literal in the input's type: numbers and booleans as such, the rest as text. */
function setLiteral(textValue: string) {
  if (language.value === 'Literal' && numeric.value && textValue.trim() !== '' && !Number.isNaN(Number(textValue)))
    set(Number(textValue));
  else if (language.value === 'Literal' && /^Boolean\??$/.test(props.input.typeName) && (textValue === 'true' || textValue === 'false'))
    set(textValue === 'true');
  else
    set(textValue);
}

function setLanguage(next: string) {
  set(value.value, next);
}
</script>

<template>
  <div class="wf-input">
    <div class="wf-input__label">
      <span>{{ label }}</span>
      <v-select v-if="usesLanguage" :model-value="language" :items="languages" :aria-label="`${label} language`" density="compact"
                variant="plain" hide-details class="wf-language" :disabled="readOnly" @update:model-value="setLanguage(String($event))" />
    </div>

    <template v-if="language === 'Literal'">
      <RiotSelectorInput v-if="hint === 'riot-output-selector'" :input="input" :model-value="value" :read-only="readOnly"
                         @update:model-value="set($event)" />
      <v-select v-else-if="hint === 'riot-llm-connection'" :model-value="value || null" :items="llm.connections" item-title="name"
                item-value="name" :aria-label="label" placeholder="Choose a connection" density="compact" hide-details="auto"
                :readonly="readOnly" no-data-text="No connections: add one under AI models" @update:model-value="set($event ?? '')">
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps" :subtitle="`${item.provider} · ${item.model}${item.enabled ? '' : ' · disabled'}`" />
        </template>
      </v-select>
      <v-select v-else-if="hint === 'riot-llm-tools'" :model-value="splitList(value)" :items="['ReadValues', 'SendCommands', 'PlanCommands']" multiple chips
                closable-chips :aria-label="label" placeholder="No tools: the model only answers" density="compact" hide-details="auto"
                :readonly="readOnly" @update:model-value="set(($event as string[]).join(', '))" />
      <v-autocomplete v-else-if="hint === 'riot-command-list'" :model-value="splitList(value)" :items="commands" item-title="name" item-value="id"
                      multiple chips closable-chips :aria-label="label" density="compact" hide-details="auto" :readonly="readOnly"
                      @update:model-value="set(($event as string[]).join(', '))" />
      <v-switch v-else-if="hint === 'checkbox'" :model-value="value === 'true'" color="primary" density="compact" hide-details :label="label"
                :disabled="readOnly" @update:model-value="set(Boolean($event))" />
      <v-select v-else-if="hint === 'dropdown' && dropdownItems.length" :model-value="value" :items="dropdownItems" :aria-label="label"
                density="compact" hide-details="auto" :readonly="readOnly" @update:model-value="setLiteral(String($event ?? ''))" />
      <v-textarea v-else-if="code" :model-value="value" :class="{ 'wf-code': hint !== 'multiline' }" rows="3" auto-grow density="compact"
                  :aria-label="label" :error-messages="schemaError" hide-details="auto" :readonly="readOnly"
                  @update:model-value="setLiteral(String($event))" />
      <v-text-field v-else :model-value="value" :type="numeric ? 'number' : 'text'" :aria-label="label" density="compact" hide-details="auto"
                    :readonly="readOnly" @update:model-value="setLiteral(String($event))" />
    </template>
    <v-textarea v-else :model-value="value" class="wf-code" rows="3" auto-grow density="compact" :aria-label="`${label} (${language})`"
                hide-details="auto" :readonly="readOnly" @update:model-value="set(String($event))" />

    <div v-if="input.description" class="wf-input__hint">{{ input.description }}</div>
  </div>
</template>
