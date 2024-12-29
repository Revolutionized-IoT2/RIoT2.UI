<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { inject } from 'vue'

  import DashboardComponent from '@/components/DashboardComponent.vue'
  import { ComponentSize, ComponentType } from '@/models/enums';
  import { useOrchestrator } from '@/composables/orchestratorService';
  import type Report from '@/models/report';
  import { InjectionKeys } from '@/models/injectionKeys';
  import { onBeforeUnmount } from 'vue';
  import Dashboard from '@/models/dashboard';
  import { useRoute, useRouter } from 'vue-router';
  import Page from '@/models/page';
  import ContextMenu from '@/components/rules/ContextMenuComponent.vue';
  import Component from '@/models/component';
  import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

  const contextMenuItems = computed(() => [
        { text: "save dashboard", action: "save", disabled: !isDirty.value, icon: "save" },
        { text: "new page", action: "new_page", disabled: false, icon: "add" },
        { text: "edit page", action: "edit_page", disabled: false, icon: "edit" },
        { text: "delete page", action: "delete_page", disabled: deletePageDisabled.value, icon: "delete" },
    ]
  );

  const componentTypes = [{name: "Button", value: ComponentType.button},
                    {name: "Chart: Bar", value: ComponentType.chart_bar},
                    {name: "Chart: Doughnut", value: ComponentType.chart_doughnut},
                    {name: "Chart: Line", value: ComponentType.chart_line},
                    {name: "Chart: Pie", value: ComponentType.chart_pie},
                    {name: "Image", value: ComponentType.image},
                    {name: "Numeric Display", value: ComponentType.numericValue},
                    {name: "Slide Button", value: ComponentType.slideButton},
                    {name: "Timeline", value: ComponentType.timeline},
                    {name: "Switch", value: ComponentType.switch},
                    {name: "State", value: ComponentType.state}
                  ];

const componentSizes = [{name: "Small", value: ComponentSize.small},
                    {name: "Medium", value: ComponentSize.half},
                    {name: "Large", value: ComponentSize.large},
                    {name: "Full", value: ComponentSize.full}];
                  

  function contextMenuAction(action: string) {
    if(dashboardConfiguration.value == null)
      return;

    if(action == 'save') { 
      orchestrator.saveDashboard(dashboardConfiguration.value, (id: string | null) => {
        if(id != null) {
          saveDashboardSnackbar.value = true;
          
          //re-load dashboard
          orchestrator.getDashboard((dashboard: Dashboard | null) => {
            dashboardConfiguration.value = dashboard;
          }, () => {isDirty.value = false;});
        }
      },
      () => {
        //move to view mode ?
      });
    } 

    if(action == 'new_page') { 
      addPage();
    } 

    if(action == 'edit_page') { 
      let e = dashboardConfiguration.value.pages[selectedPage.value];
      editPage.value = {
        id: e.id,
        name: e.name,
        icon: e.icon,
        components: [] //this can be empty as we do not edit it in dialog
      }
      
      editPageDialog.value = true;
    } 

    if(action == 'delete_page') { 
      deletePage();
    } 
  }
  
  //var isFullscreen: boolean = document.fullscreenElement != null;
  const emitter = inject(InjectionKeys.emitter);
  const selectedPage = ref<number>(0);
  const orchestrator = useOrchestrator();
  const dashboardConfiguration = ref<Dashboard | null>(null);
  const isDirty = ref(false);

  const route = useRoute();
  const router = useRouter();

  const editPage = ref<Page>(new Page());
  const editMode = ref(false);
  const editPageDialog = ref(false);
  const saveDashboardSnackbar = ref(false);

  const editComponent = ref<Component>(new Component());
  const editComponentDialog = ref(false);

  onMounted(async () => {

    await router.isReady()
    //once its ready we can access the query params
    //console.dir(route)
    if(route.path.endsWith('edit'))
      editMode.value = true;

    orchestrator.getDashboard((dashboard: Dashboard | null) => {
      dashboardConfiguration.value = dashboard;
    });

    emitter?.on("mqttReportReceived", handleReportReceived);
  });

  onBeforeUnmount(() => {
    emitter?.off("mqttReportReceived", handleReportReceived);
  })

  function handleReportReceived(data: any) {
    var report = data as Report;

    if(report == null)
      return;

    update(report);
  }

  const deletePageDisabled = computed(() => {
    if(dashboardConfiguration.value == null || dashboardConfiguration.value.pages == null)
      return true;

    if(dashboardConfiguration.value.pages.length < 2)
      return true;

    return false;
  });


  watch<Dashboard |null>(dashboardConfiguration, (n, o) => {
    if(o != null && editMode.value)
      isDirty.value = true;

  },  { immediate: false, deep: true });

  function update(report: Report) {
    if(dashboardConfiguration.value == null)
      return;

    //update elements -> set matching elements
    for(let page of dashboardConfiguration.value.pages) {
        for(let comp of page.components) {
          for (let elem of comp.elements) {
            if(elem.reportTemplate?.id == report.id) {
              elem.report = report;
            }
          }
        }
      }
  }

  function getMdSize(size: ComponentSize) {
    if(size == ComponentSize.full)
      return 12;
    else
      return 6;
  }

  function getLgSize(size: ComponentSize) : number {
    return size;
  }

  function changeFullscreenMode(fullscreen:boolean) {
    if(fullscreen) {
      (document.getElementById("riotApp") as any).style.overflow = "hidden";
      document.documentElement.requestFullscreen();
    } else {
      (document.getElementById("riotApp") as any).style.overflow = "auto";
      document.exitFullscreen();
    }
}

