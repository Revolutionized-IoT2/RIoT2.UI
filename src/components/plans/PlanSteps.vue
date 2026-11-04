<script setup lang="ts">
import type { CommandPlanStep, CommandPlanStepStatus } from '@/models/commandPlan';
import { toText } from '@/dashboard/sdk';

// A command plan's steps as a timeline: each step's time, value and how its delivery went.
defineProps<{ steps: CommandPlanStep[] }>();

const looks: Record<CommandPlanStepStatus, { color: string, icon: string, text: string }> = {
  pending: { color: 'secondary', icon: 'mdi-clock-outline', text: 'Waiting' },
  delivering: { color: 'info', icon: 'mdi-send-clock-outline', text: 'Sending' },
  executed: { color: 'success', icon: 'mdi-check-circle-outline', text: 'Done' },
  sent: { color: 'success', icon: 'mdi-send-check-outline', text: 'Sent' },
  failed: { color: 'error', icon: 'mdi-alert-circle-outline', text: 'Failed' },
  expired: { color: 'warning', icon: 'mdi-timer-off-outline', text: 'Expired' },
  unknownCommand: { color: 'error', icon: 'mdi-help-circle-outline', text: 'Unknown command' },
  skipped: { color: 'grey', icon: 'mdi-skip-next-outline', text: 'Skipped' },
  missed: { color: 'warning', icon: 'mdi-clock-alert-outline', text: 'Missed' },
  cancelled: { color: 'grey', icon: 'mdi-cancel', text: 'Cancelled' },
};

const look = (status: CommandPlanStepStatus) => looks[status] ?? looks.pending;
const time = (at: string) => new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(at));
</script>

<template>
  <v-timeline density="compact" side="end" truncate-line="both" class="plan-steps">
    <v-timeline-item v-for="(step, index) in steps" :key="index" :dot-color="look(step.status).color" :icon="look(step.status).icon" size="small">
      <div class="plan-step">
        <span class="plan-step__time">{{ time(step.at) }}</span>
        <span class="plan-step__value">{{ toText(step.value) }}</span>
        <v-chip size="x-small" variant="tonal" :color="look(step.status).color">{{ look(step.status).text }}</v-chip>
        <span v-if="step.error" class="text-error text-body-small">{{ step.error }}</span>
      </div>
    </v-timeline-item>
  </v-timeline>
</template>

<style scoped>
.plan-step {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-variant-numeric: tabular-nums;
}

.plan-step__time {
  min-width: 6.5em;
  opacity: 0.75;
}

.plan-step__value {
  font-weight: 500;
}
</style>
