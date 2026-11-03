<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import IconField from '@/components/IconField.vue';
import type { CardElement, DashboardCard } from '@/models/dashboard';
import CardHost from '../view/CardHost.vue';
import CardGallery from './CardGallery.vue';
import ElementEditor from './ElementEditor.vue';
import SettingsForm from './SettingsForm.vue';
import { findCard, legacyTypeOf } from '../sdk/registry';
import { cardSettings, cloneCard, createCard, createElement, slotOf } from '../sdk/model';
import { sizeOptions } from '../sdk/layout';
import type { AnyCardDefinition, ElementSlot, Settings } from '../sdk/types';

/**
 * Adds or edits a card: pick a card type from the gallery, then choose what it shows and how it
 * looks, with a live preview. Works on a copy; `save` hands the finished card back.
 */
const props = defineProps<{ card: DashboardCard | null }>();
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ save: [DashboardCard] }>();

const { smAndDown } = useDisplay();
const step = ref<'gallery' | 'edit'>('gallery');
const tab = ref<'content' | 'look'>('content');
const draft = ref<DashboardCard>();
const isNew = ref(true);

watch(open, isOpen => {
  if (!isOpen)
    return;
  isNew.value = props.card == null;
  draft.value = props.card == null ? undefined : cloneCard(props.card);
  step.value = props.card == null ? 'gallery' : 'edit';
  tab.value = 'content';
}, { immediate: true });

const definition = computed(() => findCard(draft.value?.kind));
const layout = computed(() => definition.value?.elements);
const settings = computed({
  get: () => draft.value == null ? {} : cardSettings(draft.value, definition.value),
  set: (value: Settings) => { if (draft.value) draft.value.settings = value; },
});

/**
 * Picks a card type. An edited card that changes type keeps its name, look and size, its bound
 * templates where the new type has room for them, and the settings both types have.
 */
function pick(next: AnyCardDefinition) {
  if (draft.value?.kind === next.kind) {
    step.value = 'edit';
    return;
  }
  const card = createCard(next);
  const old = draft.value;
  if (old != null) {
    Object.assign(card, { id: old.id, name: old.name, description: old.description, icon: old.icon, size: old.size });
    card.settings = { ...card.settings, ...keep(old.settings ?? {}, next.defaults) };
    const target = next.elements;
    if (target != null && 'each' in target)
      card.elements = (old.elements.length > 0 ? old.elements.slice(0, target.max) : card.elements).map(element => rebind(element, target.each));
    else if (target != null) {
      const unused = old.elements.filter(element => !target.slots.some(slot => slot.role === element.properties.role));
      card.elements = target.slots
        .map(slot => old.elements.find(element => element.properties.role === slot.role) ?? (slot.report === 'required' || slot.command === 'required' ? unused.shift() : undefined))
        .map((element, i) => element ? rebind(element, target.slots[i]) : undefined)
        .filter((element): element is CardElement => element != null);
    }
  }
  draft.value = card;
  step.value = 'edit';
  tab.value = 'content';
}

/** The settings whose keys the new type also has. */
function keep(settings: Settings, defaults: Settings): Settings {
  return Object.fromEntries(Object.entries(settings).filter(([key]) => key in defaults));
}

function rebind(element: CardElement, slot: ElementSlot) {
  const fresh = createElement(slot);
  fresh.id = element.id;
  fresh.name = element.name;
  fresh.icon = element.icon;
  fresh.reportTemplate = slot.report === 'none' ? undefined : element.reportTemplate;
  fresh.commandTemplate = slot.command === 'none' ? undefined : element.commandTemplate;
  fresh.numberOfPreviousReports = element.numberOfPreviousReports;
  Object.assign(fresh.properties, keep(element.properties, { ...(slot.defaults ?? {}), member: null }));
  fresh.previousReports = element.previousReports.slice();
  return fresh;
}

function addElement(slot = layout.value && 'each' in layout.value ? layout.value.each : undefined) {
  draft.value?.elements.push(createElement(slot));
}

function removeElement(index: number) {
  draft.value?.elements.splice(index, 1);
}

const canAdd = computed(() => layout.value != null && 'each' in layout.value && (draft.value?.elements.length ?? 0) < layout.value.max);
const canRemove = computed(() => layout.value != null && 'each' in layout.value && (draft.value?.elements.length ?? 0) > layout.value.min);
const missingSlots = computed(() => layout.value != null && 'slots' in layout.value
  ? layout.value.slots.filter(slot => !draft.value?.elements.some(element => element.properties.role === slot.role))
  : []);

function save() {
  if (draft.value == null || definition.value == null)
    return;
  draft.value.type = legacyTypeOf(definition.value, settings.value);
  emit('save', draft.value);
  open.value = false;
}

const previewWidth = computed(() => ({ 3: '300px', 6: '520px', 9: '100%', 12: '100%' } as Record<number, string>)[draft.value?.size ?? 3]);
const title = computed(() => step.value === 'gallery' ? (isNew.value ? 'Add a card' : 'Change the card type') : `${isNew.value ? 'New' : 'Edit'} ${definition.value?.title.toLowerCase() ?? 'card'}`);
</script>

