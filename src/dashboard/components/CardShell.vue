<script setup lang="ts">
import { computed } from 'vue';
import RelativeTime from '@/components/RelativeTime.vue';

/**
 * The frame of a dashboard card: an icon, the title and subtitle, the content, and a footer with when
 * the data last changed. `active` tints the card (a switched-on light); `state` shows why there is
 * nothing to show yet.
 */
const props = withDefaults(defineProps<{
  title?: string | null;
  subtitle?: string | null;
  icon?: string | null;
  /** The icon's color: a theme color or palette name. */
  accent?: string | null;
  active?: boolean;
  /** Not bound to a device yet, or no report yet. */
  state?: 'ready' | 'unbound' | 'waiting';
  updated?: Date | null;
  /** The whole card is one control (a tile): it gets a ripple, and the header is part of it. */
  clickable?: boolean;
  dense?: boolean;
}>(), { state: 'ready' });

const emit = defineEmits<{ click: [MouseEvent | KeyboardEvent] }>();

const hasHeader = computed(() => !!(props.title || props.subtitle || props.icon));
</script>

<template>
  <section
    class="riot-card"
    :class="{ 'riot-card--active': active, 'riot-card--clickable': clickable, 'riot-card--dense': dense }"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    v-ripple="clickable"
    @click="clickable && emit('click', $event)"
    @keydown.enter.space.prevent="clickable && emit('click', $event)"
  >
    <header v-if="hasHeader" class="riot-card__header">
      <span v-if="icon" class="riot-card__icon" :class="active ? 'riot-card__icon--active' : ''">
        <v-icon :icon="icon" :color="active ? undefined : accent ?? 'primary'" size="22" />
      </span>
      <div class="riot-card__heading">
        <div v-if="title" class="riot-card__title">{{ title }}</div>
        <div v-if="subtitle" class="riot-card__subtitle">{{ subtitle }}</div>
      </div>
      <div class="riot-card__actions" @click.stop>
        <slot name="actions" />
      </div>
    </header>

    <div class="riot-card__body">
      <div v-if="state === 'unbound'" class="riot-card__empty">
        <v-icon icon="mdi-link-variant-off" size="28" />
        <span>Not connected to a device</span>
      </div>
      <div v-else-if="state === 'waiting'" class="riot-card__empty">
        <v-icon icon="mdi-timer-sand" size="28" />
        <span>Waiting for data</span>
      </div>
      <slot v-else />
    </div>

    <footer v-if="$slots.footer || updated !== undefined" class="riot-card__footer">
      <slot name="footer" />
      <span v-if="updated !== undefined" class="riot-card__updated">
        <v-icon icon="mdi-history" size="14" />
        <RelativeTime :time="updated" />
      </span>
    </footer>
  </section>
</template>

<style scoped>
.riot-card {
  container-type: inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 132px;
  padding: 16px;
  gap: 12px;
  border-radius: 20px;
  background: rgb(var(--v-theme-dashboard-card));
  color: rgb(var(--v-theme-on-surface));
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-outline-variant)) 55%, transparent);
  overflow: hidden;
  transition: background-color 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.riot-card--dense {
  min-height: 0;
  padding: 12px 14px;
  gap: 8px;
}

.riot-card--clickable {
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
}

.riot-card--clickable:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.riot-card--clickable:active {
  transform: scale(0.98);
}

.riot-card--clickable:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.riot-card--active {
  background: rgb(var(--v-theme-primary-container));
  color: rgb(var(--v-theme-on-primary-container));
  border-color: transparent;
}

.riot-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.riot-card__icon {
  flex: none;
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: color-mix(in srgb, rgb(var(--v-theme-primary)) 12%, transparent);
}

.riot-card__icon--active {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.riot-card__heading {
  flex: 1;
  min-width: 0;
}

.riot-card__title {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.riot-card__subtitle {
  font-size: 0.8rem;
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.riot-card__actions {
  flex: none;
  display: flex;
  align-items: center;
}

.riot-card__actions:empty {
  display: none;
}

.riot-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.riot-card__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.85rem;
  opacity: 0.6;
  text-align: center;
}

.riot-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.75rem;
  opacity: 0.7;
}

.riot-card__footer > :deep(*) {
  white-space: nowrap;
}

.riot-card__updated {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-inline-start: auto;
  white-space: nowrap;
}
</style>
