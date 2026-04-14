---
name: em2code-read-slice-axon5kotlin
description: >
  Implement read slices (projections + query handlers + REST API + tests) using Axon Framework 5 AxonTestFixture
  with Spring Boot integration tests. A read slice is: Events projected into a Read Model, queried via QueryGateway.
  Use when: (1) implementing a new read slice / projection in an AF5 project,
  (2) migrating/porting a read slice from Axon Framework 4 (Java or Kotlin) to AF5,
  (3) user provides a read slice specification or Event Modeling artifact and asks to implement it,
  (4) user says "implement", "create", "add" a read slice, projection, query handler,
  or read model in an Axon Framework 5 / Vertical Slice Architecture project.
---

# Axon Framework 5 Read Slice

## Step 0: Discover Target Project Conventions

Before writing any code, read the target project's CLAUDE.md and explore at least one existing read slice.
Look for:

- **Spring Boot test annotation**: Check if the project defines a **meta-annotation** for `@AxonSpringBootTest` (e.g., a custom annotation that composes `@AxonSpringBootTest` with `@ActiveProfiles`, `@Import` for testcontainers, etc.). Search for classes/annotations annotated with `@AxonSpringBootTest` and check CLAUDE.md for the project's test annotation. If a meta-annotation exists, use it in all integration tests. If not, use `@AxonSpringBootTest` directly but look at existing tests for common patterns (`@ActiveProfiles`, `@Import`, etc.) that should be replicated consistently.
- Feature flag pattern (`@TestPropertySource` enabling the slice)
- Assertion library (AssertJ, AssertK, etc.)
- Test naming conventions (backtick-quoted method names)
- Metadata handling (how `gameId` or correlation IDs are attached to events)
- Existing read slice files and tests as patterns
- REST API test pattern (`@RestAssuredMockMvcTest`, `@AxonGatewaysMockTest`)
- Spring configuration metadata file location

## Step 1: Ensure Events Exist

Before implementing the read slice, verify that all events the projector will handle exist in the codebase. If they
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
- `namespace` = bounded context name (e.g., `"CreatureRecruitment"`)
- `name` = class name, `version` = `"1.0.0"` for new events
- Use value object types for properties
- When an event participates in a Dynamic Consistency Boundary (DCB), add extra `@EventTag` on cross-stream properties

## Step 2: Implement the Read Slice

If the Event Modeling artifact includes slice details with `## Scenarios (GWTs)`, use them to derive test cases. Read slice GWT pattern: `Given (events) → Then (information)` — no When block. Events in Given tell you which events the projector must handle. The information element in Then describes the expected query result shape and values.

If the slice details contain `## Implementation Guidelines`, **follow them** — they describe specific technical requirements that go beyond the standard slice pattern.

### Query Annotation

Every query data class must have `@Query(namespace, name, version)` — mirroring the `@Event` annotation on events:

```kotlin
@Query(namespace = "{Context}", name = "{QueryName}", version = "1.0.0")
data class GetFeature(val gameId: GameId, ...)
```

- `@Query` — import from `org.axonframework.messaging.queryhandling.annotation.Query`
- `namespace` = bounded context name (e.g., `"CreatureRecruitment"`, `"Calendar"`)
- `name` = query class name (e.g., `"GetAllDwellings"`)
- `version` = `"1.0.0"` for new queries

A read slice file contains all layers in a single file. **Do NOT add section comments** (Domain/Application/Presentation)
for read slices — those are only for write slices.

### Slice File Structure

```kotlin
// Query DTO + Result DTO
@Query(namespace = "{Context}", name = "GetFeature", version = "1.0.0")
data class GetFeature(val gameId: GameId, ...) {
    data class Result(...)
    // Optional: nested result DTOs if read model doesn't match result 1:1
}

// JPA Entity (read model) — internal to projection
@Entity @Table(name = "...", indexes = [...])
data class FeatureReadModel(...)

// Repository — private
@ConditionalOnProperty(...) @Repository
private interface FeatureReadModelRepository : JpaRepository<...> { ... }

// Projector — private
@ConditionalOnProperty(...) @Component
@SequencingPolicy(type = MetadataSequencingPolicy::class, parameters = ["gameId"])
private class FeatureReadModelProjector(...) { ... }

// Query Handler — private
@ConditionalOnProperty(...) @Component
private class FeatureReadModelQueryHandler(...) { ... }

// REST Controller — internal
@ConditionalOnProperty(...) @RestController
internal class FeatureRestApi(...) { ... }
```

