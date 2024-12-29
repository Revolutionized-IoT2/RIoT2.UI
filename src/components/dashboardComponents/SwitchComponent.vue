<script setup lang="ts">
import { useComponentService } from '@/composables/componentService';
import { useOrchestrator } from '@/composables/orchestratorService';
import Command from '@/models/command';
import type Component from '@/models/component';
import { IComponentElement } from '@/models/componentElement';
import { OutputOperation } from '@/models/enums';
import { InjectionKeys } from '@/models/injectionKeys';
import { inject, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  data: Component
}>();
const componentService = useComponentService();
const orchestrator = useOrchestrator();

const state1 = ref<boolean | undefined>(undefined);
const state2 = ref<boolean | undefined>(undefined);

const state1_on = ref<{ icon: string, color: string, name: string } | undefined>(undefined);
const state1_off = ref<{ icon: string, color: string, name: string } | undefined>(undefined);
const state2_on = ref<{ icon: string, color: string, name: string } | undefined>(undefined);
const state2_off = ref<{ icon: string, color: string, name: string } | undefined>(undefined);

watch(props.data.elements, () => {
  updateComponent();
},  { immediate: false });

function updateComponent() { 

  if(props.data.elements.length > 0 && props.data.elements[0].report != undefined)
    updateElement(1, props.data.elements[0]);

  if(props.data.elements.length > 1 && props.data.elements[1].report != undefined)
    updateElement(2, props.data.elements[1]);
}

function updateElement(i: 1|2, e: IComponentElement) {
  let changed = false;
      let val = componentService.getElementBooleanValue(e);     
      changed = val != (i==1 ? state1.value : state2.value);
  
      if(changed && i == 1) {
        state1.value = val;
      }

      if(changed && i == 2) {
        state2.value = val;
      }
 }

 function switchState(i: 1|2, val: boolean) {
  let e = props.data.elements[i-1];
  if(e.commandTemplate != undefined) {
    let cmd = new Command();
    cmd.id = e.commandTemplate.id;
    cmd.value = val;
    
    let op = OutputOperation.write;

    if(e.commandTemplate?.address?.toLowerCase() == "variable") //TODO better way to recognize variable?
      op = OutputOperation.Variable;

    console.dir(e.commandTemplate)
    console.log("switch: "+ op)
    console.dir(cmd)

    orchestrator.sendCommand(op, cmd, () => {
      //need todo anything?
    });
  }
}

onMounted(() => {

  if(props.data.elements.length > 0) {
    state1_on.value = componentService.getElementPropertyValue(props.data.elements[0], "on");
    state1_off.value = componentService.getElementPropertyValue(props.data.elements[0], "off");
  }

  if(props.data.elements.length > 1) {
    state2_on.value = componentService.getElementPropertyValue(props.data.elements[1], "on");
    state2_off.value = componentService.getElementPropertyValue(props.data.elements[1], "off");
  }

  updateComponent();
});

</script>

  <template>
  <v-card-text class="py-0 mb-10">
    <template v-if="state1_off != undefined && state1_on != undefined && state1 != undefined">
      <v-row>
      <v-col cols="4">
        <div class="text-right" >
          <v-icon :icon="state1_off.icon" size="54" :color="state1_off.color"  />
        </div>
      </v-col>
      <v-col cols="4" justify-content="center">
        <v-switch
          v-model="state1"
          class="switch-center"
            inset
            color="primary"
            @update:modelValue="switchState(1, state1)"
          ></v-switch>
      </v-col>
      <v-col cols="4" >
        <div class="text-left" >
          <v-icon :icon="state1_on.icon" size="54" :color="state1_on.color" />
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <div class="text-center text-overline">
          {{ state1 ? state1_on?.name :  state1_off?.name }}
        </div>
      </v-col>
    </v-row> 
    </template>
    
    <template v-if="state2_off != undefined && state2_on != undefined && state2 != undefined">
      <v-row>
      <v-col cols="4">
        <div class="text-right" >
          <v-icon :icon="state2_off.icon" size="54" :color="state2_off.color"  />
        </div>
      </v-col>
      <v-col cols="4" justify-content="center">
        <v-switch
          v-model="state2"
          class="switch-center"
            inset
            color="primary"
            @update:modelValue="switchState(2, state2)"
          ></v-switch>
      </v-col>
      <v-col cols="4">
        <div class="text-left" >
          <v-icon :icon="state2_on.icon" size="54" :color="state2_on.color" />
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <div class="text-center text-overline">
          {{ state2 ? state2_on?.name :  state2_off?.name }}
        </div>
      </v-col>
    </v-row> 
    </template>
  </v-card-text>
</template>
<style scoped>
.switch-center {
  display: flex;
  justify-content: center;
}
</style>
