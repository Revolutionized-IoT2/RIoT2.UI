<script setup lang="ts">
import { onMounted, ref } from 'vue';
import SystemNode  from '@/models/systemNode'
import { useOrchestrator } from '@/composables/orchestratorService';
import NodeEditorComponent from '@/components/NodeEditorComponent.vue'
import DashboardEditorComponent from '@/components/DashboardEditorComponent.vue'
import { Constants } from '@/models/constants';
import ContextMenu from '@/components/rules/ContextMenuComponent.vue';
import type { ContextMenuItem } from '@/models/contextMenuItem';
import NodeConfiguration from '@/models/nodeConfiguration';
import Dashboard from '@/models/dashboard';
import { useRouter } from 'vue-router';
import DeviceConfiguration from '@/models/deviceConfiguration';
import { yellow } from 'vuetify/util/colors';
import { DeviceState } from '@/models/enums';
import type DeviceStatus from '@/models/deviceStatus';

const contextMenuItems: ContextMenuItem[] = [
  { "text": "edit dashboard", "action": "edit_dashboard", "disabled": false, "icon": "dashboard" },
  { "text": "new node", "action": "new_node", "disabled": false, "icon": "add" }
];


const nodes = ref<SystemNode []  | undefined>(undefined);
const deviceStatuses = ref<DeviceStatus []  | undefined>(undefined);
const orchestrator = useOrchestrator();
const deleteNodeDialog = ref(false);
const editNodeDialog = ref(false);
const newDeviceDialog = ref(false);
const deviceStatusDialog = ref(false);
const loading = ref(false);
const saving = ref(false);
const saveDeleteNodeCompleted = ref(false);
const nodeIdToDelete = ref("");
//const editDashboadDialog = ref(false)
const dashboardForEdit = ref<Dashboard>(new Dashboard());
const router = useRouter();

const deviceTemplates = ref<DeviceConfiguration[]> ([]);
const selectedDeviceTemplates = ref<DeviceConfiguration[]>([]);
const loadingDeviceTemplates = ref(false);

const person = ref<any>(null)
const options = {}

//const schema = ref();
const editorData = ref<NodeConfiguration>(new NodeConfiguration());
const editorTitle = ref("");

function contextMenuAction(action : string){
  if(action == 'new_node') {

    let newNode = new NodeConfiguration();
    newNode.name = "New Node";

    editorTitle.value = newNode.name;
    editorData.value = newNode;
    editNodeDialog.value = true;
  }

  if(action == 'edit_dashboard') {
    router.push("dashboard/edit");
    /*
    orchestrator.getDashboard((dashboard: Dashboard | null)=> {
      if(dashboard != null) {
        dashboardForEdit.value = dashboard;
        editDashboadDialog.value = true;
      }
    }); */
  }
}

function configureNode(id: string, name: string) {
  loading.value = true;
  editorTitle.value = name;
  orchestrator.getNodeConfiguration(id, (data: NodeConfiguration | null) => {
    if(data != null) {
      editorData.value = data;
      loading.value = false;
      editNodeDialog.value = true;
    }
  });
}

function deleteNode(id: string) {
  nodeIdToDelete.value = id;
  deleteNodeDialog.value = true;
}

function cancelDelete() {
  nodeIdToDelete.value = "";
  deleteNodeDialog.value = false;
}

function saveConfiguration() {

  orchestrator.saveNodeConfiguration(editorData.value, (data: string | null) => {
    saving.value = true;
    initialize();
  });

  editNodeDialog.value = false;
}

function completeNodeDelete() {
  if(nodeIdToDelete.value == "")
    return;

    orchestrator.deleteNode(nodeIdToDelete.value, () => {
      saveDeleteNodeCompleted.value = true;
      deleteNodeDialog.value = false;
      initialize();
    });
}

const headers = [
  { title: 'Name', value: 'name' },
  { title: 'Status', value: 'isOnline' },
  { title: 'Devices', value: 'devices' },
  { title: 'Actions', value: 'id' }
];

const deviceTemplateheaders = [
      { title: 'Id', value: 'id' },
      { title: 'Name', value: 'name' },
      { title: 'Class name', value: 'classFullName' }
];

const deviceStatusesHeaders = [
      { title: 'Name', value: 'name' },
      { title: 'State', value: 'state' },
      { title: 'Message', value: 'message' }
];

function initialize() {
  orchestrator.getNodes((data: SystemNode[] | null) => {
    
    if(data != null)
     nodes.value = data;
 });
}

