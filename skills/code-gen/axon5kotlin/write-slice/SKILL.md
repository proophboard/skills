---
name: axon5kotlin-write-slice
description: >
  Implement Event Sourcing write slices using Axon Framework 5, Vertical Slice Architecture, and
  Event Modeling patterns. A write slice is: Command → decide → Events → evolve → State.
  Use when: (1) implementing a new write slice / command handler in an AF5 Kotlin project,
  (2) migrating/porting a write slice from Axon Framework 4 (Java or Kotlin) to AF5,
  (3) user provides a specification, Event Modeling artifact, existing tests, or natural language
  description of a command and asks to implement it,
  (4) user says "implement", "create", "add", "migrate", "port" a write slice, command handler,
  or aggregate behavior in an Axon Framework 5 / Vertical Slice Architecture project.
  Understands AF4 aggregate-based input as one possible source format.
---

# Axon Framework 5 — Write Slice

## Relationship to prooph board Event Modeling

This skill implements the **write slice (blue stripe)** from a prooph board Event Modeling board.
It consumes:
- The slice's `## Business Rules` section — used as input for `decide()` logic
- The slice's `## Scenarios (GWTs)` section (written with the `slice-scenarios` skill) — mapped to test methods
- The slice's optional `## Implementation Guidelines` — technical requirements that extend the standard pattern

## Step 0: Discover Target Project Conventions

Before writing any code, read the target project's context file (e.g., `CLAUDE.md`, `AGENTS.md`, `.cursorrules`) and
explore at least one existing write slice. Conventions vary. Look for:

- File naming (`FeatureName.Slice.kt` vs separate files)
- Section markers (Domain / Application / Presentation comment blocks)
- Visibility modifiers on State, Command, handler, REST classes
- Event definitions (value objects vs primitives, marker interfaces, `@EventTag`)
- Metadata handling — how correlation IDs are attached to commands and events. Refer to
  [references/kotlin-extensions.md](references/kotlin-extensions.md) for `AxonMetadata` helpers that avoid name
  collisions with other `Metadata` types in the project.
- Imports and package structure

Identify the established convention for each of the following. If unclear, see steps below:

- **Command handler registration style** (Step 3b)
- **REST API exposure** (Step 4)
- **Feature flag approach** (Step 5)

## Step 1: Understand the Input

Input can arrive in many forms. Extract these elements regardless of format:

| Element                  | What to extract                                                      |
|--------------------------|----------------------------------------------------------------------|
| **Command**              | Name, properties, which property identifies the consistency boundary |
| **Events**               | Names, properties, which events this command produces                |
| **Business rules**       | Preconditions, invariants, idempotency behavior                      |
| **State needed**         | What prior events must be replayed to evaluate rules                 |
| **Consistency boundary** | Single tag (one stream) or multi-tag (DCB across streams)            |

### Input: Specification / Natural Language

Extract command name, events, and business rules directly from the description.

### Input: Existing Tests

Analyze test file to understand expected behavior: commands sent, events asserted, failure cases.

### Input: Event Modeling Artifact

The write slice (blue stripe) shows: Command on left, Events on right, State (read model) below.

**Optionally**, the slice details may contain:
- `## Business Rules` — invariants and preconditions for `decide()` implementation
- `## Scenarios (GWTs)` — Given-When-Then acceptance criteria using `:::element` blocks

When GWT scenarios are present, each numbered scenario maps 1:1 to a test method. Properties in `:::element` blocks
are **only rule-relevant** — fill remaining constructor params with test fixture values.

If the slice details contain `## Implementation Guidelines`, **follow them** — they describe specific technical
requirements that go beyond the standard slice pattern.

### Input: Axon Framework 4 Code

Read the AF4 source: command class, aggregate class, events, domain rules, REST API.
See [references/af4-input-mapping.md](references/af4-input-mapping.md) for concept-by-concept translation.

**If requirements are unclear, ask the user before proceeding.**

## Step 2: Choose the AF5 Pattern

**Spring Boot** — entity and handler auto-discovered by Spring:

