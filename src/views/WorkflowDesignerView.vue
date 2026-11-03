<script setup lang="ts">
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';
import '@/assets/workflow-designer.css';

import { computed, onMounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { VueFlow, MarkerType, Panel, useVueFlow, type Connection, type EdgeMouseEvent, type NodeMouseEvent } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { useWorkflowsStore } from '@/stores/workflowsStore';
import { activityAppearance } from '@/composables/workflowAppearance';
import {
  ActivityDragType, activityOutputs, createActivity, flowToModel, modelToFlow, nodeOf, text, validateFlow,
  type ActivityModel, type WorkflowFlowEdge, type WorkflowFlowNode
} from '@/composables/workflowGraph';
import type { WorkflowActivityDefinition, WorkflowDetails, WorkflowModel, WorkflowVersion } from '@/models/workflow';
import WorkflowNode from '@/components/workflows/WorkflowNode.vue';
import WorkflowPalette from '@/components/workflows/WorkflowPalette.vue';
import WorkflowInspector from '@/components/workflows/WorkflowInspector.vue';
import WorkflowRunsPanel from '@/components/workflows/WorkflowRunsPanel.vue';

// The workflow designer (ported from Dls, ADR 0016), in place of Elsa Studio: the activities, the canvas and the
// inspector, saving and publishing through the orchestrator in either workflow mode.
const route = useRoute();
const router = useRouter();
const store = useWorkflowsStore();
const { screenToFlowCoordinate, fitView } = useVueFlow('workflow-designer');

const emptyModel = (): WorkflowModel => ({ name: 'New workflow', description: '', variables: [], root: { id: 'flowchart', type: 'Elsa.Flowchart', version: 1, activities: [], connections: [] } });
const definitionId = computed(() => route.params.id === 'new' ? null : String(route.params.id));
const workflow = ref<WorkflowDetails | null>(null);
const versions = ref<WorkflowVersion[]>([]);
const baseModel = ref<WorkflowModel>(emptyModel());
const nodes = ref<WorkflowFlowNode[]>([]);
const edges = ref<WorkflowFlowEdge[]>([]);
const name = ref('');
const description = ref('');
const selectedNodeId = ref<string | null>(null);
const selectedEdgeId = ref<string | null>(null);
const inspectorOpen = ref(globalThis.innerWidth >= 1400);
const tab = ref<'designer' | 'runs'>('designer');
const saving = ref(false);
const dirty = ref(false);
const messages = ref<string[]>([]);
const notice = ref<string | null>(null);

const catalog = computed(() => store.catalog);
const readOnly = computed(() => workflow.value != null && (!workflow.value.isLatest || workflow.value.isReadonly));
const selectedNode = computed(() => nodes.value.find(x => x.id === selectedNodeId.value) ?? null);
const selectedEdge = computed(() => edges.value.find(x => x.id === selectedEdgeId.value) ?? null);
const warnings = computed(() => validateFlow(nodes.value, edges.value));
const languages = computed(() => catalog.value?.languages ?? ['Literal', 'JavaScript', 'Liquid']);
const versionItems = computed(() => versions.value.map(x => ({ title: `Version ${x.version}${x.isPublished ? ' · published' : ''}${x.isLatest ? ' · latest' : ''}`, value: x.version })));
const published = computed(() => workflow.value?.publishedVersion != null);

async function load(version?: number) {
  await store.loadCatalog();
  if (definitionId.value == null) {
    apply(emptyModel(), null);
    return;
  }
  const loaded = await store.get(definitionId.value, version);
  if (loaded) {
    apply(loaded.model, loaded);
    versions.value = await store.versions(definitionId.value);
  }
}

function apply(model: WorkflowModel, details: WorkflowDetails | null) {
  workflow.value = details;
  baseModel.value = model;
  name.value = text(model.name) || 'New workflow';
  description.value = text(model.description);
  const flow = modelToFlow(catalog.value, model);
  nodes.value = flow.nodes;
  edges.value = flow.edges.map(withEdgeDefaults);
  selectedNodeId.value = null;
  selectedEdgeId.value = null;
  setTimeout(() => { dirty.value = false; void fitView({ padding: 0.2 }); });
}

onMounted(() => load());
// After a new workflow is saved the route gets its id; that workflow is already shown.
watch(definitionId, now => { if (now == null || now !== workflow.value?.definitionId) void load(); });
watch([nodes, edges, name, description], () => { dirty.value = true; }, { deep: true });
onBeforeRouteLeave(() => !dirty.value || readOnly.value || globalThis.confirm('Leave without saving your changes?'));

function withEdgeDefaults(edge: WorkflowFlowEdge) {
  const outcome = edge.sourceHandle ?? 'Done';
  return { ...edge, type: 'smoothstep', markerEnd: MarkerType.ArrowClosed, label: outcome === 'Done' ? undefined : outcome };
}

function connect(connection: Connection) {
  if (readOnly.value || !connection.source || !connection.target)
    return;
  const port = connection.sourceHandle ?? 'Done';
  edges.value = [...edges.value, withEdgeDefaults({ id: `${connection.source}:${port}->${connection.target}:${Date.now()}`, source: connection.source, target: connection.target, sourceHandle: port, targetHandle: 'In' })];
}

function drop(event: DragEvent) {
  const type = event.dataTransfer?.getData(ActivityDragType);
  const definition = catalog.value?.activities.find(x => x.type === type);
  if (definition && !readOnly.value) {
    const point = screenToFlowCoordinate({ x: event.clientX, y: event.clientY });
    add(definition, { x: Math.round(point.x - 116), y: Math.round(point.y - 32) }, false);
  }
}

function addNearSelected(definition: WorkflowActivityDefinition) {
  const anchor = selectedNode.value ?? nodes.value[nodes.value.length - 1];
  add(definition, anchor ? { x: anchor.position.x + 300, y: anchor.position.y } : { x: 160, y: 160 }, true);
}

function add(definition: WorkflowActivityDefinition, position: { x: number; y: number }, connectFromSelection: boolean) {
  const anchor = selectedNode.value;
  const activity = createActivity(definition, position, nodes.value.map(x => x.id));
  nodes.value = [...nodes.value, nodeOf(catalog.value, activity, position)];
  if (connectFromSelection && anchor && definition.kind !== 'Trigger') {
    const used = new Set(edges.value.filter(x => x.source === anchor.id).map(x => x.sourceHandle ?? 'Done'));
    const free = anchor.data.outcomes.find(x => !used.has(x));
    if (free)
      edges.value = [...edges.value, withEdgeDefaults({ id: `${anchor.id}:${free}->${activity.id}:${Date.now()}`, source: anchor.id, target: text(activity.id), sourceHandle: free, targetHandle: 'In' })];
  }
  selectedNodeId.value = text(activity.id);
  selectedEdgeId.value = null;
  inspectorOpen.value = true;
}

function changeActivity(activity: ActivityModel) {
  nodes.value = nodes.value.map(node => node.id === activity.id
    ? { ...node, data: { ...node.data, activity, outcomes: activityOutputs(catalog.value, activity) } }
    : node);
}

function removeSelected() {
  if (readOnly.value)
    return;
  if (selectedNodeId.value) {
    const id = selectedNodeId.value;
    nodes.value = nodes.value.filter(x => x.id !== id);
    edges.value = edges.value.filter(x => x.source !== id && x.target !== id);
  } else if (selectedEdgeId.value) {
    edges.value = edges.value.filter(x => x.id !== selectedEdgeId.value);
  }
  selectedNodeId.value = null;
  selectedEdgeId.value = null;
}

async function save(publish: boolean) {
  saving.value = true;
  messages.value = [];
  const model = flowToModel(baseModel.value, nodes.value, edges.value, name.value.trim() || 'New workflow', description.value);
  const result = await store.save(definitionId.value, model, publish);
  saving.value = false;
  if (!result)
    return;
  messages.value = result.errors;
  if (result.workflow) {
    const creating = definitionId.value == null;
    workflow.value = result.workflow;
    baseModel.value = result.workflow.model;
    dirty.value = false;
    versions.value = await store.versions(result.workflow.definitionId);
    notice.value = result.succeeded ? (publish ? 'Saved and published.' : 'Saved as a draft.') : null;
    if (creating)
      await router.replace(`/workflows/${encodeURIComponent(result.workflow.definitionId)}`);
  }
}

async function retract() {
  if (workflow.value && await store.retract(workflow.value.definitionId)) {
    notice.value = 'Unpublished: its triggers stopped.';
    await load();
  }
}

function minimapColor(node: { data: { definition: WorkflowActivityDefinition | null } }) {
  return activityAppearance(node.data.definition).color;
}
</script>

<template>
  <div class="wf-designer">
    <v-alert v-if="messages.length" type="warning" density="compact" closable @click:close="messages = []">
      <div v-for="message in messages" :key="message">{{ message }}</div>
    </v-alert>
    <v-snackbar :model-value="notice !== null" color="success" timeout="3500" @update:model-value="!$event && (notice = null)">{{ notice }}</v-snackbar>

    <header class="wf-header">
      <v-btn icon="mdi-arrow-left" variant="text" density="comfortable" aria-label="Back to workflows" to="/workflows" />
      <div class="wf-title">
        <v-text-field v-model="name" variant="plain" density="compact" hide-details single-line placeholder="Workflow name"
                      aria-label="Workflow name" class="wf-title__name" :readonly="readOnly" />
        <div class="wf-title__meta">
          <span>{{ workflow ? `Version ${workflow.version}` : 'Not saved yet' }}</span>
          <template v-if="workflow?.publishedVersion"><span>·</span><span>Version {{ workflow.publishedVersion }} published</span></template>
          <template v-if="dirty && !readOnly"><span>·</span><span>Unsaved changes</span></template>
        </div>
      </div>
      <v-btn-toggle v-model="tab" mandatory density="compact" variant="outlined" divided color="primary">
        <v-btn value="designer" prepend-icon="mdi-sitemap-outline">Designer</v-btn>
        <v-btn value="runs" prepend-icon="mdi-history" :disabled="!workflow">Runs</v-btn>
      </v-btn-toggle>
      <v-spacer />
      <div class="wf-actions">
        <v-menu v-if="warnings.length" location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-chip v-bind="menuProps" color="warning" variant="tonal" size="small" prepend-icon="mdi-alert-outline" append-icon="mdi-menu-down">
              {{ warnings.length }} issue(s)
            </v-chip>
          </template>
          <v-list density="compact" max-width="480">
            <v-list-item v-for="warning in warnings" :key="warning" prepend-icon="mdi-alert-outline"><div class="text-body-medium text-wrap">{{ warning }}</div></v-list-item>
          </v-list>
        </v-menu>
        <v-chip :color="published ? 'success' : 'secondary'" variant="tonal" size="small" :prepend-icon="published ? 'mdi-play-circle-outline' : 'mdi-pause-circle-outline'">
          {{ published ? 'Published' : 'Not published' }}
        </v-chip>
        <v-select v-if="versionItems.length > 1" :model-value="workflow?.version" :items="versionItems" aria-label="Version" density="compact"
                  hide-details class="wf-version" @update:model-value="load($event as number)" />
        <v-btn v-if="published && !readOnly" variant="text" prepend-icon="mdi-stop-circle-outline" @click="retract">Unpublish</v-btn>
        <v-btn variant="tonal" prepend-icon="mdi-content-save-outline" :loading="saving" :disabled="readOnly" @click="save(false)">Save</v-btn>
        <v-btn color="primary" prepend-icon="mdi-rocket-launch-outline" :loading="saving" :disabled="readOnly" @click="save(true)">Publish</v-btn>
      </div>
    </header>

    <div v-show="tab === 'designer'" class="wf-body">
      <WorkflowPalette :catalog="catalog" :read-only="readOnly" @add="addNearSelected" />
      <div class="wf-canvas" @dragover.prevent @drop.prevent="drop">
        <VueFlow id="workflow-designer" v-model:nodes="nodes" v-model:edges="edges" snap-to-grid :snap-grid="[20, 20]" :min-zoom="0.3" :max-zoom="1.6"
                 :nodes-draggable="!readOnly" :nodes-connectable="!readOnly" :delete-key-code="readOnly ? null : ['Delete']"
                 @node-click="(e: NodeMouseEvent) => { selectedNodeId = e.node.id; selectedEdgeId = null; inspectorOpen = true }"
                 @edge-click="(e: EdgeMouseEvent) => { selectedEdgeId = e.edge.id; selectedNodeId = null }"
                 @pane-click="selectedNodeId = null; selectedEdgeId = null" @connect="connect">
          <template #node-workflowActivity="nodeProps"><WorkflowNode v-bind="nodeProps" /></template>
          <Background :gap="20" :size="1.4" />
          <Controls position="bottom-left" :show-interactive="false" />
          <MiniMap position="bottom-right" pannable zoomable :node-color="minimapColor" :node-border-radius="10" :width="168" :height="112" />
          <Panel position="top-right" class="wf-canvas__actions">
            <v-btn icon="mdi-fit-to-screen-outline" variant="text" size="small" aria-label="Fit to screen" @click="fitView({ padding: 0.2 })" />
            <v-btn icon="mdi-delete-outline" variant="text" size="small" aria-label="Delete selected" :disabled="readOnly || (!selectedNodeId && !selectedEdgeId)" @click="removeSelected" />
            <v-divider vertical class="mx-1" />
            <v-btn :icon="inspectorOpen ? 'mdi-dock-right' : 'mdi-tune-variant'" :active="inspectorOpen" variant="text" size="small" aria-label="Inspector" @click="inspectorOpen = !inspectorOpen" />
          </Panel>
          <Panel v-if="!nodes.length && !readOnly" position="top-center" class="wf-canvas__hint">
            <v-icon icon="mdi-gesture-tap-hold" size="18" /> Drag a trigger from the activities, then the actions, and connect them.
          </Panel>
        </VueFlow>
      </div>
      <WorkflowInspector v-if="inspectorOpen" :node="selectedNode" :edge="selectedEdge" :languages="languages" :read-only="readOnly"
                         v-model:description="description" :engine="catalog?.engine ?? null" @change="changeActivity" @remove="removeSelected" @close="inspectorOpen = false" />
    </div>
    <WorkflowRunsPanel v-if="tab === 'runs' && workflow" :definition-id="workflow.definitionId" />
  </div>
</template>
