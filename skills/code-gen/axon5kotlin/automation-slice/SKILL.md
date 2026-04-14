---
name: em2code-automation-slice-axon5kotlin
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

# Axon Framework 5 Automation Slice Implementation

An automation reacts to an event by dispatching a command. In Event Modeling: the orange stripe.

There are two kinds:
- **Stateless**: Direct event-to-command mapping — no stored state needed
- **With read model**: Needs a private read model (JPA entity + repository) to look up data required for command construction (e.g., iterate over all dwellings matching a creature type)

## Step 0: Discover Target Project Conventions

Read the target project's CLAUDE.md and explore existing slices. Look for:

- File splitting conventions (single `.Slice.kt` vs separate files per class)
- Visibility modifiers (`private` on processor/configuration classes)
- Metadata handling (`GameMetadata`, `@MetadataValue`)
- Feature flag patterns (`@ConditionalOnProperty` prefix structure)
- `additional-spring-configuration-metadata.json` entries
- YAML config files (`application.yaml`, `application-test.yaml`)
- **Spring Boot test annotation**: Check if the project defines a **meta-annotation** for `@AxonSpringBootTest` (e.g., a custom annotation that composes `@AxonSpringBootTest` with `@ActiveProfiles`, `@Import` for testcontainers, etc.). Search for classes/annotations annotated with `@AxonSpringBootTest` and check CLAUDE.md for the project's test annotation. If a meta-annotation exists, use it in all integration tests. If not, use `@AxonSpringBootTest` directly but look at existing tests for common patterns (`@ActiveProfiles`, `@Import`, etc.) that should be replicated consistently.

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

If the Event Modeling artifact includes slice details with `## Scenarios (GWTs)`, use them to derive test cases. Automation GWT pattern: `Given (events) → Then (command | hotspot | NOTHING)` — no When block. Events in Given include read-model-building events first, trigger event last. Command in Then is the dispatched command. Hotspot or NOTHING means no command dispatched.

If the slice details contain `## Implementation Guidelines`, **follow them** — they describe specific technical requirements that go beyond the standard slice pattern.

### Stateless vs With Read Model Decision

Choose **with read model** when:
- The automation needs data that is NOT in the trigger event (e.g., "find all dwellings for creature X")
- The automation must iterate over a collection of entities to dispatch multiple commands
- The automation combines data from multiple event types (one builds the read model, another triggers the command)

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

Before implementing the automation, verify that all events the processor will handle exist in the codebase. If they
don't, create them **first**.

### Event Hierarchy

Events follow a three-level hierarchy:

```
DomainEvent                          ← marker (shared.domain)
  └─ HeroesEvent                     ← project-level marker (shared.domain)
       └─ {Context}Event             ← sealed interface per bounded context ({context}.events)
            └─ {ConcreteEvent}       ← data class ({context}.events)
```

### Context Event Interface (if it doesn't exist)

Each bounded context has a **sealed interface** in `{context}/events/` that extends `HeroesEvent` and declares the tag
property with `@get:EventTag`. All events in the context implement this interface, inheriting the tag automatically.

```kotlin
// File: {context}/events/{Context}Event.kt
sealed interface {Context}Event : HeroesEvent {
    @get:EventTag(EventTags.{TAG_CONSTANT})
    val {tagProperty}: {IdType}
}
```

Also ensure the tag constant exists in `EventTags.kt`.

### Concrete Event Classes

Each event is a separate file in `{context}/events/`:

```kotlin
// File: {context}/events/{EventName}.kt
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
- When an event participates in a Dynamic Consistency Boundary (DCB), add extra `@EventTag` on cross-stream properties

## Step 3: Implement the Automation

### CommandDispatcher vs CommandGateway

**Always use `CommandDispatcher`** to dispatch commands from within `@EventHandler` methods:

- `CommandDispatcher` is AF5's preferred way to send commands from within message handlers
- It is **ProcessingContext-scoped** — inject it as a **method parameter** on the `@EventHandler`, NOT as a constructor parameter
- `CommandGateway` is a singleton intended for external callers (REST controllers, etc.)

```kotlin
// CORRECT: CommandDispatcher as method parameter
@EventHandler
fun react(event: MyEvent, commandDispatcher: CommandDispatcher) {
    commandDispatcher.send(command, metadata)
}

// WRONG: CommandGateway as constructor parameter
class MyProcessor(private val commandGateway: CommandGateway) {
    @EventHandler
    fun react(event: MyEvent) {
        commandGateway.send(command, metadata) // Don't do this
    }
}
```

### Error Propagation with CompletableFuture

When the automation dispatches commands, return a `CompletableFuture` from the `@EventHandler` method so AF5 awaits command completion. If a command fails, the event handler fails too, and the event processor will retry.

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
fun interface WeekSymbolCalculator : (MonthWeek) -> WeekSymbol
```

