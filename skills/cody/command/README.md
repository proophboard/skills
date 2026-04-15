# cody-command

> Define Command element details for the Cody Engine low-code platform.

## Overview

This skill teaches AI agents how to create detailed specifications for **Command** elements in [Cody Engine](https://wiki.prooph-board.com/board_workspace/Cody-Engine.html), the low-code platform behind prooph board.

**Important:** This is a Cody Engine-specific skill. It is only useful if you work with the Cody Engine to generate applications from Event Models. If you use prooph board purely for Event Modeling without Cody Engine, this skill does not apply to you.

A Command in Cody Engine represents a **business action that changes persistent system state**. The skill covers how to define the full command specification including input schema, UI form schema, dependencies, command handler rules, and configuration metadata.

## What This Skill Covers

- **Command Type Declaration** — Aggregate command classification
- **Schema** — Input data structure and validation using `cody-schema` blocks
- **UI Schema** — Form presentation and widget configuration using `cody-ui-schema` blocks
- **Dependencies** — External data requirements for command execution
- **Command Handler Rules** — Business logic using the Rule Engine (`cody-rules`)
- **Configuration Metadata** — Aggregate and stream behavior flags

## Why This Skill

- **Consistency** — Ensures all command elements follow the same structure and naming conventions
- **Completeness** — Guides the agent to include all required sections (schema, rules, metadata)
- **Rule Engine knowledge** — Teaches proper use of JEXL expressions and rule engine actions

## When to Use

| ✅ Use This Skill | ❌ Skip It |
|---|---|
| Modeling command details for Cody Engine applications | Using prooph board for Event Modeling only (no Cody Engine) |
| Defining input validation and form schemas | General code generation for other frameworks |
| Specifying command handler business rules | Without knowledge of the Cody Engine Rule Engine |

## Usage

Once installed, your AI agent will know how to create structured command specifications with all required `cody-*` code blocks.

### Examples

<!-- Add screenshots here -->
<!-- ![Command example](_assets/example.png) -->

## Prerequisites

- Familiarity with the [Cody Engine](https://wiki.prooph-board.com/board_workspace/Cody-Engine.html) low-code platform
- Understanding of Event Sourcing and the Command → Event pattern
- Knowledge of the [Rule Engine](https://wiki.prooph-board.com/board_workspace/Rule-Engine.html) and [JEXL expressions](https://wiki.prooph-board.com/board_workspace/Expressions.html)
