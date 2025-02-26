<script setup lang="ts">
import { Rule } from '@/models/rules/rule';
import { computed, inject, onMounted, ref, watch } from 'vue';

import ContextMenu from '@/components/rules/ContextMenuComponent.vue';
import RuleHeader from '@/components/rules/RuleHeaderComponent.vue';
import RuleEditor from '@/components/rules/RuleEditorComponent.vue';
import RuleItemEditor from '@/components/rules/RuleItemEditorComponent.vue';
import Datamodel from '@/components/rules/DatamodelComponent.vue';
import { RuleTrigger } from '@/models/rules/ruleTrigger';
import type { IRuleItem } from '@/models/rules/IRuleItem';
import { nameValue } from '@/models/rules/nameValue';
import { InjectionKeys } from '@/models/injectionKeys';
import { useOrchestrator } from '@/composables/orchestratorService';
import { useRoute } from 'vue-router';
import router from '@/router';
import PlaceholderItem from '@/models/placeholderItem';
import { ValueType } from '@/models/enums';
import { ca } from 'vuetify/locale';

const reportTemplates = inject(InjectionKeys.reportTemplates);
const commandTemplates = inject(InjectionKeys.commandTemplates);
const variableTemplates = inject(InjectionKeys.variableTemplates);

const orchestrator = useOrchestrator();
const route = useRoute();

const editorTitle = ref("");
const isDirty = ref(false);
const simulateDisabled = ref(true);
const initialized = ref(false);
const rule = ref<Rule>(new Rule());
const ruleValidationErrors = ref<string[]>([]);

const tags = ref<string[]>([]);
const saveRuleSnackbar = ref(false);

const schemaHelpDialog = ref(false);
const editRuleItemView = ref(false);
const ruleItemToEdit = ref<IRuleItem>(new RuleTrigger());

const ruledatamodel = ref<any>(null);

const contextMenuItems = computed(() => [
        { text: "cancel", action: "cancel_ruleEditor", disabled: !isDirty, icon: "cancel" },
        { text: "simulate", action: "simulate_ruleEditor", disabled: simulateDisabled.value, icon: "playlist_play" },
        { text: "save", action: "save_ruleEditor", disabled: !isDirty, icon: "save" }
    ]
);

function validateRule() {
  orchestrator.validateRule(rule.value.id, (data: string[] | null) => {
    if(data != null && data.length > 0) {
      ruleValidationErrors.value = data;
      simulateDisabled.value = true;
    }
    else {
      simulateDisabled.value = false;
    }
  },()=>{

  });
}

const ruleItemValues = computed((): nameValue[] => {
  let retVal: nameValue[] = [];
  for (let i = 0; i < rule.value.ruleItems.length; i++) {
      let item = rule.value.ruleItems[i];
      retVal.push(new nameValue(item.name, item.id));
  }
  return retVal;
});

function contextMenuAction(action: string) {
    if(action == 'cancel_ruleEditor') {
      /*
      this.$confirm('Are you sure you want discard all changes?').then(res => {
        if(res) {
          this.initRule(this.rule.id);
        }
     });*/
    }

    if(action == 'simulate_ruleEditor') {
      router.push("/rules/simulate/" + rule.value.id);
    }

    if(action == 'save_ruleEditor') {
      orchestrator.saveRule((rule.value as Rule), (data: string | null) => {
        if(data != null){
          const p = "/rules/editor/" + data;
          saveRuleSnackbar.value = true;
          if(route.path != p)
            router.push(p);
          else
            initRule(data);
        }
      },()=>{
  
      });
  }
}

function initRule(id?: string | undefined) {
    if(id == null || id == '') {
      rule.value = new Rule();
    } else {
      orchestrator.getRule(id, (data: Rule | null) => {
        if(data != null)
        {
          //Append template data rule items
          rule.value = data;
          validateRule();
        }
      }, () => {
        initialized.value = true;
      });
  }
}

watch(rule, () => {
  ruleChanged();
},  { deep: true })

function ruleChanged() {
    if(initialized.value) {
      isDirty.value = false;
      initialized.value = false;
    }
    else {
      isDirty.value = true;
    }
}

function forceUpdateDataModel() {
  let currentDataModelType = ruledatamodel.value.type;
    if(allowedTypes.value != undefined && !allowedTypes.value.includes(currentDataModelType)) { //if current datamodel type is not allowed -> changed data model
      let firstAllowedType = allowedTypes.value[0];
      ruledatamodel.value.type = firstAllowedType;
      
      switch(firstAllowedType) {
        case ValueType.Boolean:
          updateDataModel(true);
          break;
        case ValueType.Entity:
          updateDataModel({"prop1": "val1", "prop2": 2});
          break;
        case ValueType.Number:
          updateDataModel(0);
          break;
        case ValueType.Text:
          updateDataModel("text value");
          break;
        case ValueType.TextArray:
          updateDataModel(["text1", "text2"]);
          break;
      }
    }
}

function updateDataModel(model: any) {
  rule.value.dataModel = model;
}

function updateItems(items: IRuleItem) {
    forceUpdateDataModel();
}

function editRuleItem(id: number) {

  ruleItemToEdit.value = rule.value.ruleItems[id];
  editRuleItemView.value = true;
}