function AddDevice() {

  console.dir(selectedDeviceTemplates.value)

  editorData.value.deviceConfigurations.push(...selectedDeviceTemplates.value);
  newDeviceDialog.value = false;
}

function nodeStatusColorOrIcon(node: SystemNode, icon: boolean = false) : string {
  if(node == null || node == undefined || node.deviceStatuses == null ||  node.deviceStatuses.length == 0)
    return icon ? "help":"yellow";

  for (var s of node.deviceStatuses) {
    var result = getColorOrIconForState(s.state, icon);
    if(result != "check_circle" && result != "green")
      return result;
  }
  return icon ? "check_circle":"green";
}

function getColorOrIconForState(state: DeviceState, icon: boolean = false) {
  if(state == DeviceState.error)
      return icon ? "error":"red";
  if(state == DeviceState.unknown || state == DeviceState.initialized)
      return icon ? "help":"yellow";
  if(state == DeviceState.stopped)
      return icon ? "cancel":"blue";
  
  return icon ? "check_circle":"green";
}

function showNodeDeviceStatuses(node: SystemNode) {
  if(node.deviceStatuses == null ||  node.deviceStatuses.length == 0)
    return;

  deviceStatuses.value = node.deviceStatuses;
  deviceStatusDialog.value = true;
}

function newDevice(id: string) {
  loadingDeviceTemplates.value = true;
  deviceTemplates.value = [];
  selectedDeviceTemplates.value = [];

  orchestrator.getDeviceTemplate(id, (data: DeviceConfiguration[] | null) => {
    if(data != null) {
      deviceTemplates.value = data;
    }
  }, 
  () => {
    let df = new DeviceConfiguration();
    df.name = "New device";
    df.classFullName = "RIoT2.Net.Devices.NEWDEVICE"
    df.commandTemplates = [];
    df.reportTemplates = [];
    df.deviceParameters = {};

    deviceTemplates.value.push(df);
    newDeviceDialog.value = true;
    loadingDeviceTemplates.value = false;
  });
}

onMounted(() => {
  initialize();
});

</script>

<template>
  <div>
    <ContextMenu :items="contextMenuItems" @click="contextMenuAction" />
    <div class="site-content-contextmenu">
    <v-data-table :hide-default-footer="nodes == null || nodes.length < 10" :items="nodes" :headers="headers" :loading="loading" class="elevation-1 mt-2">
      <template v-slot:top>
          <v-toolbar
            flat
            color="white"
          >
            <v-toolbar-title>System nodes</v-toolbar-title>
            <v-divider
              class="mx-4"
              inset
              vertical
            />

          </v-toolbar>
        </template>
        
      <template v-slot:header.isOnline>
        <div class="text-center">Node status</div>
      </template>
      <template v-slot:header.devices>
        <div class="text-center">Device status</div>
      </template>
      <template v-slot:header.id>
        <div class="text-end">Actions</div>
      </template>
    
      <template v-slot:item.name="{ item }">
        <div>{{item.name}}</div>
      </template>
      <template v-slot:item.isOnline="{ item }">
        <div class="text-center">
          <v-chip
            :color="item.isOnline ? 'green' : 'red'"
            :text="item.isOnline ? 'online' : 'offline'"
            class="text-uppercase"
            label
            size="small"
          ></v-chip>
        </div>
      </template>
      <template v-slot:item.devices="{ item }">
        <div class="text-center">
          <v-icon :color="nodeStatusColorOrIcon(item)" @click="showNodeDeviceStatuses(item)">{{nodeStatusColorOrIcon(item, true)}}</v-icon>
        </div>
      </template>
      <template v-slot:item.id="{ item }">
        <div class="text-end">
      <v-icon
        size="small"
        class="me-2"
        @click="configureNode(item.id, item.name)"
      >
        edit
      </v-icon>
      <v-icon
        size="small"
        @click="deleteNode(item.id)"
      >
        delete
      </v-icon>
    </div>
    </template>
    <template v-slot:no-data>
      <div>no nodes</div>
    </template>
    </v-data-table>

    <v-dialog v-model="editNodeDialog" scrollable width="90%">
      <v-card>
        <v-toolbar dark color="primary" dense flat>
        <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
          Configurator for {{ editorData.name }}
        </v-toolbar-title>
      </v-toolbar>
        <v-divider></v-divider>
        <v-card-text style="height: 90%;">
         <NodeEditorComponent v-model="editorData" :title="editorTitle" :enabled="true" />
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn
            rounded="0"
            color="error"
            variant="outlined"
            @click="editNodeDialog = false"
          >
          <v-icon size="small">cancel</v-icon>
            cancel
          </v-btn>
          <v-btn
            :loading="loadingDeviceTemplates"
            rounded="0"
            color="success"
            variant="outlined"
            @click="newDevice(editorData.id)"
            :disabled="editorData.id == null || editorData.id == ''"
          >
          <v-icon size="small">add</v-icon>
            new device
          </v-btn>
          <v-btn
            :disabled="editorData.id == null || editorData.id == ''"
            rounded="0"
            color="primary"
            variant="outlined"
            @click="saveConfiguration()"
          >
          <v-icon size="small">save</v-icon>
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteNodeDialog" max-width="400">
    <v-card>
      <v-toolbar dark color="primary" dense flat>
        <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
          Delete node?
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="pa-4 black--text">
        Are you sure you want to delete this node?
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
          @click="completeNodeDelete"
          >OK</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
