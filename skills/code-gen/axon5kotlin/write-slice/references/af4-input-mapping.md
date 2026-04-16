# AF4 Input Mapping

When the input for a write slice is Axon Framework 4 code (Java or Kotlin), use this reference to translate AF4 concepts
into AF5 equivalents.

Read this file ONLY when the user provides AF4 source code as input.

## Table of Contents

1. [AF4 Source Components to Locate](#1-af4-source-components-to-locate)
2. [Concept-by-Concept Translation](#2-concept-by-concept-translation)
3. [Aggregate Decomposition](#3-aggregate-decomposition)

---

## 1. AF4 Source Components to Locate

For each command being migrated, find and read:

| AF4 Component       | Where to find it                                                              |
|---------------------|-------------------------------------------------------------------------------|
| Command class       | Separate file, has `@TargetAggregateIdentifier`                               |
| Aggregate class     | `@Aggregate` class with `@CommandHandler` and `@EventSourcingHandler` methods |
| Event classes       | Implement domain event interface (e.g., `DwellingEvent`)                      |
| Domain rule classes | Implement `DomainRule` with `isViolated()` and `message()`                    |
| REST API class      | `@RestController` in the command's package                                    |

From the aggregate, identify ONLY the `@CommandHandler` and `@EventSourcingHandler` methods relevant to this specific
command. Ignore handlers for other commands.

## 2. Concept-by-Concept Translation

### Command Class

```
AF4: @TargetAggregateIdentifier on ID property, implements command interface
AF5: Plain data class, no annotations on ID (except @get:JvmName), no interface
```

Remove `@TargetAggregateIdentifier` - AF5 uses tag-based routing via `@InjectEntity(idProperty=...)`.
Remove command marker interface - no single aggregate to route to.

### Aggregate Identity

```
AF4: @AggregateIdentifier on field, @TargetAggregateIdentifier on command
AF5: @EventSourced(tagKey = "tagName") on entity, @InjectEntity(idProperty = "tagName") on handler
```

The tagKey string (e.g., `"dwellingId"`) must match both the `EventTags` constant and the command property name.

### Aggregate State (mutable fields)

```
AF4: Public mutable fields on @Aggregate class
AF5: Private immutable data class State, only fields needed by this command's decide()
```

Each slice maintains its own State projection. Don't copy the entire aggregate's fields.

### @CommandHandler (inside aggregate)

```
AF4: @CommandHandler void decide(Command cmd) { rule.verify(); apply(event); }
AF5: Private fun decide(command, state): List<Event> { if (violated) throw/return; return listOf(event) }
     + Separate @CommandHandler class calling decide() and EventAppender
```

Split into: pure `decide()` function + handler component that wires decide/EventAppender.

### @EventSourcingHandler (inside aggregate, mutates fields)

```
AF4: @EventSourcingHandler void evolve(Event e) { this.field = e.value(); }
AF5: Private fun evolve(state, event): State = when(event) { is E -> state.copy(...); is Other -> state /* explicit no-op for every sealed subtype */ }
     + @EventSourcingHandler on entity returning new entity instance
```

Split into: pure `evolve()` function + entity `@EventSourcingHandler` methods wrapping it.

### AggregateLifecycle.apply()

```
AF4: apply(event)  // static import from AggregateLifecycle
AF5: eventAppender.append(events, metadata)  // injected into handler
```

### @CreationPolicy(CREATE_IF_MISSING)

```
AF4: @CreationPolicy(AggregateCreationPolicy.CREATE_IF_MISSING) on handler
AF5: @EntityCreator on no-arg constructor returning initialState
```

### DomainRule classes

```
AF4: new RuleName(args).verify()  // throws DomainRule.ViolatedException
AF5: Inline in decide(): if (condition) throw IllegalStateException("message")
     OR: if (condition) return emptyList()  // for idempotent operations
```

Map each `DomainRule.isViolated()` condition and `message()` to inline logic in `decide()`.

### Event classes

```
AF4: Primitives (String dwellingId, Map<String, Integer> cost), sealed interface
AF5: Value objects (DwellingId, Resources), sealed interface with @EventTag
```

If events already exist in AF5 project, reuse them. Otherwise create with value object types and `@EventTag`.

### REST API

```
AF4: commandGateway.send(command, GameMetaData.with(gameId, playerId))
     Returns CompletableFuture<Void>
AF5: commandGateway.send(command.asCommandMessage(metadata))
         .resultAs(CommandHandlerResult::class.java)
         .toResponseEntity()
     Returns CompletableFuture<ResponseEntity<Any>>
```

### Snapshot configuration

```
AF4: @Aggregate(snapshotTriggerDefinition = "...")
AF5: Not applicable at slice level (handled by Axon Server / infrastructure)
```

## 3. Aggregate Decomposition

A single AF4 `@Aggregate` with N command handlers becomes N separate AF5 write slices.

Example: AF4 `Dwelling` aggregate handling `BuildDwelling`, `IncreaseAvailableCreatures`, `RecruitCreature`:

```
AF4:                          AF5:
Dwelling.java          -->    builddwelling/BuildDwelling.Slice.kt
  @CommandHandler              (own State, decide, evolve, entity, handler)
  decide(BuildDwelling)
                              increaseavailablecreatures/IncreaseAvailableCreatures.Slice.kt
  @CommandHandler              (own State, decide, evolve, entity, handler)
  decide(IncreaseAvailable)
                              recruitcreature/RecruitCreature.Slice.kt
  @CommandHandler              (own State, decide, evolve, entity, handler)
  decide(RecruitCreature)
```

Each slice only includes the `@EventSourcingHandler` methods for events it needs to reconstruct its own State. Slices
are fully independent.
