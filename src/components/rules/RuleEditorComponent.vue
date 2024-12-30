<script setup lang="ts">
import { useRuleUtils } from '@/composables/ruleUtilsService';
import { OutputOperation, RuleType } from '@/models/enums';
import type { IRuleDefination } from '@/models/rules/IRuleDefination';
import type { IRuleItem } from '@/models/rules/IRuleItem';
import type connector from '@/models/rules/connector';
import type { FunctionDefination } from '@/models/rules/functionDefination';
import type { OutputDefination } from '@/models/rules/outputDefination';
import { RuleCondition } from '@/models/rules/ruleCondition';
import { RuleFunction, useRuleFunction } from '@/models/rules/ruleFunction';
import { RuleOutput, useRuleOutput } from '@/models/rules/ruleOutput';
import { RuleTrigger, useRuleTrigger } from '@/models/rules/ruleTrigger';
import type { TriggerDefination } from '@/models/rules/triggerDefination';
import { computed, inject, nextTick, onMounted, onUnmounted, onUpdated, ref } from 'vue';
import { VueDraggableNext } from 'vue-draggable-next'
import RuleItemComponent from './RuleItemComponent.vue';
import { InjectionKeys } from '@/models/injectionKeys';
import type CommandTemplate from '@/models/commandTemplate';
import type FunctionTemplate from '@/models/rules/functionTemplate';
import type { ReportTemplate } from '@/models/rules/reportTemplate';
import { Rule } from '@/models/rules/rule';
import type { ITemplate } from '@/models/itemplate';

//import type { ContextMenuItem } fromv '@/models/contextMenuItem';
const reportTemplates = inject(InjectionKeys.reportTemplates);
const functionTemplates = inject(InjectionKeys.functionTemplates);
const commandTemplates = inject(InjectionKeys.commandTemplates);
const variableTemplates = inject(InjectionKeys.variableTemplates);

const commandTemplateItems = computed<ITemplate[]>(() => {
  if(commandTemplates == undefined && variableTemplates == undefined)
    return [];

  if(commandTemplates == undefined) return (variableTemplates?.value as ITemplate[]);
  if(variableTemplates == undefined) return (commandTemplates?.value as ITemplate[]);
    
  return (commandTemplates.value as ITemplate[]).concat(variableTemplates.value);
});

const emit = defineEmits<{
    ruleItemListUpdated: [IRuleItem[]],
    ruleItemClicked: [number]
}>();

const ruleUtils = useRuleUtils();

const model = defineModel<IRuleItem[]>({required: true })


const newRuleForm = ref<any>(null);
const newRuleStep = ref<IRuleItem>(new RuleTrigger());

const selectedReportTemplate = ref<ReportTemplate | null>(null);
const selectedCommandTemplate = ref<CommandTemplate | null>(null);
const selectedFunctionTemplate = ref<FunctionTemplate | null>(null);

const newStepDialog = ref(false);
const isLoading = ref(false);
const descriptionLimit = ref(60);
const search = ref<any>(null);
const newStepDialogValid = ref(false);

const nameRules: any [] = [
    (v: any) => !!v || 'Name is required',
    (v: any) => (!!v && v.length >= 4) || 'Name must be more than 4 characters',
    (v: any) => (!!v && v.length <= 40) || 'Name must be less than 40 characters'
];

const templateRule: any [] = [
    (v: any) => !!v || 'Value is required',
];

const newStepDefinationRules: any [] = [
    validateRuleType
];

const draggableOptions : any = {
    animation: 0,
    group: "draggableRuleItems",
    disabled: false,
    ghostClass: "ghost"
};

const isDragging = ref(false);
const delayedDragging = ref(false);

const ruleItemList = computed({
  get(): IRuleItem[] {
        return model.value;
  },
  set(val: IRuleItem[]) {
    alert("edit")
    emit('ruleItemListUpdated', val)
  }
});

