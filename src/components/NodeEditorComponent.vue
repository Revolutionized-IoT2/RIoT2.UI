<script setup lang="ts">
import NodeConfiguration from '@/models/nodeConfiguration';
import { nameValueStr } from '@/models/rules/nameValueStr';
import { ValueType } from '@/models/enums';
import { computed, nextTick, onMounted, ref } from 'vue';
import { ReportTemplate } from '@/models/rules/reportTemplate';
import CommandTemplate from '@/models/commandTemplate';
import ReportTemplateEditor from './ReportTemplateEditor.vue';
import CommandTemplateEditor from './CommandTemplateEditor.vue';
import systemNode from '@/models/systemNode';
import { useOrchestrator } from '@/composables/orchestratorService';

const model = defineModel<NodeConfiguration>({ default: new NodeConfiguration() });
const orchestrator = useOrchestrator();

const props = defineProps<{
  enabled: boolean,
  title: string
}>();

const emit = defineEmits<{
    delete: [number],
}>();

const reportHeaders = [
  { title: 'Name', value: 'name' },
  { title: 'Address', value: 'address' },
  { title: 'Type', value: 'type' }, 
  { title: 'Filters', value: 'filterOptions' },
  { title: 'Refresh', value: 'refreshSchedule' },
  { title: 'History', value: 'maintainHistory' },
  { title: 'Has parameters', value: 'parameters' }, 
  { title: 'Actions', value: 'id' }
]

const commandHeaders= [
  { title: 'Name', value: 'name' },
  { title: 'Address', value: 'address' },
  { title: 'Type', value: 'type' }, 
  { title: 'Model', value: 'model' }, 
  { title: 'Actions', value: 'id' }
]

const valid = ref(false);
const newPropertyDialog = ref(false);
const newPropertyValue = ref<nameValueStr>(new nameValueStr("", ""));
const newPropertyDeviceIndex = ref(-1);

const newReportTemplateDialog = ref(false);
const reportTemplateForEdit = ref<ReportTemplate>(new ReportTemplate());
const commandTemplateForEdit = ref<CommandTemplate>(new CommandTemplate());
const newCommandTemplateDialog = ref(false);
const nodeIdOptions = ref<systemNode[]>([]);

const newSaved = ref(false);

async function removeParameter(deviceIndex: number, propertyName: string) {
  delete model.value.deviceConfigurations[deviceIndex].deviceParameters[propertyName];
}

function addParameter() {
  if(newPropertyDeviceIndex.value == -1 || newPropertyValue == null || newPropertyValue.value == null)
    return;

  model.value.deviceConfigurations[newPropertyDeviceIndex.value].deviceParameters[newPropertyValue.value.name] = newPropertyValue.value.value;
  newPropertyDialog.value = false;
}

function newParameter(deviceIndex: number) {
  newPropertyValue.value = new nameValueStr("", "");
  newPropertyDeviceIndex.value = deviceIndex;
  newPropertyDialog.value = true;
}

function newReportTemplate(deviceIndex: number) {
  let r = new ReportTemplate();
  r.deviceId = model.value.deviceConfigurations[deviceIndex].id;

  reportTemplateForEdit.value = r; 
  newReportTemplateDialog.value = true;
}

function saveReport() {

  if(reportTemplateForEdit.value.deviceId == null || reportTemplateForEdit.value.deviceId =="")
    return;

  let idx = model.value.deviceConfigurations.findIndex(x => x.id == reportTemplateForEdit.value.deviceId);
  if(idx == -1)
    return;

  //if new add to templates
  if(reportTemplateForEdit.value.id == "") {
    model.value.deviceConfigurations[idx].reportTemplates.push(reportTemplateForEdit.value);
  } else { //edit operation -> replace existing with edited
    let reportIdx = model.value.deviceConfigurations[idx].reportTemplates.findIndex(x => x.id == reportTemplateForEdit.value.id);
    if(reportIdx > -1)
    model.value.deviceConfigurations[idx].reportTemplates[reportIdx] = reportTemplateForEdit.value;
  }
  newReportTemplateDialog.value = false;
}

