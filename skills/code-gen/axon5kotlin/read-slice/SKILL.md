---
name: axon5kotlin-read-slice
description: >
  Implement read slices (projections + query handlers + REST API + tests) using Axon Framework 5 AxonTestFixture
  with Spring Boot integration tests. A read slice is: Events projected into a Read Model, queried via QueryGateway.
  Use when: (1) implementing a new read slice / projection in an AF5 project,
  (2) migrating/porting a read slice from Axon Framework 4 (Java or Kotlin) to AF5,
  (3) user provides a read slice specification or Event Modeling artifact and asks to implement it,
  (4) user says "implement", "create", "add" a read slice, projection, query handler,
  or read model in an Axon Framework 5 / Vertical Slice Architecture project.
---

# Axon Framework 5 — Read Slice

## Relationship to prooph board Event Modeling

This skill implements the **read slice (green stripe)** from a prooph board Event Modeling board.
It consumes:
- The slice's `## Scenarios (GWTs)` section (written with the `slice-scenarios` skill) — GWT format for read slices
  is `Given (events) → Then (information)`. Events in Given tell you which events the projector must handle.
  The information element in Then describes the expected query result shape and values.
- The slice's optional `## Implementation Guidelines` — technical requirements that extend the standard pattern

## Step 0: Discover Target Project Conventions

Before writing any code, read the target project's context file (e.g., `CLAUDE.md`, `AGENTS.md`, `.cursorrules`) and
explore at least one existing read slice. Look for:

- Feature flag pattern (Step 2 — Feature Flags)
- Assertion library (AssertJ, AssertK, etc.)
- Test naming conventions (backtick-quoted method names)
- Metadata handling — how correlation IDs are attached to events (see
  [references/kotlin-extensions.md](references/kotlin-extensions.md) for `AxonMetadata` helpers)
- Existing read slice files and tests as patterns
- REST API test pattern — whether RestAssured, `MockMvc`, or another tool is used
- Spring configuration metadata file location

Also identify the established convention for:
- **REST API exposure** (Step 4 — optional)
- **Feature flags** (Step 2 — optional)

## Step 1: Ensure Events Exist

Before implementing the read slice, verify that all events the projector will handle exist in the codebase.
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
// File: {context}/events/{Context}Event.kt
sealed interface {Context}Event : DomainEvent {
    @get:EventTag(EventTags.{TAG_CONSTANT})
    val {tagProperty}: {IdType}
}
```

### Concrete Event Classes

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

## Step 2: Implement the Read Slice

If the Event Modeling artifact includes slice details with `## Scenarios (GWTs)`, use them to derive test cases.

If the slice details contain `## Implementation Guidelines`, **follow them**.

### Query Annotation

Every query data class must have `@Query(namespace, name, version)`:

```kotlin
@Query(namespace = "{Context}", name = "{QueryName}", version = "1.0.0")
data class GetOrders(val tenantId: TenantId, ...) {
    data class Result(val items: List<OrderSummary>) {
        data class OrderSummary(...)
    }
}
```

- `@Query` — import from `org.axonframework.messaging.queryhandling.annotation.Query`
- `namespace` = bounded context name, `name` = query class name, `version` = `"1.0.0"` for new queries

A read slice file contains all layers in a single file. **Do NOT add section comments** (Domain/Application/Presentation)
for read slices — those are only for write slices.

### Slice File Structure

```kotlin
// Query DTO + Result DTO
@Query(namespace = "{Context}", name = "GetOrders", version = "1.0.0")
data class GetOrders(val tenantId: TenantId, ...) {
    data class Result(val items: List<OrderSummary>)
}

// JPA Entity (read model) — internal to projection
@Entity @Table(name = "...", indexes = [...])
data class OrderReadModel(...)

// Repository — private
@ConditionalOnProperty(...)  // if using feature flags
@Repository
private interface OrderReadModelRepository : JpaRepository<...> { ... }

// Projector — private
@ConditionalOnProperty(...)  // if using feature flags
@Component
@SequencingPolicy(type = MetadataSequencingPolicy::class, parameters = ["correlationId"])
private class OrderReadModelProjector(...) { ... }

// Query Handler — private
@ConditionalOnProperty(...)  // if using feature flags
@Component
private class OrderReadModelQueryHandler(...) { ... }

// REST Controller — internal (only if REST API chosen in Step 4)
@ConditionalOnProperty(...)  // if using feature flags
@RestController
internal class OrdersRestApi(...) { ... }
```

### Result DTO Rules

- If the read model matches the desired query result **1:1**, expose the JPA entity directly in the `Result`.
- If the read model contains fields the caller already knows from the query (e.g., `tenantId`, `entityId`), create a
  **separate result data class** nested inside the query that strips those redundant fields. The query handler maps
  from the JPA entity to the result DTO.

### Idiomatic Kotlin in Projectors

Use `findByIdOrNull` (from `org.springframework.data.repository.findByIdOrNull`) with scope functions:

```kotlin
// Upsert pattern
val updated = repository.findByIdOrNull(id)
    ?.let { it.copy(quantity = it.quantity + event.quantity.raw) }
    ?: OrderReadModel(...)
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
    name = "ordering_read_getorders",
    indexes = [Index(name = "idx_orders_tenant_order", columnList = "tenantId, orderId")]
)
```

## Step 3: Feature Flags (Optional)

**Check the target project's convention first** — scan existing slices for `@ConditionalOnProperty`, `@Profile`, or
custom feature-flag integrations.

If no clear convention exists, ask the user:
> How should slice-level feature flags be managed?
> - **`@ConditionalOnProperty`** (Spring Boot default)
> - **Custom flag library** (FF4J, Unleash, LaunchDarkly, etc.)
> - **No feature flags** — ship all slices unconditionally

