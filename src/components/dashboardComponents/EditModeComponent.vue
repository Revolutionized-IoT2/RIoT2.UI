<script setup lang="ts">
import { useComponentService } from '@/composables/componentService';
import Datamodel from '@/components/rules/DatamodelComponent.vue';
import Command from '@/models/command';
import type Component from '@/models/component';
import { ButtonElementProperties, ValueElementProperties, type IComponentElement, ChartElementProperties, ImageElementProperties, SwitchElementProperties, StateElementProperties } from '@/models/componentElement';
import { ValueType, ComponentType } from '@/models/enums';
import { InjectionKeys } from '@/models/injectionKeys';
import { computed, inject, reactive, ref, watch } from 'vue';
import { useOrchestrator } from '@/composables/orchestratorService';
import { Report } from '@/models/report';
import type { ITemplate } from '@/models/itemplate';

const props = defineProps<{
  data: Component
}>()

const reportTemplates = inject(InjectionKeys.reportTemplates);
const commandTemplates = inject(InjectionKeys.commandTemplates);
const variableTemplates = inject(InjectionKeys.variableTemplates);

const orchestrator = useOrchestrator();

const componentElements = reactive<IComponentElement []>([]);

const editElementDialog = ref(false);
const selectedEditElement = ref<IComponentElement>({ id: "", name: "" });

const reportDataDialog = ref(false);
const reportData = ref<any>(null);
const loadingReport = ref(false);

function editElement(e: IComponentElement) {

  let copyOfElement = JSON.parse(JSON.stringify(e));

  selectedEditElement.value = copyOfElement;
  editElementDialog.value = true;
}

function addNewElement() {

  selectedEditElement.value = { id: "", name: "" };
  selectedEditElement.value.properties = getPropertyObject();
  editElementDialog.value = true;
}

function deleteElement() {
  let idx = props.data.elements.findIndex(x => x.id == selectedEditElement.value.id);
  if(idx != -1) {
    props.data.elements.splice(idx, 1);
  }
  editElementDialog.value = false;
}

function saveElement() {

  let idx = props.data.elements.findIndex(x => x.id == selectedEditElement.value.id);

  if(idx == -1) {
    selectedEditElement.value.id = (props.data.elements.length + 1).toString();
    props.data.elements.push(selectedEditElement.value);
  } else {
    props.data.elements[idx] = selectedEditElement.value;
  }
  editElementDialog.value = false;
}

function readReportValue(reportId: string | undefined) {
  if(reportId == undefined)
    return;
    loadingReport.value = true;
  
    orchestrator.getReportState(reportId, (data : Report | null) => {
      reportData.value = data;
  }, () => {
      loadingReport.value = false;
      reportDataDialog.value = true;
  });
}

const hasMaxNumberOfElements = computed(() => {
  switch(props.data.type) 
  {
    case ComponentType.slideButton:
    case ComponentType.button:
      return props.data.elements.length > 8;
    
    case ComponentType.switch:
      return props.data.elements.length > 1;

    default:
      return props.data.elements.length > 0;
  }
});

const actionSupported = computed(()=> {
  switch(props.data.type) {
    case ComponentType.button:
    case ComponentType.slideButton:
    case ComponentType.switch:
      return true;
    default:
      return false;
  }
});

function getPropertyObject(): any {
  switch(props.data.type) {
    case ComponentType.button:
    case ComponentType.slideButton:
      return new ButtonElementProperties();
    case ComponentType.numericValue:
      return new ValueElementProperties();
    case ComponentType.chart_bar:
    case ComponentType.chart_doughnut:
    case ComponentType.chart_line:
    case ComponentType.chart_pie:
      return new ChartElementProperties();
    case ComponentType.image:
      return new ImageElementProperties();
    case ComponentType.switch:
      return new SwitchElementProperties();
    case ComponentType.state:
    return new StateElementProperties();
    case ComponentType.timeline:
    default:
      return {};
  }
}

const numberOfPreviousReportsDisabled = computed(()=> {

  if(selectedEditElement.value.reportTemplate == undefined) {
    selectedEditElement.value.numberOfPreviousReports = 1;
    return true;
  }

  if(!selectedEditElement.value.reportTemplate.maintainHistory) {
    selectedEditElement.value.numberOfPreviousReports = 1;
    return true;
  }

  return false;
});

const reportTemplateItems = computed<ITemplate[]>(() => {
  if(reportTemplates == undefined && variableTemplates == undefined)
    return [];

  if(reportTemplates == undefined) return (variableTemplates?.value as ITemplate[]);
  if(variableTemplates == undefined) return (reportTemplates?.value as ITemplate[]);
    
  return (reportTemplates.value as ITemplate[]).concat(variableTemplates.value);
});

const commandTemplateItems = computed<ITemplate[]>(() => {
  if(commandTemplates == undefined && variableTemplates == undefined)
    return [];

  if(commandTemplates == undefined) return (variableTemplates?.value as ITemplate[]);
  if(variableTemplates == undefined) return (commandTemplates?.value as ITemplate[]);
    
  return (commandTemplates.value as ITemplate[]).concat(variableTemplates.value);
});

</script>

