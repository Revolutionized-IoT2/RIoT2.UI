<script setup lang="ts">
import { useRuleUtils } from '@/composables/ruleUtilsService';
import { ConditionType, FlowOperator, OutputOperation, RuleType, TriggerEvent, ValueType } from '@/models/enums';
import type { IRuleItem } from '@/models/rules/IRuleItem';
import type { FunctionEntity } from '@/models/rules/functionEntity';
import type { Parameter } from '@/models/rules/parameter';
import type { RuleCondition } from '@/models/rules/ruleCondition';
import type { RuleFunction } from '@/models/rules/ruleFunction';
import type { RuleOutput } from '@/models/rules/ruleOutput';
import type { RuleTrigger } from '@/models/rules/ruleTrigger';
import { SwitchCase } from '@/models/rules/switchCase';
import { onMounted, onUpdated } from 'vue';
import { computed, ref } from 'vue';
import Datamodel from '@/components/rules/DatamodelComponent.vue';
import { useOrchestrator } from '@/composables/orchestratorService';
import { Report } from '@/models/report';
import type { nameValue } from '@/models/rules/nameValue';

const ruleUtils = useRuleUtils();
const orchestrator = useOrchestrator();

const emit = defineEmits<{
  closeButtonClicked: [void],
  deleteButtonClicked: [void]
}>();


const model = defineModel<IRuleItem>();

export interface Props {
  ruleItemList: nameValue[],
  dataModel: any
}

const props = withDefaults(defineProps<Props>(), {
  dataModel: {"x": "y"},
});

const editModeName = ref(false);
const ruleTypeClassMain = ref("");
const icon = ref("");
const conditionOperators= [{value: FlowOperator.continue, name:'Continue'}, {value: FlowOperator.stop, name:'Stop'}, {value: FlowOperator.jump, name:'Jump'}];
const editIfElse = ref(false);
const caseDialog = ref(false);
const currentEditCase = ref<SwitchCase>(new SwitchCase());
const showConditionHelp = ref(false);
const testFunctionDialog = ref(false);
const testBenchResult = ref({});
const loading = ref(false);
const testBenchDataModel = ref({});
//const currentIo = ref<Io>(new Io);
const triggerDataModel = ref<any>(null);
const triggerDataDialog = ref(false);

const functionParams = computed((): Parameter [] => {
  if(model?.value?.ruleType == RuleType.function){
        return (model.value as RuleFunction).parameters.filter(function (el) {
          return el.name != 'input';
        });
      }
      return [];
});

const filteredRuleItemList = computed((): nameValue [] => {
  if(model == null || model.value == null)
    return [];

  let currentId = model.value.id;
      
      return props.ruleItemList.filter(function (el) {
        return el.value != currentId;
      });
});

const ruleItemType = computed((): string => {
  if(model == null || model.value == null)
    return "";

  return RuleType[model.value.ruleType];
});

function showTriggerDataDialog() {

  loading.value = true;
  orchestrator.getReportState((model.value as RuleTrigger).reportId, (data : Report | null) => {
    triggerDataModel.value = data?.value;
  }, () => {
    loading.value = false;
    triggerDataDialog.value = true;
  });
}

function getValueName(index: number, list: nameValue[]) : string{
  let obj = list.find(x => x.value == index);
  if(obj != null)
    return obj.name;
  else
    return "";
}


function parameterTypeAsString(type: ValueType) {
  return '[' + ValueType[type] + '] ';
}

function getFunctionParameters() : Parameter[] {

  if(model.value == undefined || model.value.ruleType != RuleType.function)
    return [];

  let f = model.value as RuleFunction;

  let params = f.parameters.filter((el) => {
    return el.type != ValueType.Entity && el.name != 'input';
  });

  //fix value types
  for(let p of params) {
    p.value = parseToType(p.value, p.type);
  }

  return params;
}

function parseToType(val: any, type: ValueType) {
  if(val == null || val == undefined)
    return undefined;

  switch(type) {
    case ValueType.Number: return Number(val);
    case ValueType.Entity:
    case ValueType.TextArray:
      return JSON.parse(val);
    case ValueType.Boolean:
      return val.toString().toLowerCase() == "true";
    case ValueType.Text:
    default:
      return val.toString()
  }
}


function isPrimitive(test: any) {
  return (test !== Object(test));
}

function getObjectKeys(obj: any): string[] {
    let paramNames: string[] = [];
    if(isPrimitive(obj)) {
      paramNames.push("value");
    } else {
      for (let key in obj) {
        paramNames.push(key);
      }
    }
    return paramNames;
}

