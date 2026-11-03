<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useWorkflowsStore } from '@/stores/workflowsStore';
import { defaultCommandScript, parseSelection, selectionText, selectorSettings } from '@/composables/workflowGraph';
import { TemplateType, type RIoTTemplateSelection, type WorkflowInputDefinition, type WorkflowTemplateItem } from '@/models/workflow';

// The RIoT template selector (riot-output-selector), which replaces Studio's: a report, command or variable from the
// orchestrator, and for commands the JavaScript that returns the value. Stored as the literal Studio stored.
const props = defineProps<{ input: WorkflowInputDefinition; modelValue: string; readOnly: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const workflows = useWorkflowsStore();
const settings = computed(() => selectorSettings(props.input));
const items = ref<WorkflowTemplateItem[]>([]);
const loadingItems = ref(false);
const selection = computed(() => parseSelection(props.modelValue));
const kindNames = ['Unknown', 'Command', 'Report', 'Variable'];
const kindIcons = ['mdi-help', 'mdi-export', 'mdi-flash-outline', 'mdi-variable'];

onMounted(async () => {
  loadingItems.value = true;
  items.value = await workflows.loadTemplates(settings.value.types);
  loadingItems.value = false;
});

// The stored choice, also when the orchestrator no longer lists it.
const choices = computed(() => {
  const current = selection.value;
  if (current?.Id && !items.value.some(x => x.id === current.Id))
    return [...items.value, { id: current.Id, name: current.Name || current.Id, type: current.Type, node: current.Node, device: current.Device, model: current.Model, templateType: current.TemplateType }];
  return items.value;
});

function choose(id: string | null) {
  const item = choices.value.find(x => x.id === id);
  if (!item) {
    emit('update:modelValue', '');
    return;
  }
  const keepScript = selection.value?.Id === item.id ? selection.value.Value : null;
  const next: RIoTTemplateSelection = {
    Id: item.id, Name: item.name, Type: item.type, Node: item.node, Device: item.device,
    Value: settings.value.hideEditor ? null : keepScript ?? defaultCommandScript(item.name, item.type, item.model),
    Model: item.model ?? null, TemplateType: item.templateType
  };
  emit('update:modelValue', selectionText(next));
}

function setScript(script: string) {
  if (selection.value)
    emit('update:modelValue', selectionText({ ...selection.value, Value: script }));
}

const subtitle = (item: WorkflowTemplateItem) => [kindNames[item.templateType], item.node, item.device].filter(Boolean).join(' · ');
const showsScript = computed(() => !settings.value.hideEditor && selection.value?.Id != null && selection.value.TemplateType !== TemplateType.Report);
</script>

<template>
  <div>
    <v-autocomplete :model-value="selection?.Id ?? null" :items="choices" item-value="id" item-title="name" :loading="loadingItems"
                    :aria-label="input.displayName ?? input.key" placeholder="Choose…" density="compact" hide-details="auto"
                    clearable :readonly="readOnly" @update:model-value="choose($event as string | null)">
      <template #item="{ props: itemProps, item }">
        <v-list-item v-bind="itemProps" :subtitle="subtitle(item)" :prepend-icon="kindIcons[item.templateType]" />
      </template>
    </v-autocomplete>
    <v-textarea v-if="showsScript" :model-value="selection?.Value ?? ''" class="wf-code mt-2" label="Value (JavaScript)" rows="3" auto-grow
                density="compact" hide-details="auto" :readonly="readOnly" hint="Returns the command's value; Elsa's JavaScript functions, such as getVariable and getOutputFrom, are available."
                persistent-hint @update:model-value="setScript(String($event))" />
  </div>
</template>
