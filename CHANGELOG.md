# Changelog

All notable changes to `RIoT2.UI`. A versioned container image is released by pushing a `*.*.*`
git tag; CI publishes `ghcr.io/revolutionized-iot2/riot2-ui:latest` and `:<tag>`.

## [Unreleased]

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
