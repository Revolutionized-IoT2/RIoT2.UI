<script setup lang="ts">
import mitt from 'mitt';
import { provide, ref, type Ref, onMounted, onUnmounted } from 'vue';
import { RouterView } from 'vue-router'
import { InjectionKeys } from '@/models/injectionKeys';
import AppError from '@/models/appError';
import { useMqtt } from '@/composables/mqttService';
import { v4 as uuidv4 } from 'uuid';
import { Constants } from './models/constants';
import type ConfigurationCommand from './models/configurationCommand';
import type Command from './models/command';
import { Report } from '@/models/report';
import { useOrchestrator } from './composables/orchestratorService';
import { useOrchestratorStore } from './stores/orchestratorStore';
import { useErrorStore } from './stores/errorStore';
import { ReportTemplate } from './models/rules/reportTemplate';
import FunctionTemplate from './models/rules/functionTemplate';
import CommandTemplate from './models/commandTemplate';
import VariableTemplate from './models/variableTemplate';
import { OutputOperation } from './models/enums';

const emitter = mitt();

const errorHandler = useErrorStore();

const reportTemplates = ref<ReportTemplate[]>([]);
const functionTemplates = ref<FunctionTemplate[]>([]);
const commandTemplates = ref<CommandTemplate[]>([]);
const variableTemplates = ref<VariableTemplate[]>([]);
//provide(InjectionKeys.errorHandler, setError);
provide(InjectionKeys.emitter, emitter);

provide(InjectionKeys.reportTemplates, reportTemplates);
provide(InjectionKeys.functionTemplates, functionTemplates);
provide(InjectionKeys.commandTemplates, commandTemplates);
provide(InjectionKeys.variableTemplates, variableTemplates);
provide(InjectionKeys.templateDataUpdated, loadTemplates); // Call this if templates need to be reloaded

//const error: Ref<AppError | null> = ref(null);
//const showSnackbar: Ref<boolean> = ref(false);
//const configured: Ref<boolean> = ref(false);

const id = uuidv4(); //create new id everytime dashboard is created
const mqttService = useMqtt(id);
const orchestrator = useOrchestrator();
const orchestratorStore = useOrchestratorStore();

const configureDashboardTopic = Constants.topicConfigure.replace("{id}", id);
const dashboardOnlineTopic = Constants.topicOnline.replace("{id}", id);
/*
function setError(err: AppError): void {
  //console.dir(err);
  error.value = err; 
  showSnackbar.value = true;
}*/

function loadTemplates() {
  orchestrator.getReportTemplates((data: ReportTemplate [] | null) => {
    if(data != null)
      reportTemplates.value = data;
  });

  orchestrator.getCommandTemplates((data: CommandTemplate [] | null) => {
    if(data != null)
      commandTemplates.value = data;
  });

  orchestrator.getFunctionTemplates((data: FunctionTemplate [] | null) => {
    if(data != null)
      functionTemplates.value = data;
  });

  orchestrator.getVariableTemplates((data: VariableTemplate [] | null) => {
    if(data != null)
    variableTemplates.value = data;
  });
}

onMounted(() => {
    mqttService.connect(mqttMessageReceived);
    mqttService.subscribe(Constants.topicReport);
    mqttService.subscribe(configureDashboardTopic);
    console.log(`the component is now mounted.`);

    mqttService.sendMessage(dashboardOnlineTopic, '{ "IsOnline": true, "Name": "Dashboard" }'); //TODO check required content -> this will indicate that dashboard is online!
    //orchestratorService.loadDashboard("for debugging");
    //console.log(dashboardConfiguration.value);
});

onUnmounted(() => {
    mqttService.disConnect();
});

function toCamelCase(key: string, value: any) {
  if (value && typeof value === 'object'){
    for (var k in value) {
      if (/^[A-Z]/.test(k) && Object.hasOwnProperty.call(value, k)) {
        value[k.charAt(0).toLowerCase() + k.substring(1)] = value[k];
        delete value[k];
      }
    }
  } 
  return value;
}

function mqttMessageReceived(topic: string, message: string) {
    //var decoded = new TextDecoder("utf-8").decode(message);
    if(topic == configureDashboardTopic) {
      let configurationCmd: ConfigurationCommand = JSON.parse(message, toCamelCase);
      orchestratorStore.baseUrl = configurationCmd.apiBaseUrl;
      loadTemplates();
    } else { 
        try {
          emitter.emit("mqttReportReceived", new Report(JSON.parse(message, toCamelCase)));
      } catch(e) {
        if(errorHandler.setError != undefined)
          errorHandler.setError(new AppError("Could not parse incoming report", "", "", message));
      }
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
      {{errorHandler.error?.text}}
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