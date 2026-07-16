# CLAUDE.md

This file provides guidance to Claude Code (or any AI coding assistant) when working with code in this repository.

## Project overview

RIoT2.UI is the web frontend for RIoT2, an IoT orchestration/automation system. It provides:
- A dashboard for visualizing device data (charts, numeric values, switches, state, timeline, etc.)
- Node management/configuration for connected devices
- A rule editor for building automation rules (with a node-based/drag-and-drop editor)
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
```

There is no configured lint or test script currently — verify with `npm run typecheck` and `npm run build` before considering a change complete.

## Environment configuration

Runtime config is read from Vite env vars (see `env.d.ts` and `src/app.config.ts`):
- `VITE_MQTT_SERVER`, `VITE_MQTT_USER`, `VITE_MQTT_PASSWORD`

These are consumed via `import.meta.env` and re-exported from `src/app.config.ts`.

## Architecture

- `src/main.ts` — app bootstrap, registers plugins/router/store.
- `src/router/index.ts` — route definitions. Most routes wrap pages in `src/layout/Default.vue` and lazy-load views from `src/views/`.
- `src/stores/` — Pinia stores (`orchestratorStore.ts`, `errorStore.ts`, `counter.ts`).
- `src/composables/` — service layer, not Vue composables in the strict sense:
  - `httpClientService.ts` — Axios wrapper for the orchestrator REST API.
  - `orchestratorService.ts` — higher-level API calls to the backend orchestrator.
  - `mqttService.ts` — MQTT client for real-time device/data updates.
  - `componentService.ts`, `ruleUtilsService.ts` — dashboard/rule helper logic.
- `src/models/` — TypeScript types/interfaces for domain entities (devices, nodes, rules, dashboards, commands, reports, etc.). `src/models/rules/` holds rule-specific types.
- `src/components/` — shared Vue components.
  - `dashboardComponents/` — widget components rendered on dashboards (Chart, Switch, State, Numeric, Timeline, Button, Image, etc.), driven by `component.ts`/`componentElement.ts` models.
  - `rules/` — rule editor UI (node graph editor, event viewer, data model panel, context menu).
- `src/views/` — route-level page components (Dashboard, Nodes, Rules, RuleEditor, RuleSimulation, Variables, Home, About).
- `src/layout/` — app shell components (`AppBar.vue`, `Default.vue`, `View.vue`).
- `src/plugins/` — Vuetify and other plugin registration (`plugins/index.ts`, `plugins/vuetify.ts`).

## Conventions

- Path alias `@` maps to `src/` (see `vite.config.ts` / `tsconfig`) — prefer `@/...` imports over deep relative paths.
- Vue components use `<script setup lang="ts">` with the Composition API.
- Backend communication is split by concern: use `orchestratorService`/`httpClientService` for REST calls and `mqttService` for real-time/pub-sub data — don't call Axios or the MQTT client directly from components.
- Dashboard widgets follow a common pattern: a model in `src/models/` describing config, and a matching component in `src/components/dashboardComponents/`.

## Deployment

- `Dockerfile`, `nginx.conf`, and `entrypoint.sh` build and serve the app via Nginx in a container. `entrypoint.sh` likely injects runtime env vars at container startup — check it before assuming env vars are build-time only.
