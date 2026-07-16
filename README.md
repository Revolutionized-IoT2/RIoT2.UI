# RIoT2.UI

RIoT2.UI is the web frontend for **RIoT2**, an IoT orchestration/automation system. It provides:

- A dashboard for visualizing device data (charts, numeric values, switches, state, timeline, etc.)
- Node management/configuration for connected devices
- A rule editor for building automation rules with a node-based/drag-and-drop editor
- Real-time device communication over MQTT and an HTTP orchestrator API

Built with Vue 3 (Composition API), TypeScript, Vite, Vuetify 3, Pinia, and Vue Router.

## Backend

The backend for this UI is located at: https://github.com/Revolutionized-IoT2/RIoT2.Net.Orchestrator

## Prerequisites

- Node.js and npm

## Setup

```bash
npm install
```

## Development

```bash
npm run dev        # Start Vite dev server (--force)
```

## Building

```bash
npm run build       # Type-check (vue-tsc) then production build
npm run preview      # Preview production build on port 5050
npm run typecheck     # Type-check only, no emit (vue-tsc --noEmit)
```

There is no configured lint or test script currently — verify with `npm run typecheck` and `npm run build` before considering a change complete.

## Environment configuration

Runtime config is read from Vite env vars (see `env.d.ts` and `src/app.config.ts`):

- `VITE_MQTT_SERVER`
- `VITE_MQTT_USER`
- `VITE_MQTT_PASSWORD`

These are consumed via `import.meta.env` and re-exported from `src/app.config.ts`.

## Deployment

`Dockerfile`, `nginx.conf`, and `entrypoint.sh` build and serve the app via Nginx in a container. `entrypoint.sh` injects runtime env vars at container startup.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).