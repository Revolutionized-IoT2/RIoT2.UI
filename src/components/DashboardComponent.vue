<script setup lang="ts">
import type Component from '@/models/component';
import { ChartType, ComponentType } from '@/models/enums';
import ButtonComponent from './dashboardComponents/ButtonComponent.vue';
import ChartComponent from './dashboardComponents/ChartComponent.vue';
import NumericValueComponent from './dashboardComponents/NumericValueComponent.vue';
import ImageComponent from './dashboardComponents/ImageComponent.vue';
import TimelineComponent from './dashboardComponents/TimelineComponent.vue';
import EditModeComponent from './dashboardComponents/EditModeComponent.vue';
import StateComponent from './dashboardComponents/StateComponent.vue';
import SwitchComponent from './dashboardComponents/SwitchComponent.vue';
import { computed } from 'vue';
import NoDataComponent from './dashboardComponents/NoDataComponent.vue';
import { ComponentElement } from '@/models/componentElement';

const props = defineProps<{
  data: Component,
  editMode: boolean
}>()

const emit = defineEmits<{
    editComponent: [Component],
    deleteComponent: [Component],
}>();

const isChart = computed(() => {
  return props.data.type == ComponentType.chart_bar 
      || props.data.type == ComponentType.chart_line 
      || props.data.type == ComponentType.chart_doughnut
      || props.data.type == ComponentType.chart_pie;
});

const hasData = computed(() => {

  if(props.data.type == ComponentType.button || 
    props.data.type == ComponentType.slideButton || 
    props.data.type == ComponentType.switch ||
    props.data.type == ComponentType.state)
      return true;

  for(let e of props.data.elements) {
    if(e.report != null)
      return true; 
  }
  
  return false;
});

const chartType = computed(() => {
  switch(props.data.type) {
    case ComponentType.chart_bar:
      return ChartType.bar;
    case ComponentType.chart_doughnut:
      return ChartType.doughnut;
    case ComponentType.chart_pie:
      return ChartType.pie;  
    case ComponentType.chart_line:
    default:
      return ChartType.line;
  }
});

function deleteComponent() {
  emit("deleteComponent", props.data);
}

function editComponent() {
  emit("editComponent", props.data);
}
</script>

<template>
  <v-card class="flex-grow-1 minHeight">
    <v-card-item :title="data.name">
      <template v-slot:title>
        {{data.name}} {{ editMode? " ["+ComponentType[data.type]+"]":"" }}
        <template v-if="props.editMode">
          <v-icon class="float-right" icon="edit" size="20" color="success" @click="editComponent"/>
          <v-icon class="float-right" icon="delete" size="20" color="red" @click="deleteComponent"/>
        </template>
      </template>
      <template v-slot:subtitle v-if="data.description != null">
        <v-icon v-if="data.icon != undefined" :icon="data.icon" size="18" color="primary" class="mr-1 pb-1" />
        {{data.description}}
      </template>
    </v-card-item>
    <template v-if="props.editMode">
      <EditModeComponent :data="data" />
    </template>
    <template v-else>
      <template v-if="!hasData"> 
        <NoDataComponent />
      </template>
      <template v-else>
        <ButtonComponent :data="data" v-if="data.type == ComponentType.button || data.type == ComponentType.slideButton" />
        <ChartComponent :type="chartType" :data="data" v-if="isChart" />
        <NumericValueComponent :data="data" v-if="data.type == ComponentType.numericValue" />
        <ImageComponent :data="data" v-if="data.type == ComponentType.image" />
        <TimelineComponent :data="data" v-if="data.type == ComponentType.timeline" />
        <StateComponent :data="data" v-if="data.type == ComponentType.state" />
        <SwitchComponent :data="data" v-if="data.type == ComponentType.switch" />
      </template>
    </template>
  </v-card>
</template>

<style scoped>

.minHeight {
  min-height: 180px;
}

</style>