Skip if the mapping from event to command is trivial/direct.

#### File 2: Configuration (if strategy exists)

```kotlin
@ConditionalOnProperty(prefix = "slices.{context}.automation", name = ["{automationname}.enabled"])
@Configuration
private class {AutomationName}Configuration {

    @Bean
    fun weekSymbolCalculator(): WeekSymbolCalculator =
        WeekSymbolCalculator { _ -> WeekSymbol(weekOf = CreatureId("angel"), growth = (1..5).random()) }
}
```

#### File 3: Processor

```kotlin
@ConditionalOnProperty(prefix = "slices.{context}.automation", name = ["{automationname}.enabled"])
@Component
private class {AutomationName}Processor(
    private val calculator: WeekSymbolCalculator  // if strategy exists
) {

    @EventHandler
    fun react(
        event: {TriggerEvent},
        @MetadataValue(GameMetadata.GAME_ID_KEY) gameId: String,
        @MetadataValue(GameMetadata.PLAYER_ID_KEY) playerId: String,
        commandDispatcher: CommandDispatcher
    ) {
        if ({condition}) {
            val command = {TargetCommand}(...)
            val metadata = GameMetadata.with(GameId(gameId), PlayerId(playerId))
            commandDispatcher.send(command, metadata)
        }
    }
}
```

---

### Automation with Read Model

When the automation needs to look up data, create a dedicated read model within the same slice. **Slices are independent** — never reuse another slice's read model.

Everything goes in a single `.Slice.kt` file:

#### JPA Entity (Read Model)

```kotlin
@Entity
@Table(
    name = "{context}_automation_{readmodel_name}",
    indexes = [Index(name = "idx_{context}_{readmodel_name}_{columns}", columnList = "gameId, creatureId")]
)
internal data class {ReadModelName}(
    val gameId: String,
    @Id
    val primaryId: String,
    val filterField: String
)
```

Key rules:
- **Composite index** on the columns used in `WHERE` clause — filter at DB level, not client-side
- **Table name prefixed** with context to avoid collisions (e.g., `astrologers_automation_built_dwelling`)
- **`internal`** visibility — only the processor in this slice should access it

#### Repository

```kotlin
@ConditionalOnProperty(prefix = "slices.{context}.automation", name = ["{automationname}.enabled"])
@Repository
private interface {ReadModelName}Repository : JpaRepository<{ReadModelName}, String> {
    fun findAllByGameIdAndFilterField(gameId: String, filterField: String): List<{ReadModelName}>
}
```

Key rules:
- **DB-level filtering** — use Spring Data derived queries that filter on all relevant columns, not `findAll()` + client-side filter
- **`private`** visibility
- **Same `@ConditionalOnProperty`** as the processor

#### Processor

```kotlin
@ConditionalOnProperty(prefix = "slices.{context}.automation", name = ["{automationname}.enabled"])
@Component
@SequencingPolicy(type = MetadataSequencingPolicy::class, parameters = ["gameId"])
private class {AutomationName}Processor(
    private val repository: {ReadModelName}Repository
) {

    @EventHandler
    fun react(
        event: {TriggerEvent},
        @MetadataValue(GameMetadata.GAME_ID_KEY) gameId: String,
        @MetadataValue(GameMetadata.PLAYER_ID_KEY) playerId: String,
        commandDispatcher: CommandDispatcher
    ): CompletableFuture<Void> {
        val futures = repository.findAllByGameIdAndFilterField(gameId, event.filterValue)
            .map { entity -> dispatchCommand(entity, event, playerId, commandDispatcher) }
        return CompletableFuture.allOf(*futures.toTypedArray())
    }

    private fun dispatchCommand(
        entity: {ReadModelName},
        event: {TriggerEvent},
        playerId: String,
        commandDispatcher: CommandDispatcher
    ): CompletableFuture<out Any?> {
        val command = {TargetCommand}(
            // map entity fields + event data to command properties
        )
        val metadata = GameMetadata.with(GameId(entity.gameId), PlayerId(playerId))
        return commandDispatcher.send(command, metadata).resultMessage
    }

    @EventHandler
    fun on(event: {BuildingEvent}, @MetadataValue(GameMetadata.GAME_ID_KEY) gameId: String) {
        repository.save(
            {ReadModelName}(
                gameId = gameId,
                primaryId = event.entityId.raw,
                filterField = event.filterValue.raw
            )
        )
    }
}
```

