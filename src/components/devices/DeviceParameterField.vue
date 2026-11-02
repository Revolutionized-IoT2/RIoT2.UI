<script setup lang="ts">
import { computed, ref } from 'vue';
import { DeviceParameterType } from '@/models/enums';
import type { DeviceParameterDefinition } from '@/models/generated/contracts';
import { parameterError } from '@/composables/deviceParameters';

/** One device parameter: a typed editor when the plugin defines it, otherwise free text. */
const value = defineModel<string | undefined>();

const props = defineProps<{
  name: string,
  definition: DeviceParameterDefinition | null
}>();

const emit = defineEmits<{
  remove: []
}>();

const revealed = ref(false);

const label = computed(() => props.definition?.required ? `${props.name} *` : props.name);
const hint = computed(() => props.definition?.description ?? undefined);
const error = computed(() => parameterError(props.definition, value.value));
const isBoolean = computed(() => props.definition?.type == DeviceParameterType.boolean);
const isNumeric = computed(() => props.definition?.type == DeviceParameterType.integer || props.definition?.type == DeviceParameterType.number);
const isSecret = computed(() => props.definition?.secret == true);
const inputType = computed(() => isSecret.value && !revealed.value ? 'password' : isNumeric.value ? 'number' : 'text');

// A switch shows the default until the value is set.
const flag = computed({
  get: () => (value.value || props.definition?.default || '').toLowerCase() == 'true',
  set: (on: boolean) => { value.value = on ? 'true' : 'false'; }
});
</script>

<template>
  <v-switch v-if="isBoolean" v-model="flag" :label="label" :hint="hint" persistent-hint color="primary" density="compact" />
  <v-text-field v-else v-model="value" :label="label" :type="inputType" :placeholder="definition?.default ?? undefined"
    :hint="hint" :persistent-hint="hint != null" :hide-details="definition == null" :error-messages="error ?? undefined"
    autocomplete="off">
    <template v-slot:append-inner>
      <v-icon v-if="isSecret" :icon="revealed ? 'visibility_off' : 'visibility'" @click="revealed = !revealed" />
      <v-icon v-if="definition == null" icon="delete" @click="emit('remove')" />
    </template>
  </v-text-field>
</template>