function changePage(i: number) {
  selectedPage.value = i;
}

function addPage() {

  editPage.value = {
    id: "",
    name: "page",
    components: [],
    icon: "add"
  };

  editPageDialog.value = true;
}

function savePage() {
  if(dashboardConfiguration.value == null)
    return;

  let idx = dashboardConfiguration.value.pages.findIndex(x => x.id == editPage.value.id);

  if(idx == -1) {
    editPage.value.id = (dashboardConfiguration.value.pages.length + 1).toString();
    dashboardConfiguration.value.pages.push(editPage.value);
  } else {
    dashboardConfiguration.value.pages[idx].name = editPage.value.name,
    dashboardConfiguration.value.pages[idx].icon = editPage.value.icon,
    changePage(idx);
  }
    
  editPageDialog.value = false;
}

function deletePage() {
  if(dashboardConfiguration.value == null)
    return;

  if(dashboardConfiguration.value.pages.length > 1) 
    dashboardConfiguration.value.pages.splice(selectedPage.value, 1);

  editPageDialog.value = false;
}

function addNewComponent() {
  editComponent.value = {
    id: "",
    name: "",
    description: "",
    icon: "",
    size: ComponentSize.small,
    type: ComponentType.button,
    elements: []
  }

  editComponentDialog.value = true;
}

function editComponentAction(c: Component) {
    editComponent.value = {
        id: c.id,
        name: c.name,
        description: c.description,
        icon: c.icon,
        size: c.size,
        type: c.type,
        elements: [] //this can be empty as we do not edit it in dialog
      }
      
      editComponentDialog.value = true;
}

function deleteComponent(c: Component) {
  if(dashboardConfiguration.value == null)
      return;

  let idx = dashboardConfiguration.value.pages[selectedPage.value].components.findIndex(x => x.id == c.id);
  if(idx != -1) {
    dashboardConfiguration.value.pages[selectedPage.value].components.splice(idx, 1);
  }

  editComponentDialog.value = false;
}

function saveComponent() {
  if(dashboardConfiguration.value == null)
    return;

  let idx = dashboardConfiguration.value.pages[selectedPage.value].components.findIndex(x => x.id == editComponent.value.id);
  if(idx > -1) {
    let targetComponent = dashboardConfiguration.value.pages[selectedPage.value].components[idx];
    if(targetComponent.type != editComponent.value.type) //if component type is changed all elements are cleared.
      targetComponent.elements = [];

    targetComponent.name = editComponent.value.name;
    targetComponent.description = editComponent.value.description;
    targetComponent.icon = editComponent.value.icon;
    targetComponent.size = editComponent.value.size;
    targetComponent.type = editComponent.value.type;
  } else {
    editComponent.value.id = (dashboardConfiguration.value.pages[selectedPage.value].components.length + 1).toString();
    dashboardConfiguration.value.pages[selectedPage.value].components.push(editComponent.value);
  }

  editComponentDialog.value = false;
}

onBeforeRouteLeave(() => {
  if(isDirty.value) {
    //TODO Use dialog 
    const answer = window.confirm('Do you really want to leave? you have unsaved changes!')

  if (!answer) return false
  }
});

</script>

<style>
.v-application__wrap {
  background-color: lightgray !important;
}

.mqtt-status {
  position: fixed !important;
  bottom: 20px;
  right: 10px;
  z-index: 10000
}

.editCard{
  opacity: 0.5;
}

.navBtn {
  text-transform: capitalize !important;
  padding: 16px !important;
  font-size: 0.9em !important;
}

.fixedBottomBar {
    position: fixed !important;
    left: 0;
    bottom: 0;
    width: 100%;
    margin-top: 0px;
    z-index: 100;
}
</style>

