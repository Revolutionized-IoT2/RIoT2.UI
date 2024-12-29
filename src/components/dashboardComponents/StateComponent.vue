<script setup lang="ts">
import { useComponentService } from '@/composables/componentService';
import type Component from '@/models/component';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps<{
  data: Component
}>();
const componentService = useComponentService();

const states = ref<{value: number, icon: string, color: string, name: string } []>([]);
const currentState = ref<{value: number, icon: string, color: string, name: string } | undefined>();

const timerExpirationTime = 720000; // 12mins
const timerStepInMillis = 1000;
const elapsedTime = ref(0);
var timer: any = null;

watch(props.data.elements, () => {
  updateComponent();
},  { immediate: false });

const isTimerExpirated = ref(false);

const timerPercentage = computed(() => {
    if(!isTimerExpirated)
      return 100;

    return 100 - (Math.round((elapsedTime.value / timerExpirationTime) * 100));
});

function updateComponent() { 
  if(props.data.elements.length > 0 && props.data.elements[0].report != undefined) {
      let changed = false;
      let numValue = componentService.getElementNumericValue(props.data.elements[0]);
      var state = states.value.find(x => x.value == numValue);
      changed = !(numValue == state?.value);
      currentState.value = state;

      if(isTimerExpirated.value && changed)
        startExpirationTimer();
    }
}

//TODO use this in icon opacity or progress bar...
function timerStep() {
  elapsedTime.value += timerStepInMillis;

  if(elapsedTime.value > timerExpirationTime) {
    stopTimer();
    currentState.value = undefined;
  }
}

function stopTimer() {
  if(timer != null)
      clearInterval(timer);

  elapsedTime.value = 0;
}

function startExpirationTimer() {
  stopTimer();
  timer = setInterval(timerStep, timerStepInMillis);
}

onUnmounted(() => {
  stopTimer();
});

onMounted(() => {
  let elementStates = componentService.getElementPropertyValue(props.data.elements[0], "states");
  if(elementStates != undefined)
    states.value = elementStates;

  if(states.value != undefined && states.value.length == 1)
      isTimerExpirated.value = true;

  updateComponent();
});

</script>

<template>
  <v-progress-linear
        :active="isTimerExpirated"
        v-model="timerPercentage"
        color="deep-purple-accent-4"
        absolute
        bottom
      ></v-progress-linear>
  <v-card-text class="py-0 mb-10">
    <v-row v-if="currentState != undefined" :style="isTimerExpirated?'opacity:'+timerPercentage : ''">
      <v-col cols="12">
        <div class="text-center" >
          <v-icon :icon="currentState.icon" size="84" :color="currentState.color"  />
        </div>
      </v-col>
      <v-col cols="12">
        <div class="text-center text-overline" >
          {{currentState.name}}
        </div>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col cols="12">
        <div class="text-center text-overline" >
          Unknown
        </div>
      </v-col>
    </v-row>
  </v-card-text>
</template>