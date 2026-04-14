# Automation with Read Model Test Example: WhenWeekSymbolProclaimedThenIncreaseDwellingAvailableCreatures

## Automation Under Test

Reacts to `WeekSymbolProclaimed` event (from Astrologers context). Looks up all dwellings matching the proclaimed creature type from a private read model (built from `DwellingBuilt` events), then dispatches `IncreaseAvailableCreatures` commands for each matching dwelling.

### File Structure

```
astrologers/automation/whenweeksymbolproclaimedthenincreasedwellingavailablecreatures/
└── WhenWeekSymbolProclaimedThenIncreaseDwellingAvailableCreatures.Slice.kt
    ├── BuiltDwellingReadModel          # @Entity — JPA read model
    ├── BuiltDwellingReadModelRepository # JpaRepository with DB-level filtering
    └── ...Processor                     # @EventHandler for both DwellingBuilt and WeekSymbolProclaimed
```

## Complete Implementation

```kotlin
@Entity
@Table(
    name = "astrologers_automation_built_dwelling",
    indexes = [Index(name = "idx_astrologers_built_dwelling_game_creature", columnList = "gameId, creatureId")]
)
internal data class BuiltDwellingReadModel(
    val gameId: String,
    @Id
    val dwellingId: String,
    val creatureId: String
)

@ConditionalOnProperty(
    prefix = "slices.astrologers.automation",
    name = ["whenweeksymbolproclaimedthenincreasedwellingavailablecreatures.enabled"]
)
@Repository
private interface BuiltDwellingReadModelRepository : JpaRepository<BuiltDwellingReadModel, String> {
    fun findAllByGameIdAndCreatureId(gameId: String, creatureId: String): List<BuiltDwellingReadModel>
}

@ConditionalOnProperty(
    prefix = "slices.astrologers.automation",
    name = ["whenweeksymbolproclaimedthenincreasedwellingavailablecreatures.enabled"]
)
@Component
@SequencingPolicy(type = MetadataSequencingPolicy::class, parameters = ["gameId"])
private class WhenWeekSymbolProclaimedThenIncreaseDwellingAvailableCreaturesProcessor(
    private val repository: BuiltDwellingReadModelRepository
) {

    @EventHandler
    fun react(
        event: WeekSymbolProclaimed,
        @MetadataValue(GameMetadata.GAME_ID_KEY) gameId: String,
        @MetadataValue(GameMetadata.PLAYER_ID_KEY) playerId: String,
        commandDispatcher: CommandDispatcher,
    ): CompletableFuture<Void> {
        val futures = repository.findAllByGameIdAndCreatureId(gameId, event.weekOf.raw)
            .map { dwelling -> increaseAvailableCreatures(dwelling, event.growth, playerId, commandDispatcher) }
        return CompletableFuture.allOf(*futures.toTypedArray())
    }

    private fun increaseAvailableCreatures(
        dwelling: BuiltDwellingReadModel,
        increaseBy: Int,
        playerId: String,
        commandDispatcher: CommandDispatcher
    ): CompletableFuture<out Any?> {
        val command = IncreaseAvailableCreatures(
            dwellingId = DwellingId(dwelling.dwellingId),
            creatureId = CreatureId(dwelling.creatureId),
            increaseBy = Quantity(increaseBy)
        )
        val metadata = GameMetadata.with(GameId(dwelling.gameId), PlayerId(playerId))
        return commandDispatcher.send(command, metadata).resultMessage
    }

    @EventHandler
    fun on(event: DwellingBuilt, @MetadataValue(GameMetadata.GAME_ID_KEY) gameId: String) {
        repository.save(
            BuiltDwellingReadModel(
                gameId = gameId,
                dwellingId = event.dwellingId.raw,
                creatureId = event.creatureId.raw
            )
        )
    }
}
```

## Complete Test

