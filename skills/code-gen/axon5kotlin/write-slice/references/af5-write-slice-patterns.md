# AF5 Write Slice Patterns

Complete reference for implementing write slices in Axon Framework 5 with Vertical Slice Architecture.

## Table of Contents

1. [Spring Boot Pattern — Single Tag](#1-spring-boot-pattern--single-tag)
2. [Explicit Registration Pattern — Single Tag](#2-explicit-registration-pattern--single-tag)
3. [Explicit Registration Pattern — Multi-Tag DCB](#3-explicit-registration-pattern--multi-tag-dcb)
4. [Component Reference](#4-component-reference)
5. [Testing](#5-testing)

The distinction between Spring Boot and Explicit Registration is about **registration mechanism** (auto-discovery vs
manual `@Configuration`), not about tag cardinality. Both support single-tag and multi-tag. Multi-tag DCB with Spring
Boot uses `@EventSourcedEntity` + `@EventCriteriaBuilder` + `@Component` (no explicit `@Configuration` needed).

---

## 1. Spring Boot Pattern — Single Tag

Default choice for Spring Boot projects. Entity and handler auto-discovered by Spring.

### Full Example: BuildDwelling

```kotlin
package com.example.creaturerecruitment.write.builddwelling

import com.example.EventTags
import com.example.creaturerecruitment.events.DwellingBuilt
import com.example.creaturerecruitment.events.DwellingEvent
import com.example.sdk.application.CommandHandlerResult
import com.example.shared.application.GameMetadata
import com.example.sdk.application.resultOf
import com.example.sdk.application.toCommandResult
import com.example.shared.domain.HeroesEvent
import com.example.shared.domain.identifiers.*
import com.example.shared.domain.valueobjects.Resources
import com.example.shared.restapi.Headers
import com.example.sdk.restapi.toResponseEntity
import org.axonframework.eventsourcing.annotation.EventSourcingHandler
import org.axonframework.eventsourcing.annotation.reflection.EntityCreator
import org.axonframework.extension.spring.stereotype.EventSourced
import org.axonframework.extensions.kotlin.AxonMetadata
import org.axonframework.messaging.commandhandling.annotation.Command
import org.axonframework.messaging.commandhandling.annotation.CommandHandler
import org.axonframework.messaging.commandhandling.gateway.CommandGateway
import org.axonframework.messaging.eventhandling.gateway.EventAppender
import org.axonframework.modelling.annotation.InjectEntity
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import org.springframework.web.bind.annotation.*
import java.util.concurrent.CompletableFuture

////////////////////////////////////////////
////////// Domain
///////////////////////////////////////////

@Command(namespace = "CreatureRecruitment", name = "BuildDwelling", version = "1.0.0")
data class BuildDwelling(
    @get:JvmName("getDwellingId")
    val dwellingId: DwellingId,
    @get:JvmName("getCreatureId")
    val creatureId: CreatureId,
    val costPerTroop: Resources,
)

private data class State(val isBuilt: Boolean)

private val initialState = State(isBuilt = false)

private fun decide(command: BuildDwelling, state: State): List<HeroesEvent> {
    if (state.isBuilt) {
        return emptyList()
    }
    return listOf(
        DwellingBuilt(
            dwellingId = command.dwellingId,
            creatureId = command.creatureId,
            costPerTroop = command.costPerTroop
        )
    )
}

private fun evolve(state: State, event: DwellingEvent): State = when (event) {
    is DwellingBuilt -> state.copy(isBuilt = true)
    is AvailableCreaturesChanged -> state  // no-op: doesn't affect BuildDwelling state
    is CreatureRecruited -> state           // no-op: doesn't affect BuildDwelling state
}

////////////////////////////////////////////
////////// Application
///////////////////////////////////////////

@ConditionalOnProperty(prefix = "slices.creaturerecruitment", name = ["write.builddwelling.enabled"])
@EventSourced(tagKey = EventTags.DWELLING_ID) // ConsistencyBoundary
private class BuildDwellingEventSourcedState private constructor(val state: State) {

    @EntityCreator
    constructor() : this(initialState)

    @EventSourcingHandler
    fun evolve(event: DwellingBuilt) = BuildDwellingEventSourcedState(evolve(state, event))
}

@ConditionalOnProperty(prefix = "slices.creaturerecruitment", name = ["write.builddwelling.enabled"])
@Component
private class BuildDwellingCommandHandler {

    @CommandHandler
    fun handle(
        command: BuildDwelling,
        metadata: AxonMetadata,
        @InjectEntity(idProperty = EventTags.DWELLING_ID) eventSourced: BuildDwellingEventSourcedState,
        eventAppender: EventAppender
    ): CommandHandlerResult = resultOf {
        val events = decide(command, eventSourced.state)
        eventAppender.append(events, metadata)
        events.toCommandResult()
    }
}

////////////////////////////////////////////
////////// Presentation
///////////////////////////////////////////

@ConditionalOnProperty(prefix = "slices.creaturerecruitment", name = ["write.builddwelling.enabled"])
@RestController
@RequestMapping("games/{gameId}")
private class BuildDwellingRestApi(private val commandGateway: CommandGateway) {
    @JvmRecord
    data class Body(val creatureId: String, val costPerTroop: Map<String, Int>)

    @PutMapping("/dwellings/{dwellingId}")
    fun putDwellings(
        @RequestHeader(Headers.PLAYER_ID) playerId: String,
        @PathVariable gameId: String,
        @PathVariable dwellingId: String,
        @RequestBody requestBody: Body
    ): CompletableFuture<ResponseEntity<Any>> {
        val command = BuildDwelling(
            DwellingId(dwellingId),
            CreatureId(requestBody.creatureId),
            Resources.of(requestBody.costPerTroop)
        )
        val metadata = GameMetadata.with(GameId(gameId), PlayerId(playerId))

        return commandGateway.send(command, metadata)
            .resultAs(CommandHandlerResult::class.java)
            .toResponseEntity()
    }
}
```

### Spring Boot Pattern Characteristics

- `@EventSourced(tagKey = EventTags.DWELLING_ID)` - all events matching this tag are replayed
- `@Component` on handler - auto-registered by Spring
- `@InjectEntity(idProperty = EventTags.DWELLING_ID)` - the command property named `dwellingId` is used to filter events
  by tag
- `@ConditionalOnProperty` on BOTH entity and handler classes (and REST)
- Tested with Spring Boot test (project's `@AxonSpringBootTest` meta-annotation + `springTestFixture`)

---

## 2. Explicit Registration Pattern — Single Tag

Use when you want unit tests without Spring context for a single-tag slice. Same domain logic as the Spring Boot
pattern,
but entity and handler are registered explicitly via `@Configuration`.

### Key Differences from Spring Boot Pattern

```kotlin
////////////////////////////////////////////
////////// Application
///////////////////////////////////////////

@EventSourcedEntity // NOT @EventSourced — no tagKey here
private class ProclaimWeekSymbolEventSourcedState private constructor(val state: State) {

    @EntityCreator
    constructor() : this(initialState)

    @EventSourcingHandler
    fun evolve(event: WeekSymbolProclaimed) = ProclaimWeekSymbolEventSourcedState(evolve(state, event))

    companion object {
        @JvmStatic
        @EventCriteriaBuilder
        fun resolveCriteria(astrologersId: AstrologersId) = // takes the id value object directly (not composite)
            EventCriteria
                .havingTags(Tag.of(EventTags.ASTROLOGERS_ID, astrologersId.raw))
                .andBeingOneOfTypes("Astrologers.WeekSymbolProclaimed")
    }
}

// NO @Component — registered via Configuration below
private class ProclaimWeekSymbolCommandHandler {

    @CommandHandler
    fun handle(
        command: ProclaimWeekSymbol,
        metadata: AxonMetadata,
        @InjectEntity(idProperty = EventTags.ASTROLOGERS_ID) eventSourced: ProclaimWeekSymbolEventSourcedState,
        eventAppender: EventAppender
    ): CommandHandlerResult = resultOf {
        val events = decide(command, eventSourced.state)
        eventAppender.append(events, metadata)
        events.toCommandResult()
    }
}

@ConditionalOnProperty(prefix = "slices.astrologers", name = ["write.proclaimweeksymbol.enabled"])
@Configuration
internal class ProclaimWeekSymbolWriteSliceConfig {

    @Bean
    fun proclaimWeekSymbolSliceState(): EntityModule<*, *> =
        EventSourcedEntityModule.autodetected(
            AstrologersId::class.java,
            ProclaimWeekSymbolEventSourcedState::class.java
        )

    @Bean
    fun proclaimWeekSymbolSlice(): CommandHandlingModule =
        CommandHandlingModule.named(ProclaimWeekSymbol::class.simpleName!!)
            .commandHandlers()
            .annotatedCommandHandlingComponent { ProclaimWeekSymbolCommandHandler() }
            .build()
}
```

### Explicit Registration Pattern Characteristics (Single Tag)

- `@EventSourcedEntity` (no tagKey) + `@EventCriteriaBuilder` companion with single tag
- `@EventCriteriaBuilder` takes the **id value object directly** (e.g., `AstrologersId`), not a composite ID
- Handler has NO `@Component` — instantiated by `CommandHandlingModule`
- `@Configuration` class registers both `EntityModule` and `CommandHandlingModule`
- `@ConditionalOnProperty` on `@Configuration` class and REST only (not on entity/handler)
- Tested with non-Spring Boot unit test (`axonTestFixture` + `configSlice`)

---

## 3. Explicit Registration Pattern — Multi-Tag DCB

Use when `decide()` needs state from events across MULTIPLE tags/streams. Uses explicit `@Configuration` for
registration, enabling non-Spring Boot unit tests.

### Full Example: RecruitCreature

Needs dwelling events (by `dwellingId`) AND army events (by `armyId`).

```kotlin
package com.example.creaturerecruitment.write.recruitcreature

// imports including:
import org.axonframework.eventsourcing.annotation.EventCriteriaBuilder
import org.axonframework.eventsourcing.annotation.EventSourcedEntity
import org.axonframework.eventsourcing.configuration.EventSourcedEntityModule
import org.axonframework.messaging.commandhandling.configuration.CommandHandlingModule
import org.axonframework.messaging.eventstreaming.EventCriteria
import org.axonframework.messaging.eventstreaming.Tag
import org.axonframework.modelling.configuration.EntityModule
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

////////////////////////////////////////////
////////// Domain
///////////////////////////////////////////

@Command(namespace = "CreatureRecruitment", name = "RecruitCreature", version = "1.0.0")
data class RecruitCreature(
    @get:JvmName("getDwellingId")
    val dwellingId: DwellingId,
    @get:JvmName("getCreatureId")
    val creatureId: CreatureId,
    val armyId: ArmyId,
    val quantity: Quantity,
    val expectedCost: Resources,
) {
    data class RecruitmentId(val dwellingId: DwellingId, val armyId: ArmyId)

    val recruitmentId = RecruitmentId(dwellingId, armyId)
}

private data class State(
    val creatureId: CreatureId,
    val availableCreatures: Quantity,
    val costPerTroop: Resources,
    val creaturesInArmy: Map<CreatureId, Quantity>
)

private val initialState = State(
    creatureId = CreatureId("undefined"),
    availableCreatures = Quantity.zero(),
    costPerTroop = Resources.empty(),
    creaturesInArmy = emptyMap()
)

private fun decide(command: RecruitCreature, state: State): List<HeroesEvent> {
    if (state.creatureId != command.creatureId || state.availableCreatures < command.quantity) {
        throw IllegalStateException("Recruit creatures cannot exceed available creatures")
    }
    val recruitCost = state.costPerTroop * command.quantity
    if (command.expectedCost != recruitCost) {
        throw IllegalStateException("Recruit cost cannot differ than expected cost")
    }
    if (!state.creaturesInArmy.containsKey(command.creatureId) && state.creaturesInArmy.size >= 7) {
        throw IllegalStateException("Army cannot contain more than 7 different creature types")
    }
    return listOf(
        CreatureRecruited(
            dwellingId = command.dwellingId,
            creatureId = command.creatureId,
            toArmy = command.armyId,
            quantity = command.quantity,
            totalCost = recruitCost
        ),
        CreatureAddedToArmy(
            armyId = command.armyId,
            creatureId = command.creatureId,
            quantity = command.quantity
        ),
        AvailableCreaturesChanged(
            dwellingId = command.dwellingId,
            creatureId = command.creatureId,
            changedBy = -command.quantity.raw,
            changedTo = state.availableCreatures - command.quantity
        )
    )
}

// Cross-module slice: HeroesEvent is non-sealed, so `else -> state` IS allowed here.
// The compiler cannot enforce exhaustiveness on non-sealed types, so `else` is the fallback.
private fun evolve(state: State, event: HeroesEvent): State = when (event) {
    is DwellingBuilt -> state.copy(creatureId = event.creatureId, costPerTroop = event.costPerTroop)
    is AvailableCreaturesChanged -> state.copy(availableCreatures = event.changedTo)
    is CreatureAddedToArmy -> {
        val current = state.creaturesInArmy[event.creatureId] ?: Quantity.zero()
        state.copy(creaturesInArmy = state.creaturesInArmy + (event.creatureId to current + event.quantity))
    }
    is CreatureRemovedFromArmy -> {
        val current = state.creaturesInArmy[event.creatureId] ?: Quantity.zero()
        val newQty = current - event.quantity
        val updated = if (newQty == Quantity.zero()) state.creaturesInArmy - event.creatureId
        else state.creaturesInArmy + (event.creatureId to newQty)
        state.copy(creaturesInArmy = updated)
    }
    else -> state  // allowed: HeroesEvent is non-sealed
}

////////////////////////////////////////////
////////// Application
///////////////////////////////////////////

@EventSourcedEntity // no tagKey - uses @EventCriteriaBuilder instead
private class RecruitCreatureEventSourcedState private constructor(val state: State) {

    @EntityCreator
    constructor() : this(initialState)

    @EventSourcingHandler
    fun evolve(event: DwellingBuilt) = RecruitCreatureEventSourcedState(evolve(state, event))

    @EventSourcingHandler
    fun evolve(event: AvailableCreaturesChanged) = RecruitCreatureEventSourcedState(evolve(state, event))

    @EventSourcingHandler
    fun evolve(event: CreatureAddedToArmy) = RecruitCreatureEventSourcedState(evolve(state, event))

    @EventSourcingHandler
    fun evolve(event: CreatureRemovedFromArmy) = RecruitCreatureEventSourcedState(evolve(state, event))

    companion object {
        @JvmStatic
        @EventCriteriaBuilder
        fun resolveCriteria(recruitmentId: RecruitCreature.RecruitmentId) =
            EventCriteria.either(
                EventCriteria
                    .havingTags(Tag.of(EventTags.DWELLING_ID, recruitmentId.dwellingId.raw))
                    .andBeingOneOfTypes(
                        "CreatureRecruitment.DwellingBuilt",
                        "CreatureRecruitment.AvailableCreaturesChanged",
                    ),
                EventCriteria
                    .havingTags(Tag.of(EventTags.ARMY_ID, recruitmentId.armyId.raw))
                    .andBeingOneOfTypes(
                        "Armies.CreatureAddedToArmy",
                        "Armies.CreatureRemovedFromArmy",
                    )
            )
    }
}

// no @Component - registered via Configuration below
private class RecruitCreatureCommandHandler {

    @CommandHandler
    fun handle(
        command: RecruitCreature,
        metadata: AxonMetadata,
        @InjectEntity(idProperty = "recruitmentId") eventSourced: RecruitCreatureEventSourcedState,
        eventAppender: EventAppender
    ): CommandHandlerResult = resultOf {
        val events = decide(command, eventSourced.state)
        eventAppender.append(events, metadata)
        events.toCommandResult()
    }
}

@ConditionalOnProperty(prefix = "slices.creaturerecruitment", name = ["write.recruitcreature.enabled"])
@Configuration
internal class RecruitCreatureWriteSliceConfig {

    @Bean
    fun recruitCreatureSliceState(): EntityModule<*, *> =
        EventSourcedEntityModule.autodetected(
            RecruitCreature.RecruitmentId::class.java,
            RecruitCreatureEventSourcedState::class.java
        )

    @Bean
    fun recruitCreatureSlice(): CommandHandlingModule =
        CommandHandlingModule.named(RecruitCreature::class.simpleName!!)
            .commandHandlers()
            .annotatedCommandHandlingComponent { RecruitCreatureCommandHandler() }
            .build()
}

////////////////////////////////////////////
////////// Presentation
///////////////////////////////////////////

@ConditionalOnProperty(prefix = "slices.creaturerecruitment", name = ["write.recruitcreature.enabled"])
@RestController
@RequestMapping("games/{gameId}")
private class RecruitCreatureRestApi(private val commandGateway: CommandGateway) {
    data class Body(val creatureId: String, val armyId: String, val quantity: Int, val expectedCost: Map<String, Int>)

    @PutMapping("/dwellings/{dwellingId}/creature-recruitments")
    fun putCreatureRecruitments(
        @RequestHeader(Headers.PLAYER_ID) playerId: String,
        @PathVariable gameId: String,
        @PathVariable dwellingId: String,
        @RequestBody requestBody: Body
    ): CompletableFuture<ResponseEntity<Any>> {
        val command = RecruitCreature(
            dwellingId = DwellingId(dwellingId),
            creatureId = CreatureId(requestBody.creatureId),
            armyId = ArmyId(requestBody.armyId),
            quantity = Quantity(requestBody.quantity),
            expectedCost = Resources.of(requestBody.expectedCost)
        )
        val metadata = GameMetadata.with(GameId(gameId), PlayerId(playerId))
        return commandGateway.send(command, metadata)
            .resultAs(CommandHandlerResult::class.java)
            .toResponseEntity()
    }
}
```

### Explicit Registration Pattern Characteristics (Multi-Tag)

- Composite ID in command: `data class RecruitmentId(...)` + `val recruitmentId = ...`
- `@EventSourcedEntity` (no tagKey)
- `@EventCriteriaBuilder` companion method defines which tags and event types to query
- `EventCriteria.either(...)` combines multiple tag queries
- `.andBeingOneOfTypes(...)` filters to specific event types — **MUST use `"Namespace.Name"` strings** (e.g., `"CreatureRecruitment.DwellingBuilt"`), NEVER `ClassName::class.java.getName()`. The type name is `@Event(namespace).@Event(name)` joined with a dot
- Handler has NO `@Component` - instantiated by `CommandHandlingModule`
- `@InjectEntity(idProperty = "recruitmentId")` points to composite ID property
- `@Configuration` class registers both `EntityModule` and `CommandHandlingModule`
- Tested with non-Spring Boot unit test (`axonTestFixture` + `configSlice`)

---

## 4. Component Reference

### Event Publishing

```kotlin
// Multiple events (List)
eventAppender.append(events, metadata)

// Single event
eventAppender.append(event, metadata)
```

### Domain Rule Enforcement in decide()

```kotlin
// Idempotent no-op (e.g., building already-built dwelling)
if (state.isBuilt) return emptyList()

// Rule violation (e.g., operating on non-existent entity)
if (!state.isBuilt) throw IllegalStateException("Only built dwelling can have available creatures")

// FailureEvent (when failure should be recorded as event - check project conventions)
if (violated) return listOf(SomeFailureEvent(reason = "..."))
```

### Event Definitions

```kotlin
// Sealed interface hierarchy
sealed interface DwellingEvent : HeroesEvent {
    @get:EventTag(EventTags.DWELLING_ID)
    val dwellingId: DwellingId
}

// Concrete event — annotate with @Event(namespace, name, version)
@Event(namespace = "CreatureRecruitment", name = "DwellingBuilt", version = "1.0.0")
data class DwellingBuilt(
    override val dwellingId: DwellingId,
    val creatureId: CreatureId,
    val costPerTroop: Resources
) : DwellingEvent
```

### Feature Flag in application.yaml

```yaml
slices:
  creaturerecruitment:
    write:
      builddwelling:
        enabled: true
```

---

## 5. Testing

### Non-Spring Boot Test (Explicit Registration pattern)

```kotlin
internal class RecruitCreatureUnitTest {
    private lateinit var sliceUnderTest: AxonTestFixture

    @BeforeEach
    fun beforeEach() {
        val sliceConfig = RecruitCreatureWriteSliceConfig()
        sliceUnderTest = axonTestFixture(
            configSlice {
                registerEntity(sliceConfig.recruitCreatureSliceState())
                registerCommandHandlingModule(sliceConfig.recruitCreatureSlice())
            }
        )
    }

    @Test
    fun `given built dwelling with creatures, when recruit, then recruited`() {
        sliceUnderTest
            .given()
            .event(DwellingBuilt(...), gameMetadata)
        .event(AvailableCreaturesChanged(...), gameMetadata)
        .`when`().command(RecruitCreature(...), gameMetadata)
        .then()
            .resultMessagePayload(CommandHandlerResult.Success)
            .events(CreatureRecruited(...), CreatureAddedToArmy(...), AvailableCreaturesChanged(...))
    }

    @Test
    fun `given not built dwelling, when recruit, then failure`() {
        sliceUnderTest
            .given().noPriorActivity()
            .`when`().command(RecruitCreature(...), gameMetadata)
        .then()
            .resultMessagePayload(CommandHandlerResult.Failure("Recruit creatures cannot exceed available creatures"))
    }
}
```

### Spring Boot Test (Spring Boot pattern)

```kotlin
@TestPropertySource(properties = ["slices.creaturerecruitment.write.builddwelling.enabled=true"])
@HeroesAxonSpringBootTest
internal class BuildDwellingSpringSliceTest @Autowired constructor(configuration: AxonConfiguration) {
    private val sliceUnderTest: AxonTestFixture = springTestFixture(configuration)

    @Test
    fun `given not built dwelling, when build, then built`() {
        sliceUnderTest
            .given().noPriorActivity()
            .`when`().command(BuildDwelling(...), gameMetadata)
        .then()
            .resultMessagePayload(CommandHandlerResult.Success)
            .events(DwellingBuilt(...))
    }

    @Test
    fun `given already built, when build again, then no events`() {
        sliceUnderTest
            .given().event(DwellingBuilt(...), gameMetadata)
        .`when`().command(BuildDwelling(...), gameMetadata)
        .then()
            .resultMessagePayload(CommandHandlerResult.Success)
            .noEvents()
    }
}
```

### REST API Test (Presentation layer)

Tests the REST controller in isolation — mocked `CommandGateway`, no Axon Server, no event store.

```kotlin
@RestAssuredMockMvcTest
@AxonGatewaysMockTest
@TestPropertySource(properties = ["slices.creaturerecruitment.write.builddwelling.enabled=true"])
internal class BuildDwellingRestApiTest @Autowired constructor(val gateways: AxonGatewaysMock) {

    private val gameId = GameId.random()
    private val playerId = PlayerId.random()
    private val dwellingId = DwellingId.random()

    @Test
    fun `command success - returns 204 No Content`() {
        gateways.assumeCommandReturns<BuildDwelling>(Success)

        Given {
            pathParam("gameId", gameId.raw)
            pathParam("dwellingId", dwellingId.raw)
            header(Headers.PLAYER_ID, playerId.raw)
            contentType(ContentType.JSON)
            body("""
                {
                  "creatureId": "angel",
                  "costPerTroop": {"gold": 3000}
                }
            """)
        } When {
            async().put("/games/{gameId}/dwellings/{dwellingId}")
        } Then {
            statusCode(HttpStatus.NO_CONTENT.value())
        }
    }

    @Test
    fun `command failure - returns 400 Bad Request`() {
        gateways.assumeCommandReturns<BuildDwelling>(Failure("Dwelling already built"))

        Given {
            pathParam("gameId", gameId.raw)
            pathParam("dwellingId", dwellingId.raw)
            header(Headers.PLAYER_ID, playerId.raw)
            contentType(ContentType.JSON)
            body("""
                {
                  "creatureId": "angel",
                  "costPerTroop": {"gold": 3000}
                }
            """)
        } When {
            async().put("/games/{gameId}/dwellings/{dwellingId}")
        } Then {
            statusCode(HttpStatus.BAD_REQUEST.value())
            contentType(ContentType.JSON)
            body("message", equalTo("Dwelling already built"))
        }
    }
}
```

Key annotations and utilities:

- `@RestAssuredMockMvcTest` — composes `@WebMvcTest` + RestAssured MockMvc setup
- `@AxonGatewaysMockTest` — provides `AxonGatewaysMock` bean with mocked `CommandGateway`, `QueryGateway`, `Clock`
- `gateways.assumeCommandReturns<T>(result)` — stubs by command type for all AF5 `CommandGateway` dispatch styles
- `async().put(...)` / `async().post(...)` — required because controllers return `CompletableFuture`
- Request body uses raw JSON primitives (not value objects) — mirrors HTTP client payloads

### Test Scenarios Checklist

**Slice tests (Given-When-Then):**

- Happy path: no prior events, command succeeds
- Idempotency: duplicate command, no events emitted
- Rule violations: invalid preconditions, `CommandHandlerResult.Failure`
- State transitions: prior events change decide() behavior
- Multiple prior events: cumulative state reconstruction

**REST API tests (HTTP layer):**

- Command success: `204 No Content`
- Command failure: `400 Bad Request` with `{"message": "..."}` body
