<script setup lang="ts">
import CommandTemplate from '@/models/commandTemplate';
import { ComponentType, ValueType } from '@/models/enums';
import { computed, ref } from 'vue';
import DashboardElementEditor from '@/components/DashboardElementEditor.vue';
import Component from '@/models/component';

const emit = defineEmits<{
    save: [void],
    cancel: [void]
}>();

function save() {
  emit('save');
}

function cancel() {
  emit('cancel');
}

function addElement() {
  alert("todo add new element")
}

const checkElementMaxCount = computed(() => {
  switch(model.value.type) 
  {
    case ComponentType.slideButton:
    case ComponentType.button:
      return model.value.elements.length > 8;

    case ComponentType.timeline:
    case ComponentType.numericValue:
    case ComponentType.image:
    case ComponentType.chart_bar:
    case ComponentType.chart_doughnut:
    case ComponentType.chart_line:
    case ComponentType.chart_pie:
    default:
      return model.value.elements.length > 0;
  }
});


const model = defineModel<Component>({ default: new Component() });
const valid = ref(false);

</script>

<template>
  <v-card>
  <v-card-title>
    <span class="text-h5">Edit component</span>
  </v-card-title>
  <v-card-text>
  <v-form v-model="valid">
  <v-container>
    <p>Parameters</p>
    <v-divider class="border-opacity-100 mb-3" color="black" />
    <v-row>
      <v-col cols="6">
        <v-text-field v-model="model.name" required hide-details
          label="Name" />
      </v-col>
      <v-col cols="6">
        <v-text-field v-model="model.description" required hide-details
          label="Description" />
      </v-col>
      <v-col cols="4">
        <v-text-field v-model="model.icon" required hide-details :append-inner-icon="model.icon"
          label="Component Icon" />
      </v-col>
      <v-col cols="4">
        <v-text-field v-model="model.type" required hide-details
          label="Type" />
      </v-col>
      <v-col cols="4">
        <v-text-field v-model="model.size" required hide-details
          label="Size" />
      </v-col>
    </v-row>
    <p class="mt-4">Elements</p>
    <v-divider class="border-opacity-100 mb-3" color="black" />
    <template v-for="(e, i) in model.elements">
      <DashboardElementEditor :type="model.type" v-model="model.elements[i]" class="mt-4 mb-4"/>
    </template>
    <v-btn
      :disabled="checkElementMaxCount"
      rounded="0"
      color="primary"
      variant="outlined"
      @click="addElement"
    >
      new element
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
</template>
