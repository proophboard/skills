# Event Modeling

> Core guidelines for creating Event Models on prooph board.

## Overview

Event Modeling is a visual technique for mapping out **business information flow and domain state changes**. This skill teaches AI agents the fundamental rules of building valid Event Models on prooph board — from element types and slice structure to command eligibility and anti-patterns.

Think of this skill as the foundation. When you need detailed patterns for specific elements (like example data or ASCII mockups), install the dedicated skills alongside it.

## Why Event Modeling

- **Shared understanding** — Visual models that business stakeholders and developers can both read
- **Domain clarity** — Forces you to think about what actually happens in the business, not how it's technically implemented
- **Early risk detection** — Uncovers missing requirements and ambiguous rules before development starts

## When to Use

| ✅ Use Event Modeling | ❌ Don't Use It |
|---|---|
| Mapping business processes | Technical architecture diagrams |
| Exploring domain complexity | UI wireframing or interaction design |
| Aligning stakeholders on workflows | Database schema design |
| Identifying missing requirements | API endpoint documentation |

## Usage

Once installed, your AI agent will understand the rules for:

- **Commands** — Business actions that change persistent state
- **Events** — Facts that became true
- **Information** — Data read from the system
- **UI** — Screens and views
- **Automation** — Automated actors
- **Hot Spots** — Open questions and uncertainties

### Examples

<!-- Add screenshots here -->

<!-- Example 1: Complete event model -->
<!-- ![Complete event model](_assets/example-model.png) -->

<!-- Example 2: Write slice -->
<!-- ![Write slice](_assets/example-write-slice.png) -->

<!-- Example 3: Hot Spot usage -->
<!-- ![Hot Spot](_assets/example-hotspot.png) -->

## Related Skills

| Skill | Purpose |
|---|---|
| **example-data** | Adding concrete YAML examples to element descriptions |
| **ascii-mockups** | Creating text-based UI mockups in element descriptions |
| **slice-scenarios** | Writing Given-When-Then scenarios for slice documentation |

Install these alongside Event Modeling for richer element descriptions.
