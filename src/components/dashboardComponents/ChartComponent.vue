<script setup lang="ts">
import { useComponentService } from '@/composables/componentService';
import type Component from '@/models/component';
import { ChartType } from '@/models/enums';
import type Report from '@/models/report';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
  ChartOptions
} from 'chart.js'
import { ref, watch } from 'vue';
import { Line, Bar, Doughnut, Pie } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const props = defineProps<{
  data: Component,
  type: ChartType
}>();

const componentService = useComponentService();
const chartdata = ref({labels: [''], datasets: [{label: '', backgroundColor: [''], data: [0]}],  updated: new Date(8640000000000000)});

watch(props.data.elements, () => {
  updateComponent();
});

function updateComponent() {
  
  if(props.data.elements[0].report == undefined)
    return;

  let timeStamp = componentService.timeStampToDate(props.data.elements[0].report.timeStamp);
  let ds: {label: string, backgroundColor: string[], data: number[]}[] = [];
  let lbls: string[] = [];

  for(let i = 0; i < props.data.elements.length; i++) {
    let currentElement = props.data.elements[i];
    let prevReports = currentElement.previousReportsAsc;

    if(prevReports != undefined) {
      let values = componentService.getElementPreviousNumericValues(currentElement);
      
      let colorProperty = componentService.getElementProperty(currentElement, "color");
      let colors = componentService.arrayMap<string>(prevReports, "value." + colorProperty);
      
      if(colors == null)
        colors = [colorProperty];

      //TODO get colors -> if variable get array. get only one value
      if(values != null) {
          ds.push({
            label: currentElement.name,
            backgroundColor: colors, // ["red", "blue"], //componentService.getElementPropertyValue(currentElement, "color"),
            data: values
        });
      }

        //get lebels from first element -> these labels are used for all elemnets
        if(i == 0) {
          let valueLabel = componentService.getElementProperty(currentElement, "label");
          if(currentElement.previousReportsAsc != undefined) {
            if(valueLabel != undefined) {
              let labels = componentService.arrayMap<string>(currentElement.previousReportsAsc, "value." + valueLabel);
              if(labels != null)
                lbls = labels;
            } else { 
              for(let t of currentElement.previousReportsAsc) {
                lbls.push(componentService.formatDate(componentService.timeStampToDate(t.timeStamp)));
              }
            } 
          }
        }
      }
    }
   chartdata.value = {
      labels: lbls,
      datasets: ds,
      updated: timeStamp
    };
}

/*
const chartdata = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
  datasets: [
    {
      label: 'Data One',
      backgroundColor: '#f87979',
      data: [40, 39, 10, 40, 39, 80, 40]
    }
  ]
}*/

const options = {
  responsive: true,
  maintainAspectRatio: false,
  //aspectRatio: 2,
  plugins: {
    legend: {
      align: "start",
      position: "bottom"
    }
  }
}

//TODO different charts
//Bar chart 
//Pie chart

</script>

<template>
  <v-card-text class="py-0">
    <Line v-if="props.type == ChartType.line" :data="chartdata" :options="options as ChartOptions<'line'>" />
    <Bar v-if="props.type == ChartType.bar" :data="chartdata" :options="options as ChartOptions<'bar'>" />
    <Doughnut v-if="props.type == ChartType.doughnut" :data="chartdata" :options="options as ChartOptions<'doughnut'>" />
    <Pie v-if="props.type == ChartType.pie" :data="chartdata" :options="options as ChartOptions<'pie'>" />
  </v-card-text>

    <div class="d-flex py-1 justify-end">
      <v-list-item
        class="text-right"
        density="compact"
      >
        <template v-slot:prepend>        
          <v-icon class="component-footer-icon">history</v-icon> 
        </template>
        <v-list-item-subtitle>
          <timeago v-if="chartdata.updated != new Date(8640000000000000)" :datetime="chartdata.updated" :converter-options="{ includeSeconds: true }" :auto-update="5"/>
          <div v-else>never</div>
        </v-list-item-subtitle>
      </v-list-item>
    </div>
</template>

<style scoped>

.component-footer-icon {
  margin-inline-end: 5px !important;
}
</style>