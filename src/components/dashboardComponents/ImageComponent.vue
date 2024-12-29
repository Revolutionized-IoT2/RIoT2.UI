<script setup lang="ts">
import { useComponentService } from '@/composables/componentService';
import type Component from '@/models/component';
import { ComponentElement } from '@/models/componentElement';
import { ValueType } from '@/models/enums';
import { reactive, ref } from '@vue/reactivity';
import { watch } from 'vue';
import FooterComponent from './FooterComponent.vue';

const props = defineProps<{
  data: Component
}>()

const componentService = useComponentService();
const image = ref({url: ["/default.jpg"], updated: new Date(8640000000000000)})
const selectedImage = ref<number>(0);

watch(props.data.elements, () => {
  selectedImage.value = 0;
  updateImage();

},  { immediate: true })

function updateImage() {

  let elem: ComponentElement | undefined = undefined;
  if(props.data.elements == null ||  props.data.elements.length < 1 || props.data.elements[0] == undefined) {
    return;
  }
  
  elem = props.data.elements[0] as ComponentElement;
  if(elem.report == undefined)
    return;

  let lastUpdated = componentService.timeStampToDate(elem.report.timeStamp);
  let imageUrls: string[] = []; 
  //imageUrls.push(componentService.getElementTextValue(props.data.elements[0]));
  
  let reportPropertyName = componentService.getElementProperty(elem);
  
  if(elem.previousReports != undefined) {
    for(let prevReport of elem.previousReports) {
      if(elem.reportTemplate?.type == ValueType.Entity &&
        reportPropertyName != null &&
        reportPropertyName != "") {
          imageUrls.push(prevReport.value[reportPropertyName]);
        } else {
          imageUrls.push(prevReport.value);
        }
    }
  }
  image.value = {url: imageUrls, updated: lastUpdated};
}
</script>
<template>
    <v-card-text class="py-0">
      <v-carousel :show-arrows="image.url.length > 1" :hide-delimiters="image.url.length < 2" v-model="selectedImage">
        <v-carousel-item v-for="img, i in image.url"
          :src="img"
          :value="i"
        ></v-carousel-item>
      </v-carousel>
      <!--<v-img :src="image.url"></v-img>-->
    </v-card-text>
    <FooterComponent :updated="image.updated" />
</template>