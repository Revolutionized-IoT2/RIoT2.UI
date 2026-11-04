import { defineStore } from 'pinia';
import { ref } from 'vue';
import { usePlanApi } from '@/composables/api/planApi';
import { useRequests } from './requests';
import type { CommandPlan, ForecastInfo } from '@/models/commandPlan';

/** The command plans the orchestrator carries out, and the forecasts it keeps (ADR 0019). */
export const usePlansStore = defineStore('plans', () => {
  const api = usePlanApi();
  const { loading, error, run } = useRequests();

  const plans = ref<CommandPlan[]>([]);
  const forecasts = ref<ForecastInfo[]>([]);
  const activeOnly = ref(true);

  async function load(): Promise<void> {
    await Promise.all([
      run(async () => { plans.value = await api.getPlans(activeOnly.value) ?? []; }),
      run(async () => { forecasts.value = await api.getForecasts() ?? []; }),
    ]);
  }

  /** Ends a plan; false on failure. */
  async function cancel(id: string): Promise<boolean> {
    const plan = await run(() => api.cancelPlan(id));
    if (!plan)
      return false;
    const index = plans.value.findIndex(x => x.id === id);
    if (activeOnly.value)
      plans.value.splice(index, index < 0 ? 0 : 1);
    else if (index >= 0)
      plans.value[index] = plan;
    return true;
  }

  return { plans, forecasts, activeOnly, loading, error, load, cancel };
});