const connectors = computed<connector[]>((): connector[] => {
    if(model == null || model.value == null)
        return [];

    let jumps: connector[] = [];
        for (let i = 0; i < model.value.length; i++) {
            let item = model?.value[i];

            if (item.ruleType == RuleType.condition) { //only conditions have jumps
                jumps = jumps.concat(ruleUtils.getJumpConnectors(item as RuleCondition));
            }
        } 

        //fix arrow directions
        for (let i = 0; i < jumps.length; i++) {
            let jump = jumps[i];
            let fromIdx = ruleUtils.findIndexById(jump.fromId, model.value);
            let toIdx = ruleUtils.findIndexById(jump.toId, model.value);
            jump.downwards = fromIdx < toIdx;
        }

        return jumps;
});


function draggingDone() {
      isDragging.value = false;
}

function onMove(obj: { relatedContext: any, draggedContext: any }) {
    const relatedElement = obj.relatedContext.element;
    const draggedElement = obj.draggedContext.element;

    return (
    (!(draggedElement.ruleType == 0) && !(relatedElement.ruleType == 0))
    );
}

function validateRuleType(v: any){
    if(newRuleStep.value.ruleType == RuleType.condition ){
      return true;
    }
    else{
      if(v == null || v.description.length == 0)
          return 'Value required'
      else
          return true;
    }
}

function createNewStep(){

  newRuleForm.value.validate().then((data:{valid: boolean}) =>{

    if(!data.valid)
    return;
    
    let ruleItem = createRuleItem();
    if(ruleItem == null || model.value == undefined)
        return;
    
    if(ruleItem != undefined){
        model.value.push(ruleItem);
    }

    newStepDialog.value = false;
  })
}

function resetOptions(){
    //newRuleForm.value.resetValidation();
    //newRuleStep.value.defination = {id:"0", name:"", type:0, systemUniqueId:"", description:""};
}

function resetNewStepDialog() {

  newRuleStep.value = new RuleTrigger(); // set back to default...

  if (model?.value?.length != 0) {
        newRuleStep.value.ruleType = RuleType.function;
    }
    newRuleStep.value.name = "";
    resetOptions();
    selectedCommandTemplate.value = null;
    selectedFunctionTemplate.value = null;
    selectedReportTemplate.value = null;
}

function activateRuleEditView(id: number) {
    emit('ruleItemClicked', id);
}

function getIdForRuleItem(): number {
    if(model.value == null)
        return 1;

    let highestNumber = 0;
    for(let item of model.value) {
    if(item.id > highestNumber)
        highestNumber = item.id;
    }
    return highestNumber + 1;
}

function createRuleItem() : IRuleItem | undefined {
    //create new ruleItem 
    //copy necessary items from defination
    //add to ruleitemlist

    let idx: number = getIdForRuleItem();

    switch (newRuleStep.value.ruleType) {
        case RuleType.trigger:
          if(selectedReportTemplate.value == null)
            return;

          return useRuleTrigger().create(idx, newRuleStep.value.name, selectedReportTemplate.value);
        case RuleType.function:
          if(selectedFunctionTemplate.value == null)
            return;
          
          return useRuleFunction().create(idx, newRuleStep.value.name, selectedFunctionTemplate.value);
        case RuleType.condition:
            var cond = new RuleCondition();
            cond.name = newRuleStep.value.name;
            cond.description = "if-else-switch";
            cond.id = idx;
            return cond;
        case RuleType.output:
          if(selectedCommandTemplate.value == null)
            return;
          
          var oper = OutputOperation.write;
          if(selectedCommandTemplate.value.device.toLowerCase() == 'variable')
            oper = OutputOperation.Variable;
            
          return useRuleOutput().create(idx, newRuleStep.value.name, selectedCommandTemplate.value, oper);
    }
}

function addNewStep() {
    resetNewStepDialog();
    newStepDialog.value = true;
}

