<script setup lang="ts">
import { useComponentService } from '@/composables/componentService';
import type Component from '@/models/component';
import { ComponentElement } from '@/models/componentElement';
import { ref, watch } from 'vue';
import FooterComponent from './FooterComponent.vue';

const props = defineProps<{
  data: Component
}>()

const numValue = ref({value: "-", prevValue: "-", updated: new Date(8640000000000000), unit: "-", trendIcon: ""})
const componentService = useComponentService();

watch(() => props.data.elements, () => {
  updateComponent();
},  { immediate: true, deep: true })

function updateComponent() {

  let elem: ComponentElement | undefined = undefined;
  if(props.data.elements == null ||  props.data.elements.length < 1 || props.data.elements[0] == undefined) {
    return;
  }
  
  elem = props.data.elements[0] as ComponentElement;
  if(elem.report == undefined)
    return;
  
  const lastUpdated = componentService.timeStampToDate(elem.report.timeStamp);
  const numericValue = componentService.getElementNumericValue(elem);
  const unit = String(componentService.getElementPropertyValue(elem, "unit") ?? "");
  const configuredDigits = Number(componentService.getElementPropertyValue(elem, "digits") ?? 0);
  const digits = Number.isFinite(configuredDigits) ? Math.min(100, Math.max(0, Math.trunc(configuredDigits))) : 0;

  let pValue = "-";
  if(elem.previousReports != undefined &&  elem.previousReports.length > 1) {
    const previousValue = componentService.getElementNumericValue({ ...elem, report: elem.previousReports[1] });
    if(Number.isFinite(previousValue))
      pValue = previousValue.toFixed(digits);
  }

  let trendIcon = "";
  if(componentService.getElementBooleanValue(elem, "useTrendIcon")) {
    const previousValues = (elem.previousReportsAsc ?? [])
      .map(report => componentService.getElementNumericValue({ ...elem, report }))
      .filter(Number.isFinite);
    if(previousValues != null)
      trendIcon = getTrendIcon(previousValues);
  }

  numValue.value = {value: Number.isFinite(numericValue) ? numericValue.toFixed(digits) : "-", prevValue: pValue, updated: lastUpdated, unit: unit, trendIcon: trendIcon};
}

function getTrendIcon(previousValues: number[]) :string {

  let trend = "";

  if(previousValues.length < 4) //do not calculate trend unless there are at least 3 values
    return trend;
 
  const x = Math.ceil(previousValues.length * 0.3);
  const futureValue = lineFitter(previousValues, x);
  const currentValue = previousValues[previousValues.length-1];

  if(futureValue > currentValue)
    trend = "trending_up";
  else
    trend = "trending_down";

  if(currentValue * 0.95 < futureValue && currentValue * 1.05 > futureValue)
    trend = "trending_flat";

  return trend;
}

function lineFitter(data: number[], x: number)
{
    let count = 0;
    let sumX = 0;
    let sumX2 = 0;
    let sumXY = 0;
    let sumY = 0;

    for (let i = 0; i < data.length; i++)
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
        const det = count * sumX2 - sumX * sumX;
        const offset = (sumX2 * sumY - sumX * sumXY) / det;
        const scale = (count * sumXY - sumX * sumY) / det;
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