<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Dashboard from '@/models/dashboard';
import systemNode from '@/models/systemNode';
import Component from '@/models/component';
import { ComponentType, ComponentSize } from '@/models/enums';
import DashboardComponentEditor from '@/components/DashboardComponentEditor.vue';

const model = defineModel<Dashboard>({ default: new Dashboard() });

/*
const props = defineProps<{
  enabled: boolean,
  title: string
}>();

const emit = defineEmits<{
    delete: [number],
}>();
*/

const componentHeaders = [
  { title: 'Name', value: 'name' },
  { title: 'Desc', value: 'description' },
  { title: 'Icon', value: 'icon' }, 
  { title: 'Type', value: 'type' },
  { title: 'Size', value: 'size' }, 
  { title: 'Actions', value: 'elements' }, 
  //{ title: 'Actions', value: 'id' }
]

const valid = ref(false);
const editComponentDialog = ref(false);
const nodeIdOptions = ref<systemNode[]>([]);
const newSaved = ref(false);
const componentToEdit = ref<Component>(new Component());

function newComponent(pageIndex: number) {
  alert(pageIndex)
}

function deletePage(pageIndex: number) {
  alert(pageIndex)
}

function editComponent(component: Component) {
  componentToEdit.value = component;
  editComponentDialog.value = true;
}
function deleteComponent(component: Component) {
  alert("delete")
}

onMounted(() => {
  
});
</script>

<template>
  <v-form v-model="valid">
  <v-container>
    <v-row>
      <v-col cols="6">
        <v-text-field v-model="model.name" required hide-details
          label="Name" />
      </v-col>
      <v-col cols="6" class="mt-4 mb-4">
        Id: {{model.id}}
      </v-col>
    </v-row>
    <v-expansion-panels class="mt-4">
      <v-expansion-panel v-for="(page, i) in model.pages" :key="i">
        <v-expansion-panel-title>Page: {{ page.name }}</v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row>
            <v-col cols="6">
            <v-text-field v-model="page.name" required hide-details
              label="Name" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="page.icon" required hide-details :append-inner-icon="page.icon"
              label="Icon" />
          </v-col>
        </v-row>
        <v-data-table :items="page.components" :headers="componentHeaders" density="compact" class="mt-4">
          <template v-slot:top>
            <v-toolbar flat>
              <v-toolbar-title>Components - {{ page.name }}</v-toolbar-title>
              <v-spacer />
                <v-dialog v-model="editComponentDialog" max-width="800px" scrollable width="90%">
                    <template v-slot:activator="{ props }">
                      <v-btn
                      size="small"

                          rounded="0"
                          color="blue-darken-1"
                          variant="outlined"
                          @click="newComponent(i)"
                        >
                          <v-icon>add</v-icon>
                          new component
                        </v-btn>
                  </template>
                  <DashboardComponentEditor v-model="componentToEdit" @cancel="editComponentDialog = false" />
                  </v-dialog>
            </v-toolbar>
          </template>
        
        <template v-slot:item.name="{ item }">
          {{item.name}}
        </template>
        <template v-slot:item.description="{ item }">
          {{item.description}}
        </template>
        <template v-slot:item.icon="{ item }">
          <v-icon>{{ item.icon }}</v-icon>
        </template>
        <template v-slot:item.type="{ item }">
          {{ComponentType[item.type]}}
        </template>
        <template v-slot:item.size="{ item }">
          {{ComponentSize[item.size]}}
        </template>
        <template v-slot:item.elements="{ item }">
          <v-icon
            small
            class="mr-2"
            @click="editComponent(item)">
            edit
          </v-icon>
          <v-icon
            small
            class="mr-2"
            @click="deleteComponent(item)">
            delete
          </v-icon>

        </template>
      <template v-slot:no-data>
        <div>no report templates</div>
      </template>
      </v-data-table>
      <v-btn
        size="small"
            class="mt-4"
            rounded="0"
            color="error"
            variant="outlined"
            @click="deletePage(i)"
          >
            <v-icon>delete</v-icon>
            delete {{ page.name }} page
          </v-btn>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</v-form>
</template>

<style scoped>

</style>