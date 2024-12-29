<script setup lang="ts">
const props = defineProps<{
  first?: {"icon": string, "text": string },
  updated: Date | undefined
}>();

</script>
<template>
  <div class="component-footer">
<div class="d-flex justify-space-between">
      <template v-if="props.first != undefined">
      <v-list-item density="compact" :prepend-icon="props.first.icon">
        <v-list-item-subtitle>{{props.first.text}}</v-list-item-subtitle>
      </v-list-item>
    </template>
    <v-list-item v-else density="compact" >
        <v-list-item-subtitle></v-list-item-subtitle>
      </v-list-item>
      <v-list-item density="compact" prepend-icon="history">
        <v-list-item-subtitle>
          <timeago v-if="props.updated != undefined" :datetime="props.updated" :converter-options="{ includeSeconds: true }" :auto-update="5"/>
          <div v-else>never</div>
        </v-list-item-subtitle>
      </v-list-item>
</div>
</div>
</template>
<style scoped>


</style>