See [references/feature-flag-patterns.md](references/feature-flag-patterns.md) for the full `@ConditionalOnProperty`
example and alternatives.

## Step 4: REST API Exposure (Optional)

**Check the target project's convention first** — does it expose read models via REST (`@RestController` presence)?

If no convention is established, ask the user:
> Does this read slice need a REST API endpoint?
> - **Yes** — add a `@RestController` and a REST API test (see `references/rest-api-patterns.md`)
> - **No** — projection + query handler only; callers use `QueryGateway` directly

## Step 5: Design Test Cases

Cover these scenarios (adapt to the specific slice):

1. **Empty state**: No events published → query returns empty result
2. **Single entity**: One creation event → query returns single item
3. **Multiple entities**: Multiple creation events → query returns all items
4. **State updates**: Creation event + update event → query returns updated state
5. **Aggregation**: Same entity updated multiple times → values accumulated correctly
6. **Deletion**: Entity added then fully removed → disappears from query result
7. **Isolation**: Multiple entities exist → query returns only matching ones (by ID, tenant, etc.)
8. **Lifecycle**: Full sequence of events reflecting real usage

### Mapping Event Model GWT Scenarios to Tests

When the slice details contain `## Scenarios (GWTs)`, map each scenario to a test method:

| GWT Element | Test Code |
|---|---|
| `NOTHING` in Given | `When { nothing() } Then { expect { ... empty result ... } }` (synchronous) |
| `:::element event` in Given | `Given { event(EventClass(...), metadata) }` |
| Multiple `:::element event` in Given | Multiple `event(...)` calls in `Given { }` block |
| `:::element information` in Then | `Then { awaitAndExpect { cfg -> assertThat(queryResult.field).isEqualTo(value) } }` |

Properties in `:::element` blocks are rule-relevant only — fill remaining constructor params with test fixture values.

## Step 6: Implement the Spring Slice Test

Use `@AxonSpringBootTest` (`org.axonframework.extension.springboot.test.AxonSpringBootTest`) with `AxonTestFixture`
injected. Check if the project defines a meta-annotation that wraps `@AxonSpringBootTest` with shared config
(`@ActiveProfiles`, `@Import` for Testcontainers, etc.); if one exists, use it.

The `AxonTestFixture` Kotlin DSL (`Given { } Then { awaitAndExpect { } }`) must be copied into the project's test
sources. See [references/axon-test-fixture-kotlin-dsl.md](references/axon-test-fixture-kotlin-dsl.md).

For `AxonMetadata` — use the typealias from [references/kotlin-extensions.md](references/kotlin-extensions.md).

### Test Class Structure

```kotlin
@TestPropertySource(properties = ["slices.{context}.read.{feature}.enabled=true"])
@AxonSpringBootTest
internal class {Feature}SpringSliceTest @Autowired constructor(
    private val fixture: AxonTestFixture
) {
    private val tenantId = TenantId.random()
    private val metadata = AxonMetadata.with("tenantId", tenantId.raw)

    @Test
    fun `given no events, when query, then empty`() {
        fixture.When { nothing() } Then {
            expect { cfg ->
                val result = query{Feature}(cfg)
                assertThat(result.items).isEmpty()
            }
        }
    }

    @Test
    fun `given event, then result contains item`() {
        fixture.Given {
            event(SomeEvent(...), metadata)
        } Then {
            awaitAndExpect { cfg ->
                val result = query{Feature}(cfg)
                assertThat(result.items).containsExactlyInAnyOrder(
                    ExpectedResult(...)
                )
            }
        }
    }

    private fun query{Feature}(cfg: Configuration): {Query}.Result =
        cfg.getComponent(QueryGateway::class.java)
            .query({Query}(tenantId), {Query}.Result::class.java)
            .orTimeout(1, TimeUnit.SECONDS)
            .join()
}
```

### Key Rules

- **Metadata is required**: If the projector uses `@MetadataValue("correlationId")`, every event must be published
  with metadata containing that key: `.event(payload, metadata)`
- **`awaitAndExpect` for events, `expect` for empty state**: Use `Given { } Then { awaitAndExpect { } }` when
  events were given (async processing). Use `When { nothing() } Then { expect { } }` when no events.
- **Query via Configuration**: Access `QueryGateway` through `cfg.getComponent(QueryGateway::class.java)` inside
  the `expect` or `awaitAndExpect` block.
- **Timeout on query**: Always add `.orTimeout(1, TimeUnit.SECONDS)` before `.join()`.
- **Assert with full objects**: Use `containsExactlyInAnyOrder(ResultDto(...))` with explicitly constructed result
  instances rather than field-by-field assertions.
- **Explicit expected values**: Define expected values as explicit properties rather than deriving them from domain
  objects. This makes tests more readable and catches serialization issues.
- **Constructor injection**: Inject `AxonTestFixture` via constructor, not field injection.

## Step 7: REST API Test (Optional, only if Step 4 chosen REST)

See [references/rest-api-patterns.md](references/rest-api-patterns.md) for a full RestAssured + `@WebMvcTest`
example with mocked `QueryGateway`.

## References

- [Read Slice Test Example](references/read-slice-test-example.md) — Complete working example
- [REST API Patterns](references/rest-api-patterns.md) — RestAssured REST controller and test examples
- [Feature Flag Patterns](references/feature-flag-patterns.md) — `@ConditionalOnProperty` and alternatives
- [Kotlin Extensions](references/kotlin-extensions.md) — `AxonMetadata` typealias and helper functions
- [AxonTestFixture Kotlin DSL](references/axon-test-fixture-kotlin-dsl.md) — Given-When-Then DSL source to copy into the project