Key rules:
- **`@SequencingPolicy(MetadataSequencingPolicy, "gameId")`** — ensures events for the same game are processed sequentially. This prevents race conditions where a `DwellingBuilt` and `WeekSymbolProclaimed` for the same game could be processed concurrently, causing the read model to be inconsistent
- **`CommandDispatcher` as method parameter** — ProcessingContext-scoped, not constructor-injected
- **`CompletableFuture<Void>` return** — `CompletableFuture.allOf()` awaits all dispatched commands; if any fails, the event handler fails and the processor retries
- **`commandDispatcher.send(command, metadata).resultMessage`** — returns `CompletableFuture` for the command result
- **Two `@EventHandler` methods in one class**: one builds the read model (e.g., `DwellingBuilt`), the other reacts by dispatching commands (e.g., `WeekSymbolProclaimed`)
- **Repository is constructor-injected** (Spring bean), `CommandDispatcher` is method-injected (ProcessingContext)

## Step 4: Add Feature Flag

Add `@ConditionalOnProperty` to processor, repository (if with read model), and configuration (if exists). Update ALL of:

- `application.yaml` — `slices.{context}.automation.{name}.enabled: true`
- `application-test.yaml` — `slices.{context}.automation.{name}.enabled: false`
- `META-INF/additional-spring-configuration-metadata.json` — add entry

## Step 5: Implement Tests

Spring Boot integration test with `AxonTestFixture` Kotlin DSL.

**Critical**: Enable BOTH the automation AND its target write slice in `@TestPropertySource`.

If the automation uses a strategy, override it with a deterministic `@TestConfiguration` bean.

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
        event({TriggerEvent}(...), gameMetadata)
    } Then {
        await({ it.commands(expectedCommand) })
    }
}
```

**Assert multiple commands in any order** (automation with read model — multiple commands):

```kotlin
fixture.Scenario {
    Given {
        event({BuildingEvent}(...), gameMetadata)  // builds read model
        event({TriggerEvent}(...), gameMetadata)   // triggers commands
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
        event({TriggerEvent}(... /* condition not met */), gameMetadata)
    } Then {
        await({ it.noCommands() })
    }
}
```

### Testing Automations with Read Model — Important Notes

1. **`RecordingCommandBus` accumulates commands** across test methods in the same Spring context. It is NOT reset between tests when using `Given { } Then { }` (only the `When { }` phase resets it).

2. **Isolate tests using entity ID filtering**: Generate unique IDs per test method, then filter assertions to only check commands relevant to the current test's IDs:
   ```kotlin
   val testDwellingIds = setOf(dwelling1, dwelling2)
   // ... in assertion:
   .filter { cmd -> cmd.dwellingId in testDwellingIds }
   ```

3. **Use `commandsSatisfy` + `containsExactlyInAnyOrder`**: JPA/DB returns results in unpredictable order, so commands may be dispatched in any order. Don't use `commands(cmd1, cmd2)` which asserts strict ordering.

4. **Put all events in a single `Given` block**: For temporal ordering tests (e.g., "only increase dwellings built before the proclamation"), interleave building events and trigger events in a single `Given` block and assert all expected commands at once.

### Test Cases to Cover

**Stateless automations:**
1. **Happy path**: Event matching condition -> expected command dispatched
2. **Condition not met**: Event not matching condition -> no commands dispatched

**Automations with read model:**
1. **Happy path**: Build read model entries + trigger event -> commands for matching entries only
2. **Non-matching entries**: Build entries of different types + trigger for one type -> only matching type gets commands
3. **Temporal ordering**: Build some entries, trigger, build more entries, trigger again -> each trigger only affects entries that existed at that point

### Mapping Event Model GWT Scenarios to Tests

When the slice details contain `## Scenarios (GWTs)`, map each scenario to a test method:

| GWT Element | Test Code |
|---|---|
| `:::element event` in Given | `Given { event(EventClass(...), gameMetadata) }` |
| Multiple events in Given | Multiple `event(...)` calls — read-model-building events first, trigger event last |
| `:::element command` in Then | `Then { await({ it.commands(expectedCommand) }) }` |
| `:::element hotspot` in Then | `Then { await({ it.noCommands() }) }` — exception/failure |
| `NOTHING` in Then | `Then { await({ it.noCommands() }) }` — no reaction |

Properties in `:::element` blocks are rule-relevant only — fill remaining constructor params with test fixture values.

## References

- [Stateless Automation Test Example](references/automation-test-example.md) — Complete working test with deterministic strategy override
- [Automation with Read Model Test Example](references/automation-with-read-model-test-example.md) — Complete working test with private read model and multi-command assertions