function saveCommand() {

if(commandTemplateForEdit.value.deviceId == null || commandTemplateForEdit.value.deviceId =="")
  return;

let idx = model.value.deviceConfigurations.findIndex(x => x.id == commandTemplateForEdit.value.deviceId);
if(idx == -1)
  return;

//if new add to templates
if(commandTemplateForEdit.value.id == "") {
  model.value.deviceConfigurations[idx].commandTemplates.push(commandTemplateForEdit.value);
} else { //edit operation -> replace existing with edited
  let reportIdx = model.value.deviceConfigurations[idx].commandTemplates.findIndex(x => x.id == commandTemplateForEdit.value.id);
  if(reportIdx > -1)
    model.value.deviceConfigurations[idx].commandTemplates[reportIdx] = commandTemplateForEdit.value;
}
newCommandTemplateDialog.value = false;
}

function newCommandTemplate(deviceIndex: number) {
  let c = new CommandTemplate();
  c.deviceId = model.value.deviceConfigurations[deviceIndex].id;

  commandTemplateForEdit.value = c; 
  newCommandTemplateDialog.value = true;
}
function editCommandTemplate(template: CommandTemplate, deviceId: string) {
  //lets create a copy
  let c = JSON.parse(JSON.stringify(template));
  c.deviceId = deviceId;

  commandTemplateForEdit.value = c;
  newCommandTemplateDialog.value = true;
}

function deleteCommandTemplate(id: string, deviceId: string) {
  let idx = model.value.deviceConfigurations.findIndex(x => x.id == deviceId);
  if(idx == -1)
    return;

  let cmdIdx = model.value.deviceConfigurations[idx].commandTemplates.findIndex(x => x.id == id);
  if(cmdIdx == -1)
    return;
  
  model.value.deviceConfigurations[idx].commandTemplates.splice(cmdIdx, 1);
}

function editReportTemplate(template: ReportTemplate, deviceId: string) {

  //lets create a copy
  let r = JSON.parse(JSON.stringify(template));
  r.deviceId = deviceId;

  reportTemplateForEdit.value = r;
  newReportTemplateDialog.value = true;
}

function deleteReportTemplate(id: string, deviceId: string) {

  let idx = model.value.deviceConfigurations.findIndex(x => x.id == deviceId);
  if(idx == -1)
    return;

  let reportIdx = model.value.deviceConfigurations[idx].reportTemplates.findIndex(x => x.id == id);
  if(reportIdx == -1)
    return;
  
    model.value.deviceConfigurations[idx].reportTemplates.splice(reportIdx, 1);
}

function deleteDevice(deviceIndex: number) {
  model.value.deviceConfigurations.splice(deviceIndex, 1);
}

onMounted(() => {
  newSaved.value = model.value.id != null && model.value.id != "";
  if(!newSaved.value) {
    orchestrator.getOnlineNodes((data: systemNode[] | null) => {
      if(data != null) {
        nodeIdOptions.value = data.filter(x => x.name == null || x.name == '');
      }
    });
  }
});
</script>

