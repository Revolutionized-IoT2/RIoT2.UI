<script setup lang="ts">
import { useRuleUtils } from '@/composables/ruleUtilsService';
import { RuleType } from '@/models/enums';
import type { IRuleItem } from '@/models/rules/IRuleItem';
import type { RuleCondition } from '@/models/rules/ruleCondition';
import type { RuleOutput } from '@/models/rules/ruleOutput';
import { onUpdated } from 'vue';
import { computed, onMounted, ref } from 'vue';

const emit = defineEmits<{
    ruleItemClicked: [number]
}>();

const ruleUtils = useRuleUtils();

const props = defineProps<{
    item: IRuleItem
}>();

const icon = ref("");
const ruleTypeClass = ref("");
const ruleTypeClassSec = ref("");

const ruleId = computed(() => {
    return "rule_" + props.item.id;
});

const showContinueConnector = computed(() => {
    if (props.item.ruleType == RuleType.output) { 
            return (props.item as RuleOutput).continueFlow;
        }
        else if (props.item.ruleType == RuleType.condition) {
            return ruleUtils.hasContinue(props.item as RuleCondition);
        }

        return true;
});

function setItemProps() {
    if(props.item == null)
        return;

    switch (props.item.ruleType) {
        case 0:
            ruleTypeClass.value = "bg-trigger-main text-center";
            ruleTypeClassSec.value = "bg-trigger-sec";
            icon.value = "flash_on"; 
            break;
        case 1:
            ruleTypeClass.value = "bg-func-main text-center";
            ruleTypeClassSec.value = "bg-func-sec";
            icon.value = "functions"; 
            break;
        case 2:
            ruleTypeClass.value = "bg-cond-main text-center";
            ruleTypeClassSec.value = "bg-cond-sec";
            icon.value = "call_split"; 
            break;
        case 3:
            ruleTypeClass.value = "bg-output-main text-center";
            ruleTypeClassSec.value = "bg-output-sec";
            icon.value = "play_for_work"; 
            break;
    }
}

function ruleItemClicked(id: number | undefined) {
    if(id == undefined)
        return;

    emit('ruleItemClicked', id); //trigger an event 
}

onMounted(() => {
    setItemProps();
});

onUpdated(() => {
    setItemProps();
});

</script>
<template>
    <div>
      <div
        :id="ruleId"
        class="shadow row ma-2 bg-white"
        style="width:260px;height:40px;"
      >
        <div
          :class="ruleTypeClass"
          style="width:40px"
        >
          <i class="material-icons md-light pt-2">{{ icon }}</i>
        </div>
        <div
          class="clickable text-left z-1"
          :class="ruleTypeClassSec"
          style="width:220px;height:40px"
          @click="ruleItemClicked(props.item.id)"
        >
          <span
            class="d-inline-block text-truncate pt-2 ml-1"
            style="max-width: 220px;"
            :title="props.item.name"
          >{{ props.item.name }}</span>
        </div>
      </div>
      <div
        class="connector"
        style="width:300px;height:40px;"
      >
        <div class="col text-center">
          <v-icon v-if="showContinueConnector">arrow_downward</v-icon>
        </div>
      </div>
    </div>
  </template>
  <style scoped>
  .z-1{
      z-index: 1;
  }

  .row {
            display: flex;
            flex-direction: row;
        }
  
  .svgContainer {
      position: absolute;
  }
  
  .connector {
      z-index: -10;
      opacity: 0.5;
  }
  
  h1 {
      padding-top: 12px;
      font-size: 22px;
      color: black;
      padding-left: 10px;
  }
  
  h2 {
      font-size: 12px;
      color: darkgray;
      padding-left:10px;
  }
  .color-green {
      color:forestgreen;
  }
  .color-red {
      color:red;
  }
  
  .ruleEditor {
      max-height: 40%;
      overflow-y: auto;
  }
  
  .ruleMenu {
      min-height: 100%;
      max-width: 40rem;
      position: fixed;
      right: 0;
      top: 0;
      bottom: 0;
      height: 100%;
      width: 50%;
      z-index: 10000;
      background-color: white;
      overflow-y: auto;
  }
  
  .material-icons.md-light {
      color: rgba(255, 255, 255, 1);
  }
  
  .ruleMenuContent {
      margin-bottom: 50px;
  }
  
  .ruleMenuFooter {
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
  
  .shadow {
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
  }
  
  .slide-leave-active,
  .slide-enter-active {
      transition: .5s;
  }
  
  .slide-enter.ruleMenu {
      transform: translate(100%, 0);
  }
  
  .slide-leave-to.ruleMenu {
      transform: translate(100%, 0);
  }
  
  .fade-enter-active, .fade-leave-active {
      transition: opacity .7s;
  }
  
  .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
      opacity: 0;
  }
  </style>