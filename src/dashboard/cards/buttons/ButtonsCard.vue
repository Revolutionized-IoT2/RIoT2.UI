<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import CardShell from '../../components/CardShell.vue';
import CommandStatus from '../../components/CommandStatus.vue';
import { isOn, switchValue, useCardSettings, useCommand, useElements, type CardProps, type ElementView } from '../../sdk';
import type { ButtonElement, ButtonsSettings } from './index';

const props = defineProps<CardProps>();
const settings = useCardSettings<ButtonsSettings>(props);
const buttons = useElements<ButtonElement>(props);
const { send } = useCommand(props);

// Pressing shows the new state at once; the next report from the device decides.
const pressed = reactive<Record<string, boolean>>({});
watch(() => buttons.value.map(button => button.updated?.getTime()), () => {
  for (const key of Object.keys(pressed))
    delete pressed[key];
});

function active(button: ElementView<ButtonElement>) {
  const id = button.element?.id ?? '';
  return button.settings.mode === 'push' ? false : pressed[id] ?? isOn(button, button.settings) ?? false;
}

function press(button: ElementView<ButtonElement>) {
  if (button.element == null)
    return;
  if (button.settings.mode === 'push') {
    send(button.element, switchValue(button.element, button.settings, true));
    return;
  }
  const next = !active(button);
  pressed[button.element.id] = next;
  send(button.element, switchValue(button.element, button.settings, next));
}

const state = computed(() => buttons.value.some(button => button.element?.commandTemplate != null) ? 'ready' : 'unbound');
</script>

<template>
  <CardShell :title="card.name" :subtitle="card.description" :icon="card.icon" :state="state">
    <div class="buttons" :class="`buttons--${settings.layout}`">
      <button
        v-for="button in buttons"
        :key="button.element?.id"
        v-ripple
        type="button"
        class="buttons__tile"
        :class="{ 'buttons__tile--on': active(button) }"
        :aria-pressed="button.settings.mode === 'push' ? undefined : active(button)"
        :disabled="button.element?.commandTemplate == null"
        @click="press(button)"
      >
        <v-icon :icon="button.element?.icon || (button.settings.mode === 'push' ? 'mdi-gesture-tap' : 'mdi-power')" size="26" />
        <span class="buttons__name">{{ button.element?.name }}</span>
        <span class="buttons__status">
          <CommandStatus :command-id="button.element?.commandTemplate?.id" />
        </span>
      </button>
    </div>
  </CardShell>
</template>

<style scoped>
.buttons {
  display: grid;
  gap: 10px;
}

.buttons--grid {
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
}

.buttons--row {
  grid-auto-flow: column;
  grid-auto-columns: 104px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  margin-inline: -16px;
  padding-inline: 16px;
}

.buttons--row .buttons__tile {
  scroll-snap-align: start;
}

.buttons__tile {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  min-height: 96px;
  padding: 12px;
  border: none;
  border-radius: 16px;
  font: inherit;
  text-align: start;
  color: rgb(var(--v-theme-on-surface));
  background: rgb(var(--v-theme-surface-container-high));
  cursor: pointer;
  overflow: hidden;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.12s ease;
}

.buttons__tile:active {
  transform: scale(0.96);
}

.buttons__tile:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.buttons__tile:disabled {
  cursor: default;
  opacity: 0.5;
}

.buttons__tile--on {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.buttons__name {
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.2;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.buttons__status {
  position: absolute;
  top: 10px;
  right: 10px;
}
</style>
