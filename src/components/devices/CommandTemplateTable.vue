<script setup lang="ts">
import { computed, ref } from 'vue';
import { ValueType } from '@/models/enums';
import CommandTemplate from '@/models/commandTemplate';
import DeviceConfiguration from '@/models/deviceConfiguration';
import CommandTemplateEditor from '@/components/CommandTemplateEditor.vue';
import Datamodel from '@/components/DatamodelComponent.vue';
import SchemaValueInput from '@/components/SchemaValueInput.vue';
import { templateSchema } from '@/dashboard/sdk/capabilities';
import { useCommandsStore } from '@/stores/commandsStore';
import type { JsonValue } from '@/models/generated/contracts';

const model = defineModel<DeviceConfiguration>({ default: () => new DeviceConfiguration() });

const commands = useCommandsStore();

const headers = [
  { title: 'Name', value: 'name' },
  { title: 'Address', value: 'address' },
  { title: 'Type', value: 'type' },
  { title: 'Actions', value: 'id' }
];

const editorOpen = ref(false);
const editing = ref<CommandTemplate>(new CommandTemplate());

const executeOpen = ref(false);
const executing = ref(false);
const asJson = ref(false);
// The form follows the value's schema: declared by the plugin, else inferred from the sample model.
const executeSchema = computed(() => templateSchema(editing.value));

// Dialogs work on a copy, so cancel leaves the template as it was.
const copy = (template: CommandTemplate): CommandTemplate => JSON.parse(JSON.stringify(template));

function newTemplate() {
  const template = new CommandTemplate();
  template.deviceId = model.value.id;
  editing.value = template;
  editorOpen.value = true;
}

function editTemplate(template: CommandTemplate) {
  editing.value = copy(template);
  editing.value.deviceId = model.value.id;
  editorOpen.value = true;
}

/** A new template (no id yet) is added; an edited one replaces the template with its id. */
function saveTemplate() {
  if (editing.value.deviceId == null || editing.value.deviceId == "")
    return;

  if (editing.value.id == "") {
    model.value.commandTemplates?.push(editing.value);
  } else {
    const index = model.value.commandTemplates?.findIndex(x => x.id == editing.value.id) ?? -1;
    if (index > -1)
      model.value.commandTemplates![index] = editing.value;
  }
  editorOpen.value = false;
}

function deleteTemplate(id: string) {
  const index = model.value.commandTemplates?.findIndex(x => x.id == id) ?? -1;
  if (index > -1)
    model.value.commandTemplates!.splice(index, 1);
}

function prepareExecute(template: CommandTemplate) {
  editing.value = copy(template);
  executeOpen.value = true;
}

/** Sends the template's id with the edited value; the dialog stays open when it fails. */
async function execute() {
  executing.value = true;
  if (await commands.execute({ id: editing.value.id, value: editing.value.model }))
    executeOpen.value = false;
  executing.value = false;
}
</script>

<template>
  <v-data-table v-if="model.commandTemplates != null" :hide-default-footer="model.commandTemplates.length < 10"
    :items="model.commandTemplates" :headers="headers" density="compact" class="mt-4">
    <template v-slot:top>
      <v-toolbar flat>
        <v-toolbar-title class="text-body-large">Command templates - {{ model.name }}</v-toolbar-title>
        <v-spacer />
        <v-btn size="small" color="primary" variant="outlined" @click="newTemplate">
          <v-icon icon="mdi-plus" />
          new command template
        </v-btn>
      </v-toolbar>
    </template>
    <template v-slot:item.type="{ item }">
      {{ ValueType[item.type] }}
    </template>
    <template v-slot:header.id="{ column }">
      <div class="text-end">{{ column.title }}</div>
    </template>
    <template v-slot:item.id="{ item }">
      <div class="text-end">
        <v-tooltip text="Execute command" location="top">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="small" class="me-3" @click="prepareExecute(item)" icon="mdi-play-circle-outline" />
          </template>
        </v-tooltip>
        <v-tooltip text="Edit command" location="top">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="small" class="me-2" @click="editTemplate(item)" icon="mdi-pencil" />
          </template>
        </v-tooltip>
        <v-tooltip text="Delete command" location="top">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="small" @click="deleteTemplate(item.id)" icon="mdi-delete-outline" />
          </template>
        </v-tooltip>
      </div>
    </template>
    <template v-slot:no-data>
      <div class="font-weight-bold">no command templates</div>
    </template>
  </v-data-table>

  <v-dialog v-model="editorOpen" max-width="800px">
    <CommandTemplateEditor v-model="editing" @save="saveTemplate" @cancel="editorOpen = false" />
  </v-dialog>

  <v-dialog v-model="executeOpen" max-width="600px">
    <v-card :title="editing.name" :subtitle="editing.device" prepend-icon="mdi-play-circle-outline" rounded="xl">
      <v-card-text class="d-flex flex-column ga-3">
        <div v-if="executeSchema?.description || executeSchema?.unit" class="text-body-medium text-medium-emphasis">
          {{ [executeSchema?.description, executeSchema?.unit && `Unit: ${executeSchema.unit}`].filter(Boolean).join(' ? ') }}
        </div>
        <Datamodel v-if="asJson" :datamodel="editing.model" :expanded="true" :editable="true" :expandable="false"
          @modelUpdated="(value: JsonValue) => { editing.model = value }" />
        <SchemaValueInput v-else v-model="editing.model" :schema="executeSchema" label="Value" />
        <v-switch v-model="asJson" label="Edit as JSON" color="primary" density="compact" hide-details inset />
      </v-card-text>
      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn class="text-none" variant="text" @click="executeOpen = false">Close</v-btn>
        <v-btn class="text-none" :loading="executing" color="primary" variant="flat" prepend-icon="mdi-send" @click="execute">Send</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
