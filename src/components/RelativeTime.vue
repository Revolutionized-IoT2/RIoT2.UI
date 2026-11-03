<script setup lang="ts">
import { computed } from 'vue';
import { relativeTime, useNow } from '@/composables/relativeTime';

// A time as "5 minutes ago", kept current; the exact time is in the tooltip.
const props = defineProps<{ time?: Date | number | null, never?: string }>();
const now = useNow();
const text = computed(() => props.time == null ? props.never ?? 'never' : relativeTime(props.time, now.value));
const exact = computed(() => props.time == null ? undefined : new Date(props.time).toLocaleString());
</script>

<template>
  <time :datetime="time == null ? undefined : new Date(time).toISOString()" :title="exact">{{ text }}</time>
</template>
