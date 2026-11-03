<script setup lang="ts">
import { computed, onMounted, ref, toRaw, watch } from 'vue';
import { useMcpStore } from '@/stores/mcpStore';
import { useTemplatesStore } from '@/stores/templatesStore';
import type { McpConfiguration, McpToolGroup } from '@/models/mcp';

// AI access (ADR 0018): the orchestrator's MCP server, through which assistants such as Claude, ChatGPT or VS Code read
// and control RIoT2. The orchestrator's MCP settings decide whether it runs and how the internet reaches it;
// this page sets which tools they get, which commands they may send, and shows what they did.
const store = useMcpStore();
const templates = useTemplatesStore();
const draft = ref<McpConfiguration | null>(null);
const saving = ref(false);
const copied = ref<string | null>(null);

const groupInfo: Record<McpToolGroup, { title: string, text: string, icon: string }> = {
  read: { title: 'Values', text: 'List and read reports, commands and variables.', icon: 'mdi-gauge' },
  health: { title: 'Health', text: 'Nodes, their devices and the system health.', icon: 'mdi-heart-pulse' },
  commands: { title: 'Commands', text: 'Send the allowed commands below to devices.', icon: 'mdi-gesture-tap-button' },
  variables: { title: 'Variables', text: 'Set variable values; workflows that watch them run.', icon: 'mdi-variable' },
  workflows: { title: 'Workflows', text: 'Read workflow definitions and runs.', icon: 'mdi-sitemap-outline' },
  workflowControl: { title: 'Workflow control', text: 'Cancel workflow runs.', icon: 'mdi-stop-circle-outline' },
  admin: { title: 'Configuration', text: 'Change node configurations, variables and workflows. Device parameters are always hidden.', icon: 'mdi-cog-outline' },
};

onMounted(async () => {
  await store.load();
  if (!templates.commandTemplates.length)
    await templates.load();
});

watch(() => store.configuration, value => { draft.value = value ? structuredClone(toRaw(value)) : null; }, { immediate: true });

const dirty = computed(() => draft.value != null && JSON.stringify(draft.value) !== JSON.stringify(store.configuration));
const toolsOf = (group: McpToolGroup) => store.status?.tools.filter(t => t.group === group).map(t => t.name) ?? [];

const commandItems = computed(() => {
  const known = templates.commandTemplates.map(t => ({ title: [t.node, t.device, t.name].filter(Boolean).join(' · '), value: t.id }));
  const unknown = (draft.value?.allowedCommands ?? []).filter(id => !known.some(k => k.value === id)).map(id => ({ title: `${id} (not configured)`, value: id }));
  return [...known, ...unknown];
});

function toggleGroup(group: McpToolGroup, on: boolean | null) {
  if (!draft.value)
    return;
  const groups = new Set(draft.value.groups);
  if (on)
    groups.add(group);
  else
    groups.delete(group);
  draft.value.groups = store.status?.groups.map(g => g.id).filter(g => groups.has(g)) ?? [...groups];
}

async function save() {
  if (!draft.value)
    return;
  saving.value = true;
  await store.save(draft.value);
  saving.value = false;
}

async function copy(text: string | null | undefined) {
  if (!text)
    return;
  await navigator.clipboard?.writeText(text);
  copied.value = text;
  setTimeout(() => { if (copied.value === text) copied.value = null; }, 2000);
}

