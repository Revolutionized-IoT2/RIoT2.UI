<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';
import UnsavedChangesDialog from '@/components/UnsavedChangesDialog.vue';
import { useUnsavedChanges } from '@/composables/unsavedChanges';
import type Dashboard from '@/models/dashboard';
import type { DashboardCard } from '@/models/dashboard';
import type { ComponentSize } from '@/models/enums';
import { useDashboardStore } from '@/stores/dashboardStore';
import DashboardGrid from '@/dashboard/view/DashboardGrid.vue';
import PageNavigation from '@/dashboard/view/PageNavigation.vue';
import CardEditorDialog from '@/dashboard/editor/CardEditorDialog.vue';
import PageEditorDialog from '@/dashboard/editor/PageEditorDialog.vue';
import ImportExportDialog from '@/dashboard/editor/ImportExportDialog.vue';
import EditorToolbar, { type PreviewWidth } from '@/dashboard/editor/EditorToolbar.vue';

/**
 * The dashboard. /dashboard (also /dashboard/fullscreen, which RIoT2.Mobile opens) is the dashboard
 * alone, for phones and wall displays; /dash shows it in the app; /dashboard/edit edits it.
 * `?page=` opens a page by id, name or number; `?theme=` sets the theme (src/plugins/vuetify.ts).
 */
const route = useRoute();
const router = useRouter();
const { smAndDown } = useDisplay();
const store = useDashboardStore();
const { dashboard, dirty, loading } = storeToRefs(store);

const editing = computed(() => route.meta.dashboardEdit === true);
const standalone = computed(() => route.meta.dashboardStandalone === true);
const pages = computed(() => dashboard.value?.pages ?? []);
const pageIndex = ref(0);
const page = computed(() => pages.value[pageIndex.value]);

const previewing = ref(false);
const previewWidth = ref<PreviewWidth>('phone');
const frameWidths = { phone: '390px', tablet: '820px', full: '100%' };

/** The page `?page=` names: an id, a name, or a number from 1. */
function pageFromQuery(): number {
  const wanted = String(route.query.page ?? '').trim();
  if (!wanted)
    return 0;
  const byId = pages.value.findIndex(p => p.id === wanted);
  if (byId !== -1)
    return byId;
  const byName = pages.value.findIndex(p => p.name.toLowerCase() === wanted.toLowerCase());
  if (byName !== -1)
    return byName;
  const number = Number(wanted);
  return Number.isInteger(number) && number >= 1 && number <= pages.value.length ? number - 1 : 0;
}

onMounted(async () => {
  if (dashboard.value == null || !editing.value)
    await store.load();
  pageIndex.value = pageFromQuery();
});

// Keeps the page in the URL, so a reload (or RIoT2.Mobile's refresh) stays on it.
watch(pageIndex, index => {
  const id = pages.value[index]?.id;
  if (id != null && route.query.page !== id)
    router.replace({ query: { ...route.query, page: id } });
});

watch(() => pages.value.length, length => {
  if (pageIndex.value >= length)
    pageIndex.value = Math.max(0, length - 1);
});

const saved = ref(false);
async function save(): Promise<boolean> {
  const ok = await store.save();
  saved.value = ok;
  return ok;
}

const guard = useUnsavedChanges({ dirty, save, discard: () => store.discard() });

// Cards
const cardDialog = ref(false);
const editedCard = ref<DashboardCard | null>(null);

function addCard() {
  editedCard.value = null;
  cardDialog.value = true;
}

function editCard(card: DashboardCard) {
  editedCard.value = card;
  cardDialog.value = true;
}

function saveCard(card: DashboardCard) {
  if (page.value != null)
    store.putCard(page.value.id, card);
}

function resize(card: DashboardCard, size: ComponentSize) {
  card.size = size;
}

function reorder(cards: DashboardCard[]) {
  if (page.value != null)
    page.value.components = cards;
}

// Pages
const pageDialog = ref(false);
const pageEdited = ref(false);

function newPage() {
  pageEdited.value = false;
  pageDialog.value = true;
}

function editPage() {
  pageEdited.value = true;
  pageDialog.value = true;
}

function savePage(values: { name: string, icon: string | null }) {
  if (pageEdited.value && page.value != null) {
    store.updatePage(page.value.id, values);
    return;
  }
  store.addPage(values.name, values.icon);
  pageIndex.value = pages.value.length - 1;
}

function movePage(offset: number) {
  if (page.value == null)
    return;
  store.movePage(page.value.id, offset);
  pageIndex.value = Math.min(pages.value.length - 1, Math.max(0, pageIndex.value + offset));
}

// To the editor first: adding the page here would make leaving this view ask about unsaved changes.
async function startDashboard() {
  if (!editing.value)
    await router.push('/dashboard/edit');
  store.addPage('Home', 'mdi-home-outline');
}

// Import and export
const transferDialog = ref(false);
function imported(value: Dashboard, mode: 'replace' | 'append') {
  const before = pages.value.length;
  store.importDashboard(value, mode);
  pageIndex.value = mode === 'append' ? before : 0;
}

function done() {
  router.push({ path: '/dash', query: { page: page.value?.id } });
}

const navigation = computed(() => pages.value.length > 1 ? (smAndDown.value ? 'bottom' : 'top') : undefined);
</script>

