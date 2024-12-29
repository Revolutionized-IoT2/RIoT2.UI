<script setup lang="ts">

</script>

<template>
    <v-card-text class="py-0 mb-10 center" >
      <v-alert
    text="no data"
    type="error"
  ></v-alert>
    </v-card-text>
</template>

<style scoped>
  .center {
    margin: 0;
    position: absolute;
    top: 50%;
    left: 50%;
    -ms-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);
  }
  .btm {
    position: absolute;
    bottom: 0px;
    right: 0px;
  }
  .component-footer-icon {
    margin-inline-end: 5px !important;
  }
</style>