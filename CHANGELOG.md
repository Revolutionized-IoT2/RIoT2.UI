# Changelog

All notable changes to `RIoT2.UI`. A versioned container image is released by pushing a `*.*.*`
git tag; CI publishes `ghcr.io/revolutionized-iot2/riot2-ui:latest` and `:<tag>`.

## [Unreleased]

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
