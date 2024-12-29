<script setup lang="ts">

import Datamodel from '@/components/rules/DatamodelComponent.vue';
import ContextMenu from '@/components/rules/ContextMenuComponent.vue';
import { useOrchestrator } from '@/composables/orchestratorService';
import type { ContextMenuItem } from '@/models/contextMenuItem';
import { ValueType } from '@/models/enums';
import type { IRuleListItem } from '@/models/rules/IRuleListItem';
import { Variable } from '@/models/rules/variable';
import router from '@/router';
import { inject, onBeforeUnmount, onMounted, ref } from 'vue';
import { InjectionKeys } from '@/models/injectionKeys';
import type Report from '@/models/report';

const contextMenuItems: ContextMenuItem[] = [
  { "text": "new", "action": "new_variable", "disabled": false, "icon": "add" }
];

const emitter = inject(InjectionKeys.emitter);
const orchestrator = useOrchestrator();

const variables = ref<Variable[]>([]);
const search = ref("");
const filter = ref("");
const editVariableDialog = ref(false);
const loading = ref(false);

const selectedVariable = ref<Variable>(new Variable());

const valueTypes = [{name: "Boolean", value: ValueType.Boolean},
                    {name: "Entity", value: ValueType.Entity},
                    {name: "Number", value: ValueType.Number},
                    {name: "Text", value: ValueType.Text},
                    {name: "TextArray", value: ValueType.TextArray}];



const headers: any [] = [
  { title: 'Name', align: 'left', sortable: true, value: 'name' },
  { title: 'Description', value: 'description', sortable: true, },
  { title: 'Persistant', align: 'left', value: 'isPersistant', sortable: false },
  { title: 'Type', value: 'type', sortable: false },
  { title: 'Value', value: 'value', sortable: false },
  { title: 'Actions', value: 'action', sortable: false },
];

function contextMenuAction(action : string){
  if(action == 'new_variable') {
    selectedVariable.value = new Variable();
    editVariableDialog.value = true;
  }
}

function editItem(item: Variable){
  selectedVariable.value = item;
  editVariableDialog.value = true;
}

function saveVarible() {
  loading.value = true;
  orchestrator.saveVariable(selectedVariable.value, () => {
    editVariableDialog.value = false;
    loadVariables();
  }, ()=>{
    loading.value = false;
  })
}

function updateVariableObjectValue(model: any) {
  selectedVariable.value.value = model;
}

function setSelectedVariableDefault() {
  switch(selectedVariable.value.type) {
    case ValueType.Boolean: selectedVariable.value.value = false; break;
    case ValueType.Text: selectedVariable.value.value = ""; break;
    case ValueType.Number: selectedVariable.value.value = 0; break;
    case ValueType.Entity: selectedVariable.value.value = {}; break;
    case ValueType.TextArray: selectedVariable.value.value = [""]; break;
  }
}

function deleteItem(item : Variable){
  alert("todo");
}

function loadVariables() {
  loading.value = true;
  orchestrator.getVariables((data: Variable[] | null) => {
    if(data != null) {
      variables.value = data;
    }
  }, () => {
    loading.value = false;
  });
}

function handleReportReceived(data: any) {
    var report = data as Report;

    if(report == null)
      return;

    let variable = variables.value.find(x => x.id == report.id);
    if(variable != null) {
      variable.value = report.value;
    }
  }

onMounted(() => {
  loadVariables();
  emitter?.on("mqttReportReceived", handleReportReceived);
});

onBeforeUnmount(() => {
    emitter?.off("mqttReportReceived", handleReportReceived);
  })
</script>

<template>
  <div>
    <context-menu
      :items="contextMenuItems"
      @click="contextMenuAction"
    />
    <div class="site-content-contextmenu">
    <v-data-table
        :hide-default-footer="variables.length < 10" 
        item-value="id"
        :search="search"
        :headers="headers"
        :items="variables"
        :sort-by="[{ key: 'name' }]"
        dense
        class="elevation-1 mt-2"
      >
      <template v-slot:top>
          <v-toolbar
            flat
            color="white"
          >
            <v-toolbar-title>Orchestrator Variables</v-toolbar-title>
            <v-divider
              class="mx-4"
              inset
              vertical
            />
          <v-spacer />
         <!--   <v-text-field
            v-model="search"
            append-icon="search"
            label="filter"
            single-line
            hide-details />-->
          </v-toolbar>
        </template>
        <template v-slot:[`item.action`]="{ item }">
          <v-icon
            small
            class="mr-2"
            @click="editItem(item)"
          >
            edit
          </v-icon>
          <v-icon
            small
            class="mr-2"
            @click="deleteItem(item)"
          >
            delete
          </v-icon>
        </template>
        <template v-slot:item.type="{ item }">
          {{ ValueType[item.type] }}

    </template>

        <template v-slot:no-data>
          <v-alert
            class="mt-3"
            :value="true"
            color="white"
            icon="info"
          >
            <b>No variables found from the system</b>
          </v-alert>
        </template>
      </v-data-table>
    </div>
   
  </div>

   <!-- edit variable dialog -->
   <v-dialog v-model="editVariableDialog" persistent max-width="600px">
          <v-card>
            <v-form>
              <v-card-title>
                <span class="headline">Variable</span>
              </v-card-title>
              <v-card-text>
              <v-container>
                 <v-row>
                  <v-col cols="12">
                    <v-text-field
                          label="Name"
                          v-model="selectedVariable.name"
                        />
                    <v-text-field
                        label="Description"
                        v-model="selectedVariable.description"
                      />
                      <v-select
                        v-model="selectedVariable.type"
                        :items="valueTypes"
                        item-title="name"
                        item-value="value"
                        label="Type"
                        @update:model-value="setSelectedVariableDefault()"
                      />
                    <v-switch
                      v-model="selectedVariable.isPersistant"
                      color="primary"
                      label="Persistant"
                      hide-details
                      />
                  </v-col>
                 </v-row>
                 <v-row>
                  <v-col cols="12">
                    <v-switch v-if="selectedVariable.type == ValueType.Boolean"
                      v-model="selectedVariable.value"
                      color="primary"
                      label="Value"
                      hide-details
                    />
                    <v-text-field v-if="selectedVariable.type == ValueType.Text"
                        label="Value"
                        v-model="selectedVariable.value"
                    />
                    <v-text-field v-if="selectedVariable.type == ValueType.Number"
                        label="Value"
                        v-model="selectedVariable.value"
                        type="number"
                    />
                    <Datamodel v-if="selectedVariable.type == ValueType.Entity || selectedVariable.type == ValueType.TextArray"
                      :datamodel="selectedVariable.value" 
                      labeltext="Value" 
                      :expanded="true" 
                      :editable="true"
                      :readInput="false"
                      @modelUpdated="updateVariableObjectValue"
                      />
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
               color="blue" 
               variant="text"
    
               @click="saveVarible">
               Save</v-btn>
              <v-btn
                color="blue darken-1"
                variant="text"

                @click="editVariableDialog = false"
              >
                Close
              </v-btn>
            </v-card-actions>
           </v-form>
          </v-card>
        </v-dialog>

</template>