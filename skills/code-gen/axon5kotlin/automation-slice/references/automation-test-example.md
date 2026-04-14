# Automation Test Example: WhenWeekStartedThenProclaimWeekSymbol

## Automation Under Test

Reacts to `DayStarted` event (from Calendar context). When `day == 1` (first day of the week), dispatches `ProclaimWeekSymbol` command (to Astrologers context) using a `WeekSymbolCalculator` strategy.

### File Structure

```
astrologers/automation/whenweekstartedthenproclaimweeksymbol/
├── WeekSymbolCalculator.kt              # fun interface
├── WhenWeekStartedThenProclaimWeekSymbolConfiguration.kt  # @Bean for calculator
└── WhenWeekStartedThenProclaimWeekSymbol.Slice.kt         # @EventHandler processor
```

## Complete Test

```kotlin
package com.dddheroes.heroesofddd.astrologers.automation.whenweekstartedthenproclaimweeksymbol

import com.dddheroes.heroesofddd.HeroesAxonSpringBootTest
import com.dddheroes.heroesofddd.astrologers.write.AstrologersId
import com.dddheroes.heroesofddd.astrologers.write.MonthWeek
import com.dddheroes.heroesofddd.astrologers.write.WeekSymbol
import com.dddheroes.heroesofddd.astrologers.write.proclaimweeksymbol.ProclaimWeekSymbol
import com.dddheroes.heroesofddd.calendar.events.DayStarted
import com.dddheroes.heroesofddd.calendar.write.CalendarId
import com.dddheroes.heroesofddd.shared.domain.identifiers.CreatureId
import org.axonframework.extensions.kotlin.AxonMetadata
import org.axonframework.test.fixture.AxonTestFixture
import org.axonframework.test.fixture.Given
import org.axonframework.test.fixture.Scenario
import org.axonframework.test.fixture.Then
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.test.context.TestPropertySource
import java.time.Duration
import java.util.*

@TestPropertySource(
    properties = [
        "slices.astrologers.automation.whenweekstartedthenproclaimweeksymbol.enabled=true",
        "slices.astrologers.write.proclaimweeksymbol.enabled=true"
    ]
)
@HeroesAxonSpringBootTest
internal class WhenWeekStartedThenProclaimWeekSymbolSpringSliceTest @Autowired constructor(
    private val fixture: AxonTestFixture
) {

    private val gameId: String = UUID.randomUUID().toString()
    private val playerId: String = UUID.randomUUID().toString()
    private val calendarId = CalendarId(gameId)

    private val gameMetadata = AxonMetadata.with("gameId", gameId)
        .and("playerId", playerId)

    @TestConfiguration
    class TestConfig {
        @Bean
        @Primary
        fun deterministicWeekSymbolCalculator(): WeekSymbolCalculator =
            WeekSymbolCalculator { _ -> WeekSymbol(weekOf = CreatureId("angel"), growth = 5) }
    }

    @Test
    fun `when DayStarted for first day of the week, then ProclaimWeekSymbol command dispatched`() {
        val expectedCommand = ProclaimWeekSymbol(
            astrologersId = AstrologersId(calendarId.raw),
            week = MonthWeek(month = 1, week = 1),
            symbol = WeekSymbol(weekOf = CreatureId("angel"), growth = 5)
        )

        fixture.Scenario {
            Given {
                event(DayStarted(calendarId, month = 1, week = 1, day = 1), gameMetadata)
            } Then {
                await({ it.commands(expectedCommand) }, Duration.ofSeconds(5))
            }
        }
    }

    @Test
    fun `when DayStarted for non-first day of the week, then no commands dispatched`() {
        fixture.Scenario {
            Given {
                event(DayStarted(calendarId, month = 1, week = 1, day = 3), gameMetadata)
            } Then {
                await({ it.noCommands() }, Duration.ofSeconds(5))
            }
        }
    }
}
```

## Pattern Notes

- **Two slices enabled**: `@TestPropertySource` enables both the automation AND the target write slice (`proclaimweeksymbol`). The automation needs the command handler to exist.
- **Deterministic strategy**: `@TestConfiguration` with `@Primary` overrides the random `WeekSymbolCalculator` bean with a fixed one. This makes `expectedCommand` assertions predictable.
- **Constructor injection**: `AxonTestFixture` injected via constructor, not field.
- **`Scenario` wrapper**: Wraps `Given { } Then { }` for readability.
- **`await` with `commands()`**: Automation dispatches commands asynchronously — `await` waits for processing. `commands(expectedCommand)` asserts exact command payload equality.
- **`await` with `noCommands()`**: When the event condition is not met, assert no commands were dispatched.
- **Metadata**: `gameMetadata` must be passed with every event — the processor extracts `gameId` and `playerId` via `@MetadataValue`.
