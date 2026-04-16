# Command Handler Styles

Axon Framework 5 supports multiple ways to register command handlers. Check the target project's existing slices
to determine which style is established, or ask the user. Examples use a generic `Ordering` bounded context.

---

## Style 1: Separate `@Component` class with `@CommandHandler` method (Spring Boot default)

The most common style for Spring Boot projects. The entity is `@EventSourced` (or `@EventSourcedEntity` for DCB),
the handler is a separate `@Component` class.

```kotlin
// Entity — Spring Boot auto-discovers via @EventSourced
@ConditionalOnProperty(prefix = "slices.ordering", name = ["write.placeorder.enabled"])
@EventSourced(tagKey = EventTags.ORDER_ID)
private class PlaceOrderEventSourcedState private constructor(val state: State) {

    @EntityCreator
    constructor() : this(initialState)

    @EventSourcingHandler
    fun evolve(event: OrderPlaced) = PlaceOrderEventSourcedState(evolve(state, event))
}

// Handler — separate @Component, receives entity via @InjectEntity
@ConditionalOnProperty(prefix = "slices.ordering", name = ["write.placeorder.enabled"])
@Component
private class PlaceOrderCommandHandler {

    @CommandHandler
    fun handle(
        command: PlaceOrder,
        metadata: AxonMetadata,
        @InjectEntity(idProperty = EventTags.ORDER_ID) eventSourced: PlaceOrderEventSourcedState,
        eventAppender: EventAppender
    ): CommandHandlerResult = resultOf {
        val events = decide(command, eventSourced.state)
        eventAppender.append(events, metadata)
        events.toCommandResult()
    }
}
```

**Characteristics:**
- Handler and entity are separate classes
- Spring Boot auto-discovers both via component scanning
- `@ConditionalOnProperty` on **both** entity and handler classes (and REST controller)
- Tested with Spring Boot integration test (`@AxonSpringBootTest` + `AxonTestFixture`)

---

## Style 2: Explicit registration via `CommandHandlingModule` in `@Configuration`

Used when you want unit tests without a Spring context. The entity and handler are registered manually.

```kotlin
// Entity — @EventSourcedEntity (no tagKey here), uses @EventCriteriaBuilder
@EventSourcedEntity
private class PlaceOrderEventSourcedState private constructor(val state: State) {

    @EntityCreator
    constructor() : this(initialState)

    @EventSourcingHandler
    fun evolve(event: OrderPlaced) = PlaceOrderEventSourcedState(evolve(state, event))

    companion object {
        @JvmStatic
        @EventCriteriaBuilder
        fun resolveCriteria(orderId: OrderId) =
            EventCriteria
                .havingTags(Tag.of(EventTags.ORDER_ID, orderId.raw))
                .andBeingOneOfTypes("Ordering.OrderPlaced")  // "Namespace.Name" strings — NEVER ClassName::class.java.getName()
    }
}

// Handler — NO @Component; registered via Configuration below
private class PlaceOrderCommandHandler {

    @CommandHandler
    fun handle(
        command: PlaceOrder,
        metadata: AxonMetadata,
        @InjectEntity(idProperty = EventTags.ORDER_ID) eventSourced: PlaceOrderEventSourcedState,
        eventAppender: EventAppender
    ): CommandHandlerResult = resultOf {
        val events = decide(command, eventSourced.state)
        eventAppender.append(events, metadata)
        events.toCommandResult()
    }
}

// Configuration — registers entity + handler explicitly
@ConditionalOnProperty(prefix = "slices.ordering", name = ["write.placeorder.enabled"])
@Configuration
internal class PlaceOrderWriteSliceConfig {

    @Bean
    fun placeOrderSliceState(): EntityModule<*, *> =
        EventSourcedEntityModule.autodetected(
            OrderId::class.java,
            PlaceOrderEventSourcedState::class.java
        )

    @Bean
    fun placeOrderSlice(): CommandHandlingModule =
        CommandHandlingModule.named(PlaceOrder::class.simpleName!!)
            .commandHandlers()
            .annotatedCommandHandlingComponent { PlaceOrderCommandHandler() }
            .build()
}
```

