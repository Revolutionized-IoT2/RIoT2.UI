<script setup lang="ts">
import { useComponentService } from '@/composables/componentService';
import Component from '@/models/component';
import { ComponentElement } from '@/models/componentElement';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import FooterComponent from './FooterComponent.vue';

enum Resolution {
    fivesec = 0,
    minute = 1,
    fiveminutes = 2
}

const props = defineProps<{
  data: Component
}>();
const componentService = useComponentService();

const timelinedata = ref({items: [{time: 0, val: ""}], updated: new Date(8640000000000000)});
const resolution = ref<Resolution>(Resolution.minute);
const values = ref<number[]>([0,0,0,0,0,0,0,0,0,0,0,0]);
const timerId = ref<any>(null);

watch(props.data.elements[0], () => {
  update();

},  { immediate: false, deep: true });

function updateComponent() { 

  let elem: ComponentElement | undefined = undefined;
  if(props.data.elements == null ||  props.data.elements.length < 1 || props.data.elements[0] == undefined) {
    return;
  }
  
  elem = props.data.elements[0] as ComponentElement;
  let prevReports = elem.previousReportsAsc;
  let items = [];
  if(prevReports != null) {
    for(let r of prevReports) {
      items.push({
          time: r.timeStamp *1000,
          val: r.value
        });
    }
  }
  
  if(elem.report != undefined)
    timelinedata.value = {items: items, updated: componentService.timeStampToDate(elem.report.timeStamp)};
}

const labels = computed<any>(() => {
  return resolutions.map(({ labels }) => labels[resolution.value]);
});

const resolutions = [ 
  { "pos": 0, labels: ["1min", "12min", "1h"] },
  { "pos": 1, labels: ["55s", "11min", "55min"] },
  { "pos": 2, labels: ["50s", "10min", "50min"] },
  { "pos": 3, labels: ["45s", "9min", "45min"] },
  { "pos": 4, labels: ["40s", "8min", "40min"] },
  { "pos": 5, labels: ["35s", "7min", "35min"] },
  { "pos": 6, labels: ["30s", "6min", "30min"] },
  { "pos": 7, labels: ["25s", "5min", "25min"] },
  { "pos": 8, labels: ["20s", "4min", "20min"] },
  { "pos": 9, labels: ["15s", "3min", "15min"] },
  { "pos": 10, labels: ["10s", "2min", "10min"] },
  { "pos": 11, labels: ["5s", "1min", "5min"] },
];

function setTimer() {
  if(timerId.value != null)
  clearInterval(timerId.value);

  timerId.value = setInterval(updateValues, resolutionInMillis())
}

//move values to left
function updateValues() {
  values.value.splice(0, 1);
  values.value.push(0);
}

function update() {

  let elem: ComponentElement | undefined = undefined;
  if(props.data.elements == null ||  props.data.elements.length < 1 || props.data.elements[0] == undefined) {
    return;
  }
  elem = props.data.elements[0] as ComponentElement;
  if(elem.report != undefined && elem.report.value.toString().toLocaleLowerCase() == "true") {
    values.value[11] = values.value[11] + 1;
  }
}

function setValues() {

  let interval = resolutionInMillis();

  for(let i = 0; i < 12; i++) {
    let timeStart = Date.now() - (interval * (12-i));
    let timeEnd = Date.now() - (interval * (11-i));
     
    //items in time period
    let itemsInPeriod = timelinedata.value.items.filter(x => x.time > timeStart && x.time < timeEnd);

      let valuesInPeriod = itemsInPeriod.map(({val}) => val);
      let countOfTrue = 0;
      for(let v of valuesInPeriod) {
  
        if(v.toString().toLocaleLowerCase() == "true")
          countOfTrue++;
      }

      values.value[i] = countOfTrue;
  }
}

function resolutionInMillis() {
  switch(resolution.value) {
    case Resolution.fivesec: return 5000;
    case Resolution.minute: return 60000;
    case Resolution.fiveminutes: return 300000;
  }
}

onMounted(() => {
  updateComponent();
  setValues();
  setTimer();
});

</script>

<template>
  <v-card-text class="py-0 mb-10">
   <v-sheet
      class="mx-auto "
      color="primary"
      elevation="6"
      rounded="lg"
    >
      <v-sparkline
        :labels="labels"
        :model-value="values"
        color="white"
        line-width="2"
        padding="12"
          stroke-linecap="round"
          smooth
      ></v-sparkline>
    </v-sheet>
  </v-card-text>
  <FooterComponent :updated="timelinedata.updated" />
</template>