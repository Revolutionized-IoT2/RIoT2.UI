<script setup lang="ts">

import type { IRule } from '@/models/rules/IRule';
import { ref } from 'vue';

//import type { ContextMenuItem } from '@/models/contextMenuItem';

//const emit = defineEmits(['click']);

const model = defineModel<IRule>({required: true })

export interface Props {
  text: string,
  editable: boolean,
  validationErrors: string[],
  state: boolean,
  tagOptions?: string []
}


const props = withDefaults(defineProps<Props>(), {
  editable: false,
  labels: () => [],
  state: false,
  validationErrors: () => [],
  tagOptions: () => []
});

const editHeaderDialog = ref(false);
const validationErrorsDialog = ref(false);

function showValidationErrors() {
  //TODO Always run validation...

  if(props.validationErrors.length > 0) {
        validationErrorsDialog.value = true;
      }
      else {
        alert("TODO: Ask to activate rule")
      }
}

/*
function exceuteAction(action: string) {
  emit('click', action);
}*/

</script>

<template>
  <v-card class="mt-3 mx-auto" outlined max-width="1185">
      <v-toolbar flat dense color="">
        <v-icon class="ml-3">share</v-icon>
        <v-toolbar-title class="overline">
          {{text}}: {{ model.name }} 
          <span class="text-disabled ml-2 font-weight-thin text-subtitle-1"> [{{state?'active':'disabled'}}]</span>
        </v-toolbar-title>
        <v-spacer />
        <v-btn
          dark
          color="grey"
          xx-small
          @click="showValidationErrors()"
        >
        <v-icon :color="validationErrors.length > 0 ? 'red':'green'">{{validationErrors.length > 0 ? 'warning':'check_circle'}}</v-icon>
      validate  
      </v-btn>
        <v-btn
          dark
          v-if="editable"
          color="grey"
          xx-small
          @click="editHeaderDialog = true"
        >
          <v-icon >edit</v-icon>
          edit
        </v-btn>
      </v-toolbar>
      <v-list-item dense three-line class="mb-4">
        <div>
          <v-list-item-title class="headline ma-2">
            {{ model?.description }}
          </v-list-item-title>
          <div>
            <template v-for="(tag, index) in model?.tags">
               <v-chip
                v-if="tag != null"
                :key="'tag_'+index"
                color="blue"
                text-color="white"
                class="ma-1 mt-2"
                size="small"
                label
              >
              {{ tag }}
              <!--
              <v-icon left v-if="tag != null && tag.icon != null" small>{{ tag.icon }}</v-icon>
                {{ tag.name }}-->
              </v-chip>
            </template>
              <span style="float: right;">
              
              </span>
          </div>
        </div>
      </v-list-item>
      <!-- edit header dialog -->
      <v-dialog
      v-model="editHeaderDialog"
      persistent
      max-width="600px"
      >
      <v-card>
          <v-card-title>
          <span class="headline">Rule Header</span>
          </v-card-title>
          <v-card-text>
          <v-container>
              <v-row>
              <v-col cols="12">
                  <v-text-field
                  v-model="model.name"
                  label="Name"
                  required
                  />
              </v-col>
              <v-col cols="12">
                  <v-text-field
                  v-model="model.description"
                  label="Description"
                  required
                  />
              </v-col>
              <v-col cols="12">
                  <!--<v-select v-model="rule.tags" return-object :items="tags" item-text="name" label="Tags" multiple chips hint="Select rule classifications" persistent-hint />-->
                  <v-combobox
                    v-model="model.tags"
                    :items="props.tagOptions"
                    label="Select tags"
                    multiple
                    chips
                  />
              </v-col>
              </v-row>
          </v-container>
          <!--<small>*indicates required field</small>-->
          </v-card-text>
          <v-card-actions>
          <v-spacer />
          <v-btn color="blue darken-1" variant="text" @click="editHeaderDialog = false">
              Close
          </v-btn>
          </v-card-actions>
      </v-card>
      </v-dialog>

      <v-dialog v-model="validationErrorsDialog" max-width="400">
         <v-alert
          border="top"
          colored-border
          type="error"
          tile
          class="ma-0">
          <ul>
            <li v-for="(err, i) of validationErrors" :key="'li-' + i">{{err}}</li>
          </ul>
    </v-alert>
      
  </v-dialog>


    </v-card>
</template>

<style scoped>

</style>
