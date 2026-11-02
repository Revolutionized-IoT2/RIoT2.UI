# RIoT2.UI

Vue 3 web dashboard for the [RIoT2](https://github.com/Revolutionized-IoT2) IoT platform. It is
served as a static single-page app by nginx and talks to the orchestrator REST API plus MQTT over
WebSockets.

- Type: Vue 3 + TypeScript + Vite + Vuetify application
- Runtime: nginx container, non-root, port 8080
- MQTT transport: MQTT.js over `ws://<VITE_MQTT_SERVER>:9001/`

How this UI fits into the platform: [architecture overview](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/architecture/overview.md).

## What it does

- Shows dashboards with charts, numeric values, switches, states, images, timelines and buttons.
- Manages nodes, device configuration, variables and Matter bridge settings through the
  orchestrator API.
- Downloads and restores configuration backups, and lists the orchestrator's saved backups
  (*Backup* page, orchestrator 1.7.0 or later).
- Opens the external Elsa Studio workflow node from the navigation drawer.
- Subscribes to live report messages over MQTT, and announces itself as a dashboard node on every
  connection and whenever the orchestrator comes back online.

## Run locally

From the repository root (`C:\Src\RIoT2\RIoT2.UI`):

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
- `npm test` runs offline Node.js regression tests from `tests/*.test.cjs`.
  `tests/contracts.test.cjs` needs RIoT2.Core and RIoT2.Net.Orchestrator checked out next to this
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

## Configuration

The browser-side MQTT settings are Vite variables read by `src/app.config.ts`:

| Variable | Purpose |
|---|---|
| `VITE_MQTT_SERVER` | Broker host name or IP for the browser. The port is fixed in code at 9001. |
| `VITE_MQTT_USER` | Optional MQTT user name. |
| `VITE_MQTT_PASSWORD` | Optional MQTT password. |

Do not commit real broker credentials. These values are visible to anyone who can load the UI.
The platform source of truth for environment variables and ports is
[env-vars.md](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/contracts/env-vars.md).

## Container deployment

`Dockerfile` builds the app on Node 24 (active LTS) with `npm ci` and serves `dist/` from
`nginx-unprivileged` on port 8080, as the non-root user `nginx` (UID 101). Since 1.1.0; earlier
images listened on port 80. At container startup, `entrypoint.sh` renders `VITE_MQTT_SERVER`, `VITE_MQTT_USER` and
`VITE_MQTT_PASSWORD` into the built JavaScript from pristine template copies, so a container restart
is enough to change MQTT settings.

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
- [Environment variables, ports, volumes and images](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/contracts/env-vars.md)

Important implementation files:

| Path | Purpose |
|---|---|
| `src/App.vue` | Creates the dashboard MQTT client id, subscribes, announces online and waits for configuration. |
| `src/composables/mqttService.ts` | MQTT.js connection, reconnect backoff, subscriptions and publishing. |
| `src/composables/presence.ts` | The camelCase presence and last will, and when to announce again. |
| `src/composables/deviceParameters.ts` | Typed device parameters: fields from the node's `parameterDefinitions`, checks, the editor's definition map. |
| `src/stores/` | Pinia stores: the data each page shows, with `loading` and `error`; failures reach the snackbar. |
| `src/composables/api/` | Promise-based REST calls per resource (nodes, templates, commands, variables, dashboard, Matter, backup). |
| `src/models/constants.ts` | REST routes and MQTT topic templates used by the UI. |
| `src/models/generated/contracts.ts` | The contract types generated from RIoT2.Core's schema; the model classes that mirror one implement it, so a contract change fails the type check. |
| `scripts/generate-models.mjs` | Generates the file above (`npm run generate`). |
| `src/layout/AppBar.vue` | Navigation drawer and external Elsa Studio link. |

## Workflows

Automation is handled by [RIoT2.Elsa](https://github.com/Revolutionized-IoT2/RIoT2.Elsa), not by
an internal UI rule editor. The navigation drawer's **Workflows** entry opens the `nodeBaseUrl` of
the online workflow node (`nodeType` 3) returned by `GET /api/nodes/online`.

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
