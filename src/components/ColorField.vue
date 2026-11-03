<script setup lang="ts">
import { computed } from 'vue';
import { colorChoices, useColors } from '@/dashboard/sdk/colors';

/** A color setting: theme colors and the Material palette as swatches, or any CSS color. */
const props = defineProps<{ label: string, hint?: string }>();
const color = defineModel<string | null | undefined>();
const { resolve } = useColors();

const custom = computed({
  get: () => color.value && !colorChoices.includes(color.value) ? color.value : '',
  set: value => { color.value = value || null; },
});
</script>

<template>
  <div class="color-field">
    <div class="color-field__label">{{ props.label }}</div>
    <div class="color-field__swatches" role="radiogroup" :aria-label="props.label">
      <button
        type="button"
        class="color-field__swatch color-field__swatch--none"
        role="radio"
        :aria-checked="!color"
        title="Default"
        :class="{ 'color-field__swatch--current': !color }"
        @click="color = null"
      >
        <v-icon icon="mdi-cancel" size="16" />
      </button>
      <button
        v-for="name in colorChoices"
        :key="name"
        type="button"
        class="color-field__swatch"
        role="radio"
        :aria-checked="color === name"
        :title="name"
        :style="{ background: resolve(name) }"
        :class="{ 'color-field__swatch--current': color === name }"
        @click="color = name"
      />
      <v-menu :close-on-content-click="false">
        <template #activator="{ props: menu }">
          <button v-bind="menu" type="button" class="color-field__swatch color-field__swatch--custom" :class="{ 'color-field__swatch--current': !!custom }" :style="custom ? { background: custom } : undefined" title="Other color">
            <v-icon v-if="!custom" icon="mdi-eyedropper-variant" size="16" />
          </button>
        </template>
        <v-color-picker v-model="custom" mode="hex" :modes="['hex', 'rgb', 'hsl']" />
      </v-menu>
    </div>
    <div v-if="props.hint" class="color-field__hint">{{ props.hint }}</div>
  </div>
</template>

<style scoped>
.color-field__label {
  font-size: 0.85rem;
  margin-bottom: 6px;
  opacity: 0.8;
}

.color-field__swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.color-field__swatch {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 18%, transparent);
  cursor: pointer;
  color: rgb(var(--v-theme-on-surface));
}

.color-field__swatch--none,
.color-field__swatch--custom {
  background: rgb(var(--v-theme-surface-container-high));
}

.color-field__swatch--current {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.color-field__hint {
  font-size: 0.75rem;
  opacity: 0.65;
  margin-top: 4px;
}
</style>