- `@EventSourced(tagKey = "tagName")` on entity (single tag) or `@EventSourcedEntity` + `@EventCriteriaBuilder` (multi-tag)
- Handler class is `@Component`
- Tested with `@AxonSpringBootTest` (`org.axonframework.extension.springboot.test.AxonSpringBootTest`)
- **Default choice** when the project uses Spring Boot

**Explicit Registration** — entity and handler registered manually via `@Configuration`:

- `@EventSourcedEntity` on entity
- `@EventCriteriaBuilder` companion method on entity
- `@Configuration` class with `EntityModule` + `CommandHandlingModule` beans
- Tested with non-Spring Boot unit test (`axonTestFixture` + `configSlice`)
- Use when: user explicitly asks for unit tests without Spring context

Both patterns support single-tag and multi-tag (DCB). The difference is registration mechanism, not tag cardinality.

See [references/af5-write-slice-patterns.md](references/af5-write-slice-patterns.md) for complete patterns.

## Step 3: Implement the Domain (decide + evolve)

Create `FeatureName.Slice.kt` with the Domain section:

```
////////////////////////////////////////////
////////// Domain
///////////////////////////////////////////
// 1. Command data class (public)
// 2. State data class (private) + initialState
// 3. decide(command, state): List<Event>  -- pure function
// 4. evolve(state, event): State          -- pure function
```

Key rules for domain components:

**Command**: Plain data class. Public. Add `@get:JvmName` on properties whose names match their type pattern.
Annotate with `@Command(namespace = "<BoundedContext>", name = "<CommandName>", version = "1.0.0")` — import
from `org.axonframework.messaging.commandhandling.annotation.Command`.

**State**: Private. Immutable data class. Contains ONLY fields needed by `decide()`. Companion `initialState` val.

**decide()**: Private standalone function. Takes `(command, state)`, returns event(s). No side effects. Enforce
rules here: throw `IllegalStateException` for violations, return `emptyList()` for idempotent no-ops.

**evolve()**: Private standalone function. Takes `(state, event)`, returns new State. Uses `when (event: SealedType)`
over the sealed interface.

**⚠️ ABSOLUTE RULE: NEVER use `else ->` in `evolve()`.** Every sealed subtype MUST have an explicit branch — even
no-ops (`is SomeEvent -> state`). Before writing `evolve()`:

1. **Find and read the bounded context's sealed event interface** (e.g., `{Context}Event`)
2. **List ALL concrete subtypes** that implement it
3. **Write an explicit `is` branch for EVERY subtype** — mutating branches with `state.copy(...)`, no-op branches
   with `-> state` and a comment explaining why

This ensures compile-time safety: adding a new event to the sealed interface breaks every slice using that type,
forcing a deliberate update.

**`@EventSourcingHandler` is ONLY added for events that actually mutate state** — no-op branches (`-> state`) must
NOT have a corresponding handler. **When any branch mutates state, add a test for that transition (see Step 6).**

**Exception: `else ->` IS allowed for non-sealed interfaces.** Cross-module slices subscribing to events from
multiple bounded contexts via a non-sealed root event interface cannot use exhaustive `when`. In this case,
`else -> state` is the correct fallback. However, every subscribed event type must still be reviewed manually
when new events are added to any of the participating modules.

### Value Objects with Kotlin `value class`

When command or event properties represent constrained domain concepts, prefer wrapping them in `@JvmInline value class`
types with validation in the `init` block:

```kotlin
@JvmInline
value class Quantity(val raw: Int) {
    init { require(raw >= 0) { "Quantity must be non-negative, got $raw" } }
}
```

**When to introduce a value class:**
- The property has validation constraints (range, format, non-blank)
- The same concept appears in command, event, and state — avoids duplicating validation
- Using primitives would allow invalid states

**Add domain operations** (`next()`, `isLast`, `plus()`, etc.) to value classes so that `decide()` works entirely
with value objects and never unwraps to `.raw`. Reserve `.raw` for REST layer, cross-context mapping, serialization.

## Step 3b: Command Handler Registration

**Check the target project's convention first** — scan existing slices for `@CommandHandler`, `@InjectEntity`, and
`CommandHandlingModule` to determine the established pattern.

