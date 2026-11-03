<script setup lang="ts">
import type { DashboardPage } from '@/models/dashboard';

/**
 * The dashboard's pages: tabs above the cards, or on phones a bottom bar within thumb reach (above the
 * home indicator, `safe-area-inset-bottom`).
 */
defineProps<{ pages: DashboardPage[], placement: 'top' | 'bottom' }>();
const page = defineModel<number>({ required: true });
</script>

<template>
  <nav v-if="placement === 'bottom'" class="page-bar" aria-label="Dashboard pages">
    <div class="page-bar__items">
      <button
        v-for="(item, i) in pages"
        :key="item.id"
        type="button"
        class="page-bar__item"
        :class="{ 'page-bar__item--current': page === i }"
        :aria-current="page === i ? 'page' : undefined"
        @click="page = i"
      >
        <span class="page-bar__indicator"><v-icon :icon="item.icon || 'mdi-view-dashboard-outline'" size="22" /></span>
        <span class="page-bar__label">{{ item.name }}</span>
      </button>
    </div>
  </nav>
  <v-tabs v-else v-model="page" class="page-tabs" color="primary" show-arrows density="comfortable">
    <v-tab v-for="(item, i) in pages" :key="item.id" :value="i" :prepend-icon="item.icon || undefined" rounded="lg">{{ item.name }}</v-tab>
  </v-tabs>
</template>

<style scoped>
.page-bar {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 1004;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: rgb(var(--v-theme-surface-container));
  border-top: 1px solid color-mix(in srgb, rgb(var(--v-theme-outline-variant)) 60%, transparent);
}

.page-bar__items {
  display: flex;
  justify-content: space-around;
  overflow-x: auto;
  scrollbar-width: none;
  padding-inline: max(8px, env(safe-area-inset-left, 0px)) max(8px, env(safe-area-inset-right, 0px));
}

.page-bar__item {
  flex: 1 0 72px;
  max-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px 12px;
  border: none;
  background: none;
  font: inherit;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.page-bar__indicator {
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 30px;
  border-radius: 999px;
  transition: background-color 0.2s ease;
}

.page-bar__item--current {
  color: rgb(var(--v-theme-on-surface));
}

.page-bar__item--current .page-bar__indicator {
  background: rgb(var(--v-theme-secondary-container));
}

.page-bar__label {
  font-size: 0.75rem;
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-tabs :deep(.v-tab) {
  text-transform: none;
}
</style>
