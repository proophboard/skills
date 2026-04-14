---
name: axon5kotlin-automation-slice
description: >
  Implement automation slices (Event to Command) using Axon Framework 5, Vertical Slice Architecture,
  and Event Modeling patterns. An automation is: an Event Handler that reacts to an event by dispatching a command
  via CommandDispatcher. Automations can be stateless (direct event-to-command mapping) or
  with a private read model (to look up data needed for command construction).
  Use when: (1) implementing a new automation / event-to-command reactor in an AF5 project,
  (2) migrating/porting an automation from Axon Framework 4 (Java or Kotlin) to AF5,
  (3) user provides a specification, Event Modeling artifact, or natural language description of an
  event-to-command reaction and asks to implement it,
  (4) user says "implement", "create", "add", "migrate", "port" an automation, event handler,
  reactor, or event-to-command flow in an Axon Framework 5 / Vertical Slice Architecture project.
  Understands AF4 @EventHandler/@ProcessingGroup input as one possible source format.
---

# Axon Framework 5 — Automation Slice

An automation reacts to an event by dispatching a command. In Event Modeling: the **orange stripe**.

There are two kinds:
- **Stateless**: Direct event-to-command mapping — no stored state needed
- **With read model**: Needs a private read model (JPA entity + repository) to look up data required for command
  construction (e.g., iterate over all entities matching a category)

## Relationship to prooph board Event Modeling

This skill implements the **automation slice (orange stripe)** from a prooph board Event Modeling board.
It consumes:
- The slice's `## Scenarios (GWTs)` section (written with the `slice-scenarios` skill) — GWT format for automations
  is `Given (events) → Then (command | hotspot | NOTHING)`. Events in Given include read-model-building events
  first, trigger event last. Command in Then is the dispatched command. Hotspot or NOTHING means no command.
- The slice's optional `## Implementation Guidelines` — technical requirements beyond the standard pattern

## Step 0: Discover Target Project Conventions

Read the target project's context file (e.g., `CLAUDE.md`, `AGENTS.md`, `.cursorrules`) and explore existing slices.
Look for:

- File splitting conventions (single `.Slice.kt` vs separate files per class)
- Visibility modifiers (`private` on processor/configuration classes)
- Metadata handling — how correlation IDs are attached (see
  [references/kotlin-extensions.md](references/kotlin-extensions.md) for `AxonMetadata` helpers)
- Feature flag patterns (Step 4 — optional)
- YAML config files (`application.yaml`, `application-test.yaml`)
- Spring Boot test annotation: check if the project defines a meta-annotation for `@AxonSpringBootTest`

## Step 1: Understand the Input

Extract these elements regardless of input format:

| Element                | What to extract                                                        |
|------------------------|------------------------------------------------------------------------|
| **Trigger event**      | Which event triggers the automation, and which condition filters it     |
| **Target command**     | Which command to dispatch, with what properties                        |
| **Mapping logic**      | How event properties map to command properties                         |
| **Strategy/calculator**| Any injectable strategy for deriving command properties from event data |
| **Metadata**           | Which metadata keys to propagate from event to command                 |
| **Read model needed?** | Does the automation need to look up data not in the event itself?      |

If the Event Modeling artifact includes slice details with `## Scenarios (GWTs)`, use them to derive test cases.

If the slice details contain `## Implementation Guidelines`, **follow them**.

### Stateless vs With Read Model Decision

Choose **with read model** when:
- The automation needs data that is NOT in the trigger event (e.g., "find all entities of type X")
- The automation must iterate over a collection of entities to dispatch multiple commands
- The automation combines data from multiple event types (one builds the read model, another triggers commands)

Choose **stateless** when:
- All data needed for the command is in the trigger event + metadata
- The mapping is direct or uses a pure calculation/strategy

### Input: Axon Framework 4 Code

```
AF4                                  AF5
─────────────────────────────────    ────────────────────────────────────
@ProcessingGroup("name")             (not needed — Spring Boot auto-config)
@DisallowReplay                      (not needed in AF5)
@Component                           @Component
@EventHandler                        @EventHandler (different package)
commandGateway.sendAndWait(cmd, m)   commandDispatcher.send(cmd, metadata)
CommandGateway (constructor-inject)  CommandDispatcher (method parameter)
@MetaDataValue("key")                @MetadataValue("key")
Function<A, B> interface             fun interface Name : (A) -> B
```

