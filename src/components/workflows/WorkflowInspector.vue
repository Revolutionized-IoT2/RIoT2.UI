<script setup lang="ts">
import { computed } from 'vue';
import { isJsonObject } from '@/composables/jsonValue';
import { activityAppearance, paletteCategory } from '@/composables/workflowAppearance';
import { text, type ActivityModel, type WorkflowFlowEdge, type WorkflowFlowNode } from '@/composables/workflowGraph';
import ActivityInputEditor from './ActivityInputEditor.vue';

// The designer's right pane (after Dls): the selected activity's name and inputs, the selected connection, or the
// workflow itself.
const props = defineProps<{
  node: WorkflowFlowNode | null;
  edge: WorkflowFlowEdge | null;
  languages: string[];
  readOnly: boolean;
  description: string;
  engine: string | null;
}>();
const emit = defineEmits<{ change: [activity: ActivityModel]; remove: []; close: []; 'update:description': [value: string] }>();

const definition = computed(() => props.node?.data.definition ?? null);
const activity = computed(() => props.node?.data.activity ?? null);
const appearance = computed(() => activityAppearance(definition.value, text(activity.value?.type)));
const isTrigger = computed(() => definition.value?.kind === 'Trigger');
const startsWorkflow = computed(() => {
  const custom = activity.value?.customProperties;
  return isJsonObject(custom) && custom.canStartWorkflow === true;
});
const title = computed(() => props.node ? 'Activity' : props.edge ? 'Connection' : 'Workflow');

function setName(name: string) {
  if (activity.value)
    emit('change', { ...activity.value, name });
}

function setStarts(starts: boolean) {
  if (!activity.value)
    return;
  const custom = isJsonObject(activity.value.customProperties) ? activity.value.customProperties : {};
  emit('change', { ...activity.value, customProperties: { ...custom, canStartWorkflow: starts } });
}
</script>

<template>
  <aside class="wf-pane wf-inspector" aria-label="Inspector">
    <div class="wf-pane__header">
      <span class="wf-pane__title">{{ title }}</span>
      <v-btn icon="mdi-close" variant="text" size="small" density="comfortable" aria-label="Hide inspector" @click="emit('close')" />
    </div>
    <div class="wf-pane__scroll">
      <v-alert v-if="readOnly" type="info" density="compact" class="mb-3" text="Older versions are read-only." />

      <template v-if="node && activity">
        <div class="wf-hero" :style="{ '--wf-accent': appearance.color }">
          <div class="wf-hero__icon"><v-icon :icon="appearance.icon" size="22" /></div>
          <div>
            <div class="wf-hero__title">{{ definition?.displayName ?? text(activity.type) }}</div>
            <div class="wf-hero__meta">{{ isTrigger ? 'Trigger' : definition ? paletteCategory(definition) : 'Unknown activity' }} · <code>{{ node.id }}</code></div>
          </div>
        </div>
        <p v-if="definition?.description" class="wf-description">{{ definition.description }}</p>
        <v-alert v-if="!definition" type="warning" density="compact" class="mt-3"
                 text="This workflow host doesn't know this activity. It is kept as it is." />

        <section class="wf-section">
          <h3 class="wf-section__title">Activity</h3>
          <v-text-field :model-value="text(activity.name)" label="Name" density="compact" hide-details="auto" :readonly="readOnly"
                        @update:model-value="setName(String($event))" />
          <v-switch v-if="isTrigger" :model-value="startsWorkflow" color="primary" density="compact" hide-details class="mt-2"
                    label="Starts the workflow" :disabled="readOnly" @update:model-value="setStarts(Boolean($event))" />
        </section>

        <section v-if="definition?.inputs.length" class="wf-section">
          <h3 class="wf-section__title">Inputs</h3>
          <ActivityInputEditor v-for="input in definition.inputs" :key="`${node.id}:${input.key}`" :activity="activity" :input="input"
                               :languages="languages" :read-only="readOnly" @change="emit('change', $event)" />
        </section>

        <section v-if="definition?.outputs.length" class="wf-section">
          <h3 class="wf-section__title">Outputs</h3>
          <div v-for="output in definition.outputs" :key="output.key" class="wf-value-row">
            <span>{{ output.displayName }}</span>
            <code>getOutputFrom('{{ node.id }}', '{{ output.key.charAt(0).toUpperCase() + output.key.slice(1) }}')</code>
          </div>
        </section>

        <v-btn class="mt-4" color="error" variant="tonal" prepend-icon="mdi-delete-outline" :disabled="readOnly" @click="emit('remove')">
          Remove activity
        </v-btn>
      </template>

      <template v-else-if="edge">
        <p class="wf-description">From <code>{{ edge.source }}</code> on <b>{{ edge.sourceHandle ?? 'Done' }}</b> to <code>{{ edge.target }}</code>.</p>
        <v-btn class="mt-4" color="error" variant="tonal" prepend-icon="mdi-link-variant-off" :disabled="readOnly" @click="emit('remove')">
          Remove connection
        </v-btn>
      </template>

      <template v-else>
        <v-textarea :model-value="description" label="Description" rows="3" auto-grow density="compact" hide-details :readonly="readOnly"
                    @update:model-value="emit('update:description', String($event))" />
        <p class="wf-description">
          Select an activity to edit it, or a connection to remove it. Connect an outcome's handle to the next activity's input.
          The trigger starts the workflow when its report arrives or its schedule is due.
        </p>
        <p v-if="engine" class="wf-description">Engine: {{ engine }}</p>
      </template>
    </div>
  </aside>
</template>
