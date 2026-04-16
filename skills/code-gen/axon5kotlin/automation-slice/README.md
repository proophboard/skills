# Axon Framework 5 — Automation Slice

> Implement automation slices (Event to Command) using Axon Framework 5 and Vertical Slice Architecture.

## Overview

This skill teaches AI agents how to implement **automation slices** in Axon Framework 5 projects using Vertical Slice Architecture. An automation is an event handler that reacts to an event by dispatching a command through the `CommandDispatcher`.

Automations represent the **orange stripe** in Event Modeling — automated actors that respond to events without human intervention.

## What This Skill Covers

- **Stateless Automations** — Direct event-to-command mapping with no stored state needed
- **Automations with Read Model** — When the automation needs to look up data from a private read model (JPA entity + repository) before dispatching commands
- **Axon Framework 5 Patterns** — Proper use of `CommandDispatcher`, `@EventHandler`, metadata propagation, and `CompletableFuture` return types
- **Migration from AF4** — Converting Axon Framework 4 `@EventHandler` and `CommandGateway` patterns to AF5

## Why This Skill

- **Vertical Slice Architecture** — Each automation is a self-contained slice with its own tests and configuration
- **AF5 Best Practices** — Uses AF5's preferred `CommandDispatcher` (ProcessingContext-scoped) instead of singleton `CommandGateway`
- **Event-Driven Design** — Implements proper event-to-command flows with correlation ID propagation
- **Testable by Design** — Includes Spring Boot integration test patterns using `AxonTestFixture` Kotlin DSL

## When to Use

| ✅ Use This Skill | ❌ Don't Use It |
|---|---|
| Implementing a new automation/event-to-command reactor in an AF5 project | Implementing command handlers (use write-slice instead) |
| Migrating/porting automations from Axon Framework 4 (Java or Kotlin) to AF5 | Building read models for queries (use read-slice instead) |
| User provides Event Modeling artifacts or GWT scenarios for an automation | Creating aggregate command handlers |
| User says "implement", "create", "add", "migrate" an automation in AF5/VSA | External API integrations without event triggers |

## Usage

Once installed, your AI agent will know how to:

1. **Discover Target Project Conventions** — Read context files (`CLAUDE.md`, `AGENTS.md`) and explore existing slices
2. **Understand Input Formats** — Parse Event Modeling artifacts, GWT scenarios, or natural language descriptions
3. **Ensure Events Exist** — Create missing event classes following the project's hierarchy conventions
4. **Implement the Automation** — Generate processor classes with proper `CommandDispatcher` usage
5. **Add Feature Flags** (Optional) — Apply project-specific feature flag patterns
6. **Write Tests** — Create Spring Boot integration tests using `AxonTestFixture` Kotlin DSL

### Stateless Automation Example

```kotlin
@Component
private class OrderShippedNotificationProcessor(
    private val notificationStrategy: NotificationStrategy
) {

    @EventHandler
    fun react(
        event: OrderShipped,
        @MetadataValue("tenantId") tenantId: String,
        commandDispatcher: CommandDispatcher
    ) {
        if (event.customerWantsNotification) {
            val command = SendNotification(
                customerId = event.customerId,
                message = notificationStrategy.buildMessage(event)
            )
            val metadata = AxonMetadata.with("tenantId", tenantId)
            commandDispatcher.send(command, metadata)
        }
    }
}
```

### Automation with Read Model Example

When the automation needs to iterate over entities or look up data not in the trigger event:

```kotlin
@Component
@SequencingPolicy(type = MetadataSequencingPolicy::class, parameters = ["tenantId"])
private class MonthlyReportProcessor(
    private val repository: ReportSubscriptionRepository
) {

    @EventHandler
    fun react(
        event: MonthEnded,
        @MetadataValue("tenantId") tenantId: String,
        commandDispatcher: CommandDispatcher
    ): CompletableFuture<Void> {
        val futures = repository.findAllByTenantId(tenantId)
            .map { subscription ->
                val command = GenerateReport(subscription.reportType, event.month)
                commandDispatcher.send(command, AxonMetadata.with("tenantId", tenantId))
                    .resultMessage
            }
        return CompletableFuture.allOf(*futures.toTypedArray())
    }

    @EventHandler
    fun on(event: ReportSubscribed, @MetadataValue("tenantId") tenantId: String) {
        repository.save(ReportSubscription(tenantId, event.subscriptionId, event.reportType))
    }
}
```

## Prerequisites

- Familiarity with **Axon Framework 5** messaging concepts (events, commands, command dispatcher)
- Understanding of **Vertical Slice Architecture** principles
- Knowledge of **Event Modeling** (especially automation/orange stripe patterns)
- Basic **Spring Boot** and **Kotlin** experience

## Related Skills

| Skill | Purpose |
|---|---|
| **write-slice** | Implement command handlers and aggregates |
| **read-slice** | Build query-side read models and projections |
| **slice-scenarios** | Write Given-When-Then scenarios for slice documentation |
| **event-modeling** | Core Event Modeling rules and element types |

Install these alongside automation-slice for complete vertical slice implementations.
