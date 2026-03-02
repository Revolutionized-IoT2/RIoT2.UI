<template>
  <v-navigation-drawer v-model="drawer" class="fixedAppBar">
    <v-list density="compact" nav>
      <v-list-item prepend-icon="home" title="Home" to="/"></v-list-item>
      <v-list-item prepend-icon="settings" title="Configure" to="/nodes"></v-list-item>
      <v-list-item prepend-icon="fact_check" title="Rules" :href="rulesLink" :disabled="rulesLink == undefined" target="_blank"
                  :subtitle="(rulesLinkSubtitle != undefined)?rulesLinkSubtitle:''"></v-list-item>
      <v-list-item prepend-icon="functions" title="Varibles" to="/variables"></v-list-item>
      <v-list-item prepend-icon="dashboard" title="Dashboard" to="/dash"></v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-app-bar class="fixedAppBar">
    <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

    <v-app-bar-title>RIoT2</v-app-bar-title>
    <v-spacer />
    <p class="mr-8 ">@admin</p>
  </v-app-bar>
</template>

<script lang="ts" setup>
import { useOrchestrator } from '@/composables/orchestratorService';
import { NodeType } from '@/models/enums';
import type SystemNode from '@/models/systemNode';
import { onMounted, ref } from 'vue';

  const drawer = ref(false);
  const orchestrator = useOrchestrator();
  const rulesLink = ref<string | undefined>(undefined);
  const rulesLinkSubtitle = ref<string | undefined>(undefined);

onMounted(() => {
   orchestrator.getOnlineNodes((data: SystemNode[] | null) => {
    let workflowNode = data?.find(x=> x.nodeType == NodeType.workflow);
    if(workflowNode != undefined) {
      rulesLink.value = workflowNode.nodeBaseUrl;
      rulesLinkSubtitle.value = workflowNode.name;
    } else {
      rulesLink.value = undefined;
      rulesLinkSubtitle.value = "offline";
    }
   });
});
</script>
<style scoped>
.fixedAppBar {
    position: fixed !important;
    left: 0;
    width: 100%;
    margin-top: 0px;
    z-index: 100;
}
</style>

