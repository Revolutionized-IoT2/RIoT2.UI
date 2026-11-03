<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import CardShell from '../../components/CardShell.vue';
import RelativeTime from '@/components/RelativeTime.vue';
import { toText, useCardSettings, useElement, type CardProps } from '../../sdk';
import type { ImageElement, ImageSettings } from './index';

const props = defineProps<CardProps>();
const settings = useCardSettings<ImageSettings>(props);
const reading = useElement<ImageElement>(props);

/** Newest first: the latest image is the first slide. */
const images = computed(() => {
  const history = settings.value.showHistory ? reading.value.history.slice().reverse() : [];
  const list = history.length > 0 ? history.map(point => ({ url: toText(point.value), time: point.time })) : [{ url: reading.value.text, time: reading.value.updated }];
  return list.filter(image => image.url);
});

const slide = ref(0);
watch(() => reading.value.updated?.getTime(), () => { slide.value = 0; });
const zoomed = ref(false);
const state = computed(() => !reading.value.bound ? 'unbound' : images.value.length > 0 ? 'ready' : 'waiting');
</script>

<template>
  <CardShell :title="card.name || reading.element?.name" :subtitle="card.description" :icon="card.icon || 'mdi-image-outline'" :state="state" :updated="images[slide]?.time">
    <div class="image" :style="{ aspectRatio: settings.aspectRatio }">
      <v-carousel v-model="slide" height="100%" :show-arrows="images.length > 1 ? 'hover' : false" hide-delimiters :continuous="false">
        <v-carousel-item v-for="(image, i) in images" :key="i" :value="i">
          <v-img :src="image.url" :cover="settings.fit === 'cover'" height="100%" class="image__picture" @click="zoomed = true">
            <template #error>
              <div class="image__error"><v-icon icon="mdi-image-broken-variant" size="32" /></div>
            </template>
          </v-img>
        </v-carousel-item>
      </v-carousel>
      <span v-if="images.length > 1" class="image__counter">{{ slide + 1 }} / {{ images.length }}</span>
    </div>

    <v-dialog v-model="zoomed" fullscreen>
      <v-card color="black" class="d-flex flex-column">
        <v-toolbar color="transparent" theme="dark" density="comfortable">
          <v-toolbar-title>{{ card.name || reading.element?.name }} · <RelativeTime :time="images[slide]?.time" /></v-toolbar-title>
          <v-btn icon="mdi-close" aria-label="Close" @click="zoomed = false" />
        </v-toolbar>
        <v-img :src="images[slide]?.url" class="flex-grow-1" />
      </v-card>
    </v-dialog>
  </CardShell>
</template>

<style scoped>
.image {
  position: relative;
  margin-inline: -16px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface-container-high));
}

.image__picture {
  cursor: zoom-in;
}

.image__error {
  display: grid;
  place-items: center;
  height: 100%;
  opacity: 0.5;
}

.image__counter {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.75rem;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
}
</style>
