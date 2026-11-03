<script setup lang="ts">
/** A page's title, an optional line below it, and its actions on the right (wrapping on phones). */
defineProps<{ title: string, subtitle?: string, icon?: string }>();
</script>

<template>
  <header class="page-header">
    <v-icon v-if="icon" :icon="icon" color="primary" size="28" class="page-header__icon" />
    <div class="page-header__text">
      <h1 class="text-headline-small font-weight-medium">{{ title }}</h1>
      <div v-if="subtitle || $slots.subtitle" class="text-body-medium text-medium-emphasis">
        <slot name="subtitle">{{ subtitle }}</slot>
      </div>
    </div>
    <v-spacer />
    <div class="page-header__actions">
      <slot />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.page-header__text h1 {
  margin: 0;
  line-height: 1.25;
}

.page-header__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