```kotlin
@TestPropertySource(
    properties = [
        "slices.astrologers.automation.whenweeksymbolproclaimedthenincreasedwellingavailablecreatures.enabled=true",
        "slices.creaturerecruitment.write.increaseavailablecreatures.enabled=true"
    ]
)
@HeroesAxonSpringBootTest
internal class WhenWeekSymbolProclaimedThenIncreaseDwellingAvailableCreaturesSpringSliceTest @Autowired constructor(
    private val fixture: AxonTestFixture
) {

    private val gameId: String = UUID.randomUUID().toString()
    private val playerId: String = UUID.randomUUID().toString()
    private val astrologersId = AstrologersId(gameId)

    private val gameMetadata = AxonMetadata.with("gameId", gameId)
        .and("playerId", playerId)

    private val costPerTroop = Resources.of(ResourceType.GOLD to 1000)

    @Test
    fun `when WeekSymbolProclaimed, then increase available creatures for matching dwellings only`() {
        val angelDwelling1 = DwellingId.random()
        val angelDwelling2 = DwellingId.random()
        val titanDwelling = DwellingId.random()
        val testDwellingIds = setOf(angelDwelling1, angelDwelling2, titanDwelling)

        fixture.Scenario {
            Given {
                event(DwellingBuilt(angelDwelling1, CreatureId("angel"), costPerTroop), gameMetadata)
                event(DwellingBuilt(angelDwelling2, CreatureId("angel"), costPerTroop), gameMetadata)
                event(DwellingBuilt(titanDwelling, CreatureId("titan"), costPerTroop), gameMetadata)
                event(
                    WeekSymbolProclaimed(astrologersId, month = 1, week = 1, weekOf = CreatureId("angel"), growth = 3),
                    gameMetadata
                )
            } Then {
                await({
                    it.commandsSatisfy { commands ->
                        val relevantPayloads = commands.map { cmd -> cmd.payload() }
                            .filterIsInstance<IncreaseAvailableCreatures>()
                            .filter { cmd -> cmd.dwellingId in testDwellingIds }

                        assertThat(relevantPayloads).containsExactlyInAnyOrder(
                            IncreaseAvailableCreatures(angelDwelling1, CreatureId("angel"), Quantity(3)),
                            IncreaseAvailableCreatures(angelDwelling2, CreatureId("angel"), Quantity(3))
                        )
                    }
                })
            }
        }
    }

    @Test
    fun `when WeekSymbolProclaimed, then increase only dwellings built before the proclamation`() {
        val angelDwelling1 = DwellingId.random()
        val angelDwelling2 = DwellingId.random()
        val testDwellingIds = setOf(angelDwelling1, angelDwelling2)

        fixture.Scenario {
            Given {
                // Dwelling 1 built before week 1
                event(DwellingBuilt(angelDwelling1, CreatureId("angel"), costPerTroop), gameMetadata)
                // Week 1: growth 1 — only dwelling 1 exists
                event(
                    WeekSymbolProclaimed(astrologersId, month = 1, week = 1, weekOf = CreatureId("angel"), growth = 1),
                    gameMetadata
                )
                // Dwelling 2 built after week 1
                event(DwellingBuilt(angelDwelling2, CreatureId("angel"), costPerTroop), gameMetadata)
                // Week 2: growth 2 — both dwellings exist
                event(
                    WeekSymbolProclaimed(astrologersId, month = 1, week = 2, weekOf = CreatureId("angel"), growth = 2),
                    gameMetadata
                )
            } Then {
                await({
                    it.commandsSatisfy { commands ->
                        val relevantPayloads = commands.map { cmd -> cmd.payload() }
                            .filterIsInstance<IncreaseAvailableCreatures>()
                            .filter { cmd -> cmd.dwellingId in testDwellingIds }

                        assertThat(relevantPayloads).containsExactlyInAnyOrder(
                            // Week 1: only dwelling 1 was built
                            IncreaseAvailableCreatures(angelDwelling1, CreatureId("angel"), Quantity(1)),
                            // Week 2: both dwellings were built
                            IncreaseAvailableCreatures(angelDwelling1, CreatureId("angel"), Quantity(2)),
                            IncreaseAvailableCreatures(angelDwelling2, CreatureId("angel"), Quantity(2))
                        )
                    }
                })
            }
        }
    }
}
```

## Pattern Notes

- **Two slices enabled**: `@TestPropertySource` enables both the automation AND the target write slice (`increaseavailablecreatures`). The automation dispatches commands that need a handler to exist.
- **Constructor injection**: `AxonTestFixture` injected via constructor, not field.
- **`Scenario` wrapper**: Wraps `Given { } Then { }` for readability.
- **`commandsSatisfy` with `containsExactlyInAnyOrder`**: Commands may be dispatched in any order (JPA returns results in unpredictable order). Never use `commands(cmd1, cmd2)` for automations with read model — it asserts strict ordering.
- **Filter by test entity IDs**: `RecordingCommandBus` accumulates commands across test methods in the same Spring context. The `Given { } Then { }` path does NOT reset the bus (only `When { }` does). Filter assertions to only check commands for the current test's entity IDs.
- **Temporal ordering test**: Interleave building events and trigger events in a single `Given` block. Assert ALL expected commands across ALL triggers at once, since `RecordingCommandBus` accumulates everything.
- **Metadata**: `gameMetadata` must be passed with every event — the processor extracts `gameId` and `playerId` via `@MetadataValue`.
- **`@SequencingPolicy(MetadataSequencingPolicy, "gameId")`**: Ensures events for the same game are processed sequentially by the event processor, preventing race conditions on the read model.
- **`CompletableFuture<Void>` return**: The processor returns `CompletableFuture.allOf()` so AF5 awaits all command dispatches. If any command fails, the event handler fails and the processor retries.
- **`CommandDispatcher` as method parameter**: ProcessingContext-scoped, auto-injected by AF5 into `@EventHandler` methods. NOT constructor-injected like `CommandGateway`.
