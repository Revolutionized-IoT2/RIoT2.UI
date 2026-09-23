<script setup lang="ts">
import type { ContextMenuItem } from '@/models/contextMenuItem';

const emit = defineEmits<{
  click: [action: string] 
}>();

const props = defineProps<{
  items: ContextMenuItem []
}>()

function exceuteAction(action: string) {
  emit('click', action);
}

</script>

<template v-if="ContextMenuItem.length > 0">
  <div class="contextMenu">
    <div
      v-for="(menuItem, index) in items"
      :key="index"
      class="pr-3 w-100"
    >
      <button
        type="button"
        class="btn float-right"
        :disabled="menuItem.disabled"
        @click="exceuteAction(menuItem.action)"
      >
        <i
          v-if="menuItem.icon != ''"
          class="material-icons align-middle"
        >{{ menuItem.icon }}</i>
        {{ menuItem.text }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.contextMenu {
    position: fixed;
    left: 0;
    width: 100%;
    background-color: rgba(0, 123, 255, 1);
    margin-top: 0px;
    z-index: 2;
}

.align-middle {
    vertical-align: middle !important;
}

.btn {
    border-radius: 0px;
    -webkit-transition-duration: 0.4s;
    transition-duration: 0.4s;
    padding: 3px 6px 3px 6px;
    border: 0px;
    color: #fff;
    display: inline-block;
    font-weight: 400;
    text-align: center;
    vertical-align: middle;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    background-color: transparent;
    border: 1px solid transparent;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    line-height: 1.5;
    border-radius: 0.25rem;
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
</style>