<template>
  <v-dialog v-model="open" :fullscreen="smAndDown" max-width="1240" scrollable>
    <v-card class="card-editor">
      <v-toolbar color="surface" density="comfortable" border="b">
        <v-btn v-if="step === 'gallery' && !isNew" icon="mdi-arrow-left" aria-label="Back" @click="step = 'edit'" />
        <v-btn v-else icon="mdi-close" aria-label="Close" @click="open = false" />
        <v-toolbar-title>{{ title }}</v-toolbar-title>
        <template v-if="step === 'edit'">
          <v-btn class="text-none mr-1" variant="text" prepend-icon="mdi-swap-horizontal" @click="step = 'gallery'">Type</v-btn>
          <v-btn class="text-none mr-2" color="primary" variant="flat" prepend-icon="mdi-check" @click="save">{{ isNew ? 'Add' : 'Done' }}</v-btn>
        </template>
      </v-toolbar>

      <v-card-text v-if="step === 'gallery'" class="pa-4">
        <CardGallery :current="draft?.kind" @pick="pick" />
      </v-card-text>

      <v-card-text v-else-if="draft && definition" class="card-editor__body pa-0">
        <div class="card-editor__form">
          <v-tabs v-model="tab" color="primary" class="mb-4">
            <v-tab value="content" prepend-icon="mdi-connection" class="text-none">Content</v-tab>
            <v-tab value="look" prepend-icon="mdi-palette-outline" class="text-none">Appearance</v-tab>
          </v-tabs>

          <v-window v-model="tab">
            <v-window-item value="content">
              <div class="card-editor__stack">
                <div v-if="!layout" class="text-medium-emphasis">This card shows no device data.</div>
                <ElementEditor
                  v-for="(element, index) in draft.elements"
                  :key="element.id"
                  :element="element"
                  :element-slot="slotOf(definition, element, index)"
                  :card-settings="settings"
                  :removable="canRemove || ('slots' in (layout ?? {}) && slotOf(definition, element, index)?.report !== 'required' && slotOf(definition, element, index)?.command !== 'required')"
                  @remove="removeElement(index)"
                />
                <div class="d-flex flex-wrap ga-2">
                  <v-btn v-if="canAdd" class="text-none" variant="tonal" prepend-icon="mdi-plus" @click="addElement()">
                    Add {{ layout && 'each' in layout ? layout.each.label.toLowerCase() : 'element' }}
                  </v-btn>
                  <v-btn v-for="slot in missingSlots" :key="slot.role" class="text-none" variant="tonal" prepend-icon="mdi-plus" @click="addElement(slot)">
                    Add {{ slot.label.toLowerCase() }}
                  </v-btn>
                </div>
                <template v-if="definition.settings?.length">
                  <div class="card-editor__heading">Options</div>
                  <SettingsForm v-model="settings" :fields="definition.settings" />
                </template>
              </div>
            </v-window-item>

            <v-window-item value="look">
              <div class="card-editor__stack">
                <v-text-field v-model="draft.name" label="Title" :placeholder="draft.elements[0]?.name || definition.title" persistent-placeholder hint="Empty: the name of the first element." persistent-hint />
                <v-text-field v-model="draft.description" label="Subtitle" />
                <IconField :model-value="draft.icon ?? ''" label="Icon" hint="Empty: an icon that fits the data." @update:model-value="value => draft && (draft.icon = value || null)" />
                <div>
                  <div class="card-editor__label">Size</div>
                  <v-btn-toggle v-model="draft.size" mandatory divided variant="outlined" color="primary" rounded="xl" density="comfortable" class="card-editor__sizes">
                    <v-btn v-for="size in sizeOptions" :key="size.value" :value="size.value" :prepend-icon="size.icon" class="text-none">{{ size.title }}</v-btn>
                  </v-btn-toggle>
                  <div class="card-editor__hint">On phones every card takes the full width, except small sensor cards, two of which sit side by side.</div>
                </div>
              </div>
            </v-window-item>
          </v-window>
        </div>

        <aside class="card-editor__preview">
          <div class="card-editor__label">Preview</div>
          <div class="card-editor__frame" :style="{ width: previewWidth }">
            <CardHost :card="draft" preview />
          </div>
          <div class="card-editor__hint">Shows the latest data; controls don't send anything here.</div>
        </aside>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.card-editor__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 42%);
  align-items: start;
}

.card-editor__form {
  padding: 16px 20px 24px;
  min-width: 0;
}

.card-editor__stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 4px;
}

.card-editor__heading {
  font-weight: 600;
  margin-top: 8px;
}

.card-editor__preview {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-height: 100%;
  padding: 20px;
  background: rgb(var(--v-theme-dashboard-background));
}

.card-editor__preview .card-editor__label {
  align-self: flex-start;
}

.card-editor__frame {
  max-width: 100%;
  min-height: 140px;
}

.card-editor__label {
  font-size: 0.85rem;
  margin-bottom: 6px;
  opacity: 0.8;
}

.card-editor__hint {
  font-size: 0.75rem;
  opacity: 0.65;
  margin-top: 4px;
}

.card-editor__sizes {
  flex-wrap: wrap;
  height: auto;
}

@media (max-width: 960px) {
  .card-editor__body {
    grid-template-columns: 1fr;
  }

  .card-editor__preview {
    position: static;
    order: -1;
    min-height: 0;
  }
}
</style>
