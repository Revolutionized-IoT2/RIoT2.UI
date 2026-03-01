<script setup lang="ts">
import { nameValueStr } from '@/models/rules/nameValueStr';
import { OutputOperation, ValueType } from '@/models/enums';
import { onMounted, ref } from 'vue';
import { ReportTemplate } from '@/models/rules/reportTemplate';
import CommandTemplate from '@/models/commandTemplate';
import ReportTemplateEditor from './ReportTemplateEditor.vue';
import CommandTemplateEditor from './CommandTemplateEditor.vue';
import { useOrchestrator } from '@/composables/orchestratorService';
import { Report } from '@/models/report';
import Datamodel from '@/components/rules/DatamodelComponent.vue';
import type { CronValidationResult } from '@/models/cronValidationResult';
import DeviceConfiguration from '@/models/deviceConfiguration';
import Command from '@/models/command';

const model = defineModel<DeviceConfiguration>({ default: new DeviceConfiguration() });
const orchestrator = useOrchestrator();

/*
const props = defineProps<{
  enabled: boolean,
  title: string
}>();
*/

const emit = defineEmits<{
    delete: [string],
}>();

const reportHeaders = [
  { title: 'Name', value: 'name' },
  { title: 'Address', value: 'address' },
  { title: 'Type', value: 'type' }, 
  { title: 'Filter options', value: 'filters' },
  //{ title: 'Refresh', value: 'refreshSchedule' },
  { title: 'Store datapoints', value: 'maintainHistory' },
  { title: 'Actions', value: 'id' }
]

const commandHeaders= [
  { title: 'Name', value: 'name' },
  { title: 'Address', value: 'address' },
  { title: 'Type', value: 'type' }, 
  { title: 'Actions', value: 'id' }
]

const newPropertyDialog = ref(false);
const newPropertyValue = ref<nameValueStr>(new nameValueStr("", ""));

const newReportTemplateDialog = ref(false);
const reportTemplateForEdit = ref<ReportTemplate>(new ReportTemplate());
const commandTemplateForEdit = ref<CommandTemplate>(new CommandTemplate());
const newCommandTemplateDialog = ref(false);

const valueDialog = ref(false);
const currentReport = ref<Report | null>(null);
const loading = ref(false);

const commandDialog = ref(false);

const validatingCron = ref(false);
const cronValidationResult = ref<CronValidationResult|null>(null);

function showReportValue(template: ReportTemplate) {
  let r = JSON.parse(JSON.stringify(template));
  reportTemplateForEdit.value = r;

  valueDialog.value = true;

  loading.value = true;
  orchestrator.getReportState(template.id, (data : Report | null) => {
    currentReport.value = data?.value;
    }, () => {
    loading.value = false;  
  });
}

function validateCron(focused: boolean) {

  if(focused) //only validate on exit
    return;

  if (model.value.refreshSchedule == undefined || model.value.refreshSchedule == "") {
    cronValidationResult.value = null;
    return;
  }

  if(model.value.refreshSchedule.length < 6) {
    cronValidationResult.value = {
      expression: model.value.refreshSchedule,
      isValid: false,
      summary: "expression too short"
    }
    return;
  }

  validatingCron.value = true;
  orchestrator.validateCron({ expression: model.value.refreshSchedule },
    (data: CronValidationResult | null) => {
      cronValidationResult.value = data;
    },
    () => {
      validatingCron.value = false;
    });
}

function newReportTemplate() {
  let r = new ReportTemplate();
  r.deviceId = model.value.id;

  reportTemplateForEdit.value = r; 
  newReportTemplateDialog.value = true;
}

function saveReport() {

  if(reportTemplateForEdit.value.deviceId == null || reportTemplateForEdit.value.deviceId == "")
    return;

  //if new add to templates
  if(reportTemplateForEdit.value.id == "") {
    model.value.reportTemplates?.push(reportTemplateForEdit.value);
  } else { //edit operation -> replace existing with edited
    let reportIdx = model.value.reportTemplates?.findIndex(x => x.id == reportTemplateForEdit.value.id);
    if(model.value.reportTemplates != null && reportIdx != undefined && reportIdx > -1)
    model.value.reportTemplates[reportIdx] = reportTemplateForEdit.value;
  }
  newReportTemplateDialog.value = false;
}

