<script setup lang="ts">

import { useMatterApi } from '@/composables/api/matterApi';
import MatterConfiguration from '@/models/matter/matterConfiguration';
import MatterStatus from '@/models/matter/matterStatus';
import { computed, onMounted, ref } from 'vue';

const matterApi = useMatterApi();

const status = ref<MatterStatus>(new MatterStatus());
const configuration = ref<MatterConfiguration>(new MatterConfiguration());
const loading = ref(false);
const saving = ref(false);
const resetDialog = ref(false);

// Busts the browser cache on the QR image: the payload changes on reset and on reconfiguration,
// but the URL does not.
const qrToken = ref(0);

const headers: any[] = [
  { title: 'Endpoint', key: 'endpointId', align: 'left', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Matter device type', key: 'deviceType', sortable: true },
  { title: 'Node', key: 'nodeId', sortable: true },
  { title: 'Device', key: 'deviceId', sortable: false },
  { title: 'Reachable', key: 'reachable', sortable: false },
];

const isPairingOpen = computed(() => status.value.commissioningWindow == 'BasicWindowOpen' || status.value.commissioningWindow == 'EnhancedWindowOpen');

const qrCodeUrl = computed(() => matterApi.getQrCodeUrl(qrToken.value));

function toHex(value: number, digits: number): string {
  return '0x' + value.toString(16).toUpperCase().padStart(digits, '0');
}

function applyStatus(data: MatterStatus | null) {
  if (data != null) {
    status.value = data;
    qrToken.value++;
  }
}

function loadStatus() {
  loading.value = true;
  matterApi.getStatus(applyStatus, () => {
    loading.value = false;
  });
}

function loadConfiguration() {
  matterApi.getConfiguration((data: MatterConfiguration | null) => {
    if (data != null)
      configuration.value = data;
  });
}

function saveConfiguration() {
  saving.value = true;
  matterApi.saveConfiguration(configuration.value, applyStatus, () => {
    saving.value = false;
  });
}

function openCommissioning() {
  loading.value = true;
  matterApi.openCommissioning(applyStatus, () => {
    loading.value = false;
  });
}

function refreshDevices() {
  loading.value = true;
  matterApi.refreshDevices(applyStatus, () => {
    loading.value = false;
  });
}

function resetBridge() {
  resetDialog.value = false;
  loading.value = true;
  matterApi.reset(applyStatus, () => {
    loading.value = false;
    // The passcode is regenerated, so the saved configuration is re-read alongside the new codes.
    loadConfiguration();
  });
}

onMounted(() => {
  loadConfiguration();
  loadStatus();
});
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="6">

        <!-- Bridge identity -->
        <v-card class="elevation-1">
          <v-card-title>
            <span class="headline">Matter Control Bridge</span>
          </v-card-title>
          <v-card-subtitle>
            The identity this bridge presents to a Matter commissioner such as Google Home.
          </v-card-subtitle>
          <v-card-text>
            <v-alert v-if="status.error" type="error" class="mb-4" density="compact">
              {{ status.error }}
            </v-alert>

            <v-switch
              v-model="configuration.enabled"
              color="primary"
              label="Bridge enabled"
              hide-details
            />
            <v-text-field
              label="Bridge name"
              v-model="configuration.nodeLabel"
              hint="The name a commissioner shows for the bridge itself"
            />
            <v-text-field
              label="Vendor id"
              v-model.number="configuration.vendorId"
              type="number"
              :hint="toHex(configuration.vendorId, 4) + ' - must be registered in the Google Home Developer Console'"
              persistent-hint
            />
            <v-text-field
              label="Product id"
              v-model.number="configuration.productId"
              type="number"
              :hint="toHex(configuration.productId, 4)"
              persistent-hint
            />
            <v-text-field
              label="Discriminator"
              v-model.number="configuration.discriminator"
              type="number"
              :hint="toHex(configuration.discriminator, 3) + ' - 12 bit, advertised over DNS-SD'"
              persistent-hint
            />
            <v-text-field
              label="Attestation path"
              v-model="configuration.attestationPath"
              hint="Leave empty to generate TEST credentials for the configured vendor/product id"
              persistent-hint
            />
          </v-card-text>
          <v-card-actions>
            <v-chip :color="status.running ? 'green' : 'grey'" size="small" class="ml-2">
              {{ status.running ? 'Running' : 'Stopped' }}
            </v-chip>
            <v-spacer />
            <v-btn color="blue" variant="text" :loading="saving" @click="saveConfiguration">Save</v-btn>
            <v-btn color="red" variant="text" @click="resetDialog = true">Reset</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">

        <!-- Onboarding -->
        <v-card class="elevation-1">
          <v-card-title>
            <span class="headline">Add to Google Home</span>
          </v-card-title>
          <v-card-subtitle>
            In the Google Home app choose Add device, then Matter device, and scan this code.
          </v-card-subtitle>
          <v-card-text>
            <div v-if="status.qrCode" class="text-center">
              <img :src="qrCodeUrl" alt="Matter onboarding QR code" class="qrCode" />
              <div class="text-h6 mt-2">{{ status.formattedManualCode }}</div>
              <div class="text-caption">Manual pairing code</div>
              <v-chip :color="isPairingOpen ? 'green' : 'grey'" size="small" class="mt-3">
                {{ isPairingOpen ? 'Pairing window open' : 'Pairing window closed' }}
              </v-chip>
            </div>
            <v-alert v-else :value="true" color="white" icon="info">
              <b>The bridge is not running, so it has no onboarding code.</b>
            </v-alert>

            <v-divider class="my-4" />

            <div class="text-subtitle-2">Commissioned fabrics</div>
            <v-list v-if="status.fabrics.length > 0" density="compact">
              <v-list-item
                v-for="fabric in status.fabrics"
                :key="fabric.fabricIndex"
                :title="fabric.label != '' ? fabric.label : 'Fabric ' + fabric.fabricIndex"
                :subtitle="'Vendor ' + toHex(fabric.vendorId, 4) + ' - node ' + fabric.nodeId"
              />
            </v-list>
            <div v-else class="text-caption">The bridge has not been commissioned yet.</div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue" variant="text" :disabled="!status.running" :loading="loading" @click="openCommissioning">
              Re-open pairing
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Bridged endpoints -->
    <v-row>
      <v-col cols="12">
        <v-data-table
          :hide-default-footer="status.endpoints.length < 10"
          item-value="templateId"
          :headers="headers"
          :items="status.endpoints"
          :loading="loading"
          :sort-by="[{ key: 'endpointId' }]"
          dense
          class="elevation-1"
        >
          <template v-slot:top>
            <v-toolbar flat color="white">
              <v-toolbar-title>Exposed devices</v-toolbar-title>
              <v-divider class="mx-4" inset vertical />
              <v-spacer />
              <v-btn variant="text" prepend-icon="refresh" :disabled="!status.running" @click="refreshDevices">
                Refresh
              </v-btn>
            </v-toolbar>
          </template>
          <template v-slot:[`item.reachable`]="{ item }">
            <v-icon size="small" :color="item.reachable ? 'green' : 'grey'">
              {{ item.reachable ? 'check_circle' : 'cancel' }}
            </v-icon>
          </template>
          <template v-slot:no-data>
            <v-alert class="mt-3" :value="true" color="white" icon="info">
              <b>No devices are exposed as Matter endpoints.</b>
              A device is exposed when its node plugin implements IMatterDevice and its configuration
              has been imported in the Configure view.
            </v-alert>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>

  <!-- reset confirmation -->
  <v-dialog v-model="resetDialog" persistent max-width="600px">
    <v-card>
      <v-card-title>
        <span class="headline">Reset the Matter bridge</span>
      </v-card-title>
      <v-card-text>
        Every commissioned fabric is dropped and a new pairing code is generated. The bridge has to be
        added to Google Home again, and the devices it exposes are removed from every home it was in.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="red" variant="text" @click="resetBridge">Reset</v-btn>
        <v-btn color="blue darken-1" variant="text" @click="resetDialog = false">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.qrCode {
  width: 260px;
  height: 260px;
  image-rendering: pixelated;
}
</style>
