# AGENTS.md — RIoT2.UI

Applies to: this repository. Read the platform guide first:
[.github/AGENTS.md](https://github.com/Revolutionized-IoT2/.github/blob/main/AGENTS.md). It covers the
workspace map, platform-wide rules and the documentation rules. In the local workspace, every
`https://github.com/Revolutionized-IoT2/<Repo>/blob/main/<path>` link is the file
`C:\Src\RIoT2\<Repo>\<path>`; read the local file instead of fetching the URL.

## What this is

A Vue 3 + TypeScript + Vite dashboard for the RIoT2 platform, styled with Vuetify and served by
nginx. It consumes orchestrator HTTP APIs, MQTT report topics over MQTT.js WebSockets, and announces
itself as a Dashboard node so the orchestrator can send its API base URL.

## Commands

Run from the repository root (`C:\Src\RIoT2\RIoT2.UI`), in PowerShell:

```powershell
npm install
npm run dev
npm test
npm run typecheck
npm run build
npm run preview
docker build -t riot2-ui:local .
```

- `npm run dev`: Vite dev server (`vite --force`).
- `npm test`: offline regressions (`node --test tests/*.test.cjs`).
- `npm run typecheck`: `vue-tsc --noEmit`.
- `npm run build`: `vue-tsc --noEmit` then `vite build`.
- `npm run preview`: Vite preview on port 5050.
- Release is tag-driven: push a `*.*.*` tag. `.github/workflows/main.yml` builds and pushes
  `ghcr.io/revolutionized-iot2/riot2-ui:latest` and `:<tag>`.

There is no configured lint script.

## Layout

| Path | Contents |
|---|---|
| `src/App.vue` | App shell, random dashboard id, MQTT subscriptions, online announcement, configuration handling |
| `src/app.config.ts` | `VITE_MQTT_SERVER`, `VITE_MQTT_USER`, `VITE_MQTT_PASSWORD` exports |
| `src/composables/mqttService.ts` | MQTT.js WebSocket client, reconnect backoff, subscribe/publish/disconnect |
| `src/composables/orchestratorService.ts` | Higher-level orchestrator REST API wrapper |
| `src/composables/api/` | API helpers for dashboard, nodes, Matter, commands/reports and variables |
| `src/models/` | TypeScript models and constants for REST routes, topics, dashboards, nodes and variables |
| `src/components/dashboardComponents/` | Dashboard widget components |
| `src/views/` | Route-level pages |
| `src/layout/` | Vuetify app shell and navigation drawer |
| `tests/` | Node.js regression tests |
| `Dockerfile`, `nginx.conf`, `entrypoint.sh` | Production container build, nginx config and runtime env substitution |

## Contracts consumed here

- [mqtt-topics.md](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/contracts/mqtt-topics.md):
  `src/models/constants.ts`, `src/App.vue`, `src/composables/mqttService.ts`.
- [http-api.md](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/contracts/http-api.md):
  `src/models/constants.ts`, `src/composables/orchestratorService.ts`, `src/composables/api/`.
- [env-vars.md](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/contracts/env-vars.md):
  `src/app.config.ts`, `Dockerfile`, `entrypoint.sh`, `nginx.conf`.

## Rules

- Keep platform-wide MQTT, REST and environment-variable facts in the hub docs and link to them;
  don't copy contract tables into this repository.
- Do not commit real broker credentials. `VITE_MQTT_USER` and `VITE_MQTT_PASSWORD` are built into
  browser-visible JavaScript at container start.
- Preserve runtime env substitution in `entrypoint.sh`: render from pristine template copies on
  every start, and don't log secret values.
- Use `orchestratorService` or helpers under `src/composables/api/` for REST, and `mqttService` for
  MQTT. Don't call Axios or MQTT.js directly from components.
- Prefer the `@` alias for imports from `src/`.
- Vue components use `<script setup lang="ts">` and Composition API patterns.
- Elsa 3 is the only workflow engine. Do not reintroduce the retired internal rule editor,
  simulator, `/rules` routes, `/api/rules` helpers or function-template loading.
- Preserve the workflow-node discovery contract in `src/layout/AppBar.vue`: `GET /api/nodes/online`
  finds `NodeType.workflow` (`3`) and uses its `nodeBaseUrl` for the external Studio link.
- Dashboard commands use `POST /api/command/execute` with `{ id, value }`. Variable actions load
  `GET /api/nodes/variables`, modify only the value on the selected DTO, and save via
  `POST /api/nodes/variable/save`.
- If a UI label or layout change affects the screenshots used by the platform guides (`docs/guides/first-configuration.md`),
  regenerate them with
  [tools/ui-screenshots](https://github.com/Revolutionized-IoT2/.github/blob/main/tools/ui-screenshots/README.md).

## Pitfalls

- `src/App.vue` creates a new random UUID on every page load and announces the UI as a Dashboard
  node (`nodeType` 2) once on `riot2/node/{id}/online`. The payload is PascalCase:
  `{"IsOnline":true,"Name":...,"NodeType":2}`. This is contract divergence D3.
- The UI learns the orchestrator base URL only from its own
  `riot2/node/{id}/configuration` message and stores `apiBaseUrl` in
  `src/stores/orchestratorStore.ts`. Until that arrives, the router is hidden behind
  "Connecting...".
- The UI does not re-announce on MQTT reconnect and does not subscribe or react to
  `riot2/orchestrator/online`; if the first online message is lost, it can stay on
  "Connecting..." until reload (backlog item 21).
- `src/composables/mqttService.ts` hard-codes the broker WebSocket port to 9001.
- MQTT.js automatic resubscription is left enabled. The UI's own reconnect backoff starts at
  4 seconds, then grows to 8, 16 and a maximum of 30 seconds.
- Stale visible labels remain in code: "Rules" for the Elsa Studio link, "Varibles" in the app bar,
  and "Persistant" in the variables view (backlog item 22). `src/models/variable.ts` also spells
  the persisted property `isPersistant`.
- `nginx.conf` intentionally leaves CSP commented out until the actual orchestrator and MQTT
  endpoints are known.

## Related work

- Backlog items [10](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/backlog/open-issues.md),
  [13](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/backlog/open-issues.md),
  [21](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/backlog/open-issues.md) and
  [22](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/backlog/open-issues.md).
- Optional hardening items [S2](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/backlog/optional-hardening.md)
  and [S12](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/backlog/optional-hardening.md).
- [M3](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/plans/m03-split-oversized-classes.md):
  split oversized orchestrator/UI classes.
- [M8](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/plans/m08-dotnet10-migration.md):
  move the UI build image from Node 22 to Node 24 in the coordinated runtime pass.
