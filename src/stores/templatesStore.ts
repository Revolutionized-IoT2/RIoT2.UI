import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useTemplateApi } from '@/composables/api/templateApi';
import { useRequests } from './requests';
import type { ReportTemplate } from '@/models/reportTemplate';
import type CommandTemplate from '@/models/commandTemplate';
import type VariableTemplate from '@/models/variableTemplate';
import type { ITemplate } from '@/models/itemplate';

/**
 * Every report, command and variable template, for the dashboard editors. Loaded when the
 * orchestrator configures the UI, and again after a node or variable is saved.
 */
export const useTemplatesStore = defineStore('templates', () => {
  const api = useTemplateApi();
  const { loading, error, run } = useRequests();

  const reportTemplates = ref<ReportTemplate[]>([]);
  const commandTemplates = ref<CommandTemplate[]>([]);
  const variableTemplates = ref<VariableTemplate[]>([]);

  /** What a dashboard element can show: report and variable templates. */
  const readableTemplates = computed<ITemplate[]>(() => [...reportTemplates.value, ...variableTemplates.value]);

  /** What a dashboard control can set: command and variable templates. */
  const writableTemplates = computed<ITemplate[]>(() => [...commandTemplates.value, ...variableTemplates.value]);

  async function load(): Promise<void> {
    await Promise.all([
      run(async () => { reportTemplates.value = await api.getReportTemplates() ?? []; }),
      run(async () => { commandTemplates.value = await api.getCommandTemplates() ?? []; }),
      run(async () => { variableTemplates.value = await api.getVariableTemplates() ?? []; }),
    ]);
  }

  return { reportTemplates, commandTemplates, variableTemplates, readableTemplates, writableTemplates, loading, error, load };
});
