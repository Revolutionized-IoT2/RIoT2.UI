<script setup lang="ts">
import { useComponentService } from '@/composables/componentService';
import type Component from '@/models/component';
import { ComponentElement } from '@/models/componentElement';
import type Report from '@/models/report';
import { ref, watch } from 'vue';
import FooterComponent from './FooterComponent.vue';

const props = defineProps<{
  data: Component
}>()

const numValue = ref({value: "-", prevValue: "-", updated: new Date(8640000000000000), unit: "-", trendIcon: ""})
const componentService = useComponentService();

watch(props.data.elements, () => {
  updateComponent();
},  { immediate: true })

function updateComponent() {

  let elem: ComponentElement | undefined = undefined;
  if(props.data.elements == null ||  props.data.elements.length < 1 || props.data.elements[0] == undefined) {
    return;
  }
  
  elem = props.data.elements[0] as ComponentElement;
  if(elem.report == undefined)
    return;
  
  let lastUpdated = componentService.timeStampToDate(elem.report.timeStamp);
  let numericValue = componentService.getElementNumericValue(elem);
  let unit = componentService.getElementPropertyValue(elem, "unit");
  let digits = componentService.getElementPropertyValue(elem, "digits") ?? 0;

  let pValue = "-";
  if(elem.previousReports != undefined &&  elem.previousReports.length > 1) {
    pValue = elem.previousReports[1].value.toFixed(digits);
  }

  let trendIcon = "";
  if(componentService.getElementBooleanValue(elem, "useTrendIcon")) {
    let previousValues = componentService.arrayMap<number>(elem.previousReportsAsc, "value");
    if(previousValues != null)
      trendIcon = getTrendIcon(previousValues);
  }

  numValue.value = {value: numericValue.toFixed(digits), prevValue: pValue, updated: lastUpdated, unit: unit, trendIcon: trendIcon};
}

function getTrendIcon(previousValues: any[]) :string {

  let trend = "";

  if(previousValues.length < 4) //do not calculate trend unless there are at least 3 values
    return trend;
 
  let x = Math.ceil(previousValues.length * 0.3);
  let futureValue = lineFitter(previousValues, x);
  let currentValue = previousValues[previousValues.length-1];

  if(futureValue > currentValue)
    trend = "trending_up";
  else
    trend = "trending_down";

  if(currentValue * 0.95 < futureValue && currentValue * 1.05 > futureValue)
    trend = "trending_flat";

  return trend;
}

function lineFitter(data: any[], x: number)
{
    let count = 0;
    let sumX = 0;
    let sumX2 = 0;
    let sumXY = 0;
    let sumY = 0;

    for (var i = 0; i < data.length; i++)
        add(i, data[i]);
    
    return project(x);

    function add (x: number, y: number)
    {
        count++;
        sumX += x;
        sumX2 += x*x;
        sumXY += x*y;
        sumY += y;
    }

    function project(x: number)
    {
        var det = count * sumX2 - sumX * sumX;
        var offset = (sumX2 * sumY - sumX * sumXY) / det;
        var scale = (count * sumXY - sumX * sumY) / det;
        return offset + x * scale;
    }
}

</script>

<template>
   <v-card-text class="py-0">
    <v-row align="center" no-gutters class="mb-8">
        <v-col
          class="text-h3"
          cols="12"
        >
          {{numValue.value}} <b class="text-h5 text-bold">{{numValue.unit}}</b> <!-- &deg;C -->
          <v-icon
            v-if="numValue.trendIcon != ''"
            color="blue"
            :icon="numValue.trendIcon"
            size="88"
          ></v-icon>
        </v-col>
      </v-row>
    </v-card-text>
    <FooterComponent :first="numValue.prevValue != '-' ?{'text':numValue.prevValue+' '+numValue.unit, 'icon': 'timeline' }:undefined"  :updated="numValue.updated" />
</template>