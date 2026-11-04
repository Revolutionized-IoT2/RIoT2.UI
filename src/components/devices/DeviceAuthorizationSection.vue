<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import type DeviceConfiguration from '@/models/deviceConfiguration';
import type DeviceStatus from '@/models/deviceStatus';
import { useNodesStore } from '@/stores/nodesStore';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import { authorizationLook, deviceAuthorizationsKey, deviceStatusContextKey, useDeviceAuthorization, webLink,
  type DeviceAuthorizationMap } from '@/composables/deviceAuthorization';

/** A device's sign-in with its provider ("Connect to Netatmo"), for a device class whose template declares one. */
const props = defineProps<{
  device: DeviceConfiguration,
  state: DeviceStatus | null
}>();

const nodes = useNodesStore();
const orchestrator = useOrchestratorStore();
const authorizations = inject(deviceAuthorizationsKey, ref<DeviceAuthorizationMap>({}));
const statusContext = inject(deviceStatusContextKey, null);

const descriptor = computed(() => authorizations.value?.[props.device.classFullName] ?? null);
const provider = computed(() => descriptor.value?.provider ?? 'the provider');
const setupLink = computed(() => webLink(descriptor.value?.setupUrl));
// The node reports the device only once it runs the saved configuration.
const onNode = computed(() => props.state != null && statusContext?.nodeId.value != null);
const look = computed(() => authorizationLook(onNode.value, props.state?.authorization));

const { connecting, result, redirectUri, connect } = useDeviceAuthorization({
  nodeId: () => onNode.value ? statusContext?.nodeId.value ?? null : null,
  deviceId: () => props.device.id,
  provider: () => provider.value,
  apiBaseUrl: () => orchestrator.baseUrl,
  start: (nodeId, deviceId, request) => nodes.startDeviceAuthorization(nodeId, deviceId, request),
  refresh: () => statusContext?.refresh() ?? Promise.resolve(),
});

const copied = ref<boolean | null>(null);

async function copyRedirectUri() {
  try {
    await navigator.clipboard.writeText(redirectUri.value);
    copied.value = true;
  } catch {
    copied.value = false;
  }
}
</script>

<template>
  <div v-if="descriptor != null" class="mt-4">
    <p>Account</p>
    <v-divider class="border-opacity-100 mb-3" color="black" />
    <div class="d-flex flex-wrap align-center ga-2 mb-2">
      <v-chip :color="look.color" :prepend-icon="look.icon" size="small" label>{{ look.text }}</v-chip>
      <v-btn v-if="onNode" icon="mdi-refresh" size="x-small" variant="text" aria-label="Refresh the status"
        @click="statusContext?.refresh()" />
    </div>
    <p v-if="descriptor.instructions" class="text-body-small mb-2 authorization-instructions">{{ descriptor.instructions }}</p>
    <p v-if="setupLink" class="text-body-small mb-3">
      <a :href="setupLink" target="_blank" rel="noopener noreferrer">Open the {{ provider }} app settings</a>
      <v-icon icon="mdi-open-in-new" size="x-small" class="ml-1" />
    </p>
    <v-row>
      <v-col cols="12" md="8">
        <v-text-field :model-value="redirectUri" readonly density="compact" label="Redirect URI"
          :hint="copied === false ? 'Copy failed: select the address and copy it.' : `Register this exact address with ${provider}.`"
          persistent-hint>
          <template v-slot:append-inner>
            <v-btn :icon="copied ? 'mdi-check' : 'mdi-content-copy'" size="x-small" variant="text"
              aria-label="Copy the redirect URI" @click="copyRedirectUri" />
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="12" md="4" class="d-flex align-center">
        <v-btn color="primary" variant="outlined" size="small" prepend-icon="mdi-link-variant" :loading="connecting"
          :disabled="!onNode" @click="connect">
          Connect to {{ provider }}
        </v-btn>
      </v-col>
    </v-row>
    <p v-if="!onNode" class="text-body-small mt-1">Save the device and wait until the node runs it, then connect.</p>
    <v-alert v-if="result != null" :type="result.success ? 'success' : 'error'" density="compact" variant="tonal"
      class="mt-2" closable @click:close="result = null">{{ result.message }}</v-alert>
  </div>
</template>

<style scoped>
.authorization-instructions {
  white-space: pre-line;
}
</style>
