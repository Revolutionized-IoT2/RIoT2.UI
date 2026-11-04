# AGENTS.md — RIoT2.UI

Applies to: this repository. Read the platform guide first:
[.github/AGENTS.md](https://github.com/Revolutionized-IoT2/.github/blob/main/AGENTS.md). It covers the
workspace map, platform-wide rules and the documentation rules. In the local workspace, every
`https://github.com/Revolutionized-IoT2/<Repo>/blob/main/<path>` link is the file
`C:\Src\RIoT2\<Repo>\<path>`; read the local file instead of fetching the URL.

## What this is

A Vue 3 + TypeScript + Vite dashboard for the RIoT2 platform, styled with Vuetify (Material 3,
ported from the maintainer's Dls project) and served by nginx. It is also the workflow designer
(Vue Flow) and manages the Run LLM connections ([ADR 0016](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/adr/0016-integrated-workflows-and-llm.md)). It consumes orchestrator HTTP APIs, MQTT report topics over MQTT.js WebSockets, and announces
itself as a Dashboard node so the orchestrator can send its API base URL.

## Commands

Run from the repository root (`C:\Src\RIoT2\RIoT2.UI`), in PowerShell:

```powershell
npm install
npm run dev
npm run lint
npm test
npm run new-card -- <kind>
npm run typecheck
npm run build
npm run preview
docker build -t riot2-ui:local .
```

- `npm run dev`: Vite dev server (`vite --force`).
- `npm run new-card -- <kind> ["Title"]`: a new dashboard card type in `src/dashboard/cards/<kind>/`.
- `npm run lint`: ESLint over `src/` (`eslint.config.mjs`). Errors fail CI; `any` is an error.
- `npm test`: Vitest (`vitest.config.ts`). `tests/*.test.mjs` load sources through
  `tests/source-loader.cjs` (CommonJS, so the code and the test share one Vue and Pinia);
  `tests/dashboard/*.test.ts` import sources and mount cards in jsdom (`tests/support/mount.ts`).
  jsdom needs Node.js 22.22 or 24.15+, as CI and the image use. `tests/contracts.test.mjs`
  reads `../RIoT2.Net.Orchestrator/openapi/riot2-orchestrator.json` and
  `../RIoT2.Core/contracts/golden`; check them out next to this repository. Add every new
  orchestrator URL to `src/models/constants.ts` and call it through `httpClient` in
  `src/composables/api/`, so the route test sees it and its method.
- `npm run generate`: `src/models/generated/contracts.ts` from `../RIoT2.Core/contracts/schemas`
  (`scripts/generate-models.mjs`; skipped with a warning when RIoT2.Core is missing, unless `CI=true`).
- `npm run typecheck`: `vue-tsc --build --force`.
- `npm run build`: `generate`, the type check, then `vite build`. CI (`verify-generated`) fails when
  the build changes a committed file.
- `npm run preview`: Vite preview on port 5050.
- Every push runs `.github/workflows/ci.yml` (`npm run lint`, `npm test`, `npm run build`, image
  build, secret scan). Release is tag-driven: push a `*.*.*` tag. `release.yml` validates, then pushes
  `ghcr.io/revolutionized-iot2/riot2-ui:latest` and `:<tag>` ([CI guide](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/guides/ci.md)).

## Layout

| Path | Contents |
|---|---|
| `src/App.vue` | App shell, random dashboard id, MQTT subscriptions, presence, configuration handling; hands reports to the stores |
| `src/app.config.ts` | `VITE_MQTT_SERVER`, `VITE_MQTT_USER`, `VITE_MQTT_PASSWORD` exports |
| `src/composables/mqttService.ts` | MQTT.js WebSocket client, reconnect backoff, subscribe/publish/disconnect |
| `src/composables/presence.ts` | Presence and last-will payloads; `orchestratorCameOnline` |
| `src/composables/connectionState.ts`, `components/ConnectionBanner.vue` | The UI's own MQTT and API state (`App.vue` sets MQTT, `httpClientService` records every request) and the banner, shown after a 5 s grace; the banner pings `/api/security/info` every 15 s |
| `src/views/SystemView.vue`, `components/system/`, `composables/systemHealthLook.ts` | The System page (`GET /api/v2/system/health`, polled every 10 s through `systemStore`) |
| `src/composables/deviceParameters.ts`, `components/devices/DeviceParameterField.vue` | Typed parameter fields from `parameterDefinitions` (provided by `NodeEditorDialog`); free text without them |
| `src/composables/deviceAuthorization.ts`, `components/devices/DeviceAuthorizationSection.vue` | "Connect to <provider>" for a template with `authorization`: `NodeEditorDialog` provides the descriptors, `NodeEditorComponent` the statuses' node and refresh; the callback page's message is read only from the API origin |
| `src/composables/api/` | Promise-based REST calls per resource; they reject with `ApiError` (`httpClientService.ts`) |
| `src/composables/statusLook.ts` | Sync, command-delivery and connector-health looks; `commandsStore` follows deliveries, `nodesStore.refreshSync` and `loadConnectors` are the quiet polls the Configure page runs |
| `src/stores/` | Pinia stores (nodes, templates, variables, dashboard, commands, Matter, backup, system, workflows, llm, mcp) with `loading`/`error` from `requests.ts` |
| `src/views/WorkflowsView.vue`, `WorkflowDesignerView.vue`, `components/workflows/` | The workflow list and designer: `WorkflowPalette`, `WorkflowNode`, `WorkflowInspector`, `ActivityInputEditor`, `RiotSelectorInput`, `WorkflowRunsPanel` |
| `src/composables/workflowGraph.ts`, `workflowAppearance.ts`, `assets/workflow-designer.css` | Model ⇄ Vue Flow conversion, inputs, the RIoT selector literal, `validateFlow`; activity colours and icons; the canvas styles |
| `src/views/AiModelsView.vue`, `components/ai/` | Language model connections (`LlmConnectionDialog`) and usage (`LlmUsagePanel`) |
| `src/views/AiAccessView.vue`, `stores/mcpStore.ts`, `models/mcp.ts` | The AI access page (`/ai/access`, [ADR 0018](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/adr/0018-mcp-server-and-remote-ai-access.md), [mcp.md](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/contracts/mcp.md)): the MCP tool policy and activity through `/api/v2/mcp` |
| `src/plugins/vuetify.ts` | The MD3 blueprint, the Dls light and dark themes (stored as `riot2.theme`), defaults and the hybrid icon set |
| `src/components/nodes/`, `src/components/devices/` | Parts of the Configure page: node list, editor dialog, device list and template picker; device parameters and template tables |
| `src/models/` | TypeScript models and constants for REST routes, topics, dashboards, nodes and variables |
| `src/models/generated/` | `contracts.ts`, generated from the RIoT2.Core contract schema: don't edit |
| `src/dashboard/` | The dashboard card kit ([README](src/dashboard/README.md)): `sdk/` (defineCard, registry, composables, capabilities, model), `components/` (CardShell, SparkLine, CommandStatus), `cards/<kind>/`, `editor/`, `view/` |
| `src/views/DashboardView.vue`, `stores/dashboardStore.ts` | The dashboard routes (`/dashboard`, `/dashboard/fullscreen`, `/dash`, `/dashboard/edit`) and its state: load, save, `dirty`, editor operations, import |
| `src/components/` | Shared parts: `PageHeader`, `IconField`, `ColorField`, `SchemaValueInput` (forms from a value schema), `RelativeTime`, `UnsavedChangesDialog` (with `composables/unsavedChanges.ts`) |
| `src/views/` | Route-level pages |
| `src/layout/` | Vuetify app shell and navigation drawer |
| `tests/` | Vitest tests: `*.test.mjs` (source loader), `dashboard/*.test.ts` (kit, store, cards) |
| `Dockerfile`, `nginx.conf`, `entrypoint.sh` | Production container build (base images pinned by digest; Renovate updates them), nginx config, runtime env substitution and the `/api` proxy (`ORCHESTRATOR_UPSTREAM`, written to `/etc/nginx/riot2/api.conf`) |

## Contracts consumed here

- [mqtt-topics.md](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/contracts/mqtt-topics.md):
  `src/models/constants.ts`, `src/App.vue`, `src/composables/mqttService.ts`.
- [http-api.md](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/contracts/http-api.md):
  `src/models/constants.ts`, `src/composables/api/`.
- [env-vars.md](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/contracts/env-vars.md):
  `src/app.config.ts`, `Dockerfile`, `entrypoint.sh`, `nginx.conf`.

## Rules

- Keep platform-wide MQTT, REST and environment-variable facts in the hub docs and link to them;
  don't copy contract tables into this repository.
- Do not commit real broker credentials. `VITE_MQTT_USER` and `VITE_MQTT_PASSWORD` are built into
  browser-visible JavaScript at container start.
- Preserve runtime env substitution in `entrypoint.sh`: render from pristine template copies on
  every start, and don't log secret values.
- Components get data from the Pinia stores in `src/stores/`; stores call `src/composables/api/`,
  and only `httpClientService` calls Axios. Use `mqttService` for MQTT. A store action that can
  fail goes through `useRequests().run`, which sets `error` and shows the snackbar.
- Keep components under about 250 lines (plan M3); move dialogs and tables into child components.
- Prefer the `@` alias for imports from `src/`.
- A model class that mirrors a Core contract type `implements` its generated type
  (`import type * as Contract from './generated/contracts'`), and the enums in `enums.ts` are
  checked against the generated unions. JSON values are `JsonValue` (helpers in
  `src/composables/jsonValue.ts`); don't use `any`. Orchestrator-only shapes (variables as served,
  Matter, backups) stay hand-written.
- Vue components use `<script setup lang="ts">` and Composition API patterns.
- Elsa 3 is the only workflow engine. Do not reintroduce the retired internal rule editor,
  simulator, `/rules` routes, `/api/rules` helpers or function-template loading.
- Workflows go through the orchestrator's `/api/workflows` only, never to Elsa directly; don't link
  to an external Studio. The designer must keep every property of the definition model it doesn't
  edit (`flowToModel` spreads the original activity), and the RIoT selector writes Studio's literal:
  PascalCase keys in Studio's order, numeric enums (`selectionText`). Saved workflows depend on both.
- A new activity gets a colour and icon in `workflowAppearance.ts`. Activity inputs are edited from
  the catalog's `uiHint`; add a case to `ActivityInputEditor` for a new hint.
- Icons: Vuetify components take `mdi-…` names; dashboards store Material Icons names, which the
  hybrid icon set in `vuetify.ts` still renders. Keep both working.
- Dashboard commands use `POST /api/command/execute` with `{ id, value }`. Variable actions load
  `GET /api/nodes/variables`, modify only the value on the selected DTO, and save via
  `POST /api/nodes/variable/save`.
- Never change state with `GET`. Deletes and Matter actions use the orchestrator's `/api/v2`
  routes (`httpClient.delete` / `httpClient.post`), which need Orchestrator 1.4.0 or later.
- If a UI label or layout change affects the screenshots used by the platform guides (`docs/guides/first-configuration.md`),
  regenerate them with
  [tools/ui-screenshots](https://github.com/Revolutionized-IoT2/.github/blob/main/tools/ui-screenshots/README.md).

## Pitfalls

- `src/App.vue` creates a new random UUID on every page load and announces the UI as a Dashboard
  node (`nodeType` 2) on `riot2/node/{id}/online` after every MQTT connection, and again when a
  live (not retained) `riot2/orchestrator/online` says `isOnline: true`. The payload is camelCase
  since 1.4.0 (D3 resolved).
- On load `App.vue` reads `/api/security/info` on its own origin (`loadSecurityState`). If it
  answers, the image proxies `/api` (`ORCHESTRATOR_UPSTREAM`) and `orchestratorStore.baseUrl` is
  `""`; otherwise it is the `apiBaseUrl` of the UI's `riot2/node/{id}/configuration` message. Until
  that message arrives (`configured`), the router is hidden behind "Connecting...".
- Live state goes through `createRealtimeTransport` (`src/composables/realtime.ts`): `mqtt` today,
  `gateway` only when `/api/security/info` says so (a placeholder until I50).
- `src/composables/mqttService.ts` hard-codes the broker WebSocket port to 9001.
- Vue Flow needs its own CSS (`@vue-flow/core/dist/style.css` and the theme) and a sized parent; the
  designer chunk is large, so keep it lazy-loaded through the router.
- `<script setup>` can't `export`: shared types and helpers for the designer live in
  `workflowGraph.ts`, which `tests/workflow-graph.test.mjs` loads directly.
- MQTT.js automatic resubscription is left enabled. The UI's own reconnect backoff starts at
  4 seconds, then grows to 8, 16 and a maximum of 30 seconds.
- Type-check with `vue-tsc --build`: the root `tsconfig.json` lists no files, so `vue-tsc --noEmit`
  checked nothing (until 1.5.0).
- `JsonValue`'s object and array cases are named interfaces; an inline recursive type makes Vue's
  `ref` unwrapping too deep for the compiler.
- `src/models/variable.ts` spells the persisted property `isPersistant`; it is part of the stored
  format, so only the label says "Persistent".
- `entrypoint.sh` renders the MQTT settings into `assets/index*.js` only, so `src/app.config.ts`
  must stay in the entry chunk (see `manualChunks` in `vite.config.ts`).
- `tests/*.test.mjs` load source files into a VM context: errors thrown there aren't `instanceof
  Error` in the test, and stores need `setActivePinia(createPinia())` first. TypeScript 6 turns on
  `esModuleInterop`, so a mock with a default export needs `__esModule: true`.
- `src/dashboard/sdk/registry.ts` uses `import.meta.glob`: test it with Vitest imports, not the
  source loader.
- The dashboard grid uses container queries on its own width, so the editor's preview frame and an
  embedded dashboard lay out like a phone at phone width. `DashboardGrid` keeps the add tile out of
  the sortable items (`draggable=".card-slot--item"`).
- `package.json` is `"type": "module"`; CommonJS files must be `.cjs`.
- `nginx.conf` intentionally leaves CSP commented out until the actual orchestrator and MQTT
  endpoints are known.
- The image runs nginx as UID 101 on port 8080 (`nginx-unprivileged`). `entrypoint.sh` rewrites
  files under `/usr/share/nginx/html/assets`, so the Dockerfile must keep those directories owned
  by UID 101. Don't add a `listen` below 1024 or write anywhere else at runtime.

## Related work

- Backlog item [13](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/backlog/open-issues.md)
  (the components still over 250 lines); items 10, 21 and 22 are done in 1.4.0 (I24).
- Optional hardening item [S2](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/backlog/optional-hardening.md).
  S12 (non-root nginx) is done in 1.1.0.
- [M3](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/plans/m03-split-oversized-classes.md):
  split oversized orchestrator/UI classes.
- [M8](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/plans/m08-dotnet10-migration.md):
  completed the UI build-image move from Node 22 to Node 24.