function editReportTemplate(template: ReportTemplate) {

  //lets create a copy
  let r = JSON.parse(JSON.stringify(template));
  r.deviceId = model.value.id;

  reportTemplateForEdit.value = r;
  newReportTemplateDialog.value = true;
}

function deleteReportTemplate(id: string) {

  if(model.value.reportTemplates == null)
    return;

  let reportIdx = model.value.reportTemplates.findIndex(x => x.id == id);
  if(reportIdx == -1)
    return;
  
  model.value.reportTemplates.splice(reportIdx, 1);
}

function newCommandTemplate() {
  let c = new CommandTemplate();
  c.deviceId = model.value.id;

  commandTemplateForEdit.value = c; 
  newCommandTemplateDialog.value = true;
}

function saveCommand() {

if(commandTemplateForEdit.value.deviceId == null || commandTemplateForEdit.value.deviceId =="")
  return;

  if(commandTemplateForEdit.value.id == "") {
    model.value.commandTemplates?.push(commandTemplateForEdit.value);
  } else { //edit operation -> replace existing with edited
    let cmdIdx = model.value.commandTemplates?.findIndex(x => x.id == commandTemplateForEdit.value.id);
    if(model.value.commandTemplates != null && cmdIdx != undefined && cmdIdx > -1)
      model.value.commandTemplates[cmdIdx] = commandTemplateForEdit.value;
  }

  newCommandTemplateDialog.value = false;
}

function editCommandTemplate(template: CommandTemplate) {
  //lets create a copy
  let c = JSON.parse(JSON.stringify(template));
  c.deviceId = model.value.id;

  commandTemplateForEdit.value = c;
  newCommandTemplateDialog.value = true;
}

function deleteCommandTemplate(id: string) {

  if(model.value.commandTemplates == null)
    return;

  let cmdIdx = model.value.commandTemplates.findIndex(x => x.id == id);
  if(cmdIdx == -1)
    return;
  
  model.value.commandTemplates.splice(cmdIdx, 1);
}

function executeCommand(template: CommandTemplate) {

  let r = JSON.parse(JSON.stringify(template));
  commandTemplateForEdit.value = r;

  commandDialog.value = true;
}

function runCommand() {
  
  let cmd: Command = {
    id: commandTemplateForEdit.value.id,
    value: commandTemplateForEdit.value.model
  };

  loading.value = true;
  orchestrator.executeCommand(cmd, (data: void | null) => {
    commandDialog.value = false;
  },
  () => {
    loading.value = false;
  });
}

async function removeParameter(propertyName: string) {
  delete model.value.deviceParameters[propertyName]; //check can it be done here?!
}

function newParameter() {
  newPropertyValue.value = new nameValueStr("", "");
  newPropertyDialog.value = true;
}

function saveParameter() {
  if(newPropertyValue == null || newPropertyValue.value == null)
    return;

  model.value.deviceParameters[newPropertyValue.value.name] = newPropertyValue.value.value;
  newPropertyDialog.value = false;
}

function deleteDevice() {
  emit('delete', model.value.id);
}

function getCronTooltipText() {
  if(cronValidationResult.value == null)
    return "";
  
  let tip = cronValidationResult.value.summary
  tip?.replace("\n", "<br>");
  return tip;
}

onMounted(() => {
  validateCron(false); //run once after loading to get current cron state
});
</script>

