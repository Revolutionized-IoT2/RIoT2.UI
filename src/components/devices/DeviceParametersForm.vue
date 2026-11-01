<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { DeviceState } from '@/models/enums';
import { nameValueStr } from '@/models/nameValueStr';
import DeviceConfiguration from '@/models/deviceConfiguration';
import type DeviceStatus from '@/models/deviceStatus';
import type { CronValidationResult } from '@/models/cronValidationResult';
import { useNodesStore } from '@/stores/nodesStore';

const model = defineModel<DeviceConfiguration>({ default: new DeviceConfiguration() });

defineProps<{
  state: DeviceStatus | null
}>();

const emit = defineEmits<{
  reload: [deviceId: string]
}>();

const nodes = useNodesStore();

const newParameterDialog = ref(false);
const newParameter = ref<nameValueStr>(new nameValueStr("", ""));

const validatingCron = ref(false);
const cronValidationResult = ref<CronValidationResult | null>(null);

/** Validates the refresh schedule when the field loses focus. */
async function validateCron(focused: boolean) {
  if (focused)
    return;

  const expression = model.value.refreshSchedule;
  if (expression == undefined || expression == "") {
    cronValidationResult.value = null;
    return;
  }

  if (expression.length < 6) {
    cronValidationResult.value = { expression, isValid: false, summary: "expression too short" };
    return;
  }

  validatingCron.value = true;
  cronValidationResult.value = await nodes.validateCron(expression);
  validatingCron.value = false;
}

function cronTooltipText() {
  return cronValidationResult.value?.summary?.replace(/\r?\n/g, '\n') ?? "";
}

function removeParameter(name: string) {
  if(model.value.deviceParameters != null)
    delete model.value.deviceParameters[name];
}

function addParameter() {
  newParameter.value = new nameValueStr("", "");
  newParameterDialog.value = true;
}

function saveParameter() {
  (model.value.deviceParameters ??= {})[newParameter.value.name] = newParameter.value.value;
  newParameterDialog.value = false;
}

onMounted(() => {
  validateCron(false);
});
</script>

<template>
  <p class="mt-4">Device parameters</p>
  <v-divider class="border-opacity-100 mb-3" color="black" />
  <v-row>
    <v-col cols="6">
      <v-text-field v-model="model.name" required hide-details label="Device Name" />
    </v-col>
    <v-col cols="6">
      <v-text-field v-model="model.id" required hide-details label="Device Id" />
    </v-col>
    <v-col cols="6">
      <v-text-field v-model="model.classFullName" required hide-details label="Device Class Fullname" />
    </v-col>
    <v-col cols="6">
      <v-text-field v-model="model.refreshSchedule" variant="solo" density="compact" hint="cron: '0 0 * ? * * *' or leave empty if refresh is done automatically."
          label="Device Refresh Schedule" @update:focused="validateCron">
          <template v-slot:append-inner>
            <v-tooltip v-if="cronValidationResult != null" location="bottom" activator="parent">
              <template v-slot:activator>
                <v-icon :color="(cronValidationResult.isValid ? 'primary' : 'error')" :icon="(cronValidationResult.isValid ? 'check' : 'error')" />
              </template>
              <span class="cron-tooltip">{{ cronTooltipText() }}</span>
            </v-tooltip>
          </template>
          <template v-slot:loader>
            <v-progress-linear :active="validatingCron" color="secondary" height="5" indeterminate />
          </template>
      </v-text-field>
    </v-col>
  </v-row>
  <div v-if="model.deviceParameters != null">
    <p>Additional parameters</p>
    <v-divider class="border-opacity-100 mb-3" color="black" />
    <v-row>
      <v-col cols="4" v-for="p in Object.keys(model.deviceParameters)" :key="p">
        <v-text-field v-model="model.deviceParameters[p]" hide-details append-inner-icon="delete"
          @click:append-inner="removeParameter(p)" :label="p" />
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-btn size="small" class="mt-6 mb-6" rounded="0" color="blue-darken-1" variant="outlined" @click="addParameter">
          <v-icon>add</v-icon>
          new parameter
        </v-btn>
      </v-col>
      <v-col class="text-right">
        <v-tooltip text="Device not running. Set the device parameters and save." v-if="state?.state != DeviceState.running" location="left" open-on-click :open-on-hover="false">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" size="small" class="mt-6 mb-6 disabled" rounded="0" color="error" variant="outlined">
              <v-icon>cached</v-icon>
              load templates
            </v-btn>
          </template>
        </v-tooltip>
        <v-btn v-else size="small" class="mt-6 mb-6" rounded="0" color="error" variant="outlined" @click="emit('reload', model.id)">
          <v-icon>cached</v-icon>
          load templates
        </v-btn>
      </v-col>
    </v-row>
  </div>

  <v-dialog v-model="newParameterDialog" persistent width="400">
    <v-card>
      <v-toolbar title="New Property"></v-toolbar>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="newParameter.name" label="Name" required />
            </v-col>
            <v-col cols="12">
              <v-text-field v-model="newParameter.value" label="Value" required />
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="blue-darken-1" variant="text" @click="newParameterDialog = false">cancel</v-btn>
        <v-btn color="blue-darken-1" variant="text" @click="saveParameter">save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.cron-tooltip {
  white-space: pre-line;
}
</style>
