<script setup lang="ts">

import ContextMenu from '@/components/rules/ContextMenuComponent.vue';
import { useOrchestrator } from '@/composables/orchestratorService';
import type { ContextMenuItem } from '@/models/contextMenuItem';
import type { IRuleListItem } from '@/models/rules/IRuleListItem';
import type { Rule } from '@/models/rules/rule';
import router from '@/router';
import { onMounted, ref } from 'vue';

const contextMenuItems: ContextMenuItem[] = [
  { "text": "new", "action": "new_rule", "disabled": false, "icon": "add" }
];

const orchestrator = useOrchestrator();

const search = ref("");
const rules = ref<IRuleListItem[]>([]);
const filter = ref("");
const loading = ref(false);
//TODO better way to create confirm dialog?
const deleteRuleId = ref<string | null>(null);
const deleteRuleDialog = ref(false);

const headers: any [] = [
  { title: 'Name', align: 'left', sortable: true, value: 'name' },
  { title: 'Description', value: 'description' },
  { title: 'Tags', align: 'left', value: 'tags', sortable: false },
  { title: 'Status', value: 'status', sortable: false },
  { title: 'Actions', value: 'action', sortable: false },
];

function cancelDelete() { 
  deleteRuleDialog.value = false;
  deleteRuleId.value = null;
}

function ruleTags(tagIds: number[]): string [] {
  return [];
}

function contextMenuAction(action : string){
  if(action == 'new_rule')
    router.push("/rules/editor/");
}

  function customFilter(value: string, query: string, item?: any) {

  if(value != null && query != null && typeof value === 'string'){
      if(value.toString().toLowerCase().indexOf(query.toLowerCase()) != -1) {
        return true;
      }
  }

  var tags = item.columns['tags'];

 
  if(tags != null) {
    if(tags.map((t:string) => t.toLowerCase()).some((i:string) => i.indexOf(query.toLowerCase()) != -1))
      return true;
    }
    
    return false;
  }

  function refreshRules() {
    alert("todo");
  }

  function filteredRules(){
    return rules.value.filter(rule => {
      return rule.tags.map(o => o).join(' ').toLowerCase().indexOf(filter.value.toLowerCase()) > -1;
    })
  }

  function editItem(item : IRuleListItem){
    router.push("/rules/editor/" + item.id);
  }

  function simulateItem(item : IRuleListItem) {
    router.push("/rules/simulate/" + item.id);
  }

  function changeState(item : IRuleListItem){
   orchestrator.setRuleState(item.id, item.isActive, (data:string | null) => {
    //todo if needed
   }, () => {
    //todo if needed
   });
  }

  function deleteItem(item : IRuleListItem){
    if(item != null) {
      deleteRuleDialog.value = true;
      deleteRuleId.value = item.id;
    }
  }

  function completeRuleDelete(){
    if(deleteRuleId.value != null) {
      orchestrator.deleteRule(deleteRuleId.value, (data:void | null) => {
        deleteRuleId.value = null;
      }, () => {
        loadRules();
        deleteRuleDialog.value = false;
      });
    }
  }

  function loadRules() {
    loading.value = true;
    orchestrator.getRules((data: IRuleListItem[] | null) => {
      if(data != null) {
        rules.value = data;
      }
    }, () => {
      loading.value = false;
    });
}

onMounted(() => {
   loadRules();
});
</script>

<template>
  <div>
    <ContextMenu :items="contextMenuItems" @click="contextMenuAction" />

    <div class="site-content-contextmenu">
    <v-data-table
        :hide-default-footer="rules.length < 10" 
        :custom-filter="customFilter"
        :search="search"
        :headers="headers"
        :items="rules"
        :sort-by="[{ key: 'name' }]"
        density="compact"
        class="elevation-1 mt-2"
      >
        <template v-slot:top>
          <v-toolbar
            flat
            color="white"
          >
            <v-toolbar-title>System Rules</v-toolbar-title>
            <v-divider
              class="mx-4"
              inset
              vertical
            />
          <v-spacer />
          <v-text-field
              v-model="search"
              prepend-inner-icon="search"
              density="compact"
              label="Search"
              single-line
              flat
              hide-details
              variant="solo-filled"
              class="pr-3"
            ></v-text-field>
          </v-toolbar>
        </template>
        <template v-slot:[`item.action`]="{ item }">
          <v-icon
            small
            class="mr-2"
            @click="editItem(item)"
          >
            edit
          </v-icon>
          <v-icon
            small
            class="mr-2"
            @click="deleteItem(item)"
          >
            delete
          </v-icon>
          <v-icon
            small
            class="mr-2"
            @click="simulateItem(item)"
          >
            play_arrow
          </v-icon>
        </template>
        <template v-slot:[`item.status`]="{ item }">
          <div class="">
            <v-switch
              color="primary"
              v-model="item.isActive"
              class=""
              @change="changeState(item)"
            />
          </div>
        </template>
        <template v-slot:[`item.tags`]="{ item }">
          <div class="">
             <v-chip
                  v-for="(tag, index) in item.tags"
                  :key="'tag_'+index"
                  color="blue"
                  text-color="white"
                  class="ma-2"
                  size="x-small"
                  label
                >
                <!--<v-icon left v-if="tag.icon != null" small>{{ tag.icon }}</v-icon> -->
                  {{ tag }}
                </v-chip>
          </div>
        </template>
        <template v-slot:no-data>
          <v-alert
            class="mt-3"
            :value="true"
            color="white"
            icon="info"
          >
            <b>No rules found from system</b>
          </v-alert>
        </template>
      </v-data-table>
    </div>
  </div>

  <v-dialog
  v-model="deleteRuleDialog" max-width="400" @keydown.esc="cancelDelete">
    <v-card>
      <v-toolbar dark color="primary" dense flat>
        <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
          Delete rule?
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="pa-4 black--text">
        Are you sure you want to delete this rule?
      </v-card-text>
      <v-card-actions class="pt-3">
        <v-spacer></v-spacer>
        <v-btn
          color="grey"
          type="text"
          class="body-2 font-weight-bold"
          @click="cancelDelete"
          >Cancel</v-btn
        >
        <v-btn
          color="primary"
          class="body-2 font-weight-bold"
          outlined
          @click="completeRuleDelete"
          >OK</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

</template>