<template>
  <v-expansion-panel>
    <v-expansion-panel-title color="info" class="font-weight-bold">{{ model.name }}</v-expansion-panel-title>
    <v-expansion-panel-text>
      <p class="mt-4">Device parameters</p>
      <v-divider class="border-opacity-100 mb-3" color="black" />
      <v-row>
        <v-col cols="6">
          <v-text-field v-model="model.name" required hide-details label="Device Name" />
        </v-col>
        <v-col cols="6">
          <v-text-field v-model="model.id" required hide-details label="Device Id" />
        </v-col>
        <v-col cols="6">
          <v-text-field v-model="model.classFullName" required hide-details label="Device Class Fullname" />
        </v-col>
        <v-col cols="6">
          <v-text-field v-model="model.refreshSchedule" variant="solo" dense hint="cron: '0 0 * ? * * *' or leave empty if refesh is done automatically."
              label="Device Refresh Schedule" @update:focused="validateCron"> 
              <template v-slot:append-inner>
                <v-tooltip v-if="cronValidationResult !=null" location="bottom" activator="parent">
                  <template v-slot:activator="{ props }">
                    <v-icon :color="(cronValidationResult.isValid ? 'primary':'error')" :icon="(cronValidationResult.isValid ? 'check':'error')" />
                  </template>
                  <span v-html="getCronTooltipText()"></span>
                </v-tooltip>
              </template>
              <template v-slot:loader>
                <v-progress-linear :active="validatingCron" color="secondary" model-value="progress" height="5" indeterminate />
              </template>
          </v-text-field>
        </v-col>
      </v-row>
      <div v-if="model.deviceParameters != null">
        <p>Additional parameters</p>
        <v-divider class="border-opacity-100 mb-3" color="black" />
        <v-row>
          <v-col cols="4" v-for="(p) in Object.keys(model.deviceParameters)">
            <v-text-field v-model="model.deviceParameters[p]" hide-details append-inner-icon="delete" 
              @click:append-inner="removeParameter(p)"
              :label="p" />
          </v-col>
        </v-row>
        <v-btn size="small" class="mt-6 mb-6" rounded="0" color="blue-darken-1" variant="outlined" @click="newParameter">
          <v-icon>add</v-icon>
          new parameter
        </v-btn>
      </div>

      <v-data-table v-if="model.reportTemplates != null" :hide-default-footer="model.reportTemplates.length < 10" 
        :items="model.reportTemplates" :headers="reportHeaders" density="compact" class="mt-4">
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title class="text-subtitle-1">Report templates - {{ model.name }}</v-toolbar-title>
            <v-spacer />
            <v-dialog v-model="newReportTemplateDialog" max-width="800px">
              <template v-slot:activator="{ props }">
                <v-btn size="small" rounded="0" color="blue-darken-1" variant="outlined" @click="newReportTemplate">
                  <v-icon>add</v-icon>
                  new report template
                </v-btn>
              </template>
              <ReportTemplateEditor v-model="reportTemplateForEdit" @save="saveReport" @cancel="newReportTemplateDialog = false" />
            </v-dialog>
          </v-toolbar>
        </template>
        <template v-slot:item.name="{ item }">
          {{item.name}}
        </template>
        <template v-slot:item.address="{ item }">
          {{item.address}}
        </template>
        <template v-slot:item.type="{ item }">
          {{ ValueType[item.type] }}
        </template>
        <template v-slot:item.filters="{ item }">
          {{ item.filters?.join('; ') }}
        </template>
        <template v-slot:item.refreshSchedule="{ item }">
          {{ item.refreshSchedule }}
        </template>
        <template v-slot:header.maintainHistory="{ column }">
          <v-tooltip text="Set value to true to activate time-series tracking" location="top" activator="parent">
            <template v-slot:activator="{ props }">
              <div v-bind="props" class="text-center">
                {{ column.title }}
              </div>
            </template>
          </v-tooltip>
        </template>
        <template v-slot:item.maintainHistory="{ item }">
          <div class="text-center">
            <v-icon color="success" v-if="item.maintainHistory">check_circle</v-icon>
            <v-icon color="warning" v-else>block</v-icon>
          </div>
        </template>
        
        <template v-slot:header.id="{ column }">
          <div class="text-end">
            {{ column.title }}
          </div>
        </template>
        <template v-slot:item.id="{ item }">
          <div class="text-end">
            <v-tooltip text="Get current value or default" location="top">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" size="small" class="me-3" @click="showReportValue(item)">
                  speed
                </v-icon>
              </template>
            </v-tooltip>
            <v-tooltip text="Edit report template" location="top">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" size="small" class="me-2" @click="editReportTemplate(item)">
                  edit
                </v-icon>
              </template>
            </v-tooltip>
            <v-tooltip text="Delete report" location="top">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" size="small" @click="deleteReportTemplate(item.id)">
                  delete
                </v-icon>
              </template>
            </v-tooltip>
          </div>
        </template>
        <template v-slot:no-data>
          <div class="font-weight-bold">no report templates</div>
        </template>
      </v-data-table>

      <v-data-table v-if="model.commandTemplates != null" :hide-default-footer="model.commandTemplates.length < 10"
        :items="model.commandTemplates" :headers="commandHeaders" density="compact" class="mt-4">
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title class="text-subtitle-1">Command templates - {{ model.name }}</v-toolbar-title>
            <v-spacer />
            <v-dialog v-model="newCommandTemplateDialog" max-width="800px">
              <template v-slot:activator="{ props }">
                <v-btn size="small" rounded="0" color="blue-darken-1" variant="outlined" @click="newCommandTemplate">
                  <v-icon>add</v-icon>
                    new command template
                </v-btn>
              </template>
              <CommandTemplateEditor v-model="commandTemplateForEdit" @save="saveCommand" @cancel="newCommandTemplateDialog = false" />
            </v-dialog>
          </v-toolbar>
        </template>
        
        <template v-slot:item.name="{ item }">
          {{item.name}}
        </template>
        <template v-slot:item.address="{ item }">
          {{item.address}}
        </template>
        <template v-slot:item.type="{ item }">
          {{ ValueType[item.type] }}
        </template>
        <template v-slot:header.id="{ column }">
          <div class="text-end">
            {{ column.title }}
          </div>
        </template>
        <template v-slot:item.id="{ item }">
          <div class="text-end">
            <v-tooltip text="Execute command" location="top">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" size="small" class="me-3" @click="executeCommand(item)">
                  play_circle
                </v-icon>
              </template>
            </v-tooltip>
            <v-tooltip text="Edit command" location="top">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" size="small" class="me-2" @click="editCommandTemplate(item)">edit</v-icon>
              </template>
            </v-tooltip>
            <v-tooltip text="Delete command" location="top">
              <template v-slot:activator="{ props }">
                <v-icon v-bind="props" size="small" @click="deleteCommandTemplate(item.id)">delete</v-icon>
              </template>
            </v-tooltip>
          </div>
        </template>
        <template v-slot:no-data>
          <div class="font-weight-bold">no command templates</div>
        </template>
      </v-data-table>
      <v-spacer />
      <v-btn size="small" class="mt-4" rounded="0" color="error" variant="outlined" @click="deleteDevice">
        <v-icon>delete</v-icon>
          delete {{ model.name }}
      </v-btn>
    </v-expansion-panel-text>
  </v-expansion-panel>

  <!--dialogs-->

  <v-dialog v-model="newPropertyDialog" persistent width="400">
    <v-card>
      <v-toolbar title="New Property"></v-toolbar>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="newPropertyValue.name" label="Name" required />
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="newPropertyValue.value" label="Value" required />
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="blue-darken-1" variant="text" @click="newPropertyDialog = false">
          cancel
        </v-btn>
        <v-btn color="blue-darken-1" variant="text" @click="saveParameter">
          save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="valueDialog" max-width="600px">
    <v-progress-circular v-if="loading" :size="70" :width="7" color="primary" indeterminate />
    <v-card width="600px" v-else>
      <v-toolbar :title="reportTemplateForEdit.name"></v-toolbar>
      <v-card-subtitle class="pb-1 text-subtitle-1">{{reportTemplateForEdit?.device}}</v-card-subtitle>
      <!--<v-card-subtitle class="pb-1 text-disabled text-decoration-overline text-subtitle-2">-todo-</v-card-subtitle>-->
      <v-card-text>
        <Datamodel :datamodel="currentReport" labeltext="Value" :expanded="true" :editable="false" :readInput="false" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="valueDialog = false" color="blue">
          <v-icon>close</v-icon>
            close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="commandDialog" max-width="600px">
    <v-progress-circular v-if="loading" :size="70" :width="7" color="primary" indeterminate />
    <v-card width="600px" v-else>
      <v-toolbar :title="commandTemplateForEdit.name"></v-toolbar>
      <v-card-subtitle class="pb-1 text-subtitle-1">{{commandTemplateForEdit?.device}}</v-card-subtitle>
      <!--<v-card-subtitle class="pb-1 text-disabled text-decoration-overline text-subtitle-2">-todo-</v-card-subtitle>-->
      <v-card-text>
        <Datamodel :datamodel="commandTemplateForEdit.model" :expanded="true" :editable="true" :expandable="false" 
        @modelUpdated="(obj:any) => {commandTemplateForEdit.model = obj}" />
      </v-card-text>
      <v-card-actions>
        <v-btn @click="runCommand" color="primary" variant="tonal">
          <v-icon>play_circle</v-icon>
            Execute
        </v-btn>
        <v-spacer />
        <v-btn @click="commandDialog = false" color="blue">
          <v-icon>close</v-icon>
            close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<!--component styles-->
<style scoped>

</style>