If no clear convention exists, ask the user:
> Which command-handler registration style does this project use?
> - **Separate `@Component` class + `@CommandHandler` method + `@InjectEntity`** (Spring Boot auto-discovery, default)
> - **Handler method colocated on the `@EventSourced` entity**
> - **Explicit registration via `CommandHandlingModule` in a `@Configuration`** (enables non-Spring unit tests)

See [references/command-handler-styles.md](references/command-handler-styles.md) for full examples of each style.

The Application section of the slice file hosts the entity and handler:

```
////////////////////////////////////////////
////////// Application
///////////////////////////////////////////
// 5. @EventSourced entity class (wraps State, has @EventSourcingHandler methods)
// 6. Command handler (style depends on Step 3b)
// 7. @Configuration if Explicit Registration pattern
```

In `@EventCriteriaBuilder` methods, `.andBeingOneOfTypes(...)` **MUST use `"Namespace.Name"` strings**
(e.g., `"Ordering.OrderPlaced"`), NEVER `ClassName::class.java.getName()`. The type name is the `@Event`
annotation's `namespace` + `"."` + `name`.

## Step 4: REST API Exposure (Optional)

**Check the target project's convention first** — does it expose commands via REST (`@RestController` presence)?

If no convention is established, ask the user:
> How will this command be triggered?
> - **REST API** — exposed via HTTP endpoint (add Presentation section + REST API test)
> - **Automation only** — dispatched internally by an event handler (no REST, no Presentation section)
> - **Both** — exposed via REST API and also dispatched by automations

If REST is chosen, add the Presentation section:

```
////////////////////////////////////////////
////////// Presentation (only if REST API trigger)
///////////////////////////////////////////
// 8. @RestController (Body DTO, sends command via CommandGateway)
```

See [references/rest-api-patterns.md](references/rest-api-patterns.md) for REST controller and RestAssured test examples.

## Step 4a: Ensure Events Exist

Before implementing the slice, check the bounded context's events package. If events don't exist yet, create them
**first** — the slice file depends on them.

### Event Hierarchy

Recommended hierarchy (check what the target project already uses):

```
DomainEvent                        ← root marker (project-defined, e.g. in sdk/shared module)
  └─ {Context}Event                ← sealed interface per bounded context ({context}/events/)
       └─ {ConcreteEvent}          ← data class ({context}/events/)
```

`DomainEvent` is a simple project-defined marker interface (not AF5 itself). Encourage its use in new projects.

### Context Event Interface (if it doesn't exist)

```kotlin
// File: {context}/events/{Context}Event.kt
sealed interface {Context}Event : DomainEvent {
    @get:EventTag(EventTags.{TAG_CONSTANT})
    val {tagProperty}: {IdType}
}
```

The `@get:EventTag` on the sealed interface means all implementing events automatically inherit the tag.
Also ensure the tag constant exists in the project's `EventTags` object.

### Concrete Event Classes

```kotlin
// File: {context}/events/{EventName}.kt
@Event(namespace = "{Context}", name = "{EventName}", version = "1.0.0")
data class {EventName}(
    override val {tagProperty}: {IdType},  // inherited from sealed interface
    val property1: ValueType1
) : {Context}Event
```

Key rules:
- `@Event(namespace, name, version)` — import from `org.axonframework.messaging.eventhandling.annotation.Event`
- `namespace` = bounded context name, `name` = class name, `version` = `"1.0.0"` for new events
- Use value object types for properties; the tag property is `override val`

### Additional Tags on Events (DCB)

When an event participates in a **Dynamic Consistency Boundary** spanning multiple streams, add extra `@EventTag`
annotations on the concrete event's properties for cross-stream filtering.

## Step 5: Feature Flags (Optional)

**Check the target project's convention first** — scan existing slices for `@ConditionalOnProperty`, `@Profile`, or
custom feature-flag integrations.

If no clear convention exists, ask the user:
> How should slice-level feature flags be managed?
> - **`@ConditionalOnProperty`** (Spring Boot default)
> - **Custom flag library** (FF4J, Unleash, LaunchDarkly, etc.)
> - **No feature flags** — ship all slices unconditionally

See [references/feature-flag-patterns.md](references/feature-flag-patterns.md) for the full `@ConditionalOnProperty`
example (entity, handler, REST controller, `application.yaml`, `additional-spring-configuration-metadata.json`)
and alternatives.

