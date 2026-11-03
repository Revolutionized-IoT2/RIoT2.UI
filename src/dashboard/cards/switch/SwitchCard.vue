<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import CardShell from '../../components/CardShell.vue';
import CommandStatus from '../../components/CommandStatus.vue';
import { isOn, switchValue, useCommand, useElements, type CardProps, type ElementView } from '../../sdk';
import type { SwitchElement } from './index';

const props = defineProps<CardProps>();
const switches = useElements<SwitchElement>(props);
const { send } = useCommand(props);

// Switching shows the new position at once; the next report from the device decides.
const switched = reactive<Record<string, boolean>>({});
watch(() => switches.value.map(row => row.updated?.getTime()), () => {
  for (const key of Object.keys(switched))
    delete switched[key];
});

function on(row: ElementView<SwitchElement>): boolean {
  return switched[row.element?.id ?? ''] ?? isOn(row, row.settings) ?? false;
}

function known(row: ElementView<SwitchElement>): boolean {
  return (row.element?.id ?? '') in switched || isOn(row, row.settings) !== undefined;
}

function toggle(row: ElementView<SwitchElement>, value = !on(row)) {
  if (row.element?.commandTemplate == null)
    return;
  switched[row.element.id] = value;
  send(row.element, switchValue(row.element, row.settings, value));
}

function icon(row: ElementView<SwitchElement>) {
  const fallback = row.element?.icon || 'mdi-power';
  return on(row) ? row.settings.onIcon || fallback : row.settings.offIcon || row.settings.onIcon || fallback;
}

const single = computed(() => switches.value.length === 1 ? switches.value[0] : undefined);
const state = computed(() => switches.value.some(row => row.element?.commandTemplate != null) ? 'ready' : 'unbound');
</script>

<template>
  <!-- One switch: the whole card is the switch. -->
  <CardShell
    v-if="single"
    :title="card.name || single.element?.name"
    :subtitle="known(single) ? (on(single) ? single.settings.onLabel : single.settings.offLabel) : card.description || 'Unknown'"
    :icon="card.icon || icon(single)"
    :active="on(single)"
    :state="state"
    :updated="single.updated ?? undefined"
    clickable
    @click="toggle(single)"
  >
    <template #actions>
      <CommandStatus :command-id="single.element?.commandTemplate?.id" class="mr-1" />
      <v-switch :model-value="on(single)" :color="single.settings.onColor || 'primary'" inset hide-details density="compact" :aria-label="single.element?.name" @update:model-value="value => toggle(single!, !!value)" />
    </template>
  </CardShell>

  <CardShell v-else :title="card.name" :subtitle="card.description" :icon="card.icon" :state="state">
    <div class="switches">
      <div v-for="row in switches" :key="row.element?.id" v-ripple class="switches__row" role="button" tabindex="0" @click="toggle(row)" @keydown.enter.space.prevent="toggle(row)">
        <span class="switches__icon" :class="{ 'switches__icon--on': on(row) }">
          <v-icon :icon="icon(row)" size="20" :color="on(row) ? row.settings.onColor || 'primary' : undefined" />
        </span>
        <span class="switches__text">
          <span class="switches__name">{{ row.element?.name }}</span>
          <span class="switches__state">{{ known(row) ? (on(row) ? row.settings.onLabel : row.settings.offLabel) : 'Unknown' }}</span>
        </span>
        <CommandStatus :command-id="row.element?.commandTemplate?.id" />
        <v-switch :model-value="on(row)" :color="row.settings.onColor || 'primary'" inset hide-details density="compact" :aria-label="row.element?.name" @click.stop @update:model-value="value => toggle(row, !!value)" />
      </div>
    </div>
  </CardShell>
</template>

<style scoped>
.switches {
  display: flex;
  flex-direction: column;
  margin-inline: -8px;
}

.switches__row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 4px 8px;
  border-radius: 12px;
  cursor: pointer;
  touch-action: manipulation;
}

.switches__icon {
  flex: none;
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface-container-high));
  transition: background-color 0.2s ease;
}

.switches__icon--on {
  background: color-mix(in srgb, rgb(var(--v-theme-primary)) 16%, transparent);
}

.switches__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.switches__name {
  font-size: 0.9rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.switches__state {
  font-size: 0.75rem;
  opacity: 0.65;
}

.switches :deep(.v-switch) {
  flex: none;
}
</style>