const outcomeColor: Record<string, string> = { ok: 'success', error: 'warning', denied: 'error', limited: 'error', failed: 'error' };
const authNames: Record<string, string> = { 'cloudflare-access': 'Cloudflare Access', oidc: 'OpenID Connect', none: 'None' };
const time = (value: string) => new Date(value).toLocaleString();
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <div class="d-flex flex-wrap align-center ga-3">
      <div>
        <div class="text-headline-small font-weight-medium">AI access</div>
        <div class="text-body-medium text-medium-emphasis">Let AI assistants such as Claude, ChatGPT or VS Code read and control RIoT2 through MCP.</div>
      </div>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-content-save-outline" :disabled="!dirty" :loading="saving" @click="save">Save</v-btn>
    </div>

    <v-alert v-if="store.status && !store.status.enabled" type="info" variant="tonal"
             text="The MCP server is off. Set RIOT2_MCP_ENABLED=true for the orchestrator and restart it; the settings below apply once it runs." />

    <v-row v-if="store.status && draft">
      <v-col cols="12" md="6">
        <v-card color="surface-container-low" variant="flat" class="h-100">
          <v-card-item prepend-icon="mdi-lan" title="On this network" subtitle="As trusted as the REST API: anyone on the network can use it while the security mode is off." />
          <v-card-text>
            <v-text-field :model-value="store.status.localUrl ?? 'Off'" label="MCP server URL" readonly density="compact" hide-details
                          :append-inner-icon="copied === store.status.localUrl ? 'mdi-check' : 'mdi-content-copy'" @click:append-inner="copy(store.status.localUrl)" />
            <div class="text-body-small text-medium-emphasis mt-2">In Claude Desktop, VS Code or another MCP client, add an HTTP (streamable) MCP server with this URL.</div>
            <v-switch v-model="draft.localEnabled" color="primary" label="Answer on this network" hide-details class="mt-2" />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card color="surface-container-low" variant="flat" class="h-100">
          <v-card-item prepend-icon="mdi-earth" title="From the internet" subtitle="ChatGPT and Claude reach RIoT2 through a tunnel that signs users in first.">
            <template #append>
              <v-chip v-if="store.status.remote.enabled" color="success" variant="tonal" size="small">{{ authNames[store.status.remote.auth] ?? store.status.remote.auth }}</v-chip>
              <v-chip v-else variant="tonal" size="small">Off</v-chip>
            </template>
          </v-card-item>
          <v-card-text v-if="store.status.remote.enabled">
            <v-text-field :model-value="store.status.remote.publicUrl" label="Public MCP URL" readonly density="compact" hide-details
                          :append-inner-icon="copied === store.status.remote.publicUrl ? 'mdi-check' : 'mdi-content-copy'" @click:append-inner="copy(store.status.remote.publicUrl)" />
            <div class="text-body-small text-medium-emphasis mt-2">
              Add it as a custom connector in Claude or as a connector in ChatGPT, and sign in when asked.
              Remote callers get at most the {{ store.status.remote.maxRole }} role{{ store.status.remote.subjectsRestricted ? ', and only the listed users may connect' : '' }}.
            </div>
            <v-switch v-model="draft.remoteEnabled" color="primary" label="Answer from the internet" hide-details class="mt-2" />
          </v-card-text>
          <v-card-text v-else class="text-body-medium">
            Remote access is off. To use RIoT2 from ChatGPT or Claude on the internet, follow the remote AI access guide:
            a Cloudflare Tunnel with Cloudflare Access in front of the orchestrator's MCP port, with RIOT2_MCP_AUTH set.
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-if="store.status && draft" color="surface-container-low" variant="flat">
      <v-card-item prepend-icon="mdi-tools" title="Tools" subtitle="What assistants may do. Remote callers also need the role shown." />
      <v-card-text>
        <v-row dense>
          <v-col v-for="group in store.status.groups" :key="group.id" cols="12" sm="6" lg="4">
            <v-card variant="outlined" class="h-100" :color="draft.groups.includes(group.id) ? 'primary' : undefined">
              <v-card-item :prepend-icon="groupInfo[group.id].icon" :title="groupInfo[group.id].title">
                <template #append>
                  <v-switch :model-value="draft.groups.includes(group.id)" color="primary" hide-details density="compact"
                            :aria-label="groupInfo[group.id].title" @update:model-value="toggleGroup(group.id, $event)" />
                </template>
              </v-card-item>
              <v-card-text class="text-body-medium">
                <div>{{ groupInfo[group.id].text }}</div>
                <div class="mt-2 d-flex flex-wrap ga-1">
                  <v-chip size="x-small" label variant="tonal">{{ group.role }}</v-chip>
                  <v-chip v-for="tool in toolsOf(group.id)" :key="tool" size="x-small" label variant="outlined">{{ tool }}</v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-alert v-if="draft.groups.includes('admin')" type="warning" variant="tonal" density="compact" class="mt-3"
                 text="Configuration tools let an assistant change devices and automations. Remote callers need the Admin role as well (RIOT2_MCP_REMOTE_MAX_ROLE=admin)." />
      </v-card-text>
    </v-card>

    <v-card v-if="draft" color="surface-container-low" variant="flat">
      <v-card-item prepend-icon="mdi-gesture-tap-button" title="Commands" subtitle="send_command sends only these; every command goes through the delivery queue." />
      <v-card-text>
        <v-autocomplete v-model="draft.allowedCommands" :items="commandItems" label="Allowed commands" multiple chips closable-chips clearable
                        :disabled="!draft.groups.includes('commands')" />
        <v-text-field v-model.number="draft.writesPerMinute" type="number" min="1" max="600" label="Writes per minute" style="max-width: 240px"
                      hint="Commands, variable changes and configuration writes, across every assistant" persistent-hint />
      </v-card-text>
    </v-card>

    <v-card color="surface-container-low" variant="flat">
      <v-card-item prepend-icon="mdi-history" title="Activity" subtitle="The latest tool calls since the orchestrator started">
        <template #append>
          <v-btn icon="mdi-refresh" variant="text" aria-label="Refresh" :loading="store.loading" @click="store.loadActivity()" />
        </template>
      </v-card-item>
      <v-card-text>
        <div v-if="!store.activity.length" class="text-body-medium text-medium-emphasis pa-4 text-center">No tool calls yet.</div>
        <v-table v-else density="compact" class="bg-transparent">
          <thead><tr><th>When</th><th>From</th><th>Tool</th><th>On</th><th>Result</th><th>Time</th></tr></thead>
          <tbody>
            <tr v-for="(entry, index) in store.activity" :key="index">
              <td>{{ time(entry.time) }}</td>
              <td><v-icon :icon="entry.listener === 'remote' ? 'mdi-earth' : 'mdi-lan'" size="small" class="me-1" />{{ entry.user }}</td>
              <td>{{ entry.tool }}</td>
              <td>{{ entry.target ?? '' }}</td>
              <td>
                <v-chip :color="outcomeColor[entry.outcome] ?? undefined" size="x-small" variant="tonal" label :title="entry.error ?? ''">{{ entry.outcome }}</v-chip>
                <span v-if="entry.error" class="text-body-small text-medium-emphasis ms-1">{{ entry.error }}</span>
              </td>
              <td>{{ entry.durationMs }} ms</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </div>
</template>
