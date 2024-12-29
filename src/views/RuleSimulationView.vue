<script setup lang="ts">
import EventViewer from '@/components/rules/EventViewerComponent.vue';
import ContextMenu from '@/components/rules/ContextMenuComponent.vue';
import RuleHeader from '@/components/rules/RuleHeaderComponent.vue';
import Datamodel from '@/components/rules/DatamodelComponent.vue';
import { useOrchestrator } from '@/composables/orchestratorService';
import type { ContextMenuItem } from '@/models/contextMenuItem';
import type { IRuleListItem } from '@/models/rules/IRuleListItem';
import type { IEvent } from '@/models/rules/Ievent';
import type Report from '@/models/report';
import { RuleSimulation } from '@/models/rules/ruleSimulation';
import router from '@/router';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { Rule } from '@/models/rules/rule';
import { RuleTrigger } from '@/models/rules/ruleTrigger';

const orchestrator = useOrchestrator();
const route = useRoute();

const contextMenuItems: ContextMenuItem[] = [
    { "text": "edit", "action": "edit_rule", "disabled": false, "icon": "edit" }
];

const events = ref<IEvent[]>([]);
const simulation = ref<RuleSimulation>(new RuleSimulation());
const runningSimulation = ref(false);
const ruleValidationErrors = ref<string[]>([]);

const ruleState = computed(() => {
    return simulation.value.rule.isActive ? 'active' : 'disabled';
});

const ruleTrigger = computed(() => {
  if(simulation.value.rule == null || simulation.value.rule.ruleItems == null || simulation.value.rule.ruleItems.length <1)
    return new RuleTrigger();
  
  return (simulation.value.rule.ruleItems[0] as RuleTrigger);
});


function contextMenuAction(action : string){
  if(action == 'edit_rule')
    router.push("/rules/editor/" + simulation.value.rule.id);
}

function runSimulation() {
    runningSimulation.value = true;
    orchestrator.simulateRule(simulation.value.rule.id, simulation.value.simulationData, (data: IEvent[] | null) => {
        if(data != null)
            events.value = data;
    }, ()=>{
        runningSimulation.value = false;
    });
}

function updateDataModelFromInput() {

    orchestrator.getReportState(ruleTrigger.value.reportId, (data: Report | null) => {
        if(data != null)
            updateDataModel(data);
    }, ()=> {
        
    })
}

function updateDataModel(obj: any) {
    simulation.value.simulationData = obj;
}

function loadSettings(id: string) {

  orchestrator.getRule(id, (data: Rule | null) => {

    if(data != null)
      simulation.value.rule = data;
  }, () =>{
    
  });

  }

  function checkRuleState(id: string) {

    orchestrator.validateRule(id, (data: string[] | null)=>{
        if(data != null)
            ruleValidationErrors.value = data;
    }, ()=>{

    });
  }

  /*
  function checkDataModelState(): string[] {
    //TÄMÄ KESKEN...
    // TODO: also check trigger input model vs. schema!
    let warnings = [];
    if(typeof this.simulation.dataModel != typeof this.simulation.trigger.defination.triggerDataModel) {
      warnings.push("Trigger data type is different from datamodel");
    }
    // tarkistetaan varoitukset, ennen kuin run:
    if(typeof this.simulation.dataModel === 'object' && 
        typeof this.simulation.trigger.defination.triggerDataModel != 'object'
        ) {
      warnings.push("Datamodel does not contain trigger-value");
    }
   
    // Jos schema on primitive ja trigger on primitive ja tyypit ei täsmää
    // jos molemmat on objekteja, mutta triggeristä ei löydy yhtää samaa propertyä 
    return warnings;
  }*/

  function getRouteParam(val: string | string []): string {
  if (Array.isArray(val) && val.length > 0)
      return val[0];

  return  (val as string);
}

  onMounted(() => {
    let id = getRouteParam(route.params.id);
    if(id != undefined && id != "") {
        loadSettings(id);
        checkRuleState(id);
    }
});

</script>

<template>
  <div>
    <ContextMenu :items="contextMenuItems" @click="contextMenuAction" />
    <v-container>
    <v-row class="site-content-contextmenu">
        <v-col cols="12" class="pl-0">
            <RuleHeader v-model="simulation.rule" :editable="false" text="rule simulation" :validationErrors="ruleValidationErrors" :state="ruleState" />
      </v-col>
    </v-row>    

        <v-row>
          <v-col cols="6" class="pl-0">
            <v-card min-height="235" outlined>
              <v-card-title>
            <v-icon large left color="#007dff">
            code
            </v-icon>
            <span class="title font-weight-light">rule data model</span>
        </v-card-title>
              <v-card-text>
          <Datamodel :datamodel="simulation.rule.dataModel" labeltext="Model" :expandable="false" />
        </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="6" >
            <v-card min-height="235" outlined>
        <v-card-title>
            <v-icon large left color="#007dff">
            flash_on
            </v-icon>
            <span class="title font-weight-light">Trigger - {{ruleTrigger.name}}</span>
        </v-card-title>
        
        <v-card-text>
            <Datamodel 
                :datamodel="simulation.simulationData" 
                labeltext="Incoming data {trigger-value}" 
                :expanded="true" 
                :expandable="false" 
                :editable="true" 
                :readInput="true"
                @modelUpdated="updateDataModel"
                @readInputClicked="updateDataModelFromInput"/>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
            <v-btn type="text" @click="runSimulation" color="blue" :disabled="runningSimulation || ruleValidationErrors.length > 0">
                <v-icon>play_arrow</v-icon>
            Run
        </v-btn>
            <v-progress-linear
            v-if="runningSimulation"
            color="deep-purple accent-4"
            indeterminate
            rounded
            height="6"
          ></v-progress-linear>
            
        </v-card-actions>
      </v-card>
    </v-col>
      <v-col cols="12" class="pl-0">
      <EventViewer v-if="events.length > 0" :events="events"/>
          </v-col>
        </v-row>
    </v-container>
  </div>
</template>