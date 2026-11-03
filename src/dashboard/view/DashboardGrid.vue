<script setup lang="ts">
import { computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import type { DashboardCard, DashboardPage } from '@/models/dashboard';
import type { ComponentSize } from '@/models/enums';
import CardHost from './CardHost.vue';
import { findCard } from '../sdk/registry';
import { cardSpans, sizeOptions } from '../sdk/layout';

/**
 * A page's cards on a 12-column grid. Columns follow the dashboard's own width (container queries),
 * so it fits a phone, a wall display or the editor's preview frame alike. While editing, cards can be
 * dragged by their handle and each has its actions; their controls send nothing.
 */
const props = defineProps<{ page: DashboardPage, pages: DashboardPage[], editing?: boolean }>();

const emit = defineEmits<{
  edit: [DashboardCard];
  add: [];
  remove: [DashboardCard];
  duplicate: [DashboardCard];
  move: [DashboardCard, string];
  resize: [DashboardCard, ComponentSize];
  reorder: [DashboardCard[]];
}>();

const otherPages = computed(() => props.pages.filter(page => page.id !== props.page.id));

function spanStyle(card: DashboardCard) {
  const spans = cardSpans(card.size, findCard(card.kind)?.compact === true);
  return { '--span-xs': spans.xs, '--span-sm': spans.sm, '--span-md': spans.md, '--span-lg': spans.lg };
}
</script>

<template>
  <div class="dashboard-grid">
    <VueDraggable
      :model-value="page.components"
      class="dashboard-grid__items"
      :disabled="!editing"
      handle=".card-slot__handle"
      draggable=".card-slot--item"
      :animation="180"
      ghost-class="card-slot--ghost"
      @update:model-value="(cards: DashboardCard[]) => emit('reorder', cards)"
    >
      <div v-for="card in page.components" :key="card.id" class="card-slot card-slot--item" :class="{ 'card-slot--editing': editing }" :style="spanStyle(card)">
        <CardHost :card="card" :preview="editing" />
        <div v-if="editing" class="card-slot__overlay" @click="emit('edit', card)">
          <div class="card-slot__tools" @click.stop>
            <v-btn class="card-slot__handle" icon="mdi-drag" size="small" variant="flat" aria-label="Drag to move" />
            <v-btn icon="mdi-pencil" size="small" variant="flat" aria-label="Edit card" @click="emit('edit', card)" />
            <v-menu location="bottom end">
              <template #activator="{ props: menu }">
                <v-btn v-bind="menu" icon="mdi-dots-vertical" size="small" variant="flat" aria-label="More" />
              </template>
              <v-list density="compact" nav>
                <v-list-subheader>Size</v-list-subheader>
                <v-list-item v-for="size in sizeOptions" :key="size.value" :title="size.title" :prepend-icon="size.icon" :active="card.size === size.value" @click="emit('resize', card, size.value)" />
                <v-divider class="my-1" />
                <v-list-item title="Duplicate" prepend-icon="mdi-content-copy" @click="emit('duplicate', card)" />
                <v-menu v-if="otherPages.length" location="start" open-on-hover>
                  <template #activator="{ props: submenu }">
                    <v-list-item v-bind="submenu" title="Move to page" prepend-icon="mdi-file-move-outline" append-icon="mdi-menu-right" />
                  </template>
                  <v-list density="compact" nav>
                    <v-list-item v-for="target in otherPages" :key="target.id" :title="target.name" :prepend-icon="target.icon || 'mdi-file-outline'" @click="emit('move', card, target.id)" />
                  </v-list>
                </v-menu>
                <v-list-item title="Delete" prepend-icon="mdi-delete-outline" base-color="error" @click="emit('remove', card)" />
              </v-list>
            </v-menu>
          </div>
        </div>
      </div>
      <button v-if="editing" type="button" class="card-slot card-slot--add" :style="{ '--span-xs': 12, '--span-sm': 6, '--span-md': 4, '--span-lg': 3 }" @click="emit('add')">
        <v-icon icon="mdi-plus" size="28" />
        <span>Add card</span>
      </button>
    </VueDraggable>

    <div v-if="!editing && page.components.length === 0" class="dashboard-grid__empty">
      <v-icon icon="mdi-view-dashboard-edit-outline" size="40" />
      <div>This page has no cards yet.</div>
      <slot name="empty" />
    </div>
  </div>
</template>

<style scoped>
.dashboard-grid {
  container-type: inline-size;
}

.dashboard-grid__items {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-flow: row dense;
  gap: 12px;
}

.card-slot {
  position: relative;
  grid-column: span var(--span-xs);
  min-width: 0;
}

@container (min-width: 600px) {
  .dashboard-grid__items { gap: 16px; }
  .card-slot { grid-column: span var(--span-sm); }
}

@container (min-width: 840px) {
  .card-slot { grid-column: span var(--span-md); }
}

@container (min-width: 1145px) {
  .card-slot { grid-column: span var(--span-lg); }
}

.card-slot--editing > :first-child {
  pointer-events: none;
}

.card-slot__overlay {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  outline: 2px dashed color-mix(in srgb, rgb(var(--v-theme-primary)) 45%, transparent);
  outline-offset: -2px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.card-slot__overlay:hover {
  background: color-mix(in srgb, rgb(var(--v-theme-primary)) 6%, transparent);
}

.card-slot__tools {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: 999px;
  background: rgb(var(--v-theme-surface-container-highest));
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.card-slot__tools :deep(.v-btn) {
  background: transparent;
}

.card-slot__handle {
  cursor: grab;
  touch-action: none;
}

.card-slot--ghost {
  opacity: 0.4;
}

.card-slot--add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 132px;
  border: 2px dashed color-mix(in srgb, rgb(var(--v-theme-primary)) 40%, transparent);
  border-radius: 20px;
  background: transparent;
  color: rgb(var(--v-theme-primary));
  font: inherit;
  font-weight: 500;
  cursor: pointer;
}

.card-slot--add:hover {
  background: color-mix(in srgb, rgb(var(--v-theme-primary)) 6%, transparent);
}

.dashboard-grid__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 64px 16px;
  text-align: center;
  opacity: 0.7;
}
</style>
