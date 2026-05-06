# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the `sabsorg/python3ide` GitHub repository. It currently contains one subproject:

- **`agentic-affiliate-agency/`** — A Node.js project scaffolded as an "Agentic Affiliate Agency" blueprint. As of initial setup, it contains only a `package.json` and a `README.md`; no source files, dependencies, tests, or build tooling have been added yet.

## Current State

The project is at its earliest scaffold stage. The `package.json` defines no dependencies and no functional scripts (`test` exits with an error by default). When adding features, establish the project structure (entry point, source directories, tooling) before implementing business logic.

## Branch Conventions

Feature branches follow the pattern `claude/<description>-<id>` (e.g., `claude/setup-affiliate-agency-dYrSC`). Always develop on the designated branch and push to `origin` with `-u`.
