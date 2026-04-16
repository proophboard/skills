# REST API Patterns

REST controller and test examples for write slice and read slice HTTP exposure.
Uses RestAssured for tests. Examples use a generic `Ordering` bounded context.

---

## Write Slice REST Controller

```kotlin
////////////////////////////////////////////
////////// Presentation
///////////////////////////////////////////

@ConditionalOnProperty(prefix = "slices.ordering", name = ["write.placeorder.enabled"])  // if using feature flags
@RestController
@RequestMapping("orders")
private class PlaceOrderRestApi(private val commandGateway: CommandGateway) {

    @JvmRecord
    data class Body(val customerId: String, val items: List<Map<String, Any>>)

    @PostMapping
    fun post(
        @RequestHeader("X-Tenant-ID") tenantId: String,
        @RequestBody requestBody: Body
    ): CompletableFuture<ResponseEntity<Any>> {
        val command = PlaceOrder(
            orderId = OrderId.random(),
            customerId = CustomerId(requestBody.customerId),
            items = requestBody.items.map { /* map to domain type */ }
        )
        val metadata = AxonMetadata.with("tenantId", tenantId)

        return commandGateway.send(command, metadata)
            .resultAs(CommandHandlerResult::class.java)
            .toResponseEntity()
    }
}
```

Key conventions (adapt to the target project):
- `@RestController` visibility depends on the project (`private`, `internal`, or default)
- Request body uses raw types (String, Map) — mirrors what the HTTP client sends
- `CompletableFuture<ResponseEntity<Any>>` return type for async command dispatch
- Metadata constructed from request headers; key names follow the project's correlation convention

---

## Write Slice REST API Test (RestAssured + `@WebMvcTest`)

Tests the controller in isolation — mocked `CommandGateway`, no Axon Server, no event store.

```kotlin
@WebMvcTest(PlaceOrderRestApi::class)
@TestPropertySource(properties = ["slices.ordering.write.placeorder.enabled=true"])  // if using feature flags
internal class PlaceOrderRestApiTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockBean
    private lateinit var commandGateway: CommandGateway

    @Test
    fun `command success - returns 201 Created`() {
        val orderId = OrderId.random()
        given().commandGatewayReturns<PlaceOrder>(CommandHandlerResult.Success)

        RestAssured.given()
            .mockMvc(mockMvc)
            .header("X-Tenant-ID", "tenant-abc")
            .contentType(ContentType.JSON)
            .body("""{ "customerId": "customer-1", "items": [] }""")
            .`when`()
            .post("/orders")
            .then()
            .statusCode(HttpStatus.CREATED.value())
    }

    @Test
    fun `command failure - returns 400 Bad Request`() {
        given().commandGatewayReturns<PlaceOrder>(CommandHandlerResult.Failure("Order already exists"))

        RestAssured.given()
            .mockMvc(mockMvc)
            .header("X-Tenant-ID", "tenant-abc")
            .contentType(ContentType.JSON)
            .body("""{ "customerId": "customer-1", "items": [] }""")
            .`when`()
            .post("/orders")
            .then()
            .statusCode(HttpStatus.BAD_REQUEST.value())
            .contentType(ContentType.JSON)
            .body("message", equalTo("Order already exists"))
    }
}
```

**Note on stubbing `CommandGateway`**: AF5's `CommandGateway` interface has multiple overloaded `send` variants.
A convenient helper is to stub by command type. Check the project for an existing `assumeCommandReturns` or
`commandGatewayReturns` utility; if it doesn't exist, stub `commandGateway.send(any(), any())` directly using
Mockito or MockK.

**Note on HTTP method / status code**: The example uses `POST` / `201 Created`. Adapt to the project's REST
conventions (PUT for idempotent commands → `204 No Content`, etc.).

---

## Read Slice REST Controller

```kotlin
@ConditionalOnProperty(prefix = "slices.ordering", name = ["read.getorders.enabled"])  // if using feature flags
@RestController
@RequestMapping("orders")
internal class GetOrdersRestApi(private val queryGateway: QueryGateway) {

    @GetMapping
    fun getOrders(
        @RequestHeader("X-Tenant-ID") tenantId: String
    ): CompletableFuture<ResponseEntity<GetOrders.Result>> {
        val query = GetOrders(TenantId(tenantId))
        return queryGateway.query(query, GetOrders.Result::class.java)
            .thenApply { ResponseEntity.ok(it) }
    }
}
```

---

## Read Slice REST API Test

```kotlin
@WebMvcTest(GetOrdersRestApi::class)
@TestPropertySource(properties = ["slices.ordering.read.getorders.enabled=true"])  // if using feature flags
internal class GetOrdersRestApiTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockBean
    private lateinit var queryGateway: QueryGateway

    private val tenantId = TenantId("tenant-abc")

    @Test
    fun `returns orders`() {
        val query = GetOrders(tenantId)
        val result = GetOrders.Result(
            listOf(GetOrders.Result.OrderSummary(orderId = "order-1", status = "PLACED"))
        )
        `when`(queryGateway.query(query, GetOrders.Result::class.java))
            .thenReturn(CompletableFuture.completedFuture(result))

        RestAssured.given()
            .mockMvc(mockMvc)
            .header("X-Tenant-ID", tenantId.raw)
            .`when`()
            .async().get("/orders")
            .then()
            .statusCode(HttpStatus.OK.value())
            .contentType(ContentType.JSON)
            .body("items", hasSize<Int>(1))
    }

    @Test
    fun `returns empty when no orders`() {
        val query = GetOrders(tenantId)
        val result = GetOrders.Result(emptyList())
        `when`(queryGateway.query(query, GetOrders.Result::class.java))
            .thenReturn(CompletableFuture.completedFuture(result))

        RestAssured.given()
            .mockMvc(mockMvc)
            .header("X-Tenant-ID", tenantId.raw)
            .`when`()
            .async().get("/orders")
            .then()
            .statusCode(HttpStatus.OK.value())
            .body("items", hasSize<Int>(0))
    }
}
```

**Key rules for REST API tests:**
- Mock the gateway, not the projection — use `when(queryGateway.query(...)).thenReturn(...)` or a project helper
- Match the exact query instance: construct the same query the controller will create from request headers/params
- Use `async().get(...)` for controllers returning `CompletableFuture`
- Request body and path variables use raw primitives — mirrors what the HTTP client sends

---

## Dependencies (pom.xml / build.gradle)

```xml
<!-- RestAssured with MockMvc support -->
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>spring-mock-mvc</artifactId>
    <scope>test</scope>
</dependency>
```

Or in Gradle:

```kotlin
testImplementation("io.rest-assured:spring-mock-mvc")
```
