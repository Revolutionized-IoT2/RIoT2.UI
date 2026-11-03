# Changelog

All notable changes to `RIoT2.UI`. A versioned container image is released by pushing a `*.*.*`
git tag; CI publishes `ghcr.io/revolutionized-iot2/riot2-ui:latest` and `:<tag>`.

## [Unreleased]

The AI access page ([I57](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-3-4.md#i57-mcp-server-and-remote-ai-access-m),
[ADR 0018](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/adr/0018-mcp-server-and-remote-ai-access.md)). Planned as 1.12.0; needs
Orchestrator 1.22.0.

- Added: the *AI access* page (`/ai/access`, under Automation): the MCP server's local and public URLs, the switches
  for each listener, the tool groups with their roles and tools, the commands `send_command` may send, the writes
  per minute, and the latest tool calls (`/api/v2/mcp`).

## [1.11.0] - 2026-11-03

The workflow designer, the AI models page, the Material 3 look ([I55](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-3-4.md#i55-integrated-workflows-and-run-llm-m),
[ADR 0016](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/adr/0016-integrated-workflows-and-llm.md)), and the new dashboard with its card kit
([I56](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-3-4.md#i56-dashboard-card-kit-m),
[ADR 0017](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/adr/0017-dashboard-card-kit.md)). The new pages need
Orchestrator 1.21.0, which keeps the dashboard's ids, card kinds and settings; the rest works with older orchestrators.

- Added: the dashboard is rebuilt on a card kit ([src/dashboard/README.md](src/dashboard/README.md)).
  Each card type is one folder with a `defineCard` definition and a Vue component; the registry,
  the card gallery, the editor and the tests find it there. `npm run new-card -- <kind>` creates
  one. Cards are stored with a `kind` and `settings` (Core 2.2.0), and the type older UIs read.
- Added: new cards: Gauge, Entities (a list of values with switches), Light (on and off,
  brightness, colour), Motion and Note (Markdown, sanitized). The numeric value is now the Sensor
  card, with a sparkline, its trend, its range and warning thresholds. Every card got a new look:
  rounded tiles, state colours, "not connected" and "waiting for data" states, and short "5 min.
  ago" times.
- Added: the card editor. Pick a card in a gallery with live samples, then choose its devices and
  settings next to a live preview of the card with the device's recent reports. Settings forms are
  built from what each card declares: icon picker, colour swatches, unit and member lists, and
  values edited as their schema describes, in place of raw JSON.
- Added: device capability discovery. A template's declared `schema` (Core 2.2.0), or one inferred
  from its sample model, picks the member, unit and icon, sorts the templates that suit a card
  first, and builds the value form for a command, also in a node's *execute command* dialog.
- Added: dashboard import and export (a JSON file; templates bound again by id, else by node,
  device and name), a preview mode at phone, tablet or full width, drag to reorder, duplicate,
  resize and move cards between pages, Ctrl+S, and a *Save, Discard or Keep editing* dialog in
  place of `window.confirm` (also when the tab closes with unsaved changes).
- Added: phones and RIoT2.Mobile. Columns follow the dashboard's own width (container queries);
  small sensor cards sit two side by side on phones. Pages are a bottom bar on phones and tabs on
  wider screens, the dashboard pads itself with the safe areas, `/dashboard/fullscreen` (RIoT2.Mobile's
  default URL) works, `?page=` opens a page by id, name or number and stays in the URL, and
  `?theme=light|dark|system` sets the theme.
- Changed: the whole UI uses Material Design Icons. Material icon names in saved dashboards are
  mapped to MDI when the dashboard loads; others still render with the Material icon font. The
  theme follows the system until the user picks light or dark (app bar menu).
- Changed: the Nodes and Variables pages have a page header in place of the blue action bar, and
  the remaining Material 2 styles (square buttons, shadows, fixed colours) are Material 3.
- Fixed: editing or deleting a card after a reload could change another card, because pages and
  cards lost their ids when saved (fixed with Orchestrator 1.21.0). A report no longer marks the
  dashboard as changed while it is edited. The image card's debug list and the button colour
  dialog that did nothing are gone (the Light card sets colours).
- Changed: dependencies are on their latest majors: Vuetify 4, Vue Router 5, Pinia 4, Vite 8,
  `@vitejs/plugin-vue` 6, vue-tsc 3, TypeScript 6, MQTT.js 5, uuid 14. `vue-timeago3` is replaced by
  `RelativeTime`. Development needs Node.js 22.22 or 24.15 or later (the image builds with Node 24).
- Changed: the tests run on Vitest. The earlier tests keep their loader (`tests/*.test.mjs`); new
  tests under `tests/dashboard/` import the sources and mount the cards in jsdom.
- Added: the *Workflows* pages (`/workflows`, `/workflows/:id`) replace the link to Elsa Studio. The
  list shows the engine's mode and state, and imports (an Elsa export or a template), exports and
  deletes workflows. The designer, ported from Dls, has a palette of the engine's activities, a Vue
  Flow canvas with an outcome handle per port, and an inspector for names, inputs (literal or
  expression, with the RIoT selectors for reports, commands and variables) and *Starts the
  workflow*. It also has versions, save and publish, warnings before publishing, and the runs with
  each activity's outcome and error. Workflows saved by Studio open and save unchanged.
- Added: the *AI models* page (`/ai`): language model connections for the Run LLM step (OpenAI,
  Azure OpenAI, Anthropic, OpenAI-compatible), with a connection test, and their usage per
  connection and day with the latest runs. API keys can be replaced or removed but are never shown.
- Changed: the whole UI takes the Material 3 look of Dls (Vuetify `md3` blueprint, light and dark
  themes with a switch in the app bar, a navigation rail on wide screens, card-based home page).
  Dashboards keep their Material Icons; `mdi-…` icons come from `@mdi/font`.
- Changed: the Backup page says that workflows aren't in a configuration backup.

## [1.10.0] - 2026-11-03

The system health page ([I46](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-3-4.md#i46-system-health-page-m)). Needs Orchestrator 1.20.0 for the System page; the rest works with
older orchestrators.

- Added: the *System* page (`/system`): the browser's own live-update and API connections, the
  orchestrator's version and checks, every node, connector and workflow engine with its online state,
  how long it has had it and its changes since the orchestrator started, its sync, and each device's
  state and last error, and the delivery queue. It reloads every 10 seconds.
- Added: a connection banner on every page, also the wall dashboard, when the realtime connection or
  the orchestrator's API has been lost for more than 5 seconds. Every API request records whether the
  API answered, and the banner asks every 15 seconds.
- Changed: the delivery queue dialog and the System page share `OutboxSummaryPanel`.

## [1.9.0] - 2026-11-02

Connectors on the Configure page ([I39](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-3-4.md#i39-connectors-in-the-ui-and-a-prometheus-exporter-m), [design 7.3](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/design/connector-sdk.md) phase 3). Needs Orchestrator 1.17.0; with an older one
the list stays empty. No port, user, volume or variable changes.

- Added: a "Connectors" list under the nodes: name, version (the connector SDK's in the tooltip),
  health (`ok`, `degraded`, `unhealthy`, `unreachable`, or `online` when the connector announces no
  URL) with the reasons, and the messages waiting in its spool. It polls `GET /api/v2/connectors`
  every ten seconds while the page is open.
- Changed: the node editor offers only device nodes' ids, never a connector's.
- Changed: `NodeType.connector` (4), from the regenerated contract models (Core 1.22.0).

## [1.8.0] - 2026-11-02

Sync and command status ([I36](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-3-4.md#i36-sync-and-command-status-in-the-ui-m); designs 7.1 phase 4 and 7.2 phase 6). Needs Orchestrator
1.16.0 for the sync column and re-apply. No port, user, volume or variable changes.

- Added: the Configure page's "Configuration" column: in sync, applying, restarting (a new plugin
  package), failed with the error, offline, or legacy, with the revisions, the devices that aren't
  running and the plugin package with its Core in the tooltip. It polls `GET /api/v2/nodes/sync`
  every three seconds while the page is open. An offline node's device states show as unknown and
  are read again when it comes back.
- Added: "re-apply" per node (`POST /api/v2/nodes/{id}/configuration/apply`), and a "delivery
  queue" dialog with the outbox summary (counts, oldest waiting message, last errors).
- Changed: dashboard controls send commands with `POST /api/v2/commands` and follow the delivery:
  buttons and switches show a spinner while it is pending, a check when the device ran it, and an
  error icon with the reason when it failed, expired or no device owns it; a failure also reaches
  the snackbar.
- Changed: the generated contract models follow RIoT2.Core 1.19.0: `PackageManifest` gains the
  optional `coreVersion` and `sha256` ([I35](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-3-4.md#i35-verified-plugin-updates-m)). No behaviour change.

## [1.7.0] - 2026-11-02

The optional security mode's seams ([I34](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-2.md#i34-security-seams-with-the-mode-fixed-at-off-m), [design 7.5](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/design/security-mode.md) phase S0). No port, user, volume or MQTT
changes; without `ORCHESTRATOR_UPSTREAM` the UI works exactly as before.

- Added: `ORCHESTRATOR_UPSTREAM` (for example `http://orchestrator:8080`). `entrypoint.sh` writes
  an nginx proxy for `/api/` and `/realtime` to it (backup uploads up to 64 MB); without it both
  answer 404. A value with a path stops the container. The compose install sets it.
- Added: on load the UI reads `GET /api/security/info` on its own origin. When it answers (the
  proxy is there), the UI calls the API on its own origin; otherwise at the configuration
  command's `apiBaseUrl`, as before. `npm run dev` proxies the same way when
  `ORCHESTRATOR_UPSTREAM` is set.
- Added: `RealtimeTransport` (`src/composables/realtime.ts`) chooses how live state arrives:
  `mqtt` (the MQTT service, unchanged), or `gateway` when the orchestrator reports it (a
  placeholder until the realtime gateway exists, I50).
- Changed: `SecurityInfo` in the generated contract models; `orchestratorStore` has `sameOrigin`
  and `configured` (the views wait for `configured`, as they waited for a non-empty `baseUrl`).
- Tests: `tests/entrypoint.test.cjs` runs `entrypoint.sh` with and without the upstream, and
  `nginx -t` on the result where nginx is installed (CI).

## [1.6.1] - 2026-11-02

Supply chain ([I33](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-2.md#i33-supply-chain-s)). No port, user, volume, variable or JSON changes.

- Build: the Dockerfile's base images are pinned by digest (`<image>:<tag>@sha256:...`), rebuilt on
  the current .NET 10 / base image patches. Renovate updates the digests.
- The image carries an SPDX SBOM and a provenance attestation; the tag now names an image index.
  `docker pull` and compose are unaffected.
- Build: `renovate.json` extends the shared Renovate preset ([I33](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-2.md#i33-supply-chain-s)). Renovate opens grouped
  update pull requests once the app is installed (MA7).

## [1.6.0] - 2026-11-02

Typed device parameters ([I30](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-2.md#i30-typed-device-options-m)). Works with RIoT2.Net.Orchestrator 1.7.0 or later; the typed
fields need a node on 1.11.0 and a plugin with typed options (Devices 1.4.0).

- Added: the node editor reads the online node's `parameterDefinitions` and shows each defined
  parameter, also one not set yet, with a typed field: a switch for Boolean, a number field for
  Integer and Number, a masked field with a reveal button for secrets, the default as placeholder,
  the description as hint, and a check like the node's (required, whole number, number). Other
  parameters, and every parameter of an offline node or older plugin, stay free text.
- Changed: devices added from a template are saved without the template's definitions.
- Added: `DeviceParameterType` in `enums.ts`, checked against the generated contract.

## [1.5.0] - 2026-11-01

Generated contract models ([I28](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-2.md#i28-narrow-references-and-generated-models-m), plans M1 step 5 and M3 UI step 4). Works with
RIoT2.Net.Orchestrator 1.7.0 or later, as 1.4.0; no request or message changes.

- Added: `npm run generate` (`scripts/generate-models.mjs`, with `json-schema-to-typescript`) writes
  `src/models/generated/contracts.ts` from RIoT2.Core's contract schema
  (`contracts/schemas/riot2-contracts.schema.json`, Core 1.14.0). `npm run build` runs it first;
  CI clones RIoT2.Core and fails when the committed file is out of date. The Docker build uses the
  committed file.
- Changed: the model classes that mirror a Core contract type (`Report`, `Command`, the report,
  command and variable templates, `DeviceConfiguration`, `NodeConfiguration`, `DeviceStatus`,
  `PackageManifest`, `ConfigurationCommand`) implement the generated types, and the enums are
  checked against the generated values, so a contract change fails the type check.
  `DeviceConfiguration` now carries `matterEndpoints` and `hash`, `ReportTemplate` its `model`.
- Changed: no `any` is left in `src/`. JSON values (report, command and variable values, template
  models, dashboard element properties) are `JsonValue`, read through `src/composables/jsonValue.ts`;
  ESLint's `no-explicit-any` is an error.
- Fixed: `npm run typecheck` and `npm run build` type-check again (`vue-tsc --build --force`).
  `vue-tsc --noEmit` checked nothing, because the root `tsconfig.json` lists no files; the check
  found a wrong `Report` import in `history.ts`.
- Fixed: adding a parameter to a device or a report template whose parameters were `null` threw;
  the editors create the parameter list instead.

## [1.4.0] - 2026-11-01

UI restructure and fixes ([I24](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-2.md#i24-ui-restructure-and-fixes-m), plan M3 UI steps 1–3, backlog items 10, 13, 21 and 22,
divergence D3). Works with RIoT2.Net.Orchestrator 1.7.0 or later, as 1.3.0.

- Fixed: the UI announces itself on every MQTT connection and again when the orchestrator comes
  back online (a live `riot2/orchestrator/online` with `isOnline: true`), so it no longer stays on
  "Connecting..." after a broker or orchestrator restart (backlog item 21).
- Changed: the presence and last will are camelCase (`{"isOnline":true,"name":…,"nodeType":2}`),
  like every other node's (D3). The orchestrator reads both casings.
- Fixed: the menu labels "Workflows" (was "Rules") and "Variables" (was "Varibles"), and
  "Persistent" in the variables view (was "Persistant") (backlog item 22). The stored property is
  still `isPersistant`.
- Added: deleting a variable (it showed "todo"). Closing the variable dialog no longer keeps
  unsaved edits in the list.
- Changed: a failed save keeps the node editor open and no longer reports "Node saved"; the error
  snackbar shows the orchestrator's reason.
- Changed: data access lives in Pinia stores (`src/stores/`: nodes, templates, variables,
  dashboard, commands, Matter, backup), each with `loading` and `error`. The API modules in
  `src/composables/api/` return promises and reject with an `ApiError`; `orchestratorService`, the
  provide/inject template keys and the `mitt` event bus are gone.
- Changed: `NodesView` is split into a node list, a node editor dialog, a device template picker
  and a device list, and `DeviceConfigurationComponent` into a parameters form and report and
  command template tables.
- Changed: every route loads its view on demand, and mqtt and Vue have chunks of their own: the
  main chunk is 181 kB (64 kB gzip) instead of 896 kB (backlog item 10).
- Added: ESLint (`npm run lint`, `eslint.config.mjs`: `eslint-plugin-vue` and `typescript-eslint`),
  run in CI and before a release. It found a missing space in the button component's colour
  picker attributes and a stray `v-if` on the context menu template.
- Removed: unused scaffolding (`stores/counter.ts`, `HelloWorld`, `TheWelcome`, `WelcomeItem`, the
  icon components, `AboutView` and its `/about` route) and the unused dashboard editor components.

## [1.3.0] - 2026-11-01

Needs RIoT2.Net.Orchestrator 1.7.0 or later ([I21](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-2.md#i21-backup-and-restore-m)).

- Added: a **Backup** page (menu *Backup*, `/backup`). *Download backup* saves a configuration
  backup, *Restore from file* restores one after a confirmation, and the list shows the
  orchestrator's saved backups (scheduled and pre-restore) to download or restore, with the
  schedule, the next run and the last result.
- Changed: an HTTP error message includes the orchestrator's reason (the problem `detail` or a
  text body), and `get`/`post` take optional axios request settings.

## [1.2.0] - 2026-10-14

Needs RIoT2.Net.Orchestrator 1.4.0 or later ([I15](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-2.md#i15-command-results-and-api-v2-m), backlog item 7).

- Changed: deleting a node or a variable uses `DELETE /api/v2/nodes/{id}` and
  `DELETE /api/v2/variables/{id}`, and the Matter page opens commissioning, refreshes devices and
  resets the bridge with `POST /api/v2/matter/...`, instead of the old state-changing `GET` routes.
  The HTTP client has a `delete` method for it.

## [1.1.0] - 2026-10-14

### Breaking

- The image now runs nginx as the non-root user `nginx` (UID 101) from
  `nginxinc/nginx-unprivileged:alpine` and **listens on port 8080 instead of 80**. Change the port
  mapping, for example `-p 80:8080`. The health check now probes `http://127.0.0.1:8080/`
  (backlog item S12, [I12](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-0-1.md#i12-one-command-install-s)). The stack's compose file in
  [deploy/](https://github.com/Revolutionized-IoT2/.github/tree/main/deploy) already uses it.

### Added

- Added `tests/contracts.test.cjs` ([I05](https://github.com/Revolutionized-IoT2/.github/blob/main/docs/increments/phase-0-1.md#i05-golden-files-and-route-contract-m)): every orchestrator URL in `constants.ts` must exist in
  the orchestrator's OpenAPI document with the method the UI uses, and the UI's MQTT handler
  reads the golden reports and configuration command. CI clones RIoT2.Core and
  RIoT2.Net.Orchestrator for the files.

- CI: every push runs `npm test`, `npm run build`, the image build and a secret scan; a tag
  validates before it pushes the image. The image build no longer receives the NuGet token.

## [1.0.1] - 2026-10-12

Tag `1.0.0` failed the Docker build and was never published.

- Changed the Docker build stage from Node 22 to Node 24 active LTS.
- Declared `vite-plugin-vuetify` as an explicit devDependency. It was previously only present as an
  optional peer of `vuetify`, which newer npm versions skip during `npm ci`, breaking the Docker build.
- Documentation: `AGENTS.md` is the AI instruction file, `CLAUDE.md` imports it, and release notes
  now live in this file.

## Earlier versions

Tags `0.1.0`–`0.1.9` exist. See `git log` and the tags; there are no release notes for them in the
existing docs.
