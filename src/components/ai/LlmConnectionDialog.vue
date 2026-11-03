<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { LlmProviders, type LlmConnection, type LlmConnectionSave, type LlmProvider } from '@/models/workflow';

// Adds or changes a language model connection. The API key is never shown: empty keeps the stored one.
const props = defineProps<{ connection: LlmConnection | null; saving: boolean }>();
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ save: [connection: LlmConnectionSave] }>();

const providerItems = [
  { value: 'OpenAI', title: 'OpenAI', subtitle: 'api.openai.com' },
  { value: 'AzureOpenAI', title: 'Azure OpenAI', subtitle: 'A deployment of an Azure OpenAI resource' },
  { value: 'Anthropic', title: 'Anthropic', subtitle: 'api.anthropic.com' },
  { value: 'OpenAICompatible', title: 'OpenAI-compatible', subtitle: 'Ollama, LM Studio, vLLM…' }
];
const form = ref<LlmConnectionSave>(blank());
const removeKey = ref(false);

function blank(): LlmConnectionSave {
  return { name: '', description: null, provider: LlmProviders[0], endpoint: null, model: '', apiVersion: null, apiKey: null, temperature: null, maxOutputTokens: null, enabled: true };
}

watch(open, isOpen => {
  if (!isOpen)
    return;
  const c = props.connection;
  form.value = c ? { name: c.name, description: c.description, provider: c.provider, endpoint: c.endpoint, model: c.model, apiVersion: c.apiVersion, apiKey: null,
    temperature: c.temperature, maxOutputTokens: c.maxOutputTokens, enabled: c.enabled } : blank();
  removeKey.value = false;
});

const needsEndpoint = computed(() => form.value.provider === 'AzureOpenAI' || form.value.provider === 'OpenAICompatible');
const endpointHint = computed(() => ({
  OpenAI: 'Empty for https://api.openai.com/v1',
  AzureOpenAI: 'The resource, such as https://my-resource.openai.azure.com',
  Anthropic: 'Empty for https://api.anthropic.com',
  OpenAICompatible: 'The /v1 base, such as http://ollama:11434/v1'
} as Record<LlmProvider, string>)[form.value.provider]);

function number(value: unknown): number | null {
  const parsed = Number(value);
  return value === '' || value == null || Number.isNaN(parsed) ? null : parsed;
}

function save() {
  const key = form.value.apiKey?.trim();
  emit('save', { ...form.value, apiKey: removeKey.value ? '' : key ? key : null });
}
</script>

<template>
  <v-dialog v-model="open" max-width="600">
    <v-card :title="connection ? `Change ${connection.name}` : 'Add a model connection'" subtitle="Run LLM steps name it">
      <v-card-text class="d-flex flex-column ga-3">
        <v-text-field v-model="form.name" label="Name" hint="Workflows refer to the connection by this name" persistent-hint />
        <v-select v-model="form.provider" :items="providerItems" label="Provider">
          <template #item="{ props: itemProps, item }"><v-list-item v-bind="itemProps" :subtitle="item.subtitle" /></template>
        </v-select>
        <v-text-field v-model="form.endpoint" label="Endpoint" :hint="endpointHint" persistent-hint :rules="needsEndpoint ? [(v: string) => !!v || 'Required'] : []" />
        <v-text-field v-model="form.model" :label="form.provider === 'AzureOpenAI' ? 'Deployment' : 'Model'" hint="Such as gpt-4.1-mini, claude-sonnet-4-5 or llama3.2" persistent-hint />
        <v-text-field v-if="form.provider === 'AzureOpenAI'" v-model="form.apiVersion" label="API version" placeholder="2024-10-21" />
        <v-text-field v-model="form.apiKey" label="API key" type="password" autocomplete="off" :disabled="removeKey"
                      :hint="connection?.hasApiKey ? 'A key is stored; leave empty to keep it' : form.provider === 'OpenAICompatible' ? 'Optional for local servers' : 'Stored encrypted; never shown again'" persistent-hint />
        <v-checkbox v-if="connection?.hasApiKey" v-model="removeKey" label="Remove the stored key" density="compact" hide-details />
        <div class="d-flex ga-3">
          <v-text-field :model-value="form.temperature ?? ''" label="Temperature" type="number" step="0.1" placeholder="Model default" @update:model-value="form.temperature = number($event)" />
          <v-text-field :model-value="form.maxOutputTokens ?? ''" label="Answer limit (tokens)" type="number" placeholder="1024" @update:model-value="form.maxOutputTokens = number($event)" />
        </div>
        <v-textarea v-model="form.description" label="Description" rows="2" auto-grow />
        <v-switch v-model="form.enabled" color="primary" label="Enabled" density="compact" hide-details />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="open = false">Cancel</v-btn>
        <v-btn color="primary" :loading="saving" :disabled="!form.name.trim() || !form.model.trim()" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