<template>
   <div>
    <ContextMenu v-if="editMode" :items="contextMenuItems" @click="contextMenuAction" />
  <!--<v-avatar class="mqtt-status" size="16" :color="mqttService.status.value?'green':'red'"></v-avatar>-->
  <v-window v-model="selectedPage" :touch="false">
    <v-window-item v-for="page in dashboardConfiguration?.pages">
      <v-container :class="editMode?'mt-9' : 'mt-1'" fluid>
        <v-row class="mb-9">
          <template v-for="comp in page.components" :key="comp.name">
            <v-col cols="12" sm="12" :md="getMdSize(comp.size)" :lg="getLgSize(comp.size)" class="d-flex" style="flex-direction:column">
              <DashboardComponent :data="comp" :editMode="editMode" @editComponent="editComponentAction" @deleteComponent="deleteComponent" />
            </v-col>
          </template>
          <v-col v-if="editMode" cols="12" sm="12" :md="getMdSize(ComponentSize.small)" :lg="getLgSize(ComponentSize.small)" class="d-flex" style="flex-direction:column">
            <v-card class="d-flex align-center editCard" height="100%" variant="flat">
              <v-card-text class="text-center">
                <div class="d-flex flex-column flex-grow-1 text-center">
                    <div class="align-center"> 
                      <v-btn 
                          rounded="xl"
                          color="success"
                          icon="add"
                          @click="addNewComponent()">
                      </v-btn>
                    </div>
                  </div>
              </v-card-text>
              <!--
              <v-card-actions>
                <v-spacer />
                    <v-btn rounded="0"
                      color="error"
                      @click="deletePage()">
                    <v-icon size="small">delete</v-icon>
                  </v-btn>
              </v-card-actions>-->
              </v-card>
            </v-col>
        </v-row>
      </v-container>
    </v-window-item>
  </v-window>

  <v-bottom-navigation class="fixedBottomBar" height="60" fixed v-if="dashboardConfiguration != null && dashboardConfiguration?.pages?.length > 1" v-model="selectedPage">
    <v-slide-group show-arrows>
      <v-slide-group-item v-for="page, i in dashboardConfiguration?.pages" :key="page.name + i" v-slot="{ isSelected, toggle }">
        <v-btn class="navBtn" :color="isSelected ? undefined : 'blue'" @click="changePage(i)">
          <v-icon v-if="page.icon != null">{{page.icon}}</v-icon>
          {{page.name}}
        </v-btn>
      </v-slide-group-item>
    </v-slide-group>
  </v-bottom-navigation>

  <v-dialog v-model="editPageDialog" max-width="800" scrollable width="90%">
    <v-card>
      <v-toolbar dark color="primary" dense flat>
        <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
          {{ editPage.id == '' ? 'New page' : 'Edit page' }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="pa-4 black--text">
        <v-row>
            <v-col cols="6">
            <v-text-field v-model="editPage.name" required hide-details
              label="Name" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="editPage.icon" required hide-details :append-inner-icon="editPage.icon"
              label="Icon" />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="pt-3">
        <v-spacer></v-spacer>
        <v-btn
            rounded="0"
            color="error"
            variant="outlined"
            @click="deletePage()"
          >
          <v-icon size="small">delete</v-icon>
            delete
          </v-btn>
        <v-btn
            rounded="0"
            color="warning"
            variant="outlined"
            @click="editPageDialog = false"
          >
          <v-icon size="small">cancel</v-icon>
            cancel
          </v-btn>
          <v-btn
            rounded="0"
            color="success"
            variant="outlined"
            @click="savePage()"
          >
          <v-icon size="small">check_circle</v-icon>
            ok
          </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="editComponentDialog" max-width="800" scrollable width="90%">
    <v-card>
      <v-toolbar dark color="primary" dense flat>
        <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
          {{ editComponent.id == '' ? 'New component' : 'Edit component' }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="pa-4 black--text">
        <v-row>
          <v-col cols="6">
            <v-text-field v-model="editComponent.name" required hide-details
              label="Name" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="editComponent.description" required hide-details
              label="Description" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="editComponent.icon" required hide-details :append-inner-icon="editComponent.icon"
              label="Icon" />
          </v-col>

          <v-col cols="6">
            <v-select
              v-model="editComponent.type"
              :items="componentTypes"
              item-title="name"
              item-value="value"
              label="Type"
            />
          </v-col>
          <v-col cols="6">
            <v-select
              v-model="editComponent.size"
              :items="componentSizes"
              item-title="name"
              item-value="value"
              label="Size"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="pt-3">
        <v-spacer></v-spacer>
        <v-btn
            rounded="0"
            color="warning"
            variant="outlined"
            @click="editComponentDialog = false"
          >
          <v-icon size="small">cancel</v-icon>
            cancel
          </v-btn>
          <v-btn
            rounded="0"
            color="success"
            variant="outlined"
            @click="saveComponent()"
          >
          <v-icon size="small">check_circle</v-icon>
            ok
          </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="saveDashboardSnackbar" color="success">
      Dashboard saved succesfully
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="saveDashboardSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>