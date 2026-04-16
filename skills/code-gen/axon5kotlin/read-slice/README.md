# Axon Framework 5 — Read Slice

> Implement read slices (projections + query handlers + REST API) using Axon Framework 5 and Vertical Slice Architecture.

## Overview

This skill teaches AI agents how to implement **read slices** in Axon Framework 5 projects using Vertical Slice Architecture. A read slice consists of:

- **Projector** — Projects events into a JPA-based read model
- **Query Handler** — Handles queries via `QueryGateway`
- **REST API** (Optional) — Exposes queries as HTTP endpoints
- **Integration Tests** — Spring Boot tests using `AxonTestFixture` Kotlin DSL

Read slices represent the **green stripe** in Event Modeling — information elements that display data to users.

## What This Skill Covers

- **Read Model Design** — JPA entities with proper indexing for efficient queries
- **Event Projection** — Building and updating read models from domain events
- **Query Handling** — Implementing query handlers with `@QueryHandler` annotation
- **REST API Exposure** — Optional Spring MVC controllers for HTTP access
- **Axon Framework 5 Patterns** — Proper use of `QueryGateway`, `@EventHandler`, and transactional boundaries
- **Migration from AF4** — Converting Axon Framework 4 projection patterns to AF5

## Why This Skill

- **Vertical Slice Architecture** — Each read slice is self-contained with its own read model, projector, and tests
- **CQRS Implementation** — Clean separation between write side (commands/events) and read side (queries/projections)
- **Testable by Design** — Includes Spring Boot integration test patterns using `AxonTestFixture` Kotlin DSL
- **Performance Optimized** — Teaches proper database indexing and query optimization strategies

## When to Use

| ✅ Use This Skill | ❌ Don't Use It |
|---|---|
| Implementing a new read slice / projection in an AF5 project | Implementing command handlers (use write-slice instead) |
| Migrating/porting read slices from Axon Framework 4 to AF5 | Building event handlers that dispatch commands (use automation-slice instead) |
| User provides Event Modeling artifacts or GWT scenarios for a read slice | Creating aggregate state (handled on write side) |
| User says "implement", "create", "add" a read slice, projection, or query handler | External API integrations without CQRS patterns |

## Usage

Once installed, your AI agent will know how to:

1. **Discover Target Project Conventions** — Read context files and explore existing slices
2. **Ensure Events Exist** — Create missing event classes following the project's hierarchy
3. **Implement the Read Slice** — Generate projector, query handler, and optional REST controller
4. **Add Feature Flags** (Optional) — Apply project-specific feature flag patterns
5. **Write Tests** — Create Spring Boot integration tests using `AxonTestFixture` Kotlin DSL

### Example Read Slice Structure

```kotlin
// Query definition with nested Result
@Query(namespace = "Orders", name = "GetOrdersByCustomer", version = "1.0.0")
data class GetOrdersByCustomer(
    val tenantId: TenantId,
    val customerId: CustomerId
) {
    data class Result(
        val orders: List<OrderSummary>
    ) {
        data class OrderSummary(
            val orderId: OrderId,
            val status: OrderStatus,
            val totalAmount: Money
        )
    }
}

// Read Model Entity
@Entity
@Table(
    name = "orders_read_orders_by_customer",
    indexes = [Index(name = "idx_orders_tenant_customer", columnList = "tenantId, customerId")]
)
internal data class OrderReadModel(
    val tenantId: String,
    val customerId: String,
    @Id
    val orderId: String,
    val status: String,
    val totalAmount: Long
)

// Repository
@Repository
private interface OrderReadModelRepository : JpaRepository<OrderReadModel, String> {
    fun findAllByTenantIdAndCustomerId(tenantId: String, customerId: String): List<OrderReadModel>
}

// Projector
@Component
@ProcessingGroup("orders-read-model")
private class OrdersByCustomerProjector(
    private val repository: OrderReadModelRepository
) {

    @EventHandler
    fun on(event: OrderCreated, @MetadataValue("tenantId") tenantId: String) {
        repository.save(
            OrderReadModel(
                tenantId = tenantId,
                customerId = event.customerId.raw,
                orderId = event.orderId.raw,
                status = "CREATED",
                totalAmount = event.totalAmount.amount
            )
        )
    }

    @EventHandler
    fun on(event: OrderShipped) {
        repository.findById(event.orderId.raw).ifPresent { order ->
            repository.save(order.copy(status = "SHIPPED"))
        }
    }
}

// Query Handler
@Component
private class OrdersByCustomerQueryHandler(
    private val repository: OrderReadModelRepository
) {

    @QueryHandler
    fun handle(query: GetOrdersByCustomer): GetOrdersByCustomer.Result {
        val orders = repository.findAllByTenantIdAndCustomerId(
            query.tenantId.raw,
            query.customerId.raw
        )
        return GetOrdersByCustomer.Result(
            orders.map { it.toOrderSummary() }
        )
    }

    private fun OrderReadModel.toOrderSummary(): GetOrdersByCustomer.Result.OrderSummary {
        return GetOrdersByCustomer.Result.OrderSummary(
            orderId = OrderId(orderId),
            status = OrderStatus.valueOf(status),
            totalAmount = Money(totalAmount)
        )
    }
}
```

### REST Controller (Optional)

```kotlin
@RestController
@RequestMapping("/api/orders")
private class OrdersByCustomerController(
    private val queryGateway: QueryGateway
) {

    @GetMapping("/customer/{customerId}")
    suspend fun getOrdersByCustomer(
        @PathVariable customerId: String,
        @RequestAttribute tenantId: String
    ): ResponseEntity<GetOrdersByCustomer.Result> {
        val query = GetOrdersByCustomer(TenantId(tenantId), CustomerId(customerId))
        val result = queryGateway.query(query, ResponseTypes.instanceOf(GetOrdersByCustomer.Result::class.java))
        return ResponseEntity.ok(result.join())
    }
}
```

## Prerequisites

- Familiarity with **Axon Framework 5** messaging concepts (events, queries, projections)
- Understanding of **CQRS** and **Vertical Slice Architecture** principles
- Knowledge of **Event Modeling** (especially read slice/green stripe patterns)
- Basic **Spring Boot**, **JPA**, and **Kotlin** experience

## Related Skills

| Skill | Purpose |
|---|---|
| **write-slice** | Implement command handlers and aggregates |
| **automation-slice** | Build event-to-command automations |
| **slice-scenarios** | Write Given-When-Then scenarios for slice documentation |
| **event-modeling** | Core Event Modeling rules and element types |

Install these alongside read-slice for complete vertical slice implementations.