**If requirements are unclear, ask the user before proceeding.**

## Step 2: Ensure Events Exist

Before implementing the automation, verify that all events the processor will handle exist in the codebase.
If they don't, create them **first**.

### Event Hierarchy

Recommended hierarchy (check what the target project already uses):

```
DomainEvent                        ← root marker (project-defined)
  └─ {Context}Event                ← sealed interface per bounded context ({context}/events/)
       └─ {ConcreteEvent}          ← data class ({context}/events/)
```

### Context Event Interface (if it doesn't exist)

```kotlin
sealed interface {Context}Event : DomainEvent {
    @get:EventTag(EventTags.{TAG_CONSTANT})
    val {tagProperty}: {IdType}
}
```

### Concrete Event Classes

```kotlin
@Event(namespace = "{Context}", name = "{EventName}", version = "1.0.0")
data class {EventName}(
    override val {tagProperty}: {IdType},
    val property1: ValueType1
) : {Context}Event
```

Key rules:
- `@Event(namespace, name, version)` — import from `org.axonframework.messaging.eventhandling.annotation.Event`
- `namespace` = bounded context name, `name` = class name, `version` = `"1.0.0"` for new events
- Use value object types for properties

## Step 3: Implement the Automation

### CommandDispatcher vs CommandGateway

**Always use `CommandDispatcher`** to dispatch commands from within `@EventHandler` methods:

- `CommandDispatcher` is AF5's preferred way to send commands from within message handlers
- It is **ProcessingContext-scoped** — inject it as a **method parameter** on the `@EventHandler`, NOT as a
  constructor parameter
- `CommandGateway` is a singleton intended for external callers (REST controllers, etc.)

```kotlin
// CORRECT: CommandDispatcher as method parameter
@EventHandler
fun react(event: {TriggerEvent}, commandDispatcher: CommandDispatcher) {
    commandDispatcher.send(command, metadata)
}

// WRONG: CommandGateway as constructor parameter
class MyProcessor(private val commandGateway: CommandGateway) {
    @EventHandler
    fun react(event: {TriggerEvent}) {
        commandGateway.send(command, metadata) // Don't do this
    }
}
```

### Error Propagation with CompletableFuture

When the automation dispatches commands, return a `CompletableFuture` from the `@EventHandler` method so AF5 awaits
command completion. If a command fails, the event handler fails too, and the event processor will retry.

- `commandDispatcher.send(command, metadata)` returns a `CommandResult`
- `CommandResult.resultMessage` returns `CompletableFuture`
- For multiple commands: use `CompletableFuture.allOf()` to await all

AF5's `MessageStreamResolverUtils` handles `CompletableFuture` return types via `MessageStream.fromFuture()`.

---

### Stateless Automation

An automation slice has up to 3 files (adapt to project conventions on splitting):

#### File 1: Strategy Interface (if needed)

A `fun interface` for injectable logic deriving command properties from event data:

```kotlin
fun interface {StrategyName} : ({InputType}) -> {OutputType}
```

Skip if the mapping from event to command is trivial/direct.

#### File 2: Configuration (if strategy exists)

```kotlin
@ConditionalOnProperty(...)  // if using feature flags
@Configuration
private class {AutomationName}Configuration {

    @Bean
    fun {strategyName}(): {StrategyName} =
        {StrategyName} { input -> /* default implementation */ }
}
```

#### File 3: Processor

```kotlin
@ConditionalOnProperty(...)  // if using feature flags
@Component
private class {AutomationName}Processor(
    private val strategy: {StrategyName}  // if strategy exists
) {

    @EventHandler
    fun react(
        event: {TriggerEvent},
        @MetadataValue("tenantId") tenantId: String,  // use the project's correlation key name
        commandDispatcher: CommandDispatcher
    ) {
        if ({condition}) {
            val command = {TargetCommand}(...)
            val metadata = AxonMetadata.with("tenantId", tenantId)
            commandDispatcher.send(command, metadata)
        }
    }
}
```

---

### Automation with Read Model

When the automation needs to look up data, create a dedicated read model within the same slice.
**Slices are independent** — never reuse another slice's read model.

Everything goes in a single `.Slice.kt` file:

#### JPA Entity (Read Model)

```kotlin
@Entity
@Table(
    name = "{context}_automation_{readmodel_name}",
    indexes = [Index(name = "idx_{context}_{readmodel_name}_{columns}", columnList = "tenantId, categoryId")]
)
internal data class {ReadModelName}(
    val tenantId: String,
    @Id
    val primaryId: String,
    val filterField: String
)
```

