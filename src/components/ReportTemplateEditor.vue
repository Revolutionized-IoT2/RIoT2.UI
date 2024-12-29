<script setup lang="ts">
import { ValueType } from '@/models/enums';
import { nameValueStr } from '@/models/rules/nameValueStr';
import { ReportTemplate } from '@/models/rules/reportTemplate';
import { ref } from 'vue';

const emit = defineEmits<{
    save: [void],
    cancel: [void]
}>();

const model = defineModel<ReportTemplate>({ default: new ReportTemplate() });
const valid = ref(false);
const newParameterDialog = ref(false);
const newPropertyValue = ref<nameValueStr>(new nameValueStr("", ""));

const valueTypes = [{name: "Boolean", value: ValueType.Boolean},
                    {name: "Entity", value: ValueType.Entity},
                    {name: "Number", value: ValueType.Number},
                    {name: "Text", value: ValueType.Text},
                    {name: "TextArray", value: ValueType.TextArray}];

function removeParameter(name: string) {

  delete model.value.parameters[name];
}

function newParameter() {
  if(newPropertyValue == null || newPropertyValue.value == null)
    return;

  model.value.parameters[newPropertyValue.value.name] = newPropertyValue.value.value;
  newParameterDialog.value = false;
}

function save() {
  emit('save');
}

function cancel() {
  emit('cancel');
}

</script>

<template>
  <v-card>
  <v-card-title>
    <span class="text-h5">{{ model.id == "" ? "New" : "Edit" }} report template</span>
                    </v-card-title>
                  <v-card-text>
  <v-form v-model="valid">
  <v-container>
    <p>Device parameters</p>
     <v-divider class="border-opacity-100 mb-3" color="black" />
    <v-row>
      <v-col cols="6">
        <v-text-field v-model="model.name" required hide-details
          label="Name" />
      </v-col>
      <v-col cols="6" class="mt-4">
        Id: {{model.id == "" ? "new" : model.id}}
      </v-col>
      <v-col cols="4">
        <v-text-field v-model="model.address" required hide-details
          label="Address" />
      </v-col>
      <v-col cols="4">
        <v-select
          v-model="model.type"
          :items="valueTypes"
          item-title="name"
          item-value="value"
          label="Type"
        />
      </v-col>
      <v-col cols="4">
        <v-switch
          :model-value="model.maintainHistory"
          color="primary"
          label="History"
        ></v-switch>
      </v-col>
      <v-col cols="6">
        <v-combobox
          v-model="model.filterOptions"
          label="Filter options"
          multiple
          chips
        />
      </v-col>
      <v-col cols="6">
        <v-text-field v-model="model.refreshSchedule" required hide-details label="Refresh Schedule" />
      </v-col>
    </v-row>
    <div v-if="Object.keys(model.parameters).length > 0">  
    <p>Additional parameters</p>
     <v-divider class="border-opacity-100 mb-3" color="black" />
     <v-row>
          <v-col cols="4" v-for="(p) in Object.keys(model.parameters)">
            <v-text-field v-model="model.parameters[p]" hide-details
              append-inner-icon="delete"
              @click:append-inner="removeParameter(p)"
              :label="p" />
          </v-col>
      </v-row>
    </div> 
      <v-btn
      size="small"
          class="mt-6"
          rounded="0"
          color="blue-darken-1"
          variant="outlined"
          @click="newParameterDialog = true"
        >
          <v-icon>add</v-icon>
          new parameter
        </v-btn>
  </v-container>
  </v-form>
</v-card-text>
<v-card-actions>
          <v-spacer />
          <v-btn
            rounded="0"
            color="error"
            variant="outlined"
            @click="cancel"
          >
          <v-icon size="small">cancel</v-icon>
            cancel
          </v-btn>
          <v-btn
            rounded="0"
            color="primary"
            variant="outlined"
            @click="save"
          >
          <v-icon size="small">save</v-icon>
            Save
          </v-btn>
        </v-card-actions>
  </v-card>

  <v-dialog v-model="newParameterDialog" persistent width="400">
      <v-card>
        <v-card-title>
          <span class="text-h5">New Property</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row dense>
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
            @click="newParameterDialog = false"
          >
            cancel
          </v-btn>
          <v-btn
            color="blue-darken-1"
            variant="text"
            @click="newParameter"
          >
            save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>