<template>
  <v-form v-model="valid">
  <v-container>
    <v-row>
      <v-col cols="6">
        <v-text-field v-model="model.name" required hide-details
          label="Node Name" />
      </v-col>
      <v-col cols="6">
        <v-combobox
          :disabled="newSaved"
          required
          :return-object="false"
          item-value="id"
          item-title="id"
          v-model="model.id"
          :items="nodeIdOptions"
          label="Node Id"
          chips
        >
      </v-combobox>
      </v-col>
    </v-row>
    <v-expansion-panels class="mt-4">
      <v-expansion-panel v-for="(device, i) in model.deviceConfigurations" :key="i">
        <v-expansion-panel-title class="font-weight-bold">{{ device.name }}</v-expansion-panel-title>
        <v-expansion-panel-text>
          <p>Device parameters</p>
          <v-divider class="border-opacity-100 mb-3" color="black" />
          <v-row>
            <v-col cols="6">
            <v-text-field v-model="device.name" required hide-details
              label="Device Name" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="device.id" required hide-details
              label="Device Id" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="device.classFullName" required hide-details
              label="Device Class Fullname" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="device.refreshSchedule"
              label="Device Refresh Schedule" hint="cron: '0 0 * ? * * *' or leave empty if refesh is done automatically." />
          </v-col>
        </v-row>
        <div v-if="device.deviceParameters != null">
        <p>Additional parameters</p>
        <v-divider class="border-opacity-100 mb-3" color="black" />
        <v-row>
          <v-col cols="4" v-for="(p) in Object.keys(device.deviceParameters)">
            <v-text-field v-model="device.deviceParameters[p]" hide-details
              append-inner-icon="delete"
              @click:append-inner="removeParameter(i, p)"
              :label="p" />
          </v-col>
        </v-row>
        <v-btn
        size="small"
            class="mt-6 mb-6"
            rounded="0"
            color="blue-darken-1"
            variant="outlined"
            @click="newParameter(i)"
          >
            <v-icon>add</v-icon>
            new parameter
          </v-btn>
        </div>
        <v-data-table :hide-default-footer="device.reportTemplates.length < 10" v-if="device.reportTemplates != null" :items="device.reportTemplates" :headers="reportHeaders" density="compact" class="mt-4">
          <template v-slot:top>
            <v-toolbar flat>
              <v-toolbar-title class="text-subtitle-1">Report templates - {{ device.name }}</v-toolbar-title>
              <v-spacer />
                <v-dialog v-model="newReportTemplateDialog" max-width="800px">
                    <template v-slot:activator="{ props }">
                      <v-btn
                      size="small"

                          rounded="0"
                          color="blue-darken-1"
                          variant="outlined"
                          @click="newReportTemplate(i)"
                        >
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
        <template v-slot:item.filterOptions="{ item }">
          {{ item.filterOptions?.join('; ') }}
        </template>
        <template v-slot:item.refreshSchedule="{ item }">
          {{ item.refreshSchedule }}
        </template>
        <template v-slot:item.maintainHistory="{ item }">
            <v-icon color="success" v-if="item.maintainHistory">check_circle</v-icon>
            <v-icon color="warning" v-else>cancel</v-icon>
        </template>
        <template v-slot:item.parameters="{ item }">
        <div class="text-center">
            <v-icon color="success" v-if="item.parameters != null && Object.keys(item.parameters).length > 0">check_circle</v-icon>
            <v-icon color="warning" v-else>cancel</v-icon>
        </div>
      </template>

        <template v-slot:item.id="{ item }">
          <div class="text-end">
        <v-icon
          size="small"
          class="me-2"
          @click="editReportTemplate(item, device.id)"
        >
          edit
        </v-icon>
        <v-icon
          size="small"
          @click="deleteReportTemplate(item.id, device.id)"
        >
          delete
        </v-icon>
      </div>
      </template>
      <template v-slot:no-data>
        <div class="font-weight-bold">no report templates</div>
      </template>
      </v-data-table>

      <v-data-table :hide-default-footer="device.commandTemplates.length < 10" v-if="device.commandTemplates != null" :items="device.commandTemplates" :headers="commandHeaders" density="compact" class="mt-4">
          <template v-slot:top>
            <v-toolbar flat>
              <v-toolbar-title class="text-subtitle-1">Command templates - {{ device.name }}</v-toolbar-title>
              <v-spacer />
                <v-dialog v-model="newCommandTemplateDialog" max-width="800px">
                    <template v-slot:activator="{ props }">
                      <v-btn
                      size="small"

                          rounded="0"
                          color="blue-darken-1"
                          variant="outlined"
                          @click="newCommandTemplate(i)"
                        >
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
        <template v-slot:item.model="{ item }">
          {{ JSON.stringify(item.model) }}
        </template>
        <template v-slot:item.id="{ item }">
          <div class="text-end">
        <v-icon
          size="small"
          class="me-2"
          @click="editCommandTemplate(item, device.id)"
        >
          edit
        </v-icon>
        <v-icon
          size="small"
          @click="deleteCommandTemplate(item.id, device.id)"
        >
          delete
        </v-icon>
      </div>
      </template>
      <template v-slot:no-data>
        <div class="font-weight-bold">no command templates</div>
      </template>
      </v-data-table>
      <v-spacer />
      <v-btn
        size="small"
            class="mt-4"
            rounded="0"
            color="error"
            variant="outlined"
            @click="deleteDevice(i)"
          >
            <v-icon>delete</v-icon>
            delete {{ device.name }}
          </v-btn>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</v-form>
<v-dialog v-model="newPropertyDialog" persistent width="400">
      <v-card>
        <v-card-title>
          <span class="text-h5">New Property</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="newPropertyValue.name"
                  label="Name"
                  required />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="newPropertyValue.value"
                  label="Value"
                  required />
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="newPropertyDialog = false"
          >
            cancel
          </v-btn>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="addParameter"
          >
            save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>

<style scoped>

</style>