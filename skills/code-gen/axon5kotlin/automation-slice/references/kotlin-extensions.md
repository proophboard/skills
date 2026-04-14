# Kotlin Extensions for Axon Framework 5

## `AxonMetadata` Typealias and Helpers

Axon Framework 5 uses `org.axonframework.messaging.core.Metadata` as the metadata type. This name can clash with
other `Metadata` types in a project (JPA, MongoDB, Spring, etc.). Copy this file into your project's main source
tree to get a clear alias and useful helper functions.

### Suggested location

`src/main/kotlin/org/axonframework/extensions/kotlin/MetadataExtensions.kt`

### Source

```kotlin
package org.axonframework.extensions.kotlin

import org.axonframework.messaging.core.Message
import org.axonframework.messaging.core.Metadata

val Message.metadata: Metadata
    get() = this.metadata()

/**
 * Checks whether this [AxonMetadata] contains all entries from the [other] metadata.
 *
 * Returns `true` if every key-value pair in [other] is present in this metadata
 * with the same value. An empty [other] metadata always returns `true`.
 */
fun AxonMetadata.contains(other: AxonMetadata): Boolean {
    return other.entries.all { (key, value) -> this[key] == value }
}

typealias AxonMetadata = Metadata
```

### Usage

```kotlin
import org.axonframework.extensions.kotlin.AxonMetadata

// Create metadata
val metadata = AxonMetadata.with("tenantId", tenantId)
    .and("correlationId", correlationId)

// Access metadata on a message
val tenantId: String? = message.metadata["tenantId"]

// Subset check (useful in tests)
val hasExpectedKeys = eventMetadata.contains(expectedMetadata)
```

### Why `AxonMetadata`?

Without the alias, `import org.axonframework.messaging.core.Metadata` competes with:
- `javax.persistence.metamodel.Metamodel`
- MongoDB / Spring Data metadata classes
- Any project-defined `Metadata` class

The alias `AxonMetadata` makes the intent explicit at each call site.

### `Metadata.with(...)` — static factory

`AxonMetadata` / `Metadata` has a static factory method:

```kotlin
AxonMetadata.with("key1", "value1")
    .and("key2", "value2")
    .and("key3", "value3")
```

This returns an immutable `Metadata` instance. Chain `.and(key, value)` to add more entries.
