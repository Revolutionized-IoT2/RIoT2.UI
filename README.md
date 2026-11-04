# RIoT2.UI

Vue 3 web dashboard for the [RIoT2](https://github.com/Revolutionized-IoT2) IoT platform. It is
served as a static single-page app by nginx and talks to the orchestrator REST API plus MQTT over
WebSockets.

- Type: Vue 3 + TypeScript + Vite + Vuetify (Material 3, light and dark) + Vue Flow application
- Runtime: nginx container, non-root, port 8080
- MQTT transport: MQTT.js over `ws://<VITE_MQTT_SERVER>:9001/`

How this UI fits into the platform: [architecture overview](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/architecture/overview.md).

## What it does

- Shows the dashboard: pages of cards (sensors, gauges, charts, lists, switches, buttons, lights,
  motion, states, images, activity and notes) that follow live reports and send commands. It works
  on phones and wall displays, and in RIoT2.Mobile (`/dashboard/fullscreen`). The editor has a card
  gallery, a live preview, import and export; see [Dashboard](#dashboard).
- Manages nodes, device configuration, variables and Matter bridge settings through the
  orchestrator API. A device that signs in to a provider's account (such as Netatmo) gets a
  *Connect* button in the device editor.
- Downloads and restores configuration backups, and lists the orchestrator's saved backups
  (*Backup* page, orchestrator 1.7.0 or later).
- Shows the health of the system on the *System* page (orchestrator 1.20.0 or later): every node,
  connector and workflow engine with its online history, sync and devices, the orchestrator's checks
  and the delivery queue. A banner on every page says when the UI loses its live updates or the API.
- Designs workflows on the *Workflows* page (orchestrator 1.21.0 or later): a list with import and
  export, and a designer with the activity palette, a Vue Flow canvas, an inspector for each
  activity's inputs, versions, publishing and the runs. It replaces Elsa Studio.
- Manages the language model connections of the *Run LLM* step, and shows their usage, on the
  *AI models* page.
- Sets what AI assistants may do through the orchestrator's MCP server (tool groups, allowed commands,
  the local and internet listeners), and shows their tool calls, on the *AI access* page (orchestrator 1.22.0).
- Subscribes to live report messages over MQTT, and announces itself as a dashboard node on every
  connection and whenever the orchestrator comes back online.

## Run locally

Needs Node.js 22.22 or 24.15 or later (the image builds with Node 24). From the repository root
(`C:\Src\RIoT2\RIoT2.UI`):

```powershell
npm install
npm run dev
```

`npm run dev` starts Vite with `--force`. The app still needs a reachable MQTT WebSocket listener
and an orchestrator configuration message before it leaves the initial "Connecting..." screen.

## Build, test and preview

```powershell
npm run lint
npm test
npm run typecheck
npm run build
npm run preview
```

- `npm run lint` runs ESLint (`eslint.config.mjs`: `eslint-plugin-vue` and `typescript-eslint`)
  over `src/`. Errors fail CI, `any` included: a JSON value is `JsonValue`.
- `npm test` runs the tests on Vitest (`vitest.config.ts`): `tests/*.test.mjs` load the sources in
  Node, `tests/dashboard/*.test.ts` also mount the cards in jsdom. `npm run test:watch` reruns them.
  `tests/contracts.test.mjs` needs RIoT2.Core and RIoT2.Net.Orchestrator checked out next to this
  repository (CI clones them). It fails when a URL in `src/models/constants.ts` isn't in the
  orchestrator's OpenAPI document (`openapi/riot2-orchestrator.json`) with the method the UI uses,
  or when the UI can't read the [golden files](https://github.com/Revolutionized-IoT2/RIoT2.Core/blob/main/contracts/golden/README.md).
- `npm run generate` writes `src/models/generated/contracts.ts` from RIoT2.Core's
  [contract schema](https://github.com/Revolutionized-IoT2/RIoT2.Core/blob/main/contracts/schemas/README.md)
  (`../RIoT2.Core/contracts/schemas/`, or `RIOT2_CONTRACT_SCHEMA`). Without RIoT2.Core next to
  this repository, as in the Docker build, the committed file is used.
- `npm run typecheck` runs `vue-tsc --build --force` (the type check of every project).
- `npm run build` runs `generate`, the type check and `vite build`. CI fails when it changes the
  committed generated file.
- `npm run preview` serves the production build on port 5050. Each route's view is its own chunk,
  and mqtt and Vue have chunks of their own (`vite.config.ts`).

## Dashboard

- `/dashboard` is the dashboard alone, for phones and wall displays; RIoT2.Mobile opens
  `/dashboard/fullscreen`, the same page. `/dash` shows it in the app, and `/dashboard/edit` edits it.
- `?page=` opens a page by its id, name or number (and the dashboard keeps the current page there);
  `?theme=light`, `dark` or `system` sets the theme for that visit.
- The editor: add cards from the card gallery, then choose devices and settings next to a live
  preview. Drag cards by their handle; each card's menu resizes, duplicates, moves or deletes it.
  *Preview* shows the page at phone, tablet or full width. *Import and export* saves the dashboard
  as a JSON file, or reads one in place of the dashboard or as more pages. Ctrl+S saves; leaving
  with unsaved changes asks to save or discard them.
- A new card type is one folder in `src/dashboard/cards/`: `npm run new-card -- <kind>` creates it.
  See the card kit guide, [src/dashboard/README.md](src/dashboard/README.md).

## Configuration

The browser-side MQTT settings are Vite variables read by `src/app.config.ts`:

| Variable | Purpose |
|---|---|
| `VITE_MQTT_SERVER` | Broker host name or IP for the browser. The port is fixed in code at 9001. |
| `VITE_MQTT_USER` | Optional MQTT user name. |
| `VITE_MQTT_PASSWORD` | Optional MQTT password. |
| `ORCHESTRATOR_UPSTREAM` | Optional (image only): the orchestrator as the container reaches it, such as `http://orchestrator:8080`. nginx then proxies `/api/` and `/realtime` there, and the UI calls the API on its own origin ([design 7.5](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/design/security-mode.md)). |

Do not commit real broker credentials. These values are visible to anyone who can load the UI.
The platform source of truth for environment variables and ports is
[env-vars.md](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/contracts/env-vars.md).

## Container deployment

`Dockerfile` builds the app on Node 24 (active LTS) with `npm ci` and serves `dist/` from
`nginx-unprivileged` on port 8080, as the non-root user `nginx` (UID 101). Since 1.1.0; earlier
images listened on port 80. At container startup, `entrypoint.sh` renders `VITE_MQTT_SERVER`, `VITE_MQTT_USER` and
`VITE_MQTT_PASSWORD` into the built JavaScript from pristine template copies, so a container restart
is enough to change MQTT settings. It also writes the `/api` and `/realtime` proxy from
`ORCHESTRATOR_UPSTREAM` (both answer 404 without it). On load the UI reads `/api/security/info`
on its own origin; when that answers it uses the proxy, otherwise the configuration command's
`apiBaseUrl`.

The whole stack, UI included, starts with one compose file:
[deploy/](https://github.com/Revolutionized-IoT2/.github/tree/main/deploy).

Example:

```powershell
docker build -t riot2-ui:local .
docker run --rm -p 8081:8080 -e VITE_MQTT_SERVER=<broker-host> -e VITE_MQTT_USER=<mqtt-user> -e VITE_MQTT_PASSWORD=<mqtt-password> riot2-ui:local
```

`nginx.conf` disables caching for the SPA shell and runtime-substituted `assets/index*.js` bundles,
uses immutable caching for other hashed assets, and leaves Content Security Policy as a commented
example because `connect-src` must match the orchestrator API and MQTT `ws:` / `wss:` endpoints.

## Contracts and APIs

This repository consumes the hub contracts instead of copying them:

- [MQTT topics and payloads](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/contracts/mqtt-topics.md)
- [HTTP and gRPC APIs](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/contracts/http-api.md)
- [Environment variables](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/contracts/env-vars.md), [ports, volumes and images](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/contracts/images.md)

Important implementation files:

| Path | Purpose |
|---|---|
| `src/App.vue` | Creates the dashboard MQTT client id, subscribes, announces online and waits for configuration. |
| `src/composables/mqttService.ts` | MQTT.js connection, reconnect backoff, subscriptions and publishing. |
| `src/composables/realtime.ts`, `securityInfo.ts` | The realtime transport (`mqtt`, `gateway` placeholder) and the `/api/security/info` probe. |
| `src/composables/presence.ts` | The camelCase presence and last will, and when to announce again. |
| `src/composables/deviceParameters.ts` | Typed device parameters: fields from the node's `parameterDefinitions`, checks, the editor's definition map. |
| `src/composables/deviceAuthorization.ts`, `components/devices/DeviceAuthorizationSection.vue` | A device's account sign-in ("Connect to Netatmo"): the redirect URI, the status chip, the sign-in window and the callback page's message. |
| `src/stores/` | Pinia stores: the data each page shows, with `loading` and `error`; failures reach the snackbar. |
| `src/composables/api/` | Promise-based REST calls per resource (nodes, templates, commands, variables, dashboard, Matter, backup, system). |
| `src/composables/statusLook.ts` | How a node's configuration sync, a command's delivery and a connector's health are shown (label, color, icon, tooltip lines). |
| `src/models/constants.ts` | REST routes and MQTT topic templates used by the UI. |
| `src/models/generated/contracts.ts` | The contract types generated from RIoT2.Core's schema; the model classes that mirror one implement it, so a contract change fails the type check. |
| `scripts/generate-models.mjs` | Generates the file above (`npm run generate`). |
| `src/layout/AppBar.vue` | App bar, navigation drawer (a rail on wide screens) and the light/dark switch. |
| `src/plugins/vuetify.ts` | The Material 3 theme (ported from Dls), component defaults, and the icon set: `mdi-…` names are Material Design Icons, others (stored dashboards) Material Icons. |
| `src/views/WorkflowsView.vue`, `WorkflowDesignerView.vue`, `components/workflows/` | The workflow list and the designer. |
| `src/composables/workflowGraph.ts`, `workflowAppearance.ts` | Elsa's definition model as Vue Flow nodes and edges and back, the RIoT selector's literal, the designer's warnings; each activity's colour and icon. |
| `src/views/AiModelsView.vue`, `components/ai/` | The language model connections and their usage. |
| `src/views/AiAccessView.vue`, `stores/mcpStore.ts` | The AI access page: the MCP server's tool policy and activity ([remote AI access guide](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/guides/remote-ai-access.md)). |

## Workflows

Automation is handled by Elsa 3 with the activities of [RIoT2.Elsa](https://github.com/Revolutionized-IoT2/RIoT2.Elsa),
not by an internal UI rule editor. The *Workflows* pages call only the orchestrator's
`/api/workflows`, which answers the same whether Elsa runs in the orchestrator or in its own
container ([ADR 0016](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/adr/0016-integrated-workflows-and-llm.md)). The designer edits Elsa's definition model and keeps
what it doesn't know, so workflows saved by Elsa Studio open and save unchanged. How to build them:
the [automation guide](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/guides/automation.md).

Legacy `/rules`, `/rules/editor/:id?`, `/rules/simulate/:id?`, `/api/rules` and
`/api/nodes/function/templates` paths are retired. Dashboard controls and variables use the
orchestrator node, dashboard, command and variable APIs.

## Releases

- Release notes are in [CHANGELOG.md](CHANGELOG.md).
- Pushing a `*.*.*` tag runs `.github/workflows/release.yml`, which runs the tests and the build,
  then pushes `ghcr.io/revolutionized-iot2/riot2-ui:latest` and `:<tag>`. Every push runs the same
  checks in `ci.yml` ([CI guide](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/guides/ci.md)).

## Contributing

- Instructions for AI coding agents: [AGENTS.md](AGENTS.md).
- Platform documentation: [.github/docs](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/README.md).
- UI screenshots used by the platform guides are regenerated from
  [tools/ui-screenshots](https://github.com/Revolutionized-IoT2/.github/blob/main/tools/ui-screenshots/README.md).

## License

See [LICENSE](LICENSE).
