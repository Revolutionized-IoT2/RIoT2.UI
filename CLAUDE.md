# CLAUDE.md

This file provides guidance to Claude Code (or any AI coding assistant) when working with code in this repository.

## Project overview

RIoT2.UI is the web frontend for RIoT2, an IoT orchestration/automation system. It provides:
- A dashboard for visualizing device data (charts, numeric values, switches, state, timeline, etc.)
- Node management/configuration for connected devices
- Discovery of and a navigation link to the external Elsa 3 workflow service
- Real-time device communication over MQTT and an HTTP orchestrator API

Built with Vue 3 (Composition API), TypeScript, Vite, Vuetify 3, Pinia, and Vue Router.

## Backend

The backend for UI is located in: https://github.com/Revolutionized-IoT2/RIoT2.Net.Orchestrator  

## Commands

```bash
npm run dev        # Start Vite dev server (--force)
npm run build       # Type-check (vue-tsc) then production build
npm run preview      # Preview production build on port 5050
npm run typecheck     # Type-check only, no emit (vue-tsc --noEmit)
npm test              # Offline regressions using the existing Node/Vue/TypeScript tooling
```

There is no configured lint script. Run `npm test`, `npm run typecheck`, and
`npm run build` before considering a change complete. The tests use real Vue
reactivity and source code with stubbed network dependencies; no live services are required.

## Environment configuration

Runtime config is read from Vite env vars (see `env.d.ts` and `src/app.config.ts`):
- `VITE_MQTT_SERVER`, `VITE_MQTT_USER`, `VITE_MQTT_PASSWORD`

These are consumed via `import.meta.env` and re-exported from `src/app.config.ts`.
Do not commit real broker credentials to `.env`; the checked-in env files should
contain placeholders only. Container startup performs string replacement for the
three MQTT values in the generated JS.

## Architecture

- `src/main.ts` — app bootstrap, registers plugins/router/store.
- `src/router/index.ts` — route definitions. Most routes wrap pages in `src/layout/Default.vue` and lazy-load views from `src/views/`.
- `src/stores/` — Pinia stores (`orchestratorStore.ts`, `errorStore.ts`, `counter.ts`).
- `src/composables/` — service layer, not Vue composables in the strict sense:
  - `httpClientService.ts` — Axios wrapper for the orchestrator REST API.
  - `orchestratorService.ts` — higher-level API calls to the backend orchestrator.
  - `mqttService.ts` — MQTT client for real-time device/data updates.
  - `api/` — dashboard, node, command/report, variable, and Matter API helpers.
  - `componentService.ts` — dashboard helper logic.
- `src/models/` — TypeScript types/interfaces for domain entities (devices, nodes, dashboards, commands, reports, variables, etc.). Shared models such as `reportTemplate.ts`, `variable.ts`, `pluginFile.ts`, and `nameValueStr.ts` live here, not under a rule-engine namespace.
- `src/components/` — shared Vue components.
  - `dashboardComponents/` — widget components rendered on dashboards (Chart, Switch, State, Numeric, Timeline, Button, Image, etc.), driven by `component.ts`/`componentElement.ts` models.
  - `DatamodelComponent.vue`, `ContextMenuComponent.vue` — shared data editing/viewing and action-menu components used by node, variable, and dashboard pages.
- `src/views/` — route-level page components (Dashboard, Nodes, Matter, Variables, Home, About).
- `src/layout/` — app shell components (`AppBar.vue`, `Default.vue`, `View.vue`).
- `src/plugins/` — Vuetify and other plugin registration (`plugins/index.ts`, `plugins/vuetify.ts`).

## Workflow integration

- Elsa 3 owns workflow authoring and execution. Do not reintroduce the retired internal rule editor, simulator, `/rules` routes, `/api/rules` helpers, or function-template loading.
- `src/layout/AppBar.vue` discovers the workflow node through `GET /api/nodes/online`, using `NodeType.workflow` (`3`) and its `nodeBaseUrl` for the external **Rules** link. Preserve this discovery contract.
- Dashboard controls and variables are independent of the retired engine. Preserve their report/command/variable templates and APIs. Device commands use `POST /api/command/execute` with `{ id, value }`; variable actions read `GET /api/nodes/variables`, find the matching variable by id, and post the full DTO to `/api/nodes/variable/save`, changing only its value. Do not restore the retired typed command endpoint or `OutputOperation` enum.

## Conventions

- Path alias `@` maps to `src/` (see `vite.config.ts` / `tsconfig`) — prefer `@/...` imports over deep relative paths.
- Vue components use `<script setup lang="ts">` with the Composition API.
- Backend communication is split by concern: use `orchestratorService`/`httpClientService` for REST calls and `mqttService` for real-time/pub-sub data — don't call Axios or the MQTT client directly from components.
- Dashboard widgets follow a common pattern: a model in `src/models/` describing config, and a matching component in `src/components/dashboardComponents/`.

## Deployment

- `Dockerfile`, `nginx.conf`, and `entrypoint.sh` build and serve the app via Nginx in a container. `entrypoint.sh` injects runtime MQTT env vars at container startup and intentionally avoids printing secret values.
