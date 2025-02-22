<script setup lang="ts">
import { useComponentService } from '@/composables/componentService';
import { useOrchestrator } from '@/composables/orchestratorService';
import Command from '@/models/command';
import type Component from '@/models/component';
import type { ComponentElement, IComponentElement } from '@/models/componentElement';
import { ValueType, ComponentType, OutputOperation } from '@/models/enums';
import { InjectionKeys } from '@/models/injectionKeys';
import { inject, reactive, ref, watch } from 'vue';

const props = defineProps<{
  data: Component
}>()

const orchestrator = useOrchestrator();
const componentService = useComponentService();
const selectedButtonIds = reactive<string []>([]);

const extendedButtonViewDialog = ref(false);
const selectedElement = ref<IComponentElement | undefined>(undefined);
const selectedColor = ref<{ r: number, g: number, b: number, a: number }>();
const selectedState = ref<boolean>();

function toggleButton(element: IComponentElement) {

  if(useExtendedView(element)) {
    extendedButtonViewDialog.value = true;
    selectedElement.value = element;
    return;
  }

  executeToggle(element);
}

function executeToggle(element: IComponentElement) {
  if(element.commandTemplate != undefined) {
    let cmd = new Command();
    cmd.id = element.commandTemplate.id;
    cmd.value = getValue(!isElementSelected(element), element);
    let op = OutputOperation.write;

    if(element.commandTemplate?.address?.toLowerCase() == "variable")
      op = OutputOperation.Variable;

    orchestrator.sendCommand(op, cmd, () => {
      //need todo anything?
    });
  }
  setElementState(!isElementSelected(element), element);
}

function getValue(state: boolean, elem: IComponentElement) {
  if(elem.commandTemplate == undefined)
    return;

  if(elem.commandTemplate.type ==  ValueType.Boolean)
    return state;

  //all other states onValue and offValue are required
  if(state) {
    return componentService.getElementPropertyValue(elem, "onValue");
  } else {
    return componentService.getElementPropertyValue(elem, "offValue");
  }
}

function isElementSelected(elem: IComponentElement): boolean {
  return selectedButtonIds.includes(elem.id);
}

watch(props.data.elements, () => {
  updateButtonStates();
},  { immediate: true })

function updateButtonStates() { 
  for(let e of props.data.elements) {
  
  if(e.report != undefined) {
    let elemState = getStateFromReport(e);
    if(elemState != isElementSelected(e))
      setElementState(getStateFromReport(e), e);
  }
}
}

function getStateFromReport(elem: IComponentElement): boolean {
  if(elem.report == undefined || elem.reportTemplate == undefined)
    return false;
  
    if(elem.reportTemplate.type == ValueType.Boolean) {
      return componentService.getElementBooleanValue(elem);
    } 
    return componentService.areEqual(componentService.getElementPropertyValue(elem, "onValue"), elem.report);
}

function setElementState(toState: boolean, element: IComponentElement) {
  //console.dir(element.report?.id +":"+element.report?.value+":"+toState)
  if(toState) {
    selectedButtonIds.push(element.id);
  } else {
    selectedButtonIds.splice(selectedButtonIds.findIndex(v => v === element.id), 1);
  }
}

function useExtendedView(e: IComponentElement) {
  //return true;

  let colorMapping = componentService.getElementPropertyValue(e, "colorMapping");
  if(colorMapping == undefined)
    return false;

  return true;
}

function executeExtendedClick() {
  alert("todo")
}

</script>

<template>
    <v-card-text class="py-0">
      <v-item-group multiple :model-value="selectedButtonIds" v-if="props.data.type == ComponentType.button">
        <v-container>
          <v-row class="mb-3" justify="start">
            <template v-for="elem, i in data.elements" :key="elem.name">
            <v-col cols="auto" >
              <v-item v-slot="{ isSelected, toggle }" :value="elem.id">
                <v-card :color="isSelected ? 'primary' : 'secondary'" class="d-flex align-center" 
                dark 
                height="120" 
                width="120"
                @click="toggleButton(elem)">
          
                  <div class="d-flex flex-column flex-grow-1 text-center">
                    <div v-if="elem.icon != null"><v-icon :icon="elem.icon" size="20" :color="isSelected ? 'secondary' : 'primary'" class="ma-2 pa-1 text-center" /></div>
                    <div class="text-center"> {{  elem.name  }}</div>
                  </div>
            
                </v-card>
              </v-item>
            </v-col>
            <!--<v-responsive width="100%" v-if="i % 6 == 0"></v-responsive>-->
          </template>
        </v-row>
      </v-container>
    </v-item-group>

    <v-slide-group
      v-else
      multiple
      :model-value="selectedButtonIds"
      class="pa-4"
      selected-class="bg-primary"
      show-arrows
    >
      <v-slide-group-item
        v-for="elem, i of props.data.elements"
        :key="i + '-elem'"
        v-slot="{ isSelected, toggle, selectedClass }"
        :value="elem.id"
      >
      <v-card :color="isSelected ? 'primary' : 'secondary'" class="d-flex align-center ma-4" 
                dark 
                height="120" 
                width="120"
                @click="toggleButton(elem)">
          
                  <div class="d-flex flex-column flex-grow-1 text-center">
                    <div v-if="elem.icon != null"><v-icon :icon="elem.icon" size="20" :color="isSelected ? 'secondary' : 'primary'" class="ma-2 pa-1 align-self-center" /></div>
                    <div class="align-center"> {{  elem.name  }}</div>
                  </div>
            
                </v-card>
      </v-slide-group-item>
    </v-slide-group>
  </v-card-text>

  <!-- extended view dialog -->
  <v-dialog transition="fab-transition" width="90%" height="90%" max-width="600" max-height="600" v-model="extendedButtonViewDialog">
  <template v-slot:default="{ isActive }">
    <v-card rounded="lg">
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="text-h5 text-medium-emphasis ps-2">
          {{selectedElement?.name}}
        </div>
        <v-btn
          icon="close"
          variant="text"
          @click="extendedButtonViewDialog = false"
        ></v-btn>
      </v-card-title>
      <v-divider class="mb-4" />
      <v-card-text>
        <div class="color-center">
          <v-color-picker :disabled="!selectedState"hide-inputs v-model="selectedColor" />
        </div>
        <div class="color-center">
          <v-switch
          v-model="selectedState"
          class="switch-center"
          direction="vertical"
          inset
          color="primary"
          ></v-switch>
        </div>
      </v-card-text>
      <v-divider class="mt-2" />
      <v-card-actions class="my-2 d-flex justify-end">
        <v-btn
          class="text-none"
          text="Cancel"
          @click="extendedButtonViewDialog = false"
        ></v-btn>

        <v-btn
          class="text-none"
          color="primary"
          text="Set"
          variant="flat"
          @click="executeExtendedClick()"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </template>
  </v-dialog>
</template>
<style scoped>
.color-center {
  display: flex;
  justify-content: center;
}
</style>