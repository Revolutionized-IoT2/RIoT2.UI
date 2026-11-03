<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import IconField from '@/components/IconField.vue';
import type { CardElement } from '@/models/dashboard';
import type { ITemplate } from '@/models/itemplate';
import { useTemplatesStore } from '@/stores/templatesStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import SettingsForm from './SettingsForm.vue';
import TemplatePicker from './TemplatePicker.vue';
import { schemaAt, templateSchema } from '../sdk/capabilities';
import { bindTemplate } from '../sdk/model';
import type { ElementSlot, FieldContext, Settings } from '../sdk/types';

/**
 * One element of a card in the editor: what it shows (a report or variable) and controls (a command
 * or variable), its name and icon, and the settings its slot declares. Choosing a template fills in
 * what the template tells and loads its recent reports, so the preview shows real data.
 */
// The card editor works on its own copy of the card (cloneCard), so the element is changed here.
/* eslint-disable vue/no-mutating-props */
const props = defineProps<{ element: CardElement, elementSlot?: ElementSlot, cardSettings: Settings, removable?: boolean }>();
const emit = defineEmits<{ remove: [] }>();

const { readableTemplates, writableTemplates } = storeToRefs(useTemplatesStore());
const dashboard = useDashboardStore();

const reportSchema = computed(() => templateSchema(props.element.reportTemplate));
const context = computed<FieldContext>(() => ({
  reportSchema: reportSchema.value,
  commandSchema: templateSchema(props.element.commandTemplate),
  valueSchema: schemaAt(reportSchema.value, props.element.properties.member),
  card: props.cardSettings,
}));

const report = computed({
  get: () => props.element.reportTemplate as ITemplate | undefined,
  set: async template => {
    bindTemplate(props.element, 'report', template, props.elementSlot);
    if (template == null) {
      props.element.previousReports = [];
      props.element.report = undefined;
      return;
    }
    const history = await dashboard.reportHistory(template.id);
    if (props.element.reportTemplate?.id === template.id)
      props.element.previousReports = history.slice(0, Math.max(1, props.element.numberOfPreviousReports));
  },
});

const command = computed({
  get: () => props.element.commandTemplate as ITemplate | undefined,
  set: template => bindTemplate(props.element, 'command', template, props.elementSlot),
});

const name = computed({ get: () => props.element.name, set: value => { props.element.name = value; } });
const icon = computed({ get: () => props.element.icon ?? '', set: value => { props.element.icon = value || undefined; } });
const properties = computed({ get: () => props.element.properties, set: value => { props.element.properties = value; } });
</script>

<template>
  <div class="element-editor">
    <div class="element-editor__head">
      <div>
        <div class="element-editor__title">{{ elementSlot?.label ?? 'Element' }}</div>
        <div v-if="elementSlot?.hint" class="element-editor__hint">{{ elementSlot.hint }}</div>
      </div>
      <v-btn v-if="removable" icon="mdi-delete-outline" variant="text" color="error" size="small" :aria-label="`Remove ${elementSlot?.label ?? 'element'}`" @click="emit('remove')" />
    </div>

    <TemplatePicker
      v-if="elementSlot?.report !== 'none'"
      v-model="report"
      :templates="readableTemplates"
      :accepts="elementSlot?.accepts"
      :required="elementSlot?.report === 'required'"
      :label="elementSlot?.command === 'none' ? 'Shows' : 'State from (report)'"
    />
    <TemplatePicker
      v-if="elementSlot?.command !== 'none'"
      v-model="command"
      :templates="writableTemplates"
      :accepts="elementSlot?.accepts"
      :required="elementSlot?.command === 'required'"
      label="Controls (command)"
    />

    <div class="element-editor__row">
      <v-text-field v-model="name" label="Name" />
      <IconField v-model="icon" label="Icon" />
    </div>

    <SettingsForm v-if="elementSlot?.settings?.length" v-model="properties" :fields="elementSlot.settings" :context="context" />
  </div>
</template>

<style scoped>
.element-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface-container-low));
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-outline-variant)) 60%, transparent);
}

.element-editor__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.element-editor__title {
  font-weight: 600;
}

.element-editor__hint {
  font-size: 0.8rem;
  opacity: 0.7;
}

.element-editor__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 12px 16px;
}
</style>
