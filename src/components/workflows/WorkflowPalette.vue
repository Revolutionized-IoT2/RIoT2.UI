<script setup lang="ts">
import { computed, ref } from 'vue';
import { activityAppearance, paletteGroups } from '@/composables/workflowAppearance';
import { ActivityDragType } from '@/composables/workflowGraph';
import type { WorkflowActivityDefinition, WorkflowCatalog } from '@/models/workflow';

// The activities to drag onto the canvas (ported from Dls), grouped and searchable; collapsed to a rail of icons.
const props = defineProps<{ catalog: WorkflowCatalog | null; readOnly: boolean }>();
const emit = defineEmits<{ add: [activity: WorkflowActivityDefinition] }>();

const search = ref('');
const collapsed = ref(globalThis.innerWidth < 1280);
const closedGroups = ref(new Set(['Branching', 'Looping', 'Flow', 'Scheduling', 'Primitives', 'Scripting', 'HTTP']));
const groups = computed(() => paletteGroups(props.catalog, search.value ?? ''));

function open(category: string): boolean {
  return (search.value ?? '').trim() !== '' || !closedGroups.value.has(category);
}

function toggle(category: string) {
  const next = new Set(closedGroups.value);
  if (!next.delete(category))
    next.add(category);
  closedGroups.value = next;
}

function dragStart(event: DragEvent, activity: WorkflowActivityDefinition) {
  if (props.readOnly) {
    event.preventDefault();
    return;
  }
  event.dataTransfer?.setData(ActivityDragType, activity.type);
  if (event.dataTransfer)
    event.dataTransfer.effectAllowed = 'copy';
}

function add(activity: WorkflowActivityDefinition) {
  if (!props.readOnly)
    emit('add', activity);
}
</script>

<template>
  <aside class="wf-pane wf-palette" :class="{ 'wf-palette--collapsed': collapsed }" aria-label="Activities">
    <div class="wf-pane__header">
      <span v-if="!collapsed" class="wf-pane__title">Activities</span>
      <v-btn :icon="collapsed ? 'mdi-chevron-double-right' : 'mdi-chevron-double-left'" variant="text" size="small" density="comfortable"
             :aria-label="collapsed ? 'Expand activities' : 'Collapse activities'" @click="collapsed = !collapsed" />
    </div>
    <template v-if="!collapsed">
      <div class="wf-palette__search">
        <v-text-field v-model="search" placeholder="Search activities" aria-label="Search activities" prepend-inner-icon="mdi-magnify"
                      variant="solo-filled" density="compact" flat hide-details clearable />
      </div>
      <div class="wf-pane__scroll">
        <section v-for="group in groups" :key="group.category">
          <button type="button" class="wf-group__header" :aria-expanded="open(group.category)" @click="toggle(group.category)">
            <v-icon :icon="open(group.category) ? 'mdi-chevron-down' : 'mdi-chevron-right'" size="16" />
            <span class="wf-group__name">{{ group.category }}</span>
            <span class="wf-group__count">{{ group.items.length }}</span>
          </button>
          <div v-show="open(group.category)">
            <div v-for="activity in group.items" :key="activity.type" class="wf-item" :class="{ 'wf-item--disabled': readOnly }"
                 :style="{ '--wf-accent': activityAppearance(activity).color }" :draggable="!readOnly" tabindex="0" role="button"
                 :title="activity.description ?? activity.displayName"
                 :aria-label="`${activity.displayName}: drag to the canvas, or press Enter to add`"
                 @dragstart="dragStart($event, activity)" @dblclick="add(activity)" @keydown.enter.prevent="add(activity)">
              <div class="wf-item__icon"><v-icon :icon="activityAppearance(activity).icon" size="18" /></div>
              <div class="wf-item__text">
                <div class="wf-item__name">{{ activity.displayName }}</div>
                <div v-if="activity.description" class="wf-item__description">{{ activity.description }}</div>
              </div>
            </div>
          </div>
        </section>
        <div v-if="!groups.length" class="wf-pane__empty">No activities match “{{ search }}”.</div>
      </div>
      <div class="wf-pane__footer">Drag activities onto the canvas, or double-click to add after the selected one.</div>
    </template>
    <div v-else class="wf-pane__scroll wf-rail">
      <template v-for="group in groups" :key="group.category">
        <div v-for="activity in group.items" :key="activity.type" class="wf-rail__item" :title="activity.displayName"
             :style="{ '--wf-accent': activityAppearance(activity).color }" :draggable="!readOnly" tabindex="0" role="button"
             :aria-label="`${activity.displayName}: drag to the canvas, or press Enter to add`"
             @dragstart="dragStart($event, activity)" @dblclick="add(activity)" @keydown.enter.prevent="add(activity)">
          <v-icon :icon="activityAppearance(activity).icon" size="18" />
        </div>
      </template>
    </div>
  </aside>
</template>