function setItemProps() {
  if(model == null || model.value == null)
    return;

    switch (model.value.ruleType) {
        case RuleType.trigger:
            ruleTypeClassMain.value = "bg-trigger-main";
            icon.value = "flash_on";
            break;
        case RuleType.function:
            ruleTypeClassMain.value = "bg-func-main";
            icon.value = "functions";
            break;
        case RuleType.condition:
            ruleTypeClassMain.value = "bg-cond-main";
            icon.value= "call_split";
            break;
        case RuleType.output:
            ruleTypeClassMain.value = "bg-output-main";
            icon.value = "play_for_work";
    }
}

function addNewSwitchCase() {

  if(model?.value?.ruleType != RuleType.condition)
    return;

  (model.value as RuleCondition).switchCases.push(new SwitchCase());
  editSwitchCase((model.value as RuleCondition).switchCases.length - 1);
}

function removeSwitchCase(index: number) {
    (model.value as RuleCondition).switchCases.splice(index, 1);
}

function editSwitchCase(index: number)
{
    currentEditCase.value = (model.value as RuleCondition).switchCases[index];
    caseDialog.value = true;
}

function testBenchDataModelUpdated(model: any) {
  testBenchDataModel.value = model;
}

function runFunctionTest() {
  loading.value = true;

  let f = {
    functionId: (model.value as RuleFunction).functionId,
    name: (model.value as RuleFunction).name,
    data: testBenchDataModel.value,
    parameters: getFunctionParameters() 
  } as FunctionEntity;

  orchestrator.runFunction(f, (data: any) => {
    testBenchResult.value = data;
  }, () => {
    loading.value = false;
  });
}

function testFunction() {
  testBenchDataModel.value = Object.assign({}, props.dataModel);
  testFunctionDialog.value = true;
}

function closeRuleEditView() {
    emit('closeButtonClicked');
}

function deleteRuleItem() {
    emit('deleteButtonClicked');
}

function outputOperationChanged() {
  alert("todo outputOperationChangeds")
}

function mappingUpdated(model: any) {
  alert("todo: " + model);
}

onMounted(() => {
    setItemProps();
});

onUpdated(() => {
    setItemProps();
});
/*
@Watch('value')
onValueChange(newVal: any) {
    this.setItemProps();
}*/

