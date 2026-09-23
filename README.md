# RIoT2.UI

RIoT2.UI is the web frontend for **RIoT2**, an IoT orchestration/automation system. It provides:

- A dashboard for visualizing device data (charts, numeric values, switches, state, timeline, etc.)
- Node management/configuration for connected devices
- A link to Elsa 3 for authoring and running automation workflows
- Real-time device communication over MQTT and an HTTP orchestrator API

Built with Vue 3 (Composition API), TypeScript, Vite, Vuetify 3, Pinia, and Vue Router.

## Backend

The backend for this UI is located at: https://github.com/Revolutionized-IoT2/RIoT2.Net.Orchestrator

## Workflows

Automation is managed by the external Elsa 3 workflow service, not an internal UI rule editor.
The **Rules** navigation item opens the `nodeBaseUrl` of the online workflow node
(`nodeType: 3`) returned by the orchestrator's `GET /api/nodes/online` endpoint.
If no workflow node is discovered, the link is disabled.

The legacy `/rules`, `/rules/editor/:id?`, and `/rules/simulate/:id?` pages have been
retired, along with calls to `/api/rules` and `/api/nodes/function/templates`.
Dashboard controls, report/command templates, and system variables still use the
orchestrator's node, dashboard, command, and variable APIs. Dashboard device
commands use `POST /api/command/execute` with `{ id, value }`; variable actions
first read `GET /api/variable/{id}/value`, then update the value via
`POST /api/nodes/variable/save`, preserving the variable's metadata.
The retired typed `/api/nodes/command/{operation}`
endpoint and `OutputOperation` enum are no longer used.

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