**Characteristics:**
- No `@Component` on handler
- `@ConditionalOnProperty` on `@Configuration` class only (not on entity/handler)
- Unit-testable without Spring via `axonTestFixture(configSlice { ... })`:

```kotlin
internal class PlaceOrderUnitTest {
    private lateinit var sliceUnderTest: AxonTestFixture

    @BeforeEach
    fun beforeEach() {
        val sliceConfig = PlaceOrderWriteSliceConfig()
        sliceUnderTest = axonTestFixture(
            configSlice {
                registerEntity(sliceConfig.placeOrderSliceState())
                registerCommandHandlingModule(sliceConfig.placeOrderSlice())
            }
        )
    }

    @Test
    fun `given no prior order, when place, then placed`() {
        sliceUnderTest
            .given().noPriorActivity()
            .`when`().command(PlaceOrder(...), metadata)
            .then()
            .resultMessagePayload(CommandHandlerResult.Success)
            .events(OrderPlaced(...))
    }
}
```

---

## Style 3: Multi-Tag DCB with Explicit Registration

Used when `decide()` needs state from events across **multiple** consistency boundaries (streams).
Same registration mechanism as Style 2 but with a composite ID and `EventCriteria.either(...)`.

```kotlin
// Command with composite consistency boundary
@Command(namespace = "Ordering", name = "CheckoutCart", version = "1.0.0")
data class CheckoutCart(
    @get:JvmName("getCartId") val cartId: CartId,
    @get:JvmName("getCustomerId") val customerId: CustomerId,
    val items: List<CartItem>
) {
    data class ConsistencyId(val cartId: CartId, val customerId: CustomerId)
    val consistencyId = ConsistencyId(cartId, customerId)
}

// Entity — criteria spans two streams
@EventSourcedEntity
private class CheckoutCartEventSourcedState private constructor(val state: State) {

    @EntityCreator
    constructor() : this(initialState)

    @EventSourcingHandler
    fun evolve(event: CartCreated) = CheckoutCartEventSourcedState(evolve(state, event))

    @EventSourcingHandler
    fun evolve(event: CreditReserved) = CheckoutCartEventSourcedState(evolve(state, event))

    companion object {
        @JvmStatic
        @EventCriteriaBuilder
        fun resolveCriteria(id: CheckoutCart.ConsistencyId) =
            EventCriteria.either(
                EventCriteria
                    .havingTags(Tag.of(EventTags.CART_ID, id.cartId.raw))
                    .andBeingOneOfTypes("Ordering.CartCreated"),
                EventCriteria
                    .havingTags(Tag.of(EventTags.CUSTOMER_ID, id.customerId.raw))
                    .andBeingOneOfTypes("Customers.CreditReserved")
            )
    }
}
```

**Key rule for `.andBeingOneOfTypes(...)`**: Use `"Namespace.Name"` string literals (e.g., `"Ordering.CartCreated"`).
This is the `@Event(namespace)` + `"."` + `@Event(name)` value — NEVER `ClassName::class.java.getName()`.

---

## Which style to choose?

| | Style 1 (`@Component`) | Style 2 (Explicit `@Configuration`) | Style 3 (Multi-Tag DCB) |
|---|---|---|---|
| Spring Boot project | ✅ Default | ✅ Also valid | ✅ Also valid |
| Non-Spring unit tests wanted | ❌ Needs Spring context | ✅ Works standalone | ✅ Works standalone |
| Single consistency boundary | ✅ | ✅ | — |
| Multiple consistency boundaries (DCB) | ✅ (use `@EventSourcedEntity` + `@EventCriteriaBuilder` + `@Component`) | ✅ | ✅ |
