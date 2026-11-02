<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useCommandsStore } from '@/stores/commandsStore';
import { commandLook } from '@/composables/statusLook';

// The delivery status of a dashboard control's last command (design 7.1 phase 4): a spinner while it
// is pending, a check for a few seconds once the device ran it, and an error icon with the reason
// until the next command when it failed.
const props = defineProps<{
  commandId?: string | null
}>();

const commands = useCommandsStore();
const delivery = computed(() => props.commandId == null ? undefined : commands.deliveries[props.commandId]);
const look = computed(() => delivery.value == null ? null : commandLook(delivery.value));
const showSuccess = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

watch(() => delivery.value?.status, status => {
  clearTimeout(timer);
  showSuccess.value = status == 'executed' || status == 'duplicate' || status == 'sent';
  if (showSuccess.value)
    timer = setTimeout(() => { showSuccess.value = false; }, 3000);
});

onBeforeUnmount(() => clearTimeout(timer));

const visible = computed(() => look.value != null && (delivery.value?.status == 'pending' || look.value.color == 'red' || showSuccess.value));
</script>

<template>
  <span v-if="visible && look != null" class="command-status">
    <v-progress-circular v-if="delivery?.status == 'pending'" indeterminate size="14" width="2" color="blue" />
    <v-icon v-else :color="look.color" size="16">{{ look.icon }}</v-icon>
    <v-tooltip activator="parent" location="top">
      <div>{{ look.label }}</div>
      <div v-for="line in look.detail" :key="line">{{ line }}</div>
    </v-tooltip>
  </span>
</template>

<style scoped>
.command-status {
  display: inline-flex;
  align-items: center;
}
</style>