<!--
  <v-dialog v-model="editDashboadDialog" max-width="1000" scrollable width="90%">
    <v-card>
      <v-toolbar dar color="primary" dense flat>
        <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
          Edit dashboard
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="pa-4 black--text">
        <DashboardEditorComponent v-model="dashboardForEdit" />
      </v-card-text>
      <v-card-actions class="pt-3">
        <v-spacer></v-spacer>
        <v-btn
            rounded="0"
            color="error"
            variant="outlined"
            @click="editDashboadDialog = false"
          >
          <v-icon size="small">cancel</v-icon>
            cancel
          </v-btn>
          <v-btn
            rounded="0"
            color="success"
            variant="outlined"
            @click="newPageToDashboard()"
          >
          <v-icon size="small">add</v-icon>
            new page
          </v-btn>
          <v-btn
            rounded="0"
            color="primary"
            variant="outlined"
            @click="saveDashboard()"
          >
          <v-icon size="small">save</v-icon>
            Save
          </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
-->

  <v-dialog v-model="newDeviceDialog" scrollable width="80%">
      <v-card>
        <v-toolbar dark color="primary" dense flat>
        <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
          Select device template 
        </v-toolbar-title>
      </v-toolbar>
        <v-divider></v-divider>
        <v-card-text style="height: 90%;">
          <v-data-table
            :headers="deviceTemplateheaders"
            v-model="selectedDeviceTemplates"
            :items="deviceTemplates"
            return-object
            show-select
          ></v-data-table>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn
            rounded="0"
            color="error"
            variant="outlined"
            @click="newDeviceDialog = false"
          >
          <v-icon size="small">cancel</v-icon>
            cancel
          </v-btn>
          <v-btn
            :disabled="selectedDeviceTemplates.length < 1"
            rounded="0"
            color="success"
            variant="outlined"
            @click="AddDevice()"
          >
          <v-icon size="small">add</v-icon>
            add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deviceStatusDialog" width="80%" scrollable>
        <v-card prepend-icon="checklist" title="Device Statuses">
          <v-divider class="mt-3"></v-divider>
          <v-card-text class="px-4" style="height: 300px;">
            <v-data-table hide-default-footer Density 
            :items="deviceStatuses" :headers="deviceStatusesHeaders" >
      
              <template v-slot:header.name>
                <div class="font-weight-bold">Name</div>
              </template>
              <template v-slot:header.state>
                <div class="text-center font-weight-bold">State</div>
              </template>
              <template v-slot:header.message>
                <div class="font-weight-bold">Message</div>
              </template>
            
              <template v-slot:item.name="{ item }">
                <div>{{item.name}}</div>
              </template>
              <template v-slot:item.state="{ item }">
                <div class="text-center">
                  <v-icon :color="getColorOrIconForState(item.state)">{{getColorOrIconForState(item.state, true)}}</v-icon>
                </div>
              </template>
              <template v-slot:item.message="{ item }">
                <div>{{item.message}}</div>
                </template>
            </v-data-table>
          </v-card-text>
          <v-divider />
          <v-card-actions>
            <v-btn text="Close" @click="deviceStatusDialog = false"></v-btn>
          </v-card-actions>
        </v-card>
    </v-dialog>

  <v-snackbar v-model="saveDeleteNodeCompleted" color="warning">
      Node deleted succesfully
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="saveDeleteNodeCompleted = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <v-snackbar v-model="saving" color="success">
      Node saved succesfully
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="saving = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
    </div>
  </div>
</template>