Key rules:
- **Composite index** on the columns used in `WHERE` clause — filter at DB level, not client-side
- **Table name prefixed** with context to avoid collisions
- **`internal`** visibility — only the processor in this slice should access it

#### Repository

```kotlin
@ConditionalOnProperty(...)  // if using feature flags
@Repository
private interface {ReadModelName}Repository : JpaRepository<{ReadModelName}, String> {
    fun findAllByTenantIdAndFilterField(tenantId: String, filterField: String): List<{ReadModelName}>
}
```

Key rules:
- **DB-level filtering** — use Spring Data derived queries that filter on all relevant columns, not `findAll()` +
  client-side filter
- **`private`** visibility
- **Same `@ConditionalOnProperty`** as the processor (if using feature flags)

#### Processor

```kotlin
@ConditionalOnProperty(...)  // if using feature flags
@Component
@SequencingPolicy(type = MetadataSequencingPolicy::class, parameters = ["tenantId"])
private class {AutomationName}Processor(
    private val repository: {ReadModelName}Repository
) {

    @EventHandler
    fun react(
        event: {TriggerEvent},
        @MetadataValue("tenantId") tenantId: String,
        commandDispatcher: CommandDispatcher
    ): CompletableFuture<Void> {
        val futures = repository.findAllByTenantIdAndFilterField(tenantId, event.filterValue)
            .map { entity -> dispatchCommand(entity, event, tenantId, commandDispatcher) }
        return CompletableFuture.allOf(*futures.toTypedArray())
    }

    private fun dispatchCommand(
        entity: {ReadModelName},
        event: {TriggerEvent},
        tenantId: String,
        commandDispatcher: CommandDispatcher
    ): CompletableFuture<out Any?> {
        val command = {TargetCommand}(
            // map entity fields + event data to command properties
        )
        val metadata = AxonMetadata.with("tenantId", tenantId)
        return commandDispatcher.send(command, metadata).resultMessage
    }

    @EventHandler
    fun on(event: {BuildingEvent}, @MetadataValue("tenantId") tenantId: String) {
        repository.save(
            {ReadModelName}(
                tenantId = tenantId,
                primaryId = event.entityId.raw,
                filterField = event.filterValue.raw
            )
        )
    }
}
```

Key rules:
- **`@SequencingPolicy(MetadataSequencingPolicy, "tenantId")`** — ensures events for the same tenant/correlation unit
  are processed sequentially, preventing race conditions on the read model
- **`CommandDispatcher` as method parameter** — ProcessingContext-scoped, not constructor-injected
- **`CompletableFuture<Void>` return** — `CompletableFuture.allOf()` awaits all dispatched commands; if any fails,
  the event handler fails and the processor retries
- **`commandDispatcher.send(command, metadata).resultMessage`** — returns `CompletableFuture` for the command result
- **Two `@EventHandler` methods in one class**: one builds the read model, the other reacts by dispatching commands
- **Repository is constructor-injected** (Spring bean), `CommandDispatcher` is method-injected (ProcessingContext)

## Step 4: Feature Flags (Optional)

**Check the target project's convention first** — scan existing slices for `@ConditionalOnProperty`, `@Profile`, or
custom feature-flag integrations.

If no clear convention exists, ask the user:
> How should slice-level feature flags be managed?
> - **`@ConditionalOnProperty`** (Spring Boot default)
> - **Custom flag library** (FF4J, Unleash, LaunchDarkly, etc.)
> - **No feature flags** — ship all slices unconditionally

See [references/feature-flag-patterns.md](references/feature-flag-patterns.md) for the full `@ConditionalOnProperty`
example (processor, repository, `application.yaml`, `additional-spring-configuration-metadata.json`) and alternatives.

## Step 5: Implement Tests

Spring Boot integration test with `AxonTestFixture` Kotlin DSL.

**Critical**: Enable BOTH the automation AND its target write slice in the feature flag settings.

If the automation uses a strategy, override it with a deterministic `@TestConfiguration` bean.

The `AxonTestFixture` Kotlin DSL must be copied into the project's test sources.
See [references/axon-test-fixture-kotlin-dsl.md](references/axon-test-fixture-kotlin-dsl.md).