<template>
    <v-card-text class="py-0">
      <v-item-group multiple :model-value="componentElements">
        <v-container>
          <v-row class="mb-3" justify="start">
            <template v-for="elem, i in data.elements" :key="elem.name">
            <v-col cols="auto" >
              <v-item v-slot="{ toggle }" :value="elem">
                <v-card color="green-lighten-5" class="d-flex align-center" 
                dark 
                height="120" 
                width="120"
                @click="editElement(elem)">
      
                  <div class="d-flex flex-column flex-grow-1 text-center">
                    <div class="text-center" v-if="elem.icon != null"><v-icon :icon="elem.icon" size="20" class="ma-2 pa-1" /></div>
                    <div class="text-center"> {{  elem.name  }}</div>
                    <div class="text-center"> [EDIT] </div>
                  </div>
                </v-card>
              </v-item>
            </v-col>
            <!--<v-responsive width="100%" v-if="i % 6 == 0"></v-responsive>-->
          </template>
          <v-col cols="auto" v-if="!hasMaxNumberOfElements">
            <v-card class="d-flex align-center editCard" color="gray" height="120" 
                width="120">
              <v-card-text>
                <div class="d-flex flex-column text-center">
                    <div class="align-center"> 
                      <v-btn 
                          rounded="xl"
                          color="success"
                          icon="add"
                          @click="addNewElement()">
                      </v-btn>
                    </div>
                  </div>
              </v-card-text>
              </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-item-group>
  </v-card-text>

  <v-dialog v-model="editElementDialog" max-width="800" scrollable width="90%">
    <v-card>
      <v-toolbar dark color="primary" dense flat>
        <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
          {{ selectedEditElement.id == '' ? 'New element' : 'Edit element' }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="pa-4 black--text">
        <v-row>
          <v-col cols="4">
        <v-text-field v-model="selectedEditElement.name" required hide-details
          label="Name" />
      </v-col>
      <v-col cols="4">
        <v-text-field v-model="selectedEditElement.icon" required hide-details :append-inner-icon="selectedEditElement.icon"
          label="Element Icon" />
      </v-col>
      <v-col cols="4">
        <v-text-field :disabled="numberOfPreviousReportsDisabled" v-model="selectedEditElement.numberOfPreviousReports" required hide-details type="number"
          label="Number of prev. Reports" />
      </v-col>
      <v-col cols="12">
      <v-autocomplete
        v-model="selectedEditElement.reportTemplate"
        :items="reportTemplateItems"
        append-icon="manage_search"
        @click:append="readReportValue(selectedEditElement.reportTemplate?.id)"
        :loading="loadingReport"
          color="primary"
          item-title="name"
          item-value="name"
          label="Select input datasource"
          placeholder="Report"
          return-object>

          <template v-slot:item="{ props, item }">
            <v-list-item
              v-bind="props"
              :title="item.raw.name"
            >
            <v-chip class="ma-1" label>
              {{ item.raw.node }}
              </v-chip>
              <v-chip class="ma-1" label>
              {{ item.raw.device }}
              </v-chip>
          </v-list-item>
          </template>
        </v-autocomplete>
       </v-col>
       <v-col cols="12">
        <v-autocomplete
          v-if="actionSupported"
          v-model="selectedEditElement.commandTemplate"
            :items="commandTemplateItems"
            color="primary"
            item-title="name"
            item-value="name"
            label="Select Action"
            placeholder="Select Action"
            return-object>

          <template v-slot:item="{ props, item }">
            <v-list-item
              v-bind="props"
              :title="item.raw.name"
            >
            <v-chip class="ma-1" label>
              {{ item.raw.node }}
              </v-chip>
              <v-chip class="ma-1" label>
              {{ item.raw.device }}
              </v-chip>
          </v-list-item>
          </template>
        </v-autocomplete>
       </v-col>

      <template v-if="selectedEditElement.properties != null">
            <!--print properties, depending on comp type-->
          <v-col cols="6" v-for="(p) in Object.keys(selectedEditElement.properties)">
            <Datamodel 
              :datamodel="selectedEditElement.properties[p]" 
              :labeltext="p"
              :expandable="true" 
              :editable="true" 
              :expanded="false"
              @modelUpdated="(m: any) => selectedEditElement.properties[p] = m"
            />
          </v-col>
      </template>
        </v-row>
      </v-card-text>
      <v-card-actions class="pt-3">
        <v-spacer></v-spacer>
        <v-btn
            rounded="0"
            color="error"
            variant="outlined"
            @click="deleteElement()"
          >
          <v-icon size="small">delete</v-icon>
            delete
          </v-btn>
        <v-btn
            rounded="0"
            color="warning"
            variant="outlined"
            @click="editElementDialog = false"
          >
          <v-icon size="small">cancel</v-icon>
            cancel
          </v-btn>
          <v-btn
            rounded="0"
            color="success"
            variant="outlined"
            @click="saveElement()"
          >
          <v-icon size="small">check_circle</v-icon>
            ok
          </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="reportDataDialog" max-width="600px">
        <v-card width="600px" >
        <v-card-title>
          <span class="title mr-2">Report data</span>
        </v-card-title>
        <v-card-subtitle class="pb-1 text-subtitle-1">{{selectedEditElement.reportTemplate?.name}}</v-card-subtitle>
        <v-card-text>
            <Datamodel
              :datamodel="reportData" 
              labeltext="" 
              :expanded="true" 
              :editable="false"
              :readInput="false"
               />
        </v-card-text>
        <v-card-actions>
            <v-spacer />
            <v-btn @click="reportDataDialog = false" color="blue">
                <v-icon>close</v-icon>
                close
            </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>