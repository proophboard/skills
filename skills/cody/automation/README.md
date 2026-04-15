# cody-automation

> Define Automation element details for the Cody Engine low-code platform.

## Overview

This skill teaches AI agents how to create detailed specifications for **Automation** elements in [Cody Engine](https://wiki.prooph-board.com/board_workspace/Cody-Engine.html), the low-code platform behind prooph board.

**Important:** This is a Cody Engine-specific skill. It is only useful if you work with the Cody Engine to generate applications from Event Models. If you use prooph board purely for Event Modeling without Cody Engine, this skill does not apply to you.

An Automation in Cody Engine represents an **automated reaction to events**. The skill covers how to define event reactions, dependencies on external data, and automation rules using the Rule Engine — including command triggers, user lookups, scheduled notifications, and batch processing.

## What This Skill Covers

- **Event Reaction Declaration** — Marks the automation as reacting to events in the chapter flow
- **Dependencies** — External data requirements (queries, services) using `cody-dependencies` blocks
- **Automation Rules** — Event handling logic using `cody-rules` blocks and the Rule Engine, including `trigger`, `lookup`, `forEach`, `assign`, and `log` actions

## Why This Skill

- **Complete automation specs** — Covers event reactions, data dependencies, and rule-based logic
- **Notification patterns** — Teaches proper use of severity levels, scheduling, and deduplication tags
- **Rule Engine knowledge** — Guides the agent through trigger, lookup, and forEach patterns

## When to Use

| ✅ Use This Skill | ❌ Skip It |
|---|---|
| Modeling automation elements for Cody Engine applications | Using prooph board for Event Modeling only (no Cody Engine) |
| Defining event-triggered automated reactions | General code generation for other frameworks |
| Without knowledge of the Cody Engine Rule Engine | |

## Usage

Once installed, your AI agent will know how to create structured automation specifications with dependencies and Rule Engine rules for event reactions, notifications, and scheduled tasks.

### Examples

<!-- Add screenshots here -->
<!-- ![Automation example](_assets/example.png) -->

## Prerequisites

- Familiarity with the [Cody Engine](https://wiki.prooph-board.com/board_workspace/Cody-Engine.html) low-code platform
- Understanding of event-driven automation patterns
- Knowledge of the [Rule Engine](https://wiki.prooph-board.com/board_workspace/Rule-Engine.html) and [JEXL expressions](https://wiki.prooph-board.com/board_workspace/Expressions.html)
