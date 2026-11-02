<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import ContextMenu from '@/components/ContextMenuComponent.vue';
import NodeList from '@/components/nodes/NodeList.vue';
import ConnectorList from '@/components/nodes/ConnectorList.vue';
import NodeEditorDialog from '@/components/nodes/NodeEditorDialog.vue';
import OutboxDialog from '@/components/nodes/OutboxDialog.vue';
import NodeConfiguration from '@/models/nodeConfiguration';
import type { ContextMenuItem } from '@/models/contextMenuItem';
import { useNodesStore } from '@/stores/nodesStore';

const contextMenuItems: ContextMenuItem[] = [
  { "text": "edit dashboard", "action": "edit_dashboard", "disabled": false, "icon": "dashboard" },
  { "text": "new node", "action": "new_node", "disabled": false, "icon": "add" },
  { "text": "delivery queue", "action": "outbox", "disabled": false, "icon": "outbox" }
];

// How often the nodes' configuration sync is refreshed while this page is open (design 7.2 phase 6).
const syncPollMilliseconds = 3000;
// How often the connectors and their health are refreshed; each refresh asks every connector (design 7.3 phase 3).
const connectorPollMilliseconds = 10000;

const store = useNodesStore();
const { nodes, onlineNodes, connectors, loading } = storeToRefs(store);
const router = useRouter();

const editorOpen = ref(false);
const editorData = ref<NodeConfiguration>(new NodeConfiguration());
const saving = ref(false);
const saved = ref(false);

const reapplied = ref(false);
const outboxOpen = ref(false);
let syncTimer: ReturnType<typeof setInterval> | undefined;
let connectorTimer: ReturnType<typeof setInterval> | undefined;

const deleteDialog = ref(false);
const nodeIdToDelete = ref("");
const deleted = ref(false);

function contextMenuAction(action: string) {
  if (action == 'new_node') {
    const node = new NodeConfiguration();
    node.name = "New Node";
    editorData.value = node;
    editorOpen.value = true;
  }

  if (action == 'edit_dashboard')
    router.push("dashboard/edit");

  if (action == 'outbox')
    outboxOpen.value = true;
}

async function reapply(id: string) {
  if (await store.reapply(id))
    reapplied.value = true;
}

async function configureNode(id: string) {
  const configuration = await store.getConfiguration(id);
  if (configuration == null)
    return;
  editorData.value = configuration;
  editorOpen.value = true;
}

// The editor stays open when the save fails, so nothing typed is lost.
async function saveConfiguration() {
  saving.value = true;
  if (await store.saveConfiguration(editorData.value)) {
    editorOpen.value = false;
    saved.value = true;
  }
  saving.value = false;
}

function askDelete(id: string) {
  nodeIdToDelete.value = id;
  deleteDialog.value = true;
}

function cancelDelete() {
  nodeIdToDelete.value = "";
  deleteDialog.value = false;
}

async function completeDelete() {
  if (nodeIdToDelete.value == "")
    return;
  if (await store.deleteNode(nodeIdToDelete.value)) {
    deleted.value = true;
    cancelDelete();
  }
}

onMounted(() => {
  store.load();
  store.loadConnectors();
  syncTimer = setInterval(() => store.refreshSync(), syncPollMilliseconds);
  connectorTimer = setInterval(() => store.loadConnectors(), connectorPollMilliseconds);
});

onBeforeUnmount(() => {
  clearInterval(syncTimer);
  clearInterval(connectorTimer);
});
</script>

<template>
  <div>
    <ContextMenu :items="contextMenuItems" @click="contextMenuAction" />
    <div class="site-content-contextmenu">
      <NodeList :nodes="nodes" :loading="loading" @edit="configureNode" @delete="askDelete" @reapply="reapply" />

      <ConnectorList :connectors="connectors" />

      <OutboxDialog v-model:open="outboxOpen" />

      <NodeEditorDialog v-model:open="editorOpen" v-model:configuration="editorData" :onlineNodes="onlineNodes" :saving="saving" @save="saveConfiguration" />

      <v-dialog v-model="deleteDialog" max-width="400">
        <v-card>
          <v-toolbar color="primary" density="compact" flat>
            <v-toolbar-title class="text-body-2 font-weight-bold">
              Delete node?
            </v-toolbar-title>
          </v-toolbar>
          <v-card-text class="pa-4">
            Are you sure you want to delete this node?
          </v-card-text>
          <v-card-actions class="pt-3">
            <v-spacer></v-spacer>
            <v-btn color="grey" class="body-2 font-weight-bold" @click="cancelDelete">Cancel</v-btn>
            <v-btn color="primary" class="body-2 font-weight-bold" :loading="loading" @click="completeDelete">OK</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-snackbar v-model="deleted" color="warning">
        Node deleted successfully
        <template v-slot:actions>
          <v-btn color="white" variant="text" @click="deleted = false">Close</v-btn>
        </template>
      </v-snackbar>

      <v-snackbar v-model="reapplied" color="success">
        Configuration sent to the node
        <template v-slot:actions>
          <v-btn color="white" variant="text" @click="reapplied = false">Close</v-btn>
        </template>
      </v-snackbar>

      <v-snackbar v-model="saved" color="success">
        Node saved successfully
        <template v-slot:actions>
          <v-btn color="white" variant="text" @click="saved = false">Close</v-btn>
        </template>
      </v-snackbar>
    </div>
  </div>
</template>
