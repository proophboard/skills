# Changelog

## 2026-10-04

### Updated Skills

#### Skill: Event Modeling v1.8.0

**Description vs. Details — what goes where, and why the sidebar is not a longer card.** The skill said only "write a short description" and "DO NOT WRITE TO ELEMENT DETAILS. Details are reserved for deep modeling", which states the restriction without ever stating the split. A reader told that details are off-limits in this skill never learns what they are *for*, and a reader who does write them has no rule for choosing between the two fields. Adds a section covering the description as the condensed card text — the information flow in business language, with examples and sample data welcome — and the details as the element's long-form specification: schema, configuration, API endpoints, rules. It names the sidebar's auto-generated table of contents, its extended Markdown, and `:::element` references. Adds the scope table — description local to the placement, details shared by every similar element (name + type + context) — and the two consequences that follow from it: a step-specific example belongs in the description, and `details` is shared state that must be read before it is written. The Structure rule gains a pointer, so "details are reserved" and "this is what details are for" no longer read as a contradiction.

## 2026-09-23

### Updated Skills

#### Skill: Event Modeling v1.7.0

**Element sync's inputs changed under us: `context` is now editable, and `copy_element` inherits its source's context.** The skill's repair path for unsynchronized elements was "remove and re-add, because a copy takes the *target* chapter's context" — true of the old server, wrong now. `copy_element` defaults the copy to the **source element's** context, and a wrong context is fixed in place with `update_element(context:)` or `update_chapter(context:)`, the latter cascading to the elements that shared the old chapter context (an element deliberately carrying another context is left alone). The Sync section is rewritten around that, and the identity key now includes `type`: name + type + context is what makes two elements one.

**`details` shared, `description` per-placement — stated as the model, not the symptom.** The old text described "the merge is asymmetric, only the first placement's details survived" as an observed oddity. The server documents it: elements sharing name + type + context synchronise their `details` field, a copy inherits the shared details of the matching element already in that context, and `description` is never shared. Same practical rule, but now the reader knows why.

**`get_chapter` does have a metadata-only mode.** The previous entry asserted it had none. `structure_only: true` strips lane and slice details, and `slice_ids` now strips the `details` of non-matching slices too — so the "tens of thousands of tokens" warning was overstated for filtered reads. Added `search_elements(detail: 'none' | 'summary' | 'full')` as the element-level equivalent.

**Verified against the server, not the message.** Every signature above was read off the live `tools/list` (prooph-board-mcp 1.0.0, 2026-09-23), which corrected two things the feedback text left loose: the chapter cascade reaches the elements sharing the *old chapter context* (not literally all of them), and a copy inherits the *matching element's* details rather than "the first-created placement winning a merge".

#### Skill: Slice Scenarios v1.1.0

**Reference validation.** The skill documents `:::element` syntax but had no check that a reference resolves. Adds the two-tier rule that caught real defects on a production board: FAIL when a name matches no element anywhere in the chapter (a dangling reference), WARN when it matches one in a different slice (legitimate for `Given`, worth confirming). Both verdicts are reachable from the cheap reads — `get_chapter(structure_only: true)` or `search_elements(detail: 'none')`.

## 2026-08-18

### Updated Skills

#### Skill: Event Modeling v1.6.0

**Hot Spot semantics.** This skill defines Hot Spots as open questions, while `slice-scenarios` uses them as runtime failure states in a scenario's Then. Both are legitimate and the element is the same red sticky, but conflating them makes a failure-state Hot Spot look like an unresolved question and vice versa. Adds a table separating them by meaning, author, content, lifecycle, and whether they block a completeness gate.

**Amending shipped chapters.** Every existing rule assumes greenfield modeling. Adds a section for the case where production taught you something the model didn't know:
- a deployed status is not evidence the slice is still correct
- the board routinely disagrees with itself across slice details / element details / comments
- details fields must never be blind-written, because they replace wholesale
- the chapter's downstream artifacts (manifest, spec, superseded ADR) go stale silently

**`get_element` now exists.** The stub-resolution paragraph says "fetch the complete text for that element from the live board", which was the only option when it was written. Naming the tool makes it actionable.

**`get_chapter` has no metadata-only mode**, and its `slice_ids` filter narrows *elements* only — lanes and slices always come back whole, and an id matching nothing does not suppress them. I read the existing text as implying a cheap structural read was available, called it speculatively on a mature chapter, and got ~30k tokens of Given/When/Then back. Worth stating so the next agent budgets for it.

## 2026-07-28

### Updated Skills

#### Skill: Event Modeling v1.5.0

- clarified that a conditional outcome of one trigger is sibling slices in the same chapter, while
  a genuinely divergent journey is a separate chapter
- documented the four slice types explicitly, including Event Reaction and the `add_event_reaction`
  tool
- added a Validation Checklist for Critic mode and as the final step of the modeling order


## 2026-06-29

### Updated Skills

#### Skill: Animal Shelter Academy v0.2.0

- added a coaching sub skill for Event Modeling


## 2026-06-26

### New Skills

#### Skill: Schema v1.0.0

- New skill to add a schema definition to commands, events, and information

#### Skill: Animal Shelter Academy v0.1.0

A training ground for Event Modeling on [prooph board](https://prooph-board.com)

Meet the characters of the [Animal Shelter story](https://www.linkedin.com/posts/alexander-miertsch-prooph-board_businessseriesmodeling-businessseriesmodeling-share-7470224109180907521-ofYG)

## 2026-06-05

### Updated Skills

#### modeling/example-data v1.2.0

- updated slice resize instruction to take new cell padding into account when resizing


## 2026-04-28

### Updated Skills

#### modeling/event-modeling v1.4.0

- Added rules for multiple consecutive slices
  - Event -> multiple read slices
  - UI/Automation -> multiple write slices
  - Command -> multiple Events

## 2026-04-23

### New Skills

#### Skill: navigation v1.0.0

- New skill for parsing and generating deeplinks for prooph board
- Teaches agents to extract identifiers from deeplinks and retrieve chapter data via MCP tools
- Focuses responses on specific elements or slices referenced in deeplinks
- Generates precise navigation links when referencing modeling issues or elements
- Author: prooph software GmbH

## 2026-04-20

### Updated Skills

#### Skill: modeling/example-data v1.1.0

- Added a rule to resize the element's slice if needed

#### Skill modeling/event-modeling v1.3.0

- Added new section: Event Reaction Slice

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
