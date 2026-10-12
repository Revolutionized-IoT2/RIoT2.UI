# Changelog

All notable changes to `RIoT2.UI`. A versioned container image is released by pushing a `*.*.*`
git tag; CI publishes `ghcr.io/revolutionized-iot2/riot2-ui:latest` and `:<tag>`.

## [Unreleased]

- Changed the Docker build stage from Node 22 to Node 24 active LTS.
- Declared `vite-plugin-vuetify` as an explicit devDependency. It was previously only present as an
  optional peer of `vuetify`, which newer npm versions skip during `npm ci`, breaking the Docker build.
- Documentation: `AGENTS.md` is the AI instruction file, `CLAUDE.md` imports it, and release notes
  now live in this file.

## Earlier versions

Tags `0.1.0`–`0.1.9` exist. See `git log` and the tags; there are no release notes for them in the
existing docs.
