<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import CardShell from '../../components/CardShell.vue';
import CommandStatus from '../../components/CommandStatus.vue';
import { formatNumber, isOn, switchValue, useCommand, useElement, type CardProps } from '../../sdk';
import { formatColor, parseColor, swatches, toHex } from './color';
import type { LightElement } from './index';

const props = defineProps<CardProps>();
const power = useElement<LightElement>(props, 'power');
const brightness = useElement<LightElement>(props, 'brightness');
const color = useElement<LightElement>(props, 'color');
const { send } = useCommand(props);

// Controls show the new value at once; the next report from the device decides.
const switched = ref<boolean>();
const level = ref<number>();
const picked = ref<string>();
watch(() => power.value.updated?.getTime(), () => { switched.value = undefined; });
watch(() => brightness.value.updated?.getTime(), () => { level.value = undefined; });
watch(() => color.value.updated?.getTime(), () => { picked.value = undefined; });

const on = computed(() => switched.value ?? isOn(power.value, power.value.settings) ?? false);
const min = computed(() => brightness.value.settings.min ?? brightness.value.schema?.minimum ?? 0);
const max = computed(() => brightness.value.settings.max ?? brightness.value.schema?.maximum ?? 100);
const currentLevel = computed(() => level.value ?? (Number.isFinite(brightness.value.number) ? brightness.value.number : max.value));
const percent = computed(() => Math.round(((currentLevel.value - min.value) / ((max.value - min.value) || 1)) * 100));
const currentColor = computed(() => picked.value ?? (color.value.hasValue ? toHex(parseColor(color.value.value) ?? { r: 255, g: 183, b: 77 }) : undefined));

const hasBrightness = computed(() => brightness.value.element?.commandTemplate != null);
const hasColor = computed(() => color.value.element?.commandTemplate != null);
const pickerOpen = ref(false);

function toggle() {
  const element = power.value.element;
  if (element == null)
    return;
  switched.value = !on.value;
  send(element, switchValue(element, power.value.settings, switched.value));
}

function setLevel(value: number) {
  level.value = value;
  send(brightness.value.element, value);
}

function setColor(hex: string) {
  const rgb = parseColor(hex);
  if (rgb == null)
    return;
  picked.value = toHex(rgb);
  send(color.value.element, formatColor(rgb, color.value.settings.format));
}

const subtitle = computed(() => !on.value ? 'Off' : hasBrightness.value || brightness.value.hasValue ? `${formatNumber(percent.value, 0)} %` : 'On');
const state = computed(() => power.value.element?.commandTemplate == null ? 'unbound' : 'ready');
</script>

<template>
  <CardShell
    :title="card.name || power.element?.name"
    :subtitle="subtitle"
    :icon="card.icon || (on ? 'mdi-lightbulb-on' : 'mdi-lightbulb-outline')"
    :active="on"
    :state="state"
    :updated="power.updated ?? undefined"
    :style="on && currentColor ? { '--light-glow': currentColor } : undefined"
    class="light"
  >
    <template #actions>
      <CommandStatus :command-id="power.element?.commandTemplate?.id" class="mr-1" />
      <v-switch :model-value="on" inset hide-details density="compact" color="primary" aria-label="Power" @update:model-value="toggle" />
    </template>

    <div class="light__controls">
      <v-slider
        v-if="hasBrightness"
        :model-value="currentLevel"
        :min="min"
        :max="max"
        :step="1"
        :disabled="!on"
        hide-details
        thumb-label
        prepend-icon="mdi-brightness-5"
        aria-label="Brightness"
        class="light__slider"
        @end="setLevel"
      />
      <div v-if="hasColor" class="light__swatches" role="radiogroup" aria-label="Color">
        <button
          v-for="swatch in swatches"
          :key="swatch"
          type="button"
          class="light__swatch"
          role="radio"
          :aria-checked="currentColor === swatch"
          :aria-label="swatch"
          :disabled="!on"
          :style="{ background: swatch }"
          :class="{ 'light__swatch--current': currentColor === swatch }"
          @click="setColor(swatch)"
        />
        <v-menu v-model="pickerOpen" :close-on-content-click="false" location="top">
          <template #activator="{ props: menu }">
            <button v-bind="menu" type="button" class="light__swatch light__swatch--custom" :disabled="!on" aria-label="Other color">
              <v-icon icon="mdi-palette" size="16" />
            </button>
          </template>
          <v-color-picker :model-value="currentColor ?? '#ffb74d'" mode="rgb" :modes="['rgb', 'hex']" hide-inputs @update:model-value="(value: string) => (picked = value)" />
          <div class="d-flex justify-end pa-2"><v-btn variant="flat" color="primary" @click="picked && setColor(picked); pickerOpen = false">Set</v-btn></div>
        </v-menu>
      </div>
    </div>
  </CardShell>
</template>

<style scoped>
.light.riot-card--active {
  background: color-mix(in srgb, var(--light-glow, rgb(var(--v-theme-primary-container))) 32%, rgb(var(--v-theme-dashboard-card)));
  color: rgb(var(--v-theme-on-surface));
}

.light__controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
}

.light__slider {
  margin-inline: 0;
}

.light__swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.light__swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 20%, transparent);
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  touch-action: manipulation;
  transition: transform 0.12s ease;
}

.light__swatch:disabled {
  opacity: 0.4;
  cursor: default;
}

.light__swatch--current {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.light__swatch--custom {
  background: conic-gradient(#ef5350, #ffca28, #66bb6a, #26c6da, #42a5f5, #7e57c2, #ef5350);
  color: #fff;
}
</style>
