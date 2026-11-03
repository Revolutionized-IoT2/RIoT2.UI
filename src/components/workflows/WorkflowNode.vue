<script setup lang="ts">
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { activityAppearance, paletteCategory } from '@/composables/workflowAppearance';
import { sanitizeId, text, type WorkflowNodeData } from '@/composables/workflowGraph';

// A node on the canvas (ported from Dls): an input handle, the activity's icon and names, and a handle per outcome.
const props = defineProps<{ id: string; data: WorkflowNodeData; selected?: boolean }>();

const definition = computed(() => props.data.definition);
const isTrigger = computed(() => definition.value?.kind === 'Trigger');
const appearance = computed(() => activityAppearance(definition.value, text(props.data.activity.type)));
const title = computed(() => text(props.data.activity.name) || definition.value?.displayName || text(props.data.activity.type));
const category = computed(() => definition.value ? paletteCategory(definition.value) : 'Unknown activity');
// The id only when it tells two nodes apart.
const showId = computed(() => props.id !== sanitizeId(title.value) && props.id !== title.value);
const labelledOutcomes = computed(() => props.data.outcomes.length > 1 || (props.data.outcomes.length === 1 && props.data.outcomes[0] !== 'Done'));
</script>

<template>
  <div
    class="wf-node"
    :class="{ 'wf-node--selected': selected, 'wf-node--trigger': isTrigger, 'wf-node--unknown': !definition }"
    :style="{ '--wf-accent': appearance.color }"
  >
    <Handle v-if="!isTrigger" id="In" type="target" :position="Position.Left" />
    <div class="wf-node__body">
      <div class="wf-node__icon"><v-icon :icon="appearance.icon" size="20" /></div>
      <div class="wf-node__text">
        <div class="wf-node__title">{{ title }}</div>
        <div class="wf-node__meta">
          <v-icon v-if="isTrigger" icon="mdi-lightning-bolt" size="11" />{{ isTrigger ? 'Trigger' : category }}
          <template v-if="definition && title !== definition.displayName"> · {{ definition.displayName }}</template>
        </div>
        <div v-if="showId" class="wf-node__id">{{ id }}</div>
      </div>
    </div>
    <div v-if="labelledOutcomes" class="wf-node__outcomes">
      <div v-for="outcome in data.outcomes" :key="outcome" class="wf-node__outcome">
        <span>{{ outcome }}</span>
        <Handle :id="outcome" type="source" :position="Position.Right" />
      </div>
    </div>
    <Handle v-else-if="data.outcomes.length" id="Done" type="source" :position="Position.Right" />
  </div>
</template>
