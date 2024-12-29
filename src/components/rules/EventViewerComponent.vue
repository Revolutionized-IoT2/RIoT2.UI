<script setup lang="ts">
import type { IEvent } from '@/models/rules/Ievent';

export interface Props {
  events: IEvent [],
}

const props = withDefaults(defineProps<Props>(), {
    events: () => [],
});

</script>

<template>
    <v-timeline truncate-line="both">
      <v-timeline-item v-for="(event, i) in events" :key="i"
        fill-dot
        :icon="event.icon != null ? event.icon : ''"
        :icon-color="event.iconColor != null? event.iconColor : 'black'"
        :dot-color="event.iconBgColor != null? event.iconBgColor : 'primary'" 
      >
      <template v-slot:opposite>
        {{event.timeStamp}}
      </template>
        <v-card class="elevation-2" min-width="400">
          <v-card-title :class="{'pb-0': event.expandable}">
            {{event.header}}
            </v-card-title>
          <v-card-actions v-if="event.expandable">
            <v-card-subtitle v-if="event.subHeader != null" >
            {{event.subHeader}}
            </v-card-subtitle>
            <v-spacer></v-spacer>
            <v-btn icon @click="event.isExpanded = !event.isExpanded">
              <v-icon>{{ event.isExpanded ? 'arrow_drop_up' : 'arrow_drop_down' }}</v-icon>
            </v-btn>
            </v-card-actions>
            <template v-else>
             <v-card-subtitle v-if="event.subHeader != null" >
            {{event.subHeader}}
            </v-card-subtitle>
          </template>
              
          <template v-if="event.expandable">
          <v-expand-transition>
            <div v-show="event.isExpanded">
              <v-card-text class="pt-0" v-html="event.text" />
            </div>
          </v-expand-transition>
          </template>
          <template v-else>
          <v-card-text v-html="event.text" />
          </template>
        </v-card>
      </v-timeline-item>
    </v-timeline>
</template>