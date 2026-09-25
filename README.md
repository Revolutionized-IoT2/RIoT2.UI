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
read `GET /api/nodes/variables`, select the matching variable by id, then update
the value via `POST /api/nodes/variable/save`, preserving the variable's metadata.
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
npm test              # Offline client regressions (Node test runner + existing Vue/TypeScript)
```

There is no configured lint script. Verify changes with `npm test`, `npm run typecheck`,
and `npm run build`. Tests execute the actual component setup/service code with Vue
reactivity and stubbed external dependencies; they do not contact MQTT or HTTP services
and are not browser end-to-end tests.

Regression coverage includes numeric/entity history values, initial and replaced chart
history, unique stable IDs when deleting/adding dashboard pages/components/elements,
two-way report-history settings, variable command updates, dashboard button state
comparison, data-model type detection, and MQTT reconnect recovery.

MQTT continues reconnecting until the client is explicitly disconnected. The first
retry waits 4 seconds; successive retry delays grow to 8, 16, then a maximum of
30 seconds. Successful connections reset the delay to 4 seconds. MQTT.js retains
automatic subscription recovery; explicit disconnect also terminates an offline
client rather than waiting indefinitely for queued traffic.

## Environment configuration

Runtime config is read from Vite env vars (see `env.d.ts` and `src/app.config.ts`):

- `VITE_MQTT_SERVER`
- `VITE_MQTT_USER`
- `VITE_MQTT_PASSWORD`

These are consumed via `import.meta.env` and re-exported from `src/app.config.ts`.
Do not commit real broker credentials to `.env`; use local overrides or deployment
secrets. The committed `.env` and `.env.production` contain safe placeholders only.

## Deployment

`Dockerfile`, `nginx.conf`, and `entrypoint.sh` build and serve the app via Nginx in a container. The image build uses `npm ci`; the runtime stage serves `dist/` from Nginx and includes a `wget` health check on `http://localhost/`. `entrypoint.sh` keeps pristine copies of generated `assets/index*.js*` files outside the served asset names, renders from those templates on every container start, replaces `VITE_MQTT_SERVER`, `VITE_MQTT_USER`, and `VITE_MQTT_PASSWORD` safely for shell/sed special characters, and warns when a value is empty without logging secret values. `nginx.conf` enables gzip for text assets, no-cache for the SPA shell and for the runtime-substituted `assets/index*.js` bundles (so changed MQTT settings reach browsers after a restart), immutable caching for all other hashed `/assets/` files, and basic security headers on every location. A CSP is intentionally left as a commented example because `connect-src` must allow the orchestrator API and MQTT `ws:/wss:` endpoints before enabling it.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).