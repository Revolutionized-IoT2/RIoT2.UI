<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { RouterView } from 'vue-router'
import AppError from '@/models/appError';
import { createRealtimeTransport, type RealtimeTransport } from '@/composables/realtime';
import { loadSecurityState } from '@/composables/securityInfo';
import { useSecurityApi } from '@/composables/api/securityApi';
import { orchestratorCameOnline, presenceMessage } from '@/composables/presence';
import { setMqttConnected } from '@/composables/connectionState';
import ConnectionBanner from '@/components/ConnectionBanner.vue';
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
// Chosen from /api/security/info when the page loads (design 7.5); MQTT unless it says otherwise.
let realtime: RealtimeTransport | undefined;

const configureDashboardTopic = Constants.topicConfigure.replace("{id}", id);
const dashboardOnlineTopic = Constants.topicOnline.replace("{id}", id);
const productName = globalThis.navigator?.product ?? "Dashboard";

// The orchestrator answers with the configuration command, which carries its API URL.
function announce() {
  realtime?.sendMessage(dashboardOnlineTopic, presenceMessage(productName));
}

let unmounted = false;

onMounted(async () => {
  // Through the UI image's /api proxy when there is one; otherwise the mode is off, as before.
  const security = await loadSecurityState(() => useSecurityApi().getInfo());
  if (unmounted)
    return;
  orchestratorStore.sameOrigin = security.sameOrigin;
  realtime = createRealtimeTransport(security.info.realtime, id);
  // The connection banner and the System page show the realtime connection (I46).
  if (realtime.status)
    watch(realtime.status, connected => setMqttConnected(connected), { immediate: true });
  realtime.connect(mqttMessageReceived, announce);
  realtime.subscribe(Constants.topicReport);
  realtime.subscribe(configureDashboardTopic);
  realtime.subscribe(Constants.topicOrchestratorOnline);
});

onUnmounted(() => {
  unmounted = true;
  realtime?.disConnect();
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
      // With the proxy the API is on this origin; the command still says the orchestrator is ready.
      orchestratorStore.baseUrl = orchestratorStore.sameOrigin ? "" : configurationCmd.apiBaseUrl;
      orchestratorStore.configured = true;
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
    <ConnectionBanner v-if="orchestratorStore.isInitialized"/>
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