For `AxonMetadata` — use the typealias from [references/kotlin-extensions.md](references/kotlin-extensions.md).

### AF5 Imports

```kotlin
import org.axonframework.messaging.commandhandling.gateway.CommandDispatcher
import org.axonframework.messaging.core.annotation.MetadataValue
import org.axonframework.messaging.eventhandling.annotation.EventHandler
import org.axonframework.messaging.eventhandling.annotation.SequencingPolicy
import org.axonframework.messaging.eventhandling.sequencing.MetadataSequencingPolicy
```

### AxonTestFixture API for Automations

**Assert exact command dispatched** (stateless automation — single command):

```kotlin
fixture.Scenario {
    Given {
        event({TriggerEvent}(...), metadata)
    } Then {
        await({ it.commands(expectedCommand) })
    }
}
```

**Assert multiple commands in any order** (automation with read model — multiple commands):

```kotlin
fixture.Scenario {
    Given {
        event({BuildingEvent}(...), metadata)  // builds read model
        event({TriggerEvent}(...), metadata)   // triggers commands
    } Then {
        await({
            it.commandsSatisfy { commands ->
                val relevantPayloads = commands.map { cmd -> cmd.payload() }
                    .filterIsInstance<{TargetCommand}>()
                    .filter { cmd -> cmd.entityId in testEntityIds }

                assertThat(relevantPayloads).containsExactlyInAnyOrder(
                    {TargetCommand}(...),
                    {TargetCommand}(...)
                )
            }
        })
    }
}
```

**Assert no commands** (condition not met):

```kotlin
fixture.Scenario {
    Given {
        event({TriggerEvent}(... /* condition not met */), metadata)
    } Then {
        await({ it.noCommands() })
    }
}
```

### Testing Automations with Read Model — Important Notes

1. **`RecordingCommandBus` accumulates commands** across test methods in the same Spring context. It is NOT reset
   between tests when using `Given { } Then { }` (only the `When { }` phase resets it).

2. **Isolate tests using entity ID filtering**: Generate unique IDs per test method, then filter assertions to only
   check commands relevant to the current test's IDs:
   ```kotlin
   val testEntityIds = setOf(entity1, entity2)
   // ... in assertion:
   .filter { cmd -> cmd.entityId in testEntityIds }
   ```

3. **Use `commandsSatisfy` + `containsExactlyInAnyOrder`**: JPA/DB returns results in unpredictable order, so
   commands may be dispatched in any order. Don't use `commands(cmd1, cmd2)` which asserts strict ordering.

4. **Put all events in a single `Given` block**: For temporal ordering tests, interleave building events and trigger
   events in a single `Given` block and assert all expected commands at once.

### Test Cases to Cover

**Stateless automations:**
1. **Happy path**: Event matching condition → expected command dispatched
2. **Condition not met**: Event not matching condition → no commands dispatched

**Automations with read model:**
1. **Happy path**: Build read model entries + trigger event → commands for matching entries only
2. **Non-matching entries**: Build entries of different types + trigger for one type → only matching type gets commands
3. **Temporal ordering**: Build some entries, trigger, build more entries, trigger again → each trigger only affects
   entries that existed at that point

### Mapping Event Model GWT Scenarios to Tests

| GWT Element | Test Code |
|---|---|
| `:::element event` in Given | `Given { event(EventClass(...), metadata) }` |
| Multiple events in Given | Multiple `event(...)` calls — read-model-building events first, trigger event last |
| `:::element command` in Then | `Then { await({ it.commands(expectedCommand) }) }` |
| `:::element hotspot` in Then | `Then { await({ it.noCommands() }) }` — exception/failure |
| `NOTHING` in Then | `Then { await({ it.noCommands() }) }` — no reaction |

Properties in `:::element` blocks are rule-relevant only — fill remaining constructor params with test fixture values.

## References

- [Stateless Automation Test Example](references/automation-test-example.md) — Complete working test with
  deterministic strategy override
- [Automation with Read Model Test Example](references/automation-with-read-model-test-example.md) — Complete
  working test with private read model and multi-command assertions
- [Feature Flag Patterns](references/feature-flag-patterns.md) — `@ConditionalOnProperty` and alternatives
- [Kotlin Extensions](references/kotlin-extensions.md) — `AxonMetadata` typealias and helper functions
- [AxonTestFixture Kotlin DSL](references/axon-test-fixture-kotlin-dsl.md) — Given-When-Then DSL source to copy into the project
