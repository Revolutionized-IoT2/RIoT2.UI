<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { RouterView } from 'vue-router'
import AppError from '@/models/appError';
import { useMqtt } from '@/composables/mqttService';
import { orchestratorCameOnline, presenceMessage } from '@/composables/presence';
import { v4 as uuidv4 } from 'uuid';
import { Constants } from './models/constants';
import type ConfigurationCommand from './models/configurationCommand';
import { Report } from '@/models/report';
import { useOrchestratorStore } from './stores/orchestratorStore';
import { useErrorStore } from './stores/errorStore';
import { useTemplatesStore } from './stores/templatesStore';
import { useDashboardStore } from './stores/dashboardStore';
import { useVariablesStore } from './stores/variablesStore';

const errorHandler = useErrorStore();
const orchestratorStore = useOrchestratorStore();
const templates = useTemplatesStore();
const dashboard = useDashboardStore();
const variables = useVariablesStore();

const id = uuidv4(); // A new id for every page load: each open UI is its own dashboard node.
const mqttService = useMqtt(id);

const configureDashboardTopic = Constants.topicConfigure.replace("{id}", id);
const dashboardOnlineTopic = Constants.topicOnline.replace("{id}", id);
const productName = globalThis.navigator?.product ?? "Dashboard";

// The orchestrator answers with the configuration command, which carries its API URL.
function announce() {
  mqttService.sendMessage(dashboardOnlineTopic, presenceMessage(productName));
}

onMounted(() => {
  mqttService.connect(mqttMessageReceived, announce);
  mqttService.subscribe(Constants.topicReport);
  mqttService.subscribe(configureDashboardTopic);
  mqttService.subscribe(Constants.topicOrchestratorOnline);
});

onUnmounted(() => {
  mqttService.disConnect();
});

// Older nodes and orchestrators send PascalCase; the UI's models are camelCase.
function toCamelCase(key: string, value: unknown) {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const k of Object.keys(record)) {
      if (/^[A-Z]/.test(k)) {
        record[k.charAt(0).toLowerCase() + k.substring(1)] = record[k];
        delete record[k];
      }
    }
  }
  return value;
}

function mqttMessageReceived(topic: string, message: string, retained = false) {
  try {
    if (topic == configureDashboardTopic) {
      const configurationCmd: ConfigurationCommand = JSON.parse(message, toCamelCase);
      orchestratorStore.baseUrl = configurationCmd.apiBaseUrl;
      templates.load();
    } else if (topic == Constants.topicOrchestratorOnline) {
      if (orchestratorCameOnline(message, retained))
        announce();
    } else {
      const report = new Report(JSON.parse(message, toCamelCase));
      dashboard.applyReport(report);
      variables.applyReport(report);
    }
  } catch {
    errorHandler.setError(new AppError("Could not parse incoming MQTT message", "", "", message));
  }
}

</script>

<template>
  <v-app>
    <RouterView v-if="orchestratorStore.isInitialized"/>
    <v-container v-else>
      <v-row class="fill-height" align-content="center" justify="center">
        <v-col class="text-subtitle-1 text-center" cols="12">
          Connecting...
        </v-col>
        <v-col cols="6">
          <v-progress-linear
            color="deep-purple-accent-4"
            indeterminate
            rounded
            height="6"
          ></v-progress-linear>
        </v-col>
      </v-row>
    </v-container>
    <v-snackbar v-model="errorHandler.showSnackbar" color="error">
      {{errorHandler.error?.text}}<template v-if="errorHandler.error?.message">: {{errorHandler.error.message}}</template>
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="errorHandler.showSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>
