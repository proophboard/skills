# Axon Framework 5 — Write Slice

> Implement Event Sourcing write slices using Axon Framework 5 and Vertical Slice Architecture.

## Overview

This skill teaches AI agents how to implement **write slices** in Axon Framework 5 projects using Vertical Slice Architecture and Event Sourcing. A write slice follows the pattern: **Command → decide → Events → evolve → State**.

Write slices represent the **blue stripe** in Event Modeling — commands that change persistent state and the events they produce.

## What This Skill Covers

- **Event Sourced Entities** — Using `@EventSourced` annotation for single-tag or `@EventSourcedEntity` with `@EventCriteriaBuilder` for multi-tag (Dynamic Consistency Boundaries)
- **Command Handlers** — Implementing command handling logic with business rule validation
- **Event Evolution** — Managing state through event replay and evolution
- **REST API Exposure** — Optional Spring MVC controllers for HTTP command submission
- **Axon Framework 5 Patterns** — Proper use of `CommandGateway`, event sourcing, and consistency boundaries
- **Migration from AF4** — Converting Axon Framework 4 aggregate patterns to AF5 entity-based architecture

## Why This Skill

- **Vertical Slice Architecture** — Each write slice is self-contained with its own entity, handler, and tests
- **Event Sourcing Best Practices** — Teaches proper event-driven state management and consistency boundaries
- **Testable by Design** — Includes both Spring Boot integration tests and unit test patterns
- **DCB Support** — Handles both single-tag streams and multi-tag Dynamic Consistency Boundaries

## When to Use

| ✅ Use This Skill | ❌ Don't Use It |
|---|---|
| Implementing a new write slice / command handler in an AF5 project | Building read models for queries (use read-slice instead) |
| Migrating/porting write slices from Axon Framework 4 (Java or Kotlin) to AF5 | Implementing event handlers that dispatch commands (use automation-slice instead) |

## Usage

Once installed, your AI agent will know how to:

1. **Discover Target Project Conventions** — Read context files (`CLAUDE.md`, `AGENTS.md`) and explore existing slices
2. **Understand Input Formats** — Parse specifications, Event Modeling artifacts, GWT scenarios, or AF4 code
3. **Choose AF5 Pattern** — Select Spring Boot auto-discovery vs explicit registration based on project conventions
4. **Implement the Write Slice** — Generate entity, handler, commands, and events
5. **Add Feature Flags** (Optional) — Apply project-specific feature flag patterns
6. **Write Tests** — Create Spring Boot integration tests or unit tests using `axonTestFixture`

### Example Write Slice Structure

```kotlin
// Command
@Command(namespace = "Orders", name = "CreateOrder", version = "1.0.0")
data class CreateOrder(
    val tenantId: TenantId,
    val customerId: CustomerId,
    val items: List<OrderItem>,
    val shippingAddress: Address
)

// Events
@Event(namespace = "Orders", name = "OrderCreated", version = "1.0.0")
data class OrderCreated(
    val orderId: OrderId,
    val tenantId: TenantId,
    val customerId: CustomerId,
    val items: List<OrderItem>,
    val totalAmount: Money,
    val status: OrderStatus
) : OrdersEvent

@Event(namespace = "Orders", name = "OrderCancelled", version = "1.0.0")
data class OrderCancelled(
    val orderId: OrderId,
    val reason: String,
    val cancelledAt: Instant
) : OrdersEvent

// Event-Sourced Entity
@EventSourced(tagKey = "orderId")
internal data class Order private constructor(
    val orderId: OrderId,
    val tenantId: TenantId,
    val customerId: CustomerId,
    val items: List<OrderItem>,
    val totalAmount: Money,
    val status: OrderStatus
) {
    companion object {
        fun create(command: CreateOrder): Pair<EventStream, Order> {
            val event = OrderCreated(
                orderId = OrderId.next(),
                tenantId = command.tenantId,
                customerId = command.customerId,
                items = command.items,
                totalAmount = command.calculateTotal(),
                status = OrderStatus.CREATED
            )
            return EventStream.of(event) to Order.fromEvent(event)
        }
    }

    fun cancel(reason: String): EventStream {
        require(status == OrderStatus.CREATED) { "Can only cancel created orders" }
        return EventStream.of(
            OrderCancelled(orderId, reason, Instant.now())
        )
    }

    private fun apply(event: OrderCreated) = copy(
        orderId = event.orderId,
        tenantId = event.tenantId,
        customerId = event.customerId,
        items = event.items,
        totalAmount = event.totalAmount,
        status = event.status
    )

    private fun apply(event: OrderCancelled) = copy(
        status = OrderStatus.CANCELLED
    )
}

// Command Handler
@Component
private class CreateOrderHandler {

    @CommandHandler
    suspend fun handle(command: CreateOrder, eventStore: EventStore): OrderId {
        val (eventStream, entity) = Order.create(command)
        val orderId = entity.orderId
        eventStore.append(orderId.raw, eventStream)
        return orderId
    }
}
```

### REST Controller (Optional)

```kotlin
@RestController
@RequestMapping("/api/orders")
private class OrdersController(
    private val commandGateway: CommandGateway
) {

    @PostMapping
    suspend fun createOrder(@RequestBody command: CreateOrder): ResponseEntity<OrderId> {
        val result = commandGateway.send(command).resultMessage.join()
        return ResponseEntity.status(HttpStatus.CREATED).body(result as OrderId)
    }
}
```

## Prerequisites

- Familiarity with **Axon Framework 5** messaging concepts (commands, events, event sourcing)
- Understanding of **Vertical Slice Architecture** principles
- Knowledge of **Event Modeling** (especially write slice/blue stripe patterns)
- Basic **Spring Boot** and **Kotlin** experience
- Understanding of **CQRS** and **Event Sourcing** patterns

## Related Skills

| Skill | Purpose |
|---|---|
| **read-slice** | Build query-side read models and projections |
| **automation-slice** | Implement event-to-command automations |
| **slice-scenarios** | Write Given-When-Then scenarios for slice documentation |
| **event-modeling** | Core Event Modeling rules and element types |

Install these alongside write-slice for complete vertical slice implementations.