function createJumpConnectors() {
    if (model == null || model.value == null || model.value.length < 2)
        return;

    let c = connectors.value;
    let lastItem = model.value[model.value.length - 1];
    let firstItem = model.value[0];

    let firstRuleElem = document.getElementById("rule_" + firstItem.id); 
    let lastRuleElem = document.getElementById("rule_" + lastItem.id); 
    if(firstRuleElem == null || lastRuleElem == null) {
        return;
    }

    let svg = document.getElementById("svg1");
    ruleUtils.setSvgArea(svg, firstRuleElem, lastRuleElem);
    let downArrows = 0;
    let upArrows = 0;

    for (let i = 0; i < c.length; i++) {
        let jump = c[i];

        let a = document.getElementById(jump.arrowId);
        let d1 = document.getElementById(jump.fromIdElem); 
        let d2 = document.getElementById(jump.toIdElem);

        if (jump.downwards)
            downArrows++;
        else
            upArrows++;
        
        let container = document.getElementById("svgContainer");
        ruleUtils.connectElements(a, d1, d2, container, jump.downwards ? downArrows : upArrows, jump.downwards);
    }
}

async function windowSizeChanged() {
    await nextTick();
    createJumpConnectors();
}

onUpdated(() => {
  setTimeout(() => createJumpConnectors(), 550);
});

onMounted(() => {
  window.addEventListener('resize', windowSizeChanged);
});

onUnmounted(() => {
  window.removeEventListener('resize', windowSizeChanged);
});


/*
function exceuteAction(action: string) {
  emit('click', action);
}*/

</script>