</script>
<template>
    <v-card height="100%" flat style="overflow-y: auto;">
      <v-card-item>
            <div>
              <div class="text-overline mb-1">
                <v-icon :class="ruleTypeClassMain">{{ icon }}</v-icon> {{ ruleItemType }}{{' [' + model?.id +']'}}
              </div>
              <div class="text-h6 mb-1">
                {{ model?.name }}
              </div>
              <div class="text-caption">{{ (model as IRuleItem).description }}</div>
            </div>
          </v-card-item>
        <v-divider />
    
        <!--trigger-->
        <v-form class="ml-3 mr-3" v-if="model?.ruleType == RuleType.trigger">
          <v-container class="pt-0 mb-12">
            <v-row dense>
              <v-col cols="12">
                <v-list-subheader class="pl-0 mt-2">Trigger settings</v-list-subheader>
                <v-select
                  clearable
                  hint="If no filter is defined, the rule is activated everytime"
                  :disabled="(model as RuleTrigger).filterOptions?.length < 1"
                  :items="(model as RuleTrigger).filterOptions"
                  v-model="(model as RuleTrigger).filter"
                  label="Select filter for trigger"
                ></v-select>
              </v-col>
              <v-col cols="12">
                 <v-btn size="small" :loading="loading" color="success" outlined @click="showTriggerDataDialog()"><v-icon size="x-small">login</v-icon>trigger data</v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
    
        <!--function-->
        <v-form class="ml-3 mr-3" v-if="model?.ruleType == RuleType.function">
          <v-container class="pt-0 mb-12">
            <v-list-subheader class="pl-0 mt-2 mb-2">Function parameters
              <v-icon class="ml-1" @click="showConditionHelp = true">info</v-icon>
            </v-list-subheader>
            <v-row>
              <v-col cols="12" class="pt-0" v-for="(param, index) in getFunctionParameters()" :key="index">
                <v-text-field
                      dense
                      v-model="param.value"
                      :hint="parameterTypeAsString(param.type) + (param.description != null ? param.description : '' )">
                  <template v-slot:label>
                        <span :class="{'red--text': !param.isOptional }">{{param.name}}</span><span v-if="!param.isOptional" class="red--text"><strong> *</strong></span>
                  </template>
                </v-text-field>
              </v-col>
               <v-col cols="12">
                 <v-btn :loading="loading" 
                    size="small" 
                    color="success" 
                    outlined 
                    @click="testFunction()">
                    <v-icon size="x-small">check</v-icon>test function
                  </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
    
      <!--condition-->
      <v-form class="ml-3 mr-3" v-if="model?.ruleType == RuleType.condition">
        <v-container class="pt-0 mb-12">
          <v-row dense>
            <v-col cols="12" class="pt-0 mt-3">
              <v-radio-group dense v-model="(model as RuleCondition).conditionType" label="Condition type">
                    <v-radio label="If-Else" :value="0" />
                    <v-radio label="Switch" :value="1" />
              </v-radio-group>
            </v-col>
          </v-row>
          <v-row dense v-if="(model as RuleCondition).conditionType == ConditionType.ifElse">
            <!-- if-else card-->
            <v-col cols="12">
              <v-card dark>
                <v-card-text>
                  IF <v-chip small label>{{(model as RuleCondition).ifClause}}</v-chip> THEN <v-chip small label>
                    {{FlowOperator[(model as RuleCondition).thenOperator].toUpperCase()}}</v-chip>
                    {{(model as RuleCondition).thenOperator == FlowOperator.jump ? " TO ": ""}}
                    <v-chip small label v-if="(model as RuleCondition).thenOperator == FlowOperator.jump">
                      {{getValueName((model as RuleCondition).thenJumpTo, ruleItemList)}}</v-chip>
                </v-card-text>
                <v-card-text>
                  ELSE <v-chip small label>{{FlowOperator[(model as RuleCondition).elseOperator].toUpperCase()}}</v-chip>
                  {{(model as RuleCondition).elseOperator == FlowOperator.jump ? " TO ":""}} 
                  <v-chip small v-if="(model as RuleCondition).elseOperator == FlowOperator.jump">
                    {{getValueName((model as RuleCondition).elseJumpTo, ruleItemList)}}</v-chip>
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn varint="text" small @click="editIfElse = true"><v-icon small>edit</v-icon>edit</v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
          <!-- switch card-->
          <v-row dense v-if="(model as RuleCondition).conditionType == ConditionType.switch">
            <v-col cols="12" >
                <v-select
                  v-model="(model as RuleCondition).switchVariable"
                  :items="getObjectKeys(props.dataModel)"
                  label="SWITCH">
                </v-select>
            </v-col>
             <!-- cases -->
             <v-col cols="12" v-for="(c, i) in (model as RuleCondition).switchCases" :key="i">
              <v-card dark>
                <v-card-actions class="card-actions">
                  <v-card-subtitle>CASE <v-chip small>{{c.case}}</v-chip> : <v-chip small>
                    {{FlowOperator[c.operation].toUpperCase()}}</v-chip>
                    {{c.operation == FlowOperator.jump ? " TO ":""}}
                    <v-chip small v-if="c.operation == FlowOperator.jump">
                      {{getValueName(c.jumpTo, ruleItemList)}}
                    </v-chip>
                  </v-card-subtitle>
                  <v-spacer />
                  <v-icon color="success" @click="editSwitchCase(i)">edit</v-icon>
                  <v-icon color="red" @click="removeSwitchCase(i)">remove_circle</v-icon>
                </v-card-actions>
              </v-card>
            </v-col>
            <v-col cols="4">
                 <v-btn x-small color="success" outlined @click="addNewSwitchCase"><v-icon x-small>add</v-icon>add case</v-btn>
            </v-col>
          </v-row>
        </v-container>
        </v-form>
    
        <!--output-->
        <v-form class="ml-3 mr-3" v-if="model?.ruleType == RuleType.output">
          <v-container class="pt-0 mb-12">
          <v-row dense>
            <v-list-subheader class="pl-0 mt-2">Output settings</v-list-subheader>
            <v-col cols="12">
            <Datamodel 
              :datamodel="(model as RuleOutput).model" 
              labeltext="Expected data"
              :expandable="true" 
              :editable="false" 
              />
            </v-col>
            <v-col cols="12">
                <v-switch
                  color="primary"
                  v-model="(model as RuleOutput).useMapping"
                  label="Use mapping" />
            </v-col>
            <template v-if="(model as RuleOutput).useMapping">
            <v-list-subheader class="pl-0 mt-2">Output mappings</v-list-subheader>
            <v-col cols="12" v-for="(p, i) in getObjectKeys((model as RuleOutput).dataModelMapping)" :key="i">
              <v-select
                  v-model="(model as RuleOutput).dataModelMapping[p]"
                  :items="getObjectKeys(props.dataModel)"
                  :label="p">
                </v-select>
            </v-col>
            </template>
            <v-col cols="12" v-else>
              If datamodel is not mapped, Schema datamodel is used for output
            </v-col>
            
            <!--
            <v-col cols="12">
              <v-select
                  :items="getOutputOperations()"
                  item-value="value"
                  item-text="name"
                  label="Output operation"
                  v-model="(model as RuleOutput).operation"
                  @change="outputOperationChanged()"
                   />

                  //TODO if operations are implemented
                <template v-if="(model as RuleOutput).operation == 5 || (model as RuleOutput).operation == 6">
                  <v-alert border="top" colored-border type="info" elevation="1">
                    Pulse lenght can be passed in as primitive value or as object pulseLength -parameter. Value in millis.
                  </v-alert>
                  <v-select
                  v-model="pulseLengthParameter.inputParameter"
                  :items="getDataModelParamNames()"
                  :label="pulseLengthParameter.name" />
                </template>
                </v-col>
                -->
              <v-col cols="12">
                <v-switch
                  color="primary"
                  v-model="(model as RuleOutput).continueFlow"
                  label="Continue flow after operation" />
            </v-col>
          </v-row>
          <!-- <template v-if="(model as RuleOutput).operation == OutputOperation.write && (model as RuleOutput).parameters.length > 0"> 
          <v-divider />
          <v-list-subheader class="pl-0 mt-2">Output parameter mapping</v-list-subheader>
           <v-row dense >
            <v-col cols="12" v-for="(p, i) in (model as RuleOutput).parameters" :key="i">
              <v-select
                  v-model="p.inputParameter"
                  :items="getDataModelParamNames()"
                  :label="p.name">
                </v-select>
            </v-col>
          </v-row>-->
          </v-container>
        </v-form>
        
        <v-card-actions class="card-actions-footer">
          <v-btn outlined color="success" @click="closeRuleEditView"><v-icon>close</v-icon>Close</v-btn>
          <v-btn color="red" outlined @click="deleteRuleItem"><v-icon>delete</v-icon>Delete</v-btn>
        </v-card-actions>
    
     <v-dialog v-model="editIfElse" persistent max-width="600px">
          <v-card>
            <v-form>
              <v-card-title>
                <span class="headline">Edit IF-ELSE</span>
              </v-card-title>
              <v-card-text>
              <v-container>
                 <v-row>
                  <v-col cols="12">
                    <v-text-field
                      label="IF"
                      dense
                      v-model="(model as RuleCondition).ifClause"
                      placeholder="value == 1"
                      append-outer-icon="info"
                      @click:append-outer="showConditionHelp = true"
                    />
                  </v-col>
                   <v-col cols="12" class="pt-0">
                <v-select
                  v-model="(model as RuleCondition).thenOperator"
                  :items="conditionOperators"
                  item-value="value"
                  item-title="name"
                  label="THEN">
                </v-select>
              </v-col>
              <v-col cols="12" class="pt-0">
                <v-select
                  v-model="(model as RuleCondition).thenJumpTo"
                  :disabled="(model as RuleCondition).thenOperator != FlowOperator.jump"
                  :items="ruleItemList"
                  item-value="value"
                  item-title="name"
                  label="TO">
                </v-select>
              </v-col>
              <v-col cols="12" class="pt-0">
                <v-select
                  v-model="(model as RuleCondition).elseOperator"
                  :items="conditionOperators"
                  item-value="value"
                  item-title="name"
                  label="ELSE">
                </v-select>
              </v-col>
               <v-col cols="12" class="pt-0">
                 <v-select
                  v-model="(model as RuleCondition).elseJumpTo"
                  :disabled="(model as RuleCondition).elseOperator != FlowOperator.jump"
                  :items="ruleItemList"
                  item-value="value"
                  item-title="name"
                  label="TO">
                </v-select>
               </v-col>
                 </v-row>
              </v-container>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="blue darken-1"
                variant="text"
                @click="editIfElse = false"
              >
                Close
              </v-btn>
            </v-card-actions>
           </v-form>
          </v-card>
        </v-dialog>
    
        <!--Case dialog -->
        <v-dialog v-model="caseDialog" persistent max-width="600px">
          <v-card>
            <v-form>
              <v-card-title>
                <span class="headline">CASE</span>
              </v-card-title>
              <v-card-text>
              <v-container>
                 <v-row>
                  <v-col cols="12">
                    <v-text-field
                          label="CASE"
                          dense
                          v-model="currentEditCase.case"
                        />
                  </v-col>
                  <v-col cols="12">
                    <v-select
                      v-model="currentEditCase.operation"
                      :items="conditionOperators"
                      item-value="value"
                      item-title="name"
                      label="THEN">
                    </v-select>
                  </v-col>
                  <v-col cols="12">
                    <v-select
                      v-model="currentEditCase.jumpTo"
                      :disabled="currentEditCase.operation != FlowOperator.jump"
                      :items="ruleItemList"
                      item-value="value"
                      item-title="name"
                      label="TO">
                    </v-select>
                  </v-col>
                 </v-row>
              </v-container>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="blue darken-1"
                varinat ="text"
                @click="caseDialog = false"
              >
                Close
              </v-btn>
            </v-card-actions>
           </v-form>
          </v-card>
        </v-dialog>
    
        <!--trigger data dialog -->
        <v-dialog v-model="triggerDataDialog" max-width="600px">
        <v-card width="600px" >
        <v-card-title>
          <span class="title mr-2">[{{ (model as RuleTrigger).id }}]</span>
            <span class="title font-weight-light">{{(model as RuleTrigger).name}}</span>
        </v-card-title>
        <v-card-subtitle class="pb-1 text-subtitle-1">{{(model as RuleTrigger).description}}</v-card-subtitle>
        <v-card-subtitle class="pb-1 text-disabled text-decoration-overline text-subtitle-2">{{(model as RuleTrigger).reportId}}</v-card-subtitle>
        <v-card-text>
            <Datamodel
              :datamodel="triggerDataModel" 
              labeltext="Trigger value" 
              :expanded="true" 
              :editable="false"
              :readInput="false"
               />
        </v-card-text>
        <v-card-actions>
            <v-spacer />
            <v-btn @click="triggerDataDialog = false" color="blue">
                <v-icon>close</v-icon>
                close
            </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
        
    
        <!-- Condition help dialog -->
        <v-dialog v-model="showConditionHelp" max-width="600">
          <v-alert
            border="top"
            colored-border
            type="info"
            tile
            class="ma-0">
            <p>Static value or property from datamodel can be used as input value for parameter.</p>
            <p>If datamodel is primitive, use <i>value</i> to refer it. If datamodel is an object, use object-notation with <i>value</i>-prefix to refer it's properties e.g. <i>value.property</i></p>
            <p>Syntax is not case sensitive.</p>
          </v-alert>
        </v-dialog>
    
        <!-- Test function dialog -->
        <v-dialog v-model="testFunctionDialog" max-width="500">
            <v-card>
              <v-card-title>
                <span class="headline">Function Testbench</span>
              </v-card-title>
              <v-card-text>
              <v-container>
                 <v-row>
                  <v-col cols="12">
                    <Datamodel
                      :datamodel="testBenchDataModel" 
                      labeltext="Incoming datamodel" 
                      :expandable="false"
                      :editable="true"
                      :readInput="false"
                      @modelUpdated="testBenchDataModelUpdated"
                   />
                  </v-col>
                  <v-col cols="12" align="center" class="pa-0 ma-0">
                   <v-icon x-large>arrow_drop_down</v-icon>
                  </v-col>
                   <v-col cols="12" class="pt-0 pb-0 mt-2 mb-0" v-for="(param, index) in getFunctionParameters()" :key="index">
                      <v-text-field 
                            dense
                            v-model="param.value"
                            :hint="parameterTypeAsString(param.type) + (param.description != null ? param.description : '' )">
                        <template v-slot:label>
                            <span :class="{'red--text': !param.isOptional }">{{param.name}}</span><span v-if="!param.isOptional" class="red--text"><strong> *</strong></span>
                        </template>
                      </v-text-field>
                  </v-col>
                  <v-col cols="12" align="center" class="pa-0 ma-0">
                   <v-icon x-large>arrow_drop_down</v-icon>
                  </v-col>
                  <v-col cols="12">
                    <Datamodel :datamodel="testBenchResult" 
                      labeltext="Resulting datamodel" 
                      :expandable="false"
                      :editable="false"
                      :readInput="false"
                   />
                  </v-col>
                 </v-row>
              </v-container>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                :loading="loading"
                color="blue darken-1"
                variant="text"
                @click="runFunctionTest()"
              >
                run
              </v-btn>
              <v-btn
                color="blue darken-1"
                variant="text"
                @click="testFunctionDialog = false"
              >
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-card>
    </template>
    <style scoped>
    .required{
      content: " *";
      color: red;
    }
    .card-actions-footer {
        /*padding: 20px;
        position: fixed;
        width: 100%;
        position: absolute;*/
        position: fixed;
        width: 100%;
        bottom: 0;
        background: #ddd;
        border-left: 1px solid rgba(0, 0, 0, 0.125);
        padding: 0.75rem 1.25rem;
        border-top: 1px solid rgba(0, 0, 0, 0.125);
    }
    </style>