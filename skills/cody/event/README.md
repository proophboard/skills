# cody-event

> Define Event element details for the Cody Engine low-code platform.

## Overview

This skill teaches AI agents how to create detailed specifications for **Event** elements in [Cody Engine](https://wiki.prooph-board.com/board_workspace/Cody-Engine.html), the low-code platform behind prooph board.

**Important:** This is a Cody Engine-specific skill. It is only useful if you work with the Cody Engine to generate applications from Event Models. If you use prooph board purely for Event Modeling without Cody Engine, this skill does not apply to you.

An Event in Cody Engine represents a **business fact that became true** as the result of a command. The skill covers how to define the event payload schema, state apply rules that update the aggregate, and configuration metadata.

## What This Skill Covers

- **Event Type Declaration** — Aggregate event classification
- **Schema** — Event data structure using `cody-schema` blocks
- **State Apply Rules** — How the event updates aggregate state using `cody-apply-rules` blocks and the Rule Engine
- **Configuration Metadata** — Event visibility and aggregate flags

## Why This Skill

- **Correct state transitions** — Guides the agent to choose the right state apply pattern (merge, partial update, complete replace)
- **Consistent schemas** — Ensures event payloads follow the same type system as commands
- **Rule Engine knowledge** — Teaches proper use of `assign` actions and JEXL expressions in apply rules

## When to Use

| ✅ Use This Skill | ❌ Skip It |
|---|---|
| Modeling event details for Cody Engine applications | Using prooph board for Event Modeling only (no Cody Engine) |
| Defining how events mutate aggregate state | General code generation for other frameworks |
| Without knowledge of the Cody Engine Rule Engine | |

## Usage

Once installed, your AI agent will know how to create structured event specifications with schema, state apply rules, and metadata.

### Examples

<!-- Add screenshots here -->
<!-- ![Event example](_assets/example.png) -->

## Prerequisites

- Familiarity with the [Cody Engine](https://wiki.prooph-board.com/board_workspace/Cody-Engine.html) low-code platform
- Understanding of Event Sourcing and aggregate state
- Knowledge of the [Rule Engine](https://wiki.prooph-board.com/board_workspace/Rule-Engine.html) and [JEXL expressions](https://wiki.prooph-board.com/board_workspace/Expressions.html)