## Step 6: Implement Tests

The `AxonTestFixture` Kotlin DSL (`Given { } When { } Then { }`) must be copied into the project's test sources —
it is not yet published as a standalone library. See [references/axon-test-fixture-kotlin-dsl.md](references/axon-test-fixture-kotlin-dsl.md)
for the full source and instructions.

For `AxonMetadata` — use the typealias from [references/kotlin-extensions.md](references/kotlin-extensions.md)
to avoid name collisions.

### 6a. Slice Tests (domain logic via Given-When-Then)

Two approaches:

- **Spring Boot test** — uses `@AxonSpringBootTest` (`org.axonframework.extension.springboot.test.AxonSpringBootTest`)
  with `AxonTestFixture` injected via constructor. Check if the project defines a meta-annotation that wraps
  `@AxonSpringBootTest` with shared config (`@ActiveProfiles`, `@Import` for Testcontainers, etc.); if one exists,
  use it. Otherwise use `@AxonSpringBootTest` directly.
- **Non-Spring Boot test** — uses `axonTestFixture(configSlice { ... })`. No Spring context needed.

See [references/af5-write-slice-patterns.md](references/af5-write-slice-patterns.md) for complete test examples.

Cover these scenarios:

- **Happy path**: no prior state, command produces expected events
- **Idempotency**: duplicate command produces no events
- **Rule violations**: invalid state returns `CommandHandlerResult.Failure`
- **State transitions**: prior events change behavior
- **All mutating evolve branches**: for every event that mutates state in `evolve()`, add at least one test

**⚠️ CRITICAL: implement ALL GWT scenarios from the slice details, not just the command's own events.**

#### Mapping Event Model GWT Scenarios to Tests

| GWT Element | Test Code |
|---|---|
| Scenario name (e.g., `### 1. place first order`) | Test method name: `` `given no prior order, when place, then placed` `` |
| `NOTHING` in Given | `noPriorActivity()` |
| `:::element event` in Given | `event(EventClass(...), metadata)` in `Given { }` block |
| `:::element command` in When | `command(CommandClass(...), metadata)` in `When { }` block |
| `:::element event` in Then | `events(EventClass(...))` + `resultMessagePayload(Success)` |
| `:::element hotspot` in Then | `resultMessagePayload(Failure("message"))` |
| `NOTHING` in Then | `noEvents()` + `resultMessagePayload(Success)` — idempotent |

**Metadata is MANDATORY** on every `event()` and `command()` call. Always define a metadata object at class level
and pass it to every call:

```kotlin
private val metadata = AxonMetadata.with("correlationId", UUID.randomUUID().toString())
    .and("tenantId", UUID.randomUUID().toString())
```

**Property mapping**: GWT properties are rule-relevant only. Fill remaining constructor params with test fixture values.
When the same property value appears in Given and When, use the same variable to make the relationship explicit.

### 6b. REST API Tests (only if REST API chosen in Step 4)

Tests the REST controller in isolation — mocked `CommandGateway`, no Axon Server, no event store.

See [references/rest-api-patterns.md](references/rest-api-patterns.md) for full RestAssured + `@WebMvcTest` examples.

## References

- [AF5 Write Slice Patterns](references/af5-write-slice-patterns.md) — Complete examples (Spring Boot + Explicit
  Registration, single-tag and multi-tag DCB) with full code and testing
- [AF4 Input Mapping](references/af4-input-mapping.md) — When input is Axon Framework 4 code: concept-by-concept
  translation guide
- [Command Handler Styles](references/command-handler-styles.md) — All three handler-registration styles with examples
- [REST API Patterns](references/rest-api-patterns.md) — REST controller and RestAssured test examples
- [Feature Flag Patterns](references/feature-flag-patterns.md) — `@ConditionalOnProperty` and alternatives
- [Kotlin Extensions](references/kotlin-extensions.md) — `AxonMetadata` typealias and helper functions
- [AxonTestFixture Kotlin DSL](references/axon-test-fixture-kotlin-dsl.md) — Given-When-Then DSL source to copy into the project
