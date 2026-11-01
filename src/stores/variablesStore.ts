import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useVariableApi } from '@/composables/api/variableApi';
import { useRequests } from './requests';
import { useTemplatesStore } from './templatesStore';
import type { Variable } from '@/models/variable';
import type Command from '@/models/command';
import type { IReport } from '@/models/report';

/** The orchestrator's variables. */
export const useVariablesStore = defineStore('variables', () => {
  const api = useVariableApi();
  const templates = useTemplatesStore();
  const { loading, error, run } = useRequests();

  const variables = ref<Variable[]>([]);

  async function load(): Promise<void> {
    await run(async () => { variables.value = await api.getVariables() ?? []; });
  }

  /** Saves a variable, then reloads the variables and the templates. Resolves to success. */
  async function save(variable: Variable): Promise<boolean> {
    if (await run(() => api.saveVariable(variable)) === undefined)
      return false;
    await Promise.all([load(), templates.load()]);
    return true;
  }

  /** Deletes a variable, then reloads the variables and the templates. Resolves to success. */
  async function remove(id: string): Promise<boolean> {
    if (await run(() => api.deleteVariable(id)) === undefined)
      return false;
    await Promise.all([load(), templates.load()]);
    return true;
  }

  /**
   * Sets a variable's value from a dashboard command. The save endpoint needs the whole variable,
   * so the current one is read first and keeps its name, description and persistence.
   */
  async function setValue(command: Command): Promise<boolean> {
    return await run(async () => {
      const current = (await api.getVariables())?.find(v => v.id === command.id);
      if (current == null)
        return false;
      await api.saveVariable({ ...current, value: command.value });
      return true;
    }) ?? false;
  }

  /** A variable's report carries its new value. */
  function applyReport(report: IReport): void {
    const variable = variables.value.find(x => x.id == report.id);
    if (variable != null)
      variable.value = report.value;
  }

  return { variables, loading, error, load, save, remove, setValue, applyReport };
});
