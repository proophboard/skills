# cody-information

> Define Information (read model) element details for the Cody Engine low-code platform.

## Overview

This skill teaches AI agents how to create detailed specifications for **Information** elements in [Cody Engine](https://wiki.prooph-board.com/board_workspace/Cody-Engine.html), the low-code platform behind prooph board.

**Important:** This is a Cody Engine-specific skill. It is only useful if you work with the Cody Engine to generate applications from Event Models. If you use prooph board purely for Event Modeling without Cody Engine, this skill does not apply to you.

An Information element in Cody Engine represents **data that can be read from the system** — including queries, read models, and UI data bindings. The skill covers schemas, UI presentation, query resolvers, projections, and configuration metadata.

## What This Skill Covers

- **Schema** — Data structure for single entities and lists using `cody-schema` blocks
- **UI Schema** — Table and form presentation using `cody-ui-schema` blocks
- **Query Schema & Resolver** — Input parameters and data fetching rules using `cody-query-schema` and `cody-resolve` blocks
- **Configuration Metadata** — Collection and entity metadata using `cody-metadata` blocks
- **Initialize Rules** — Default value initialization for new items
- **Projections** — Event-sourced read models using `cody-projection` blocks

## Why This Skill

- **Complete read model specs** — Covers everything from data structure to UI presentation to query logic
- **Projection patterns** — Teaches how to build read models from events using the Rule Engine
- **UI integration** — Ensures information elements include proper table and form configurations

## When to Use

| ✅ Use This Skill | ❌ Skip It |
|---|---|
| Modeling information elements for Cody Engine applications | Using prooph board for Event Modeling only (no Cody Engine) |
| Defining queryable data and read models | General code generation for other frameworks |
| Without knowledge of the Cody Engine Rule Engine | |

## Usage

Once installed, your AI agent will know how to create structured information specifications with schema, UI configuration, query resolvers, and projections.

### Examples

<!-- Add screenshots here -->
<!-- ![Information example](_assets/example.png) -->

## Prerequisites

- Familiarity with the [Cody Engine](https://wiki.prooph-board.com/board_workspace/Cody-Engine.html) low-code platform
- Understanding of read models and CQRS patterns
- Knowledge of the [Rule Engine](https://wiki.prooph-board.com/board_workspace/Rule-Engine.html) and [JEXL expressions](https://wiki.prooph-board.com/board_workspace/Expressions.html)
