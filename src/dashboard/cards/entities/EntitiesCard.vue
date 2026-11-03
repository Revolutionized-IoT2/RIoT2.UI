<script setup lang="ts">
import { computed } from 'vue';
import CardShell from '../../components/CardShell.vue';
import CommandStatus from '../../components/CommandStatus.vue';
import RelativeTime from '@/components/RelativeTime.vue';
import { commandIsBoolean, formatNumber, iconFor, isNumeric, toNumber, useCardSettings, useCommand, useElements, type CardProps, type ElementView } from '../../sdk';
import type { EntitiesSettings, EntityElement } from './index';

const props = defineProps<CardProps>();
const rows = useElements<EntityElement>(props);
const { send } = useCommand(props);

function display(row: ElementView<EntityElement>): string {
  if (!row.hasValue)
    return '–';
  if (row.boolean !== undefined && (row.schema?.type === 'boolean' || typeof row.value === 'boolean'))
    return row.boolean ? row.settings.onLabel || 'On' : row.settings.offLabel || 'Off';
  if (isNumeric(row.schema) || typeof row.value === 'number')
    return `${formatNumber(row.number, toNumber(row.setting('digits') ?? 1))}${row.unit ? ` ${row.unit}` : ''}`;
  return row.text;
}

function icon(row: ElementView<EntityElement>) {
  return row.element?.icon || iconFor(row.schema?.semantic, row.boolean !== false) || 'mdi-circle-small';
}

const hasSwitch = (row: ElementView<EntityElement>) => commandIsBoolean(row.element);
const state = computed(() => rows.value.some(row => row.bound) ? 'ready' : 'unbound');
const settings = useCardSettings<EntitiesSettings>(props);
</script>

<template>
  <CardShell :title="card.name" :subtitle="card.description" :icon="card.icon" :state="state" dense>
    <ul class="entities">
      <li v-for="row in rows" :key="row.element?.id" class="entities__row">
        <v-icon class="entities__icon" :icon="icon(row)" size="20" :color="row.boolean ? 'primary' : undefined" />
        <span class="entities__name">
          {{ row.element?.name }}
          <small v-if="settings.showTime && row.updated" class="entities__time"><RelativeTime :time="row.updated" /></small>
        </span>
        <template v-if="hasSwitch(row)">
          <CommandStatus :command-id="row.element?.commandTemplate?.id" />
          <v-switch :model-value="row.boolean === true" color="primary" inset hide-details density="compact" :aria-label="row.element?.name" @update:model-value="value => send(row.element, !!value)" />
        </template>
        <span v-else class="entities__value">{{ display(row) }}</span>
      </li>
    </ul>
  </CardShell>
</template>

<style scoped>
.entities {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.entities__row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
}

.entities__row + .entities__row {
  border-top: 1px solid color-mix(in srgb, rgb(var(--v-theme-outline-variant)) 50%, transparent);
}

.entities__icon {
  flex: none;
  opacity: 0.85;
}

.entities__name {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entities__time {
  font-size: 0.7rem;
  opacity: 0.6;
}

.entities__value {
  flex: none;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.entities :deep(.v-switch) {
  flex: none;
}
</style>
