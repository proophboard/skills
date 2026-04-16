# Changelog

## 2026-04-16

### New Skills

#### Skill: axon5kotlin-write-slice v1.0.0

- New skill for generating Kotlin write slices (Command → decide → Events → evolve → State) from prooph board Event Modeling slices
- Covers Spring Boot and Explicit Registration patterns, single-tag and multi-tag DCB, value objects, feature flags, and Given-When-Then tests with AxonTestFixture
- Supports migrating Axon Framework 4 aggregates to Axon Framework 5
- Author: Mateusz Nowak

#### Skill: axon5kotlin-read-slice v1.0.0

- New skill for generating Kotlin read slices (Events → Projection → JPA ReadModel → QueryHandler → REST API) from prooph board Event Modeling slices
- Covers Spring Boot integration tests with AxonTestFixture, RestAssured REST API tests, JPA projections, and Given-When-Then scenario mapping
- Author: Mateusz Nowak

#### Skill: axon5kotlin-automation-slice v1.0.0

- New skill for generating Kotlin automation slices (Event → CommandDispatcher) from prooph board Event Modeling slices
- Covers stateless and read-model-backed automations, CommandDispatcher usage, SequencingPolicy, and Spring Boot integration tests with AxonTestFixture
- Author: Mateusz Nowak

#### Skill: wireframe-sketch v1.0.0

- New skill for creating hand-drawn style SVG wireframes with sketchy aesthetics
- Generates professional-looking wireframes that render inline in the browser
- Includes validation rules to prevent layout overlap and ensure proper element spacing
- Higher token cost than ASCII mockups but better suited for non-technical stakeholders
- Author: prooph software GmbH

## 2026-04-13

### New Skills

#### Skill: example-data v1.0.0

- New skill for adding concrete YAML example data to Command, Event, and Information element descriptions
- Covers why example data helps business stakeholders, when to use it, and best practices for showing state changes

#### Skill: ascii-mockups v1.0.0

- New skill for creating ASCII mockups in UI element descriptions
- Covers mockup patterns for state variations, dashboards, and blocked/disabled states
- Includes alternative markdown tables for list views

### Updated Skills

#### Skill: event-modeling v1.2.0

- Removed detailed example data patterns (moved to `example-data` skill)
- Removed detailed ASCII mockup patterns (moved to `ascii-mockups` skill)
- Removed Given-When-Then scenario patterns (moved to `slice-scenarios` skill)
- Added **Element Descriptions** section linking to the three dedicated skills for richer documentation patterns
- Simplified and sharpened the skill

#### All Skills

- Added `tags` array to all `skill.json` files for catalog browsing and filtering
- Added user-facing `README.md` to every skill with overview, pros/cons, when-to-use guidance, and screenshot placeholders

## 2026-04-11

### Skill: event-modeling v1.1.0

- Added automation slice as an explicit slice type
- Defined the rules for handling events as input/output of automations

### Skill: element-description v1.0.1

- Added name + description metadata to the skill

### Skill: slice-scenarios v1.0.1

- Added name + description metadata to the skill