### Result DTO Rules

- If the read model matches the desired query result **1:1**, expose the JPA entity directly in the `Result` for simplicity.
- If the read model contains fields the caller already knows from the query (e.g., `gameId`, `armyId`), create a
  **separate result data class** nested inside the query that strips those redundant fields. The query handler maps
  from the JPA entity to the result DTO.

### Idiomatic Kotlin in Projectors

Use `findByIdOrNull` (from `org.springframework.data.repository.findByIdOrNull`) with scope functions:

```kotlin
// Upsert pattern
val updated = repository.findByIdOrNull(id)
    ?.let { it.copy(quantity = it.quantity + event.quantity.raw) }
    ?: FeatureReadModel(...)
repository.save(updated)

// Delete-or-update pattern
repository.findByIdOrNull(id)?.let { existing ->
    if (shouldDelete) repository.deleteById(id) else repository.save(existing.copy(...))
}
```

### JPA Index

Add `@Table(indexes = [...])` for columns used in repository query methods:

```kotlin
@Table(
    name = "context_read_feature",
    indexes = [Index(name = "idx_feature_game_entity", columnList = "gameId, entityId")]
)
```

### Feature Flag Configuration

After creating the slice, update ALL of these files:

- `application.yaml` — add `slices.{context}.read.{feature}.enabled: true`
- `application-test.yaml` — add `slices.{context}.read.{feature}.enabled: false` (slices disabled by default in tests; individual tests opt-in via `@TestPropertySource`)
- `META-INF/additional-spring-configuration-metadata.json` — add entry:

```json
{
  "name": "slices.{context}.read.{feature}.enabled",
  "type": "java.lang.Boolean",
  "description": "Enable/disable the {Feature} read slice in the {Context} bounded context."
}
```

## Step 3: Design Test Cases

Cover these scenarios (adapt to specific slice):

1. **Empty state**: No events published → query returns empty result
2. **Single entity**: One creation event → query returns single item
3. **Multiple entities**: Multiple creation events → query returns all items
4. **State updates**: Creation event + update event → query returns updated state
5. **Aggregation**: Same entity updated multiple times → quantities/values accumulated correctly
6. **Deletion**: Entity added then fully removed → disappears from query result
7. **Isolation**: Multiple entities exist → query returns only matching ones (by ID, game, etc.)
8. **Lifecycle**: Full sequence of events reflecting real usage

### Mapping Event Model GWT Scenarios to Tests

When the slice details contain `## Scenarios (GWTs)`, map each scenario to a test method:

| GWT Element | Test Code |
|---|---|
| `NOTHING` in Given | `When { nothing() } Then { expect { ... empty result ... } }` (synchronous) |
| `:::element event` in Given | `Given { event(EventClass(...), gameMetadata) }` |
| Multiple `:::element event` in Given | Multiple `event(...)` calls in `Given { }` block |
| `:::element information` in Then | `Then { awaitAndExpect { cfg -> assertThat(queryResult.field).isEqualTo(value) } }` |

Properties in `:::element` blocks are rule-relevant only — fill remaining constructor params with test fixture values.

## Step 4: Implement the Spring Slice Test

Use the Spring Boot integration test approach with `AxonTestFixture`.

### Test Class Structure

```kotlin
@TestPropertySource(properties = ["slices.{context}.read.{feature}.enabled=true"])
@{ProjectAxonSpringBootTest} // Use the project's @AxonSpringBootTest meta-annotation discovered in Step 0 (e.g. @HeroesAxonSpringBootTest)
internal class {Feature}SpringSliceTest @Autowired constructor(
    private val fixture: AxonTestFixture
) {
    // Test data
    private val gameId = GameId.random()
    private val gameMetadata = AxonMetadata.with("gameId", gameId.raw)

    // Tests...

    // Query helper
    private fun query{Feature}(cfg: Configuration): {Query}.Result =
        cfg.getComponent(QueryGateway::class.java)
            .query({Query}(gameId), {Query}.Result::class.java)
            .orTimeout(1, TimeUnit.SECONDS)
            .join()
}
```

### AxonTestFixture DSL for Read Slices

**Empty state test** (synchronous — no events to process):

```kotlin
fixture.When { nothing() } Then {
    expect { cfg ->
        val result = queryFeature(cfg)
        assertThat(result.items).isEmpty()
    }
}
```

**Events-present test** (asynchronous — must await event processing):

```kotlin
fixture.Given {
    event(SomeEvent(...), gameMetadata)
    event(AnotherEvent(...), gameMetadata)
} Then {
    awaitAndExpect { cfg ->
        val result = queryFeature(cfg)
        assertThat(result.items).containsExactlyInAnyOrder(
            ExpectedResult(...)
        )
    }
}
```

### Key Rules

- **Metadata is required**: If the projector uses `@MetadataValue(GameMetadata.GAME_ID_KEY)`, every event must be
  published with metadata containing that key: `.event(payload, gameMetadata)`
- **`await` for events, `expect` for empty state**: Use `Given { } Then { awaitAndExpect { } }` when events were given
  (async processing). Use `When { nothing() } Then { expect { } }` when no events (nothing to wait for).
- **Query via Configuration**: Access `QueryGateway` through `cfg.getComponent(QueryGateway::class.java)` inside the
  `expect` block.
- **Timeout on query**: Always add `.orTimeout(1, TimeUnit.SECONDS)` before `.join()`.
- **Assert with full objects**: Use `containsExactlyInAnyOrder(ResultDto(...))` with explicitly constructed result
  instances rather than field-by-field assertions.
- **Explicit expected values**: Define expected values (like cost maps) as explicit properties rather than deriving them
  from domain objects. This makes tests more readable and catches serialization issues.
- **Constructor injection**: Inject `AxonTestFixture` via constructor, not field injection.

## Step 5: Implement the REST API Test

Use `@RestAssuredMockMvcTest` + `@AxonGatewaysMockTest` with mocked `QueryGateway`:

```kotlin
@RestAssuredMockMvcTest
@AxonGatewaysMockTest
@TestPropertySource(properties = ["slices.{context}.read.{feature}.enabled=true"])
internal class {Feature}RestApiTest @Autowired constructor(val gateways: AxonGatewaysMock) {

    private val gameId = GameId.random()

    @Test
    fun `returns result`() {
        val query = GetFeature(gameId)
        val result = GetFeature.Result(listOf(...))
        gateways.assumeQueryReturns(query, result)

        Given {
            pathParam("gameId", gameId.raw)
        } When {
            async().get("/games/{gameId}/feature")
        } Then {
            statusCode(HttpStatus.OK.value())
            contentType(ContentType.JSON)
            body("items", hasSize<Int>(1))
        }
    }

    @Test
    fun `returns empty when no data`() {
        val query = GetFeature(gameId)
        val result = GetFeature.Result(emptyList())
        gateways.assumeQueryReturns(query, result)

        Given {
            pathParam("gameId", gameId.raw)
        } When {
            async().get("/games/{gameId}/feature")
        } Then {
            statusCode(HttpStatus.OK.value())
            body("items", hasSize<Int>(0))
        }
    }
}
```

### Key Rules for REST API Tests

- **Mock the query, not the projection**: Use `gateways.assumeQueryReturns(query, result)` to stub the `QueryGateway`.
- **Match the exact query instance**: The mock uses `eq(query)`, so construct the same query the controller will create
  from path variables.
- **Use `async()`**: Controllers returning `CompletableFuture` require `async().get(...)` in RestAssured.

## References

- [Read Slice Test Example](references/read-slice-test-example.md) — Complete working example
  (`GetAllDwellingsSpringSliceTest`)
