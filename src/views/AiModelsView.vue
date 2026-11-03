<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useLlmStore } from '@/stores/llmStore';
import type { LlmConnection, LlmConnectionSave, LlmRunResult } from '@/models/workflow';
import LlmConnectionDialog from '@/components/ai/LlmConnectionDialog.vue';
import LlmUsagePanel from '@/components/ai/LlmUsagePanel.vue';

// The language model connections the Run LLM workflow step uses (ADR 0016), their test, and their usage. The keys stay
// in the orchestrator, which talks to the models in both workflow modes.
const store = useLlmStore();
const editing = ref<LlmConnection | null>(null);
const dialog = ref(false);
const saving = ref(false);
const testing = ref<string | null>(null);
const results = ref<Record<string, LlmRunResult>>({});
const deleting = ref<LlmConnection | null>(null);

onMounted(() => store.load());

function edit(connection: LlmConnection | null) {
  editing.value = connection;
  dialog.value = true;
}

async function save(connection: LlmConnectionSave) {
  saving.value = true;
  const saved = await store.save(editing.value?.id ?? null, connection);
  saving.value = false;
  if (saved)
    dialog.value = false;
}

async function test(connection: LlmConnection) {
  testing.value = connection.id;
  const result = await store.test(connection.id);
  testing.value = null;
  if (result)
    results.value = { ...results.value, [connection.id]: result };
}

async function confirmDelete() {
  if (deleting.value)
    await store.remove(deleting.value.id);
  deleting.value = null;
}

const providerNames: Record<string, string> = { OpenAI: 'OpenAI', AzureOpenAI: 'Azure OpenAI', Anthropic: 'Anthropic', OpenAICompatible: 'OpenAI-compatible' };
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <div class="d-flex flex-wrap align-center ga-3">
      <div>
        <div class="text-headline-small font-weight-medium">AI models</div>
        <div class="text-body-medium text-medium-emphasis">Connections the Run LLM workflow step uses; their keys never leave the orchestrator.</div>
      </div>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="edit(null)">Add connection</v-btn>
    </div>

    <v-row>
      <v-col v-for="connection in store.connections" :key="connection.id" cols="12" md="6" xl="4">
        <v-card color="surface-container-low" variant="flat" class="h-100">
          <v-card-item>
            <template #prepend><v-avatar color="tertiary-container" rounded="lg"><v-icon icon="mdi-robot-outline" color="on-tertiary-container" /></v-avatar></template>
            <v-card-title>{{ connection.name }}</v-card-title>
            <v-card-subtitle>{{ providerNames[connection.provider] }} · {{ connection.model }}</v-card-subtitle>
            <template #append>
              <v-chip v-if="!connection.enabled" size="small" variant="tonal">Disabled</v-chip>
              <v-chip v-else-if="!connection.hasApiKey && connection.provider !== 'OpenAICompatible'" size="small" color="warning" variant="tonal">No key</v-chip>
            </template>
          </v-card-item>
          <v-card-text>
            <div v-if="connection.description" class="mb-2">{{ connection.description }}</div>
            <div class="text-body-small text-medium-emphasis">{{ connection.endpoint ?? 'Default endpoint' }}</div>
            <v-alert v-if="results[connection.id]" :type="results[connection.id]!.succeeded ? 'success' : 'error'" density="compact" class="mt-3"
                     :text="results[connection.id]!.succeeded ? `Answered “${results[connection.id]!.text ?? ''}” using ${results[connection.id]!.usage.totalTokens} tokens.` : results[connection.id]!.error ?? 'Failed.'" />
          </v-card-text>
          <v-card-actions>
            <v-btn prepend-icon="mdi-connection" :loading="testing === connection.id" @click="test(connection)">Test</v-btn>
            <v-spacer />
            <v-btn icon="mdi-pencil-outline" variant="text" aria-label="Change" @click="edit(connection)" />
            <v-btn icon="mdi-delete-outline" variant="text" color="error" aria-label="Delete" @click="deleting = connection" />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-card v-if="!store.connections.length && !store.loading" color="surface-container-low" variant="flat" class="pa-6 text-center text-body-medium text-medium-emphasis">
      No connections yet. Add one for OpenAI, Azure OpenAI, Anthropic or a local OpenAI-compatible server such as Ollama.
    </v-card>

    <LlmUsagePanel />

    <LlmConnectionDialog v-model="dialog" :connection="editing" :saving="saving" @save="save" />
    <v-dialog :model-value="deleting !== null" max-width="440" @update:model-value="!$event && (deleting = null)">
      <v-card :title="`Delete ${deleting?.name}?`" text="Run LLM steps that name it fail until a connection of that name exists again.">
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleting = null">Cancel</v-btn>
          <v-btn color="error" @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
