<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import CardShell from '../../components/CardShell.vue';
import { useCardSettings, type CardProps } from '../../sdk';
import type { MarkdownSettings } from './index';

const props = defineProps<CardProps>();
const settings = useCardSettings<MarkdownSettings>(props);

// Markdown from the dashboard definition, sanitized: anyone who can import a dashboard writes it.
const html = computed(() => DOMPurify.sanitize(marked.parse(settings.value.content ?? '', { async: false, breaks: true, gfm: true }) as string, {
  ADD_ATTR: ['target'],
}));

const toneIcon = computed(() => ({ info: 'mdi-information-outline', warning: 'mdi-alert-outline', success: 'mdi-check-circle-outline' } as Record<string, string>)[settings.value.tone]);
</script>

<template>
  <CardShell :title="card.name" :subtitle="card.description" :icon="card.icon || toneIcon" :accent="settings.tone === 'plain' ? undefined : settings.tone" :class="`note--${settings.tone}`">
    <!-- eslint-disable-next-line vue/no-v-html -- sanitized above -->
    <div class="note" v-html="html" />
  </CardShell>
</template>

<style scoped>
.riot-card.note--info { background: color-mix(in srgb, rgb(var(--v-theme-info)) 10%, rgb(var(--v-theme-dashboard-card))); }
.riot-card.note--warning { background: color-mix(in srgb, rgb(var(--v-theme-warning)) 12%, rgb(var(--v-theme-dashboard-card))); }
.riot-card.note--success { background: color-mix(in srgb, rgb(var(--v-theme-success)) 10%, rgb(var(--v-theme-dashboard-card))); }

.note {
  font-size: 0.92rem;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.note :deep(h1),
.note :deep(h2),
.note :deep(h3),
.note :deep(h4) {
  margin: 0.2em 0 0.4em;
  line-height: 1.25;
  font-weight: 600;
}

.note :deep(h1) { font-size: 1.4rem; }
.note :deep(h2) { font-size: 1.2rem; }
.note :deep(h3) { font-size: 1.05rem; }

.note :deep(p),
.note :deep(ul),
.note :deep(ol) {
  margin: 0 0 0.6em;
}

.note :deep(ul),
.note :deep(ol) {
  padding-inline-start: 1.3em;
}

.note :deep(a) {
  color: rgb(var(--v-theme-primary));
}

.note :deep(code) {
  padding: 1px 5px;
  border-radius: 6px;
  font-size: 0.85em;
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 8%, transparent);
}

.note :deep(> :last-child) {
  margin-bottom: 0;
}
</style>
