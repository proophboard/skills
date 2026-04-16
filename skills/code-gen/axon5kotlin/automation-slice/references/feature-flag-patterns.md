# Feature Flag Patterns

How to conditionally enable/disable individual slice components. Examples use a generic `Ordering` bounded context.

---

## Option 1: Spring Boot `@ConditionalOnProperty` (default)

Add `@ConditionalOnProperty` to every conditionally-loaded component in the slice. Update the YAML config files
and Spring metadata so the IDE auto-completes the property keys.

### Annotation on slice components

```kotlin
// Entity
@ConditionalOnProperty(prefix = "slices.ordering", name = ["write.placeorder.enabled"])
@EventSourced(tagKey = EventTags.ORDER_ID)
private class PlaceOrderEventSourcedState ...

// Handler
@ConditionalOnProperty(prefix = "slices.ordering", name = ["write.placeorder.enabled"])
@Component
private class PlaceOrderCommandHandler ...

// REST controller (if applicable)
@ConditionalOnProperty(prefix = "slices.ordering", name = ["write.placeorder.enabled"])
@RestController
private class PlaceOrderRestApi ...
```

For the **Explicit Registration pattern**, put `@ConditionalOnProperty` on the `@Configuration` class only:

```kotlin
@ConditionalOnProperty(prefix = "slices.ordering", name = ["write.placeorder.enabled"])
@Configuration
internal class PlaceOrderWriteSliceConfig { ... }
```

### `application.yaml` (main — enable by default)

```yaml
slices:
  ordering:
    write:
      placeorder:
        enabled: true
    read:
      getorders:
        enabled: true
    automation:
      notifycustomeronorder:
        enabled: true
```

### `application-test.yaml` (test profile — disable by default, opt-in per test)

```yaml
slices:
  ordering:
    write:
      placeorder:
        enabled: false
    read:
      getorders:
        enabled: false
    automation:
      notifycustomeronorder:
        enabled: false
```

### Opt-in in a specific test class

```kotlin
@TestPropertySource(properties = ["slices.ordering.write.placeorder.enabled=true"])
@AxonSpringBootTest
internal class PlaceOrderSpringSliceTest { ... }
```

### `META-INF/additional-spring-configuration-metadata.json`

Register each property so IDEs (IntelliJ, VS Code with Spring extension) auto-complete and validate it:

```json
{
  "properties": [
    {
      "name": "slices.ordering.write.placeorder.enabled",
      "type": "java.lang.Boolean",
      "description": "Enable/disable the PlaceOrder write slice in the Ordering bounded context."
    },
    {
      "name": "slices.ordering.read.getorders.enabled",
      "type": "java.lang.Boolean",
      "description": "Enable/disable the GetOrders read slice in the Ordering bounded context."
    }
  ]
}
```

---

## Option 2: Spring Profile (`@Profile`)

Enable/disable components by activating/deactivating a named Spring profile. Simpler than `@ConditionalOnProperty`
for "all or nothing" feature rollouts, but less granular.

```kotlin
@Profile("ordering-write")
@Component
private class PlaceOrderCommandHandler ...
```

Activate in tests via `@ActiveProfiles("ordering-write")` or `spring.profiles.active=ordering-write`.

---

## Option 3: No feature flags

If the project ships all slices unconditionally, omit `@ConditionalOnProperty` entirely. Applicable when:
- The project is small and startup time is not a concern
- There is no partial-rollout requirement
- Feature branches are the rollout mechanism

---

## Option 4: External flag libraries

For dynamic runtime flags (toggled without restart), integrate a flag library:

| Library | Spring support | Dynamic? |
|---------|---------------|----------|
| FF4J | `ff4j-spring-boot-autoconfigure` | ✅ Yes |
| Unleash | `getunleash/unleash-client-java` | ✅ Yes |
| LaunchDarkly | `launchdarkly-java-server-sdk` | ✅ Yes |
| Flipt | REST API client | ✅ Yes |

Implementation varies by library — consult the library's Spring Boot integration docs.

---

## Convention recommendation

- Use `@ConditionalOnProperty` for new projects: zero extra dependencies, IDE-friendly, test-friendly.
- Disable all slices by default in the test profile; opt-in per test class via `@TestPropertySource`.
- Always enable BOTH the slice under test AND its dependencies (e.g., the automation AND the target write slice).
