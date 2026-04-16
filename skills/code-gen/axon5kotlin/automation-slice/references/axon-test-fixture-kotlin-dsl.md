# AxonTestFixture Kotlin DSL

## Overview

`AxonTestFixtureDsl.kt` provides `Given { } When { } Then { }` syntax for `AxonTestFixture` tests.
It is **not yet published as a standalone library** — copy the source below into your project's test sources.

### Suggested location

`src/test/kotlin/org/axonframework/test/fixture/AxonTestFixtureDsl.kt`

### Source

```kotlin
@file:Suppress("TestFunctionName")

package org.axonframework.test.fixture

import org.assertj.core.api.Assertions.assertThat
import org.axonframework.common.configuration.Configuration
import org.axonframework.messaging.core.Metadata
import org.axonframework.test.fixture.AxonTestPhase.*
import java.time.Duration

/**
 * Kotlin DSL for [AxonTestFixture] providing `Given { } When { } Then { }` syntax.
 *
 * Mirrors the REST Assured Kotlin DSL pattern — no wrapper classes, just extension functions
 * on Axon's own types. Eliminates the need for backtick-escaping `` `when`() `` and provides
 * lambda-with-receiver blocks for each test phase.
 *
 * ### Write slice example:
 * ```kotlin
 * sliceUnderTest.Scenario {
 *     Given {
 *         noPriorActivity()
 *     } When {
 *         command(PlaceOrder(...), metadata)
 *     } Then {
 *         resultMessagePayload(CommandHandlerResult.Success)
 *         events(OrderPlaced(...))
 *     }
 * }
 * ```
 *
 * ### Read slice example (Given → Then, skip When):
 * ```kotlin
 * fixture.Given {
 *     event(OrderPlaced(...), metadata)
 * } Then {
 *     awaitAndExpect { cfg -> ... }
 * }
 * ```
 *
 * ### Read slice example (skip Given):
 * ```kotlin
 * fixture.When { nothing() } Then { expect { cfg -> ... } }
 * ```
 */

// ── Scenario Wrapper ──────────────────────────────────────────

/**
 * Wraps a full Given-When-Then test scenario for readability.
 *
 * @param description optional human-readable description (for documentation purposes only)
 * @param block the scenario body using `Given { } When { } Then { }` DSL
 */
@Suppress("unused", "UNUSED_PARAMETER")
fun AxonTestFixture.Scenario(
    description: String = "",
    block: AxonTestFixture.() -> Unit
) {
    this.block()
}

// ── Entry Points ──────────────────────────────────────────────

/**
 * Enters the Given phase to define initial state before the action under test.
 */
fun AxonTestFixture.Given(block: Given.() -> Unit): Given =
    this.given().apply(block)

/**
 * Enters the When phase directly, skipping the Given phase (no prior state).
 */
@Suppress("unused")
fun <T> AxonTestFixture.When(block: When.() -> T): T =
    this.`when`().block()

// ── Given → When ──────────────────────────────────────────────

/**
 * Transitions from the Given phase to the When phase.
 */
infix fun <T> Given.When(block: When.() -> T): T =
    this.`when`().block()

// ── Given → Then (skip When, for read model tests) ───────────

/**
 * Transitions from the Given phase directly to the Then phase, skipping the When phase.
 *
 * Useful for read model / projection tests where you only need to set up events
 * and assert on the projected state.
 */
@Suppress("unused")
infix fun Given.Then(block: Then.Nothing.() -> Unit): Then.Nothing =
    this.then().apply(block)

// ── And (chain a new scenario) ───────────────────────────────

/**
 * Returns to the setup phase to chain a new test scenario.
 */
infix fun Then.Command.And(block: Setup.() -> Unit): Setup =
    this.and().apply(block)

@Suppress("unused")
infix fun Then.Event.And(block: Setup.() -> Unit): Setup =
    this.and().apply(block)

@Suppress("unused")
infix fun Then.Nothing.And(block: Setup.() -> Unit): Setup =
    this.and().apply(block)

// ── Setup Entry Points (for And chaining) ────────────────────

fun Setup.Given(block: Given.() -> Unit): Given =
    this.given().apply(block)

@Suppress("unused")
fun <T> Setup.When(block: When.() -> T): T =
    this.`when`().block()

// ── When.X → Then (type-specific) ────────────────────────────

infix fun When.Command.Then(block: Then.Command.() -> Unit): Then.Command =
    this.then().apply(block)

@Suppress("unused")
infix fun When.Event.Then(block: Then.Event.() -> Unit): Then.Event =
    this.then().apply(block)

@Suppress("unused")
infix fun When.Nothing.Then(block: Then.Nothing.() -> Unit): Then.Nothing =
    this.then().apply(block)

// ── Kotlin Helpers ────────────────────────────────────────────

/**
 * Combines [Then.Message.await] and [Then.MessageAssertions.expect] into a single call.
 *
 * Equivalent to `await { it.expect(block) }` with the default 5-second timeout.
 */
@Suppress("unused")
fun <T : Then.Message<T>> T.awaitAndExpect(block: (Configuration) -> Unit): T =
    this.await { it.expect(block) }

/**
 * Combines [Then.Message.await] and [Then.MessageAssertions.expect] with a custom [timeout].
 */
@Suppress("unused")
fun <T : Then.Message<T>> T.awaitAndExpect(
    timeout: Duration,
    block: (Configuration) -> Unit
): T = this.await({ it.expect(block) }, timeout)

/**
 * Reified variant of [Then.MessageAssertions.exception] — avoids `::class.java` boilerplate.
 */
@Suppress("unused")
inline fun <reified T : Throwable> Then.MessageAssertions<*>.exception() {
    this.exception(T::class.java)
}

/**
 * Reified variant of [Then.Command.resultMessagePayloadSatisfies] — infers payload type
 * from the generic parameter.
 */
@Suppress("unused", "DEPRECATION")
inline fun <reified T : Any> Then.Command.resultMessagePayloadSatisfies(
    noinline consumer: (T) -> Unit
) {
    this.resultMessagePayloadSatisfies(T::class.java, consumer)
}

// ── Metadata Assertions ───────────────────────────────────────

/**
 * Asserts that all published events contain the [expected] metadata entries.
 *
 * Uses a subset check — events may carry additional metadata beyond [expected].
 */
@Suppress("unused")
fun <T : Then.MessageAssertions<T>> T.allEventsHaveMetadata(expected: Metadata): T =
    this.eventsSatisfy { events ->
        assertThat(events)
            .`as`("all events should contain metadata %s", expected)
            .allSatisfy { event ->
                assertThat(event.metadata())
                    .`as`("metadata of '%s' event", event.payloadType().simpleName)
                    .containsAllEntriesOf(expected)
            }
    }
```

### Usage notes

- **Write slice tests**: use `Scenario { Given { } When { } Then { } }`
- **Read slice tests (with events)**: use `fixture.Given { event(...) } Then { awaitAndExpect { cfg -> ... } }`
- **Read slice tests (empty state)**: use `fixture.When { nothing() } Then { expect { cfg -> ... } }`
- **`awaitAndExpect`** — async; waits for event processors to project events before asserting
- **`expect`** — synchronous; use when no events were given (nothing to wait for)
- **`await`** with a `Duration` — override the default 5-second wait: `awaitAndExpect(Duration.ofSeconds(10)) { ... }`
