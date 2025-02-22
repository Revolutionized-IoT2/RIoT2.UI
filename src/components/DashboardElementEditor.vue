<script setup lang="ts">
import CommandTemplate from '@/models/commandTemplate';
import { ComponentType, ValueType } from '@/models/enums';
import { computed, inject, onMounted, ref, watch } from 'vue';
import Datamodel from '@/components/rules/DatamodelComponent.vue';
import Component from '@/models/component';
import { ButtonElementProperties, ChartElementProperties, ComponentElement, type IComponentElement, ImageElementProperties, ValueElementProperties } from '@/models/componentElement';
import { ReportTemplate } from '@/models/rules/reportTemplate';
import { InjectionKeys } from '@/models/injectionKeys';
import type { ITemplate } from '@/models/itemplate';

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

const model = defineModel<IComponentElement>({ default: new ComponentElement({id: "", name: "", icon: "", numberOfPreviousReports: 0, properties: {}}) 
});

const props = defineProps<{
    type: ComponentType
}>();

const valid = ref(false);
const reportTemplates = inject(InjectionKeys.reportTemplates);
const commandTemplates = inject(InjectionKeys.commandTemplates);
const variableTemplates = inject(InjectionKeys.variableTemplates);

function getPropertyObject(): any {
  switch(props.type) {
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
    case ComponentType.timeline:
    default:
      return {};
  }
}

const actionSupported = computed(()=> {
  switch(props.type) {
    case ComponentType.button:
    case ComponentType.slideButton:
      return true;
    case ComponentType.numericValue:
    case ComponentType.chart_bar:
    case ComponentType.chart_doughnut:
    case ComponentType.chart_line:
    case ComponentType.chart_pie:
    case ComponentType.image:
    case ComponentType.timeline:
    default:
      return false;
  }
});

//combine report templates and variable templates
const reportTemplateItems = computed<ITemplate[]>(() => {
  if(reportTemplates == undefined && variableTemplates == undefined)
    return [];

  if(reportTemplates == undefined) return (variableTemplates?.value as ITemplate[]);
  if(variableTemplates == undefined) return (reportTemplates?.value as ITemplate[]);
    
  return (reportTemplates.value as ITemplate[]).concat(variableTemplates.value);
});

onMounted(() => {
  if(model.value.properties == null)
    model.value.properties = getPropertyObject();
});

</script>

<template>
  <v-card :title="model.name +' [' + model.id +']' " subtitle="element settings" variant="outlined">
    <v-card-text>
      <v-form v-model="valid">
  <v-container>
    <v-row>
      <v-col cols="4">
        <v-text-field v-model="model.name" required hide-details
          label="Name" />
      </v-col>
      <v-col cols="4">
        <v-text-field v-model="model.icon" required hide-details :append-inner-icon="model.icon"
          label="Element Icon" />
      </v-col>
      <v-col cols="4">
        <v-text-field v-model="model.numberOfPreviousReports" required hide-details type="number"
          label="Number of prev. Reports" />
      </v-col>
      <v-col cols="12">
      <v-autocomplete
        v-model="model.reportTemplate"
        :items="reportTemplateItems"
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
          v-model="model.commandTemplate"
            :items="commandTemplates"
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

      <template v-if="model.properties != null">
            <!--print properties, depending on comp type-->
          <v-col cols="4" v-for="(p) in Object.keys(model.properties)">
            <v-text-field v-model="model.properties[p]" hide-details :label="p" />
          </v-col>
      </template>
    </v-row>
  </v-container>
  </v-form>
    </v-card-text>
  </v-card>
</template>