<template>
  <div class="dashboard" :class="{ 'dashboard--standalone': standalone, 'dashboard--with-bar': navigation === 'bottom' }">
    <EditorToolbar
      v-if="editing"
      v-model:previewing="previewing"
      v-model:preview-width="previewWidth"
      :dirty="dirty"
      :saving="loading"
      :has-page="!!page"
      @new-page="newPage"
      @edit-page="editPage"
      @transfer="transferDialog = true"
      @discard="store.discard()"
      @save="save"
      @done="done"
    />

    <div v-if="navigation === 'top' || (editing && pages.length > 0)" class="dashboard__pages">
      <PageNavigation v-model="pageIndex" :pages="pages" placement="top" />
      <v-btn v-if="editing" icon="mdi-plus" size="small" variant="text" aria-label="New page" @click="newPage" />
      <v-btn v-if="!editing && !standalone" class="dashboard__edit" variant="text" prepend-icon="mdi-pencil-outline" :to="{ path: '/dashboard/edit', query: { page: page?.id } }">Edit</v-btn>
    </div>
    <div v-else-if="!editing && !standalone && pages.length > 0" class="dashboard__pages dashboard__pages--plain">
      <v-spacer />
      <v-btn class="dashboard__edit text-none" variant="text" prepend-icon="mdi-pencil-outline" :to="{ path: '/dashboard/edit', query: { page: page?.id } }">Edit</v-btn>
    </div>

    <div v-if="loading && dashboard == null" class="dashboard__loading">
      <v-skeleton-loader v-for="i in 4" :key="i" type="article" class="dashboard__skeleton" />
    </div>

    <div v-else-if="pages.length === 0" class="dashboard__welcome">
      <v-icon icon="mdi-view-dashboard-variant-outline" size="56" color="primary" />
      <h2>No dashboard yet</h2>
      <p>Add a page, then cards that show and control your devices.</p>
      <v-btn v-if="!standalone" class="text-none" color="primary" variant="flat" prepend-icon="mdi-plus" @click="startDashboard">Create the dashboard</v-btn>
    </div>

    <div v-else-if="page" class="dashboard__canvas" :class="{ 'dashboard__canvas--framed': editing && previewing && previewWidth !== 'full' }">
      <div class="dashboard__frame" :style="editing && previewing ? { width: frameWidths[previewWidth] } : undefined">
        <v-fade-transition mode="out-in">
          <DashboardGrid
            :key="page.id"
            :page="page"
            :pages="pages"
            :editing="editing && !previewing"
            @add="addCard"
            @edit="editCard"
            @remove="card => store.removeCard(card.id)"
            @duplicate="card => store.duplicateCard(card.id)"
            @move="(card, pageId) => store.moveCardToPage(card.id, pageId)"
            @resize="resize"
            @reorder="reorder"
          >
            <template v-if="!standalone" #empty>
              <v-btn class="text-none mt-2" variant="tonal" color="primary" prepend-icon="mdi-plus" :to="{ path: '/dashboard/edit', query: { page: page.id } }">Add cards</v-btn>
            </template>
          </DashboardGrid>
        </v-fade-transition>
      </div>
    </div>

    <PageNavigation v-if="navigation === 'bottom'" v-model="pageIndex" :pages="pages" placement="bottom" />

    <CardEditorDialog v-model="cardDialog" :card="editedCard" @save="saveCard" />
    <PageEditorDialog
      v-model="pageDialog"
      :page="pageEdited ? page ?? null : null"
      :can-delete="pages.length > 1"
      :first="pageIndex === 0"
      :last="pageIndex === pages.length - 1"
      @save="savePage"
      @remove="page && store.removePage(page.id)"
      @move="movePage"
    />
    <ImportExportDialog v-model="transferDialog" :dashboard="dashboard" @import="imported" />
    <UnsavedChangesDialog v-model="guard.dialog.value" :saving="guard.saving.value" what="dashboard changes" @choose="guard.choose" />

    <v-snackbar v-model="saved" color="success" timeout="2500" location="bottom">
      <v-icon icon="mdi-check-circle-outline" class="mr-2" />Dashboard saved
    </v-snackbar>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100%;
  padding: 12px;
  background: rgb(var(--v-theme-dashboard-background));
}

@media (min-width: 600px) {
  .dashboard {
    padding: 16px 20px 24px;
  }
}

.dashboard--standalone {
  min-height: 100dvh;
  padding-top: max(12px, env(safe-area-inset-top, 0px));
  padding-left: max(12px, env(safe-area-inset-left, 0px));
  padding-right: max(12px, env(safe-area-inset-right, 0px));
  overscroll-behavior-y: contain;
}

.dashboard--with-bar {
  padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
}

.dashboard__pages {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.dashboard__pages > :first-child {
  flex: 1;
  min-width: 0;
}

.dashboard__pages--plain {
  margin-bottom: 4px;
}

.dashboard__edit {
  flex: none;
}

.dashboard__loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: 16px;
}

.dashboard__skeleton {
  border-radius: 20px;
}

.dashboard__welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  max-width: 420px;
  margin: 12vh auto 0;
  text-align: center;
}

.dashboard__welcome h2 {
  font-size: 1.4rem;
  font-weight: 500;
}

.dashboard__welcome p {
  opacity: 0.75;
}

.dashboard__canvas--framed {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dashboard__frame {
  max-width: 100%;
  margin-inline: auto;
  transition: width 0.25s ease;
}

.dashboard__canvas--framed .dashboard__frame {
  padding: 16px 12px;
  border-radius: 28px;
  border: 8px solid rgb(var(--v-theme-surface-container-highest));
  background: rgb(var(--v-theme-dashboard-background));
}
</style>
