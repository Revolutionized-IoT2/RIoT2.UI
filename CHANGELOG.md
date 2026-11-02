# Changelog

All notable changes to `RIoT2.UI`. A versioned container image is released by pushing a `*.*.*`
git tag; CI publishes `ghcr.io/revolutionized-iot2/riot2-ui:latest` and `:<tag>`.

## [Unreleased]

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