function closeRuleEditView() {
  editRuleItemView.value = false;
}

function deleteRuleItem() {
  editRuleItemView.value = false;
  const index = rule.value.ruleItems.indexOf(ruleItemToEdit.value, 0);
  if (index > -1 && (rule.value.ruleItems.length > 0 && index != 0)) {
    rule.value.ruleItems.splice(index, 1);
  }
  editRuleItemView.value = false;
}

function loadTemplates() {
  orchestrator.getTags((data: string[] | null) => {
    if(data != null)
      tags.value = data;
  });
}

function getRouteParam(val: string | string []): string {
  if (Array.isArray(val) && val.length > 0)
      return val[0];

  return  (val as string);
}

const placeholders = computed(() => {
  let items: PlaceholderItem [] = [];
  if(reportTemplates != undefined) {
    for(let r of reportTemplates.value) {
      items.push({
        id: r.id,
        name: r.name,
        placeholder: "{R:" + r.id + "}",
        tags: ["report", r.node, r.device, ValueType[r.type]]        
      })
    }
  }

  if(commandTemplates != undefined) {
    for(let c of commandTemplates.value) {
      items.push({
        id: c.id,
        name: c.name,
        placeholder: "{C:" + c.id + "}",
        tags: ["command", c.node, c.device, ValueType[c.type]]        
      })
    }
  }

  if(variableTemplates != undefined) {
    for(let v of variableTemplates.value) {
      items.push({
        id: v.id,
        name: v.name,
        placeholder: "{R:" + v.id + "}",
        tags: ["variable", ValueType[v.type]]        
      })
    }
  }
  
  return items;
})

const allowedTypes = computed(() => {
  if(rule.value.ruleItems.length == 0)
    return undefined;

  let t = reportTemplates?.value.find(r => r.id == (rule.value.ruleItems[0] as RuleTrigger).reportId);
  if(t != undefined) {
    return getAllowedTypes(t.type);
  }

  let v = variableTemplates?.value.find(r => r.id == (rule.value.ruleItems[0] as RuleTrigger).reportId);
  if(v != undefined) {
    return getAllowedTypes(v.type);
  }

  return undefined;
});

function getAllowedTypes(t: ValueType) {
  switch(t) {
    case  ValueType.Entity:
      return [ValueType.Entity];
    
     case  ValueType.Boolean:
      return [ValueType.Boolean, ValueType.Entity];

    case  ValueType.Number:
      return [ValueType.Number, ValueType.Entity];

    case  ValueType.TextArray:
      return [ValueType.TextArray, ValueType.Entity];

    default:
    case  ValueType.Text:
      return [ValueType.Text, ValueType.Entity];
  }
}

onMounted(() => {
  loadTemplates();
  initRule(getRouteParam(route.params.id));
});

</script>

<template>
  <div>
    <ContextMenu :items="contextMenuItems" @click="contextMenuAction" />

    <v-container >
      <v-row class="site-content-contextmenu">
        <v-col cols="12" class="pl-0">
        <RuleHeader v-model="rule" 
          :editable="true" text="rule editor" 
          :validationErrors="ruleValidationErrors" 
          :state="rule.isActive"
          :tagOptions="tags"
          />
      </v-col>
      </v-row>
      <v-row>
        <v-col cols="6" class="pl-0">
          <v-card outlined>
            <v-card-title>
                <v-icon size="large" left color="#007dff">
                code
                </v-icon>
                <span class="title font-weight-light ml-2">rule data model</span>
                <v-icon size="x-small" class="ml-2" style="float: right;" @click="schemaHelpDialog = true">help</v-icon>
            </v-card-title>
           <v-card-text>
          <Datamodel ref="ruledatamodel" :datamodel="rule.dataModel" labeltext="value" 
            :expandable="false" 
            :editable="true"
            :placeholders="placeholders"
            :allowedTypes="allowedTypes"
            @modelUpdated="updateDataModel"/>
      </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6">
          <RuleEditor v-model="rule.ruleItems" @ruleItemClicked="editRuleItem" @ruleItemListUpdated="updateItems" />
        </v-col>
      </v-row>
    </v-container>
    
    <!--rule item settings -->
    <v-navigation-drawer
      
      v-model="editRuleItemView"
      temporary
      location="right"
      width="450"
      fixed
      clipped
      stateless
    >
      <RuleItemEditor 
      v-model="ruleItemToEdit" 
      :dataModel="rule.dataModel" 
      :ruleItemList="ruleItemValues" 
      @closeButtonClicked="closeRuleEditView" 
      @deleteButtonClicked="deleteRuleItem"
       />

    </v-navigation-drawer>

    <!-- Schema help dialog -->
    <v-dialog v-model="schemaHelpDialog" width="500">
      <v-alert
        border="top"
        colored-border
        type="info"
        tile
        class="ma-0">
        <p>Define datamodel for the rule. The model can be primitive value, entity or test array.</p>
        <ol>
          <li>If trigger data is entity, it's properties are merged to rule's datamodel.</li>
          <li>Data can also be injected to rule model by using a placeholder:<i>{trigger-value}</i></li>
        </ol>
      </v-alert>
    </v-dialog>

    <v-snackbar v-model="saveRuleSnackbar" color="success">
      Rule saved succesfully
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="saveRuleSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
