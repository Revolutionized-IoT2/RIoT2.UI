<script setup lang="ts">
import CommandTemplate from '@/models/commandTemplate';
import { ValueType } from '@/models/enums';
import { ref } from 'vue';
import Datamodel from '@/components/rules/DatamodelComponent.vue';

const emit = defineEmits<{
    save: [void],
    cancel: [void]
}>();

const model = defineModel<CommandTemplate>({ default: new CommandTemplate() });
const valid = ref(false);

function modelUpdated(m: any, type: ValueType) {
  model.value.type = type;
  model.value.model = m;
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
    <span class="text-h5">{{ model.id == "" ? "New" : "Edit" }} command template</span>
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
      <v-col cols="6">
        <v-text-field v-model="model.address" required hide-details
          label="Address" />
      </v-col>
    </v-row>
     <Datamodel 
              :datamodel="model.model" 
              labeltext="Command Model"
              :expandable="true" 
              :editable="true" 
              :expanded="true"
              @modelUpdated="modelUpdated"
      />

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
</template>
