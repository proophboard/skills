# cody-ui

> Define UI (page/screen) element details for the Cody Engine low-code platform.

## Overview

This skill teaches AI agents how to create detailed specifications for **UI** elements in [Cody Engine](https://wiki.prooph-board.com/board_workspace/Cody-Engine.html), the low-code platform behind prooph board.

**Important:** This is a Cody Engine-specific skill. It is only useful if you work with the Cody Engine to generate applications from Event Models. If you use prooph board purely for Event Modeling without Cody Engine, this skill does not apply to you.

A UI element in Cody Engine represents a **page or screen** in the application. The skill covers how to define page metadata (routes, breadcrumbs), sidebar navigation, data views, action buttons, and their configurations.

## What This Skill Covers

- **Page Metadata** — Route, breadcrumb, title, and parent relationships using `cody-metadata` blocks
- **Sidebar Configuration** — Navigation menu entries for top-level pages using `cody-sidebar` blocks
- **Views Configuration** — Data views and their UI schemas using `cody-views` blocks
- **Actions/Commands** — Buttons and interactions on the page using `cody-commands` blocks

## Why This Skill

- **Complete page specs** — Covers routing, navigation, data binding, and user actions
- **UI patterns** — Teaches proper use of dialog pages, sub-level pages, form redirects, and table views
- **Cody Engine integration** — Ensures all UI elements follow the Cody Engine page model and expression syntax

## When to Use

| ✅ Use This Skill | ❌ Skip It |
|---|---|
| Modeling UI elements for Cody Engine applications | Using prooph board for Event Modeling only (no Cody Engine) |
| Defining application pages, forms, and navigation | General code generation for other frameworks |
| Without knowledge of the Cody Engine UI model | |

## Usage

Once installed, your AI agent will know how to create structured UI element specifications with page metadata, views, action buttons, and sidebar configuration.

### Examples

<!-- Add screenshots here -->
<!-- ![UI example](_assets/example.png) -->

## Prerequisites

- Familiarity with the [Cody Engine](https://wiki.prooph-board.com/board_workspace/Cody-Engine.html) low-code platform
- Understanding of page routing and navigation patterns
- Knowledge of [JEXL expressions](https://wiki.prooph-board.com/board_workspace/Expressions.html) for data binding