<template>
    <div
      class="ruleEditor p-3 mb-4"
      align="center"
    >
      <!-- div connector -->
      <!--TODO TODO set container width and height properly-->
      <div
        id="svgContainer"
        class="svgContainer connector"
      >
        <svg
          id="svg1"
          width="0"
          height="0"
        >
          <defs>
            <marker
              id="arr"
              markerWidth="10"
              markerHeight="10"
              refX="0"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path
                d="M0,0 L0,6 L9,3 z"
                fill="#000000"
              />
            </marker>
          </defs>
          <template :key="index" v-for="(c, index) in connectors">
            <path
              :id="c.arrowId"
              d="M1000 1000"
              stroke="#000"
              fill="none"
              stroke-width="2px"
              marker-end="url(#arr)"
            />
          </template>
        </svg>
      </div>
      <VueDraggableNext v-model="ruleItemList" v-bind="draggableOptions" :move="onMove" @start="isDragging=true" @end="draggingDone">
      <transition-group type="transition" :name="'flip-list'">
        <RuleItemComponent v-for="(item, i) in ruleItemList" :key="item.id"
              :item="item"
              @ruleItemClicked="activateRuleEditView(i)"
            />
      </transition-group>
      </VueDraggableNext>
    <!--
      <VueDraggableNext :list="ruleItemList" v-bind="draggableOptions"
       :move="onMove" @start="isDragging=true" @end="draggingDone"
       tag="transition-group" :component-data="{name:'flip-list', type:'transition'}">

       <template #item="{element}">
          <RuleItemComponent v-for="(item, i) in ruleItemList" :key="item.id"
            :item="item"
            @ruleItemClicked="activateRuleEditView(i)"
          />
       </template>
      </VueDraggableNext>-->
      <div>
        <div class="text-center mt-2">
          <v-btn
            class=""
            outlined
            fab
            dark
            color="indigo"
            @click="addNewStep()"
          >
            <v-icon dark>
              add
            </v-icon>
          </v-btn>
        </div>
      </div>
  
      <!-- new step dialog -->
      <v-dialog v-model="newStepDialog" persistent max-width="600px">
        <v-card>
          <v-form ref="newRuleForm">
            <v-card-title>
              <span class="headline">New step</span>
            </v-card-title>
            <v-card-text>
            <v-container>
               <v-row>
                <v-col cols="12">
                  <v-text-field
                    label="Name"
                    required
                    dense
                    :rules="nameRules"
                    :counter="40"
                    v-model="newRuleStep.name"
                  />
      
                  <v-radio-group dense v-model="newRuleStep.ruleType" @change="resetOptions" label="Rule type">
                    <v-radio
                      :key="0"
                      label="Trigger"
                      :value="0"
                      :disabled="model.length > 0"
                     
                    ></v-radio>
                    <v-radio
                      :key="1"
                      label="Function"
                      :value="1"
                      :disabled="model.length == 0"
                    ></v-radio>
                    <v-radio
                      :key="2"
                      label="Condition"
                      :value="2"
                      :disabled="model.length == 0"
                    ></v-radio>
                    <v-radio
                      :key="3"
                      label="Output"
                      :value="3"
                      :disabled="model.length == 0"
                    ></v-radio>
                  </v-radio-group>
                </v-col>
                 <v-col cols="12">
                   <v-autocomplete
                    v-if="newRuleStep.ruleType == RuleType.trigger"
                    v-model="selectedReportTemplate"
                    :rules="templateRule"
                    :items="reportTemplates"
                    color="primary"
                    item-title="name"
                    item-value="name"
                    label="Select Trigger"
                    placeholder="Select trigger"
                    prepend-icon="find_in_page"
                    return-object>

                    <template v-slot:chip="{ props, item }">
                      <div v-bind="props" v-if="item != null">
                        {{ item.raw.name }} 
                        <v-chip class="ma-2" label>
                        {{ item.raw.node }}
                        </v-chip>
                        <v-chip class="ma-2" label>
                        {{ item.raw.device }}
                        </v-chip>
                      </div>
                    </template>
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

                  <v-autocomplete
                    v-if="newRuleStep.ruleType == RuleType.output"
                    v-model="selectedCommandTemplate"
                    :rules="templateRule"
                    :items="commandTemplateItems"
                    color="primary"
                    item-title="name"
                    item-value="name"
                    label="Select Action"
                    placeholder="Select Action"
                    prepend-icon="find_in_page"
                    return-object>

                    <template v-slot:chip="{ props, item }">
                      <div v-bind="props" v-if="item != null">
                        {{ item.raw.name }} 
                        <v-chip class="ma-2" label>
                        {{ item.raw.node }}
                        </v-chip>
                        <v-chip class="ma-2" label>
                        {{ item.raw.device }}
                        </v-chip>
                      </div>
                    </template>
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

                  <v-autocomplete
                    v-if="newRuleStep.ruleType == RuleType.function"
                    v-model="selectedFunctionTemplate"
                    :rules="templateRule"
                    :items="functionTemplates"
                    color="primary"
                    item-title="name"
                    item-value="name"
                    label="Select Function"
                    placeholder="Select Function"
                    prepend-icon="find_in_page"
                    return-object>

                    <template v-slot:chip="{ props, item }">
                      <div v-bind="props" v-if="item != null">
                        {{ item.raw.name }}
                      </div>
                    </template>
                    <template v-slot:item="{ props, item }">
                      <v-list-item
                          v-bind="props"
                          :title="item.raw.name"
                          :subtitle="item.raw.description"
                        ></v-list-item>
                   </template>
                  </v-autocomplete>
                </v-col>
               </v-row>
            </v-container>
            <!--<small>*indicates required field</small>-->
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="blue darken-1"
              variant="text"
              @click="createNewStep"
            >
              Save
            </v-btn>
            <v-btn
              color="blue darken-1"
              variant="text"
              @click="newStepDialog = false"
            >
              Close
            </v-btn>
          </v-card-actions>
         </v-form>
        </v-card>
      </v-dialog>
    </div>
  </template>
  <style>
  .flip-list-move {
    transition: transform 0.5s;
  }
  
  .no-move {
    transition: transform 0s;
  }
  
  .ghost {
    opacity: 0.2;
  }
  
  .svgContainer {
      position: absolute;
  }
  
  .connector {
      opacity: 0.5;
  }
  </style>