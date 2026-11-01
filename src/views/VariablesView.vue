<script setup lang="ts">

import Datamodel from '@/components/DatamodelComponent.vue';
import ContextMenu from '@/components/ContextMenuComponent.vue';
import type { ContextMenuItem } from '@/models/contextMenuItem';
import { ValueType } from '@/models/enums';
import { Variable } from '@/models/variable';
import { useVariablesStore } from '@/stores/variablesStore';
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';

const contextMenuItems: ContextMenuItem[] = [
  { "text": "new", "action": "new_variable", "disabled": false, "icon": "add" }
];

const store = useVariablesStore();
// The store keeps the values current from the reports the UI receives.
const { variables, loading } = storeToRefs(store);
const search = ref("");
const editVariableDialog = ref(false);
const deleteVariableDialog = ref(false);
const saving = ref(false);

const selectedVariable = ref<Variable>(new Variable());

const valueTypes = [{name: "Boolean", value: ValueType.Boolean},
                    {name: "Entity", value: ValueType.Entity},
                    {name: "Number", value: ValueType.Number},
                    {name: "Text", value: ValueType.Text},
                    {name: "TextArray", value: ValueType.TextArray}];

const headers = [
  { title: 'Name', align: 'start' as const, sortable: true, value: 'name' },
  { title: 'Description', value: 'description', sortable: true, },
  { title: 'Persistent', align: 'start' as const, value: 'isPersistant', sortable: false },
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

// The dialog edits a copy, so Close leaves the listed variable as it was.
function editItem(item: Variable){
  selectedVariable.value = JSON.parse(JSON.stringify(item));
  editVariableDialog.value = true;
}

async function saveVariable() {
  saving.value = true;
  if (await store.save(selectedVariable.value))
    editVariableDialog.value = false;
  saving.value = false;
}

function updateVariableObjectValue(model: unknown) {
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
  selectedVariable.value = item;
  deleteVariableDialog.value = true;
}

async function completeDelete() {
  saving.value = true;
  if (await store.remove(selectedVariable.value.id))
    deleteVariableDialog.value = false;
  saving.value = false;
}

onMounted(() => {
  store.load();
});
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
        :loading="loading"
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
                      label="Persistent"
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
    
               :loading="saving"
               @click="saveVariable">
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

   <!-- delete variable dialog -->
   <v-dialog v-model="deleteVariableDialog" max-width="400">
    <v-card>
      <v-toolbar color="primary" density="compact" flat>
        <v-toolbar-title class="text-body-2 font-weight-bold">
          Delete variable?
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="pa-4">
        Delete {{ selectedVariable.name }}? Workflows and dashboard elements that use it stop working.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="grey" @click="deleteVariableDialog = false">Cancel</v-btn>
        <v-btn color="primary" :loading="saving" @click="completeDelete">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

</template>