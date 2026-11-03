<script setup lang="ts">
import { ref } from 'vue';
import { ValueType } from '@/models/enums';
import { ReportTemplate } from '@/models/reportTemplate';
import DeviceConfiguration from '@/models/deviceConfiguration';
import ReportTemplateEditor from '@/components/ReportTemplateEditor.vue';
import Datamodel from '@/components/DatamodelComponent.vue';
import { useCommandsStore } from '@/stores/commandsStore';

const model = defineModel<DeviceConfiguration>({ default: () => new DeviceConfiguration() });

const commands = useCommandsStore();

const headers = [
  { title: 'Name', value: 'name' },
  { title: 'Address', value: 'address' },
  { title: 'Type', value: 'type' },
  { title: 'Filter options', value: 'filters' },
  { title: 'Store datapoints', value: 'maintainHistory' },
  { title: 'Actions', value: 'id' }
];

const editorOpen = ref(false);
const editing = ref<ReportTemplate>(new ReportTemplate());

const valueOpen = ref(false);
const currentValue = ref<unknown>(null);
const loadingValue = ref(false);

// Dialogs work on a copy, so cancel leaves the template as it was.
const copy = (template: ReportTemplate): ReportTemplate => JSON.parse(JSON.stringify(template));

async function showValue(template: ReportTemplate) {
  editing.value = copy(template);
  valueOpen.value = true;
  loadingValue.value = true;
  currentValue.value = (await commands.getReportState(template.id))?.value;
  loadingValue.value = false;
}

function newTemplate() {
  const template = new ReportTemplate();
  template.deviceId = model.value.id;
  editing.value = template;
  editorOpen.value = true;
}

function editTemplate(template: ReportTemplate) {
  editing.value = copy(template);
  editing.value.deviceId = model.value.id;
  editorOpen.value = true;
}

/** A new template (no id yet) is added; an edited one replaces the template with its id. */
function saveTemplate() {
  if (editing.value.deviceId == null || editing.value.deviceId == "")
    return;

  if (editing.value.id == "") {
    model.value.reportTemplates?.push(editing.value);
  } else {
    const index = model.value.reportTemplates?.findIndex(x => x.id == editing.value.id) ?? -1;
    if (index > -1)
      model.value.reportTemplates![index] = editing.value;
  }
  editorOpen.value = false;
}

function deleteTemplate(id: string) {
  const index = model.value.reportTemplates?.findIndex(x => x.id == id) ?? -1;
  if (index > -1)
    model.value.reportTemplates!.splice(index, 1);
}
</script>

<template>
  <v-data-table v-if="model.reportTemplates != null" :hide-default-footer="model.reportTemplates.length < 10"
    :items="model.reportTemplates" :headers="headers" density="compact" class="mt-4">
    <template v-slot:top>
      <v-toolbar flat>
        <v-toolbar-title class="text-body-large">Report templates - {{ model.name }}</v-toolbar-title>
        <v-spacer />
        <v-btn size="small" color="primary" variant="outlined" @click="newTemplate">
          <v-icon icon="mdi-plus" />
          new report template
        </v-btn>
      </v-toolbar>
    </template>
    <template v-slot:item.type="{ item }">
      {{ ValueType[item.type] }}
    </template>
    <template v-slot:item.filters="{ item }">
      {{ item.filters?.join('; ') }}
    </template>
    <template v-slot:header.maintainHistory="{ column }">
      <v-tooltip text="Set value to true to activate time-series tracking" location="top" activator="parent">
        <template v-slot:activator="{ props }">
          <div v-bind="props" class="text-center">{{ column.title }}</div>
        </template>
      </v-tooltip>
    </template>
    <template v-slot:item.maintainHistory="{ item }">
      <div class="text-center">
        <v-icon color="success" v-if="item.maintainHistory" icon="mdi-check-circle" />
        <v-icon color="warning" v-else icon="mdi-cancel" />
      </div>
    </template>
    <template v-slot:header.id="{ column }">
      <div class="text-end">{{ column.title }}</div>
    </template>
    <template v-slot:item.id="{ item }">
      <div class="text-end">
        <v-tooltip text="Get current value or default" location="top">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="small" class="me-3" @click="showValue(item)" icon="mdi-speedometer" />
          </template>
        </v-tooltip>
        <v-tooltip text="Edit report template" location="top">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="small" class="me-2" @click="editTemplate(item)" icon="mdi-pencil" />
          </template>
        </v-tooltip>
        <v-tooltip text="Delete report" location="top">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="small" @click="deleteTemplate(item.id)" icon="mdi-delete-outline" />
          </template>
        </v-tooltip>
      </div>
    </template>
    <template v-slot:no-data>
      <div class="font-weight-bold">no report templates</div>
    </template>
  </v-data-table>

  <v-dialog v-model="editorOpen" max-width="800px">
    <ReportTemplateEditor v-model="editing" @save="saveTemplate" @cancel="editorOpen = false" />
  </v-dialog>

  <v-dialog v-model="valueOpen" max-width="600px">
    <v-progress-circular v-if="loadingValue" :size="70" :width="7" color="primary" indeterminate />
    <v-card width="600px" v-else>
      <v-toolbar :title="editing.name"></v-toolbar>
      <v-card-subtitle class="pb-1 text-body-large">{{ editing.device }}</v-card-subtitle>
      <v-card-text>
        <Datamodel :datamodel="currentValue" labeltext="Value" :expanded="true" :editable="false" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="valueOpen = false" color="primary">
          <v-icon icon="mdi-close" />
          close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
