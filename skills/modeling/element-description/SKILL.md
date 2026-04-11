---
name: element-description
description: "Element Description Skill - Guide for writing effective local element descriptions in prooph board. Covers markdown formatting, YAML examples, ASCII mockups, and patterns for each element type. Use this skill when tasked to dive into the details of a chapter or the user asks for an example data flow and/or details of the user journey."
---

# Element Description Skill - Local Documentation for Elements

This document describes how to write effective **element descriptions** in prooph board, based on analysis of real-world modeling examples and the official documentation.

## Key Difference: Description vs Details

### Element Description (Local)
- **Scope**: Local to the specific element instance in a specific slice
- **Audience**: All users including non-technical business people
- **Purpose**: Document what happens in this specific process step
- **Visibility**: Visible directly on the canvas
- **Content**: Process-specific context, scenarios, business rules for this step

### Element Details (Global)
- **Scope**: Global to all similar elements (same name + type + context)
- **Audience**: Technical users, developers, system architects
- **Purpose**: Define the technical specification of the element
- **Visibility**: Visible in the details sidebar
- **Content**: Schema, UI Schema, Query definitions, Command handlers, Rules

> **Best Practice**: Use descriptions for documentation that is important for the element in a specific process/slice, and the details documentation in the details sidebar to document general information about the element.

---

## Structure and Format

Element descriptions support **Markdown formatting** and are edited via inline editing (double-click element).

### Format Rules

1. **Name and Description Split**: 
   - All characters up to the first line break = **element name**
   - Everything after first line break = **element description**

2. **Markdown Support**:
   - **Bold**: `**text**`
   - *Italic*: `*text*`
   - Lists: `- item` or `1. item`
   - task lists (Github style): `- [ ] Task`
   - markdown tables
   - Code blocks: Triple backticks
   - Links: `[text](url)`
   - Images: `![alt](url)`
   - Blockquotes: `> text`

3. **YAML Code Blocks**: Common for showing data state

---

## Patterns by Element Type

### UI Elements

> **Before adding ASCII mockups, always ask the user!** Some users prefer uploading wireframes, screenshots, or design tool exports instead. For list views, offer markdown tables as a lightweight alternative.

#### Pattern 1: State Description with ASCII Mockup

```markdown
- clocked in: true

Time is ticking

```yaml
trackingId: track1
```

## ASCII Mockup

```bash
┌─────────────────────────────────────┐
│  Time Tracker                       │
├─────────────────────────────────────┤
│                                     │
│         09:23:45                    │
│      Time in progress               │
│                                     │
│    Started: 09:00 AM                │
│                                     │
├─────────────────────────────────────┤
│     [ Pause ]  [ Clock Out ]        │
└─────────────────────────────────────┘
```
```

**Use cases:**
- Show UI state variations
- Visual mockups for developer reference
- List component states (clocked in/out, paused, etc.)

---

#### Pattern 1b: List View as Markdown Table

As an alternative to ASCII mockups, list views can be documented as markdown tables:

```markdown
## List View

| Name | Email | Status | Last Activity |
|------|-------|--------|---------------|
| Anna M. | anna@example.com | Active | 2026-03-05 |
| Bob K. | bob@example.com | Inactive | 2026-02-28 |

```
```

**Use cases:**
- List/overview screens
- Tabular data presentation
- Lightweight alternative to ASCII mockups or screenshots

---

#### Pattern 2: Feature Overview with Bullet Points

```markdown
Overview of: 

- days worked in current month
- total hours worked this month
- total overtime

## ASCII Mockup

```bash
┌─────────────────────────────────────────────┐
│  Time Entries Dashboard                     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Days    │  │  Hours   │  │ Overtime │  │
│  │ Worked   │  │ Worked   │  │  Hours   │  │
│  │    15    │  │  120.5   │  │   +8.5   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────┘
```
```

**Use cases:**
- Dashboard/overview screens
- List features shown on screen
- Provide visual layout reference

---

#### Pattern 3: State Variations

```markdown
- clocked In: true

Time is ticking

```yaml
trackingId: track1
```

## ASCII Mockup

```bash
┌─────────────────────────────────────┐
│  Time Tracker                       │
│  (Blocked State)                    │
├─────────────────────────────────────┤
│         09:23:45                    │
│      Time in progress               │
└─────────────────────────────────────┘
```
```

```markdown
- clocked in: false

Time is not ticking

```yaml
trackingId: track1
```

## ASCII Mockup

```bash
┌─────────────────────────────────────┐
│  Time Tracker                       │
├─────────────────────────────────────┤
│         PAUSED                      │
│    ⚠️ On break                      │
├─────────────────────────────────────┤
│         [ Continue ]                │
└─────────────────────────────────────┘
```
```

**Use cases:**
- Document different UI states
- Show how UI changes based on data
- Help designers and developers understand state transitions

---

### Command Elements

#### Pattern 1: YAML Data Example

```markdown
```yaml
trackingId: uuid
employee: uuid
location: uuid
day: 2026-03-05
startTime: 09:00
breaks:
  - 
    startTime: 13:00
    endTime: 13:30
  - 
    startTime: 15:00
    endTime: 15:15
endTime: 18:00
notes: Worked late on project documentation
```
```

**Use cases:**
- Show example payload
- Document expected data structure
- Provide concrete examples for business users

---

#### Pattern 2: Simple Identifier

```markdown
```
trackingId: track1
```
```

**Use cases:**
- Minimal data needed for this step
- Reference to tracking/aggregate ID
- Simple commands with single parameter

---

#### Pattern 3: Scenario Documentation

```markdown
## Scenarios

### Worktime matches with contract

[Scenario details here]
```

**Use cases:**
- Document different business scenarios
- Edge cases specific to this process step
- Business rules that apply in this context

---

### Event Elements

#### Pattern 1: YAML State After Event

```markdown
```yaml
trackingId: track1
# ...
breaks:
  - 
    startTime: 1pm
    endTime: now()|time()
```
```

**Use cases:**
- Show state change caused by event
- Document what data the event carries
- Illustrate the "fact" that became true

---

#### Pattern 2: Minimal Event Data

```markdown
```yaml
trackingId: track1
```
```

**Use cases:**
- Simple events with just ID
- Events that reference aggregate state

---

### Information Elements

#### Pattern 1: YAML Data Structure

```markdown
```yaml
trackingId: track1
employee: Anna
location: loc-abc
day: 2026-03-05
startTime: 9am
```
```

**Use cases:**
- Show example data structure
- Document what information is available
- Provide concrete examples with sample values

---

#### Pattern 2: State with Nested Objects

```markdown
```yaml
trackingId: track1
employee: Anna
location: loc-abc
day: 2026-03-05
startTime: 9am
breaks:
  - 
    startTime: 1pm
    endTime: 1:30pm
endTime: 6pm
overtime: 0
```
```

**Use cases:**
- Complex data with nested structures
- Show complete state after multiple events
- Document all fields that may be present

---

#### Pattern 3: Empty Description for Self-Explanatory

Sometimes information elements need no description if the name is clear and the technical details in element details provide full specification.

---

### Hotspot Elements

#### Pattern 1: Open Questions with Options

```markdown
@TODO: Should Time Tracker be visible across the app?
We could place it in:
1. sidebar
2. topbar
3. or a time tracker bottom bar
4. Popover in bottom right corner on every page would also be an option.
```

**Use cases:**
- Document open design decisions
- List options for discussion
- Tag with @TODO for follow-up

---

#### Pattern 2: Risks and Concerns

```markdown
⚠️ Risk: [Description of risk]

**Impact**: [What could go wrong]

**Mitigation**: [Possible solutions]
```

**Use cases:**
- Highlight architectural risks
- Document security concerns
- Flag compliance requirements

---

### Slice Details (Related Pattern)

Slice details can document scenarios involving multiple elements in a slice:

```markdown
## Scenario 1: View started Time Tracking

### Given

:::element event
Employee Clocked In

```yaml
trackingid: track1
employee: Anna
location: loc-abc
day: now()|date()
startTime: now()|time()
```
:::

### Then

:::element information
Time Tracking

```yaml
trackingId: track1
employee: Anna
location: loc-abc
day: 2026-03-05
startTime: 9am
```
:::
```

**Use cases:**
- Document Given-When-Then scenarios
- Show element interactions in a slice
- Define user stories spanning multiple elements

---

## Best Practices

### 1. Keep it Business-Friendly

```markdown
✅ Good:
- Employee clocks in to start tracking work time
- System records the start time and creates a new time tracking session

❌ Avoid:
- POST /api/time-tracking/clock-in endpoint triggers aggregate creation
- Event sourcing handler persists TimeTrackingStarted event to event store
```

---

### 2. Use Concrete Examples

```markdown
✅ Good:
```yaml
employee: Anna
location: loc-abc
startTime: 9am
```

❌ Avoid:
```yaml
employeeId: string|format:uuid
locationId: string|format:uuid
startTime: string|format:time
```
(Use this in element details, not description)
```

---

### 3. Document State Changes

```markdown
✅ Good:
**Before**: Employee is not clocked in
**After**: Time tracking session started at 09:00 AM

Shows the business state change clearly.
```

---

### 4. Use Visual Representations for UI (ask first!)

**Before adding ASCII mockups, always ask the user** — they may prefer wireframes, screenshots, or markdown tables for list views.

```markdown
✅ Good (ASCII mockup, if user wants it):
```bash
┌──────────────────┐
│  Time Tracker    │
├──────────────────┤
│  09:23:45        │
│  [Pause] [Out]   │
└──────────────────┘
```

✅ Good (markdown table for list views):
| Name | Status | Last Activity |
|------|--------|---------------|
| Anna M. | Active | 2026-03-05 |

Helps non-technical stakeholders visualize the UI.
```

---

### 5. Tag Open Questions

```markdown
✅ Good:
@TODO: Decision needed - should overtime be calculated daily or weekly?

**Options:**
1. Daily calculation (simpler)
2. Weekly calculation (more flexible)

**Recommendation**: Weekly - aligns with contract hours
```

---

### 6. Document Process-Specific Rules

```markdown
✅ Good:
**Business Rule**: Employee must clock out for breaks longer than 15 minutes.

**Exception**: Breaks during lunch period (12-2 PM) don't require clock out.
```

---

### 7. Keep Technical Details in Element Details

| Description (Local) | Details (Global) |
|---------------------|------------------|
| "Employee clocks in" | `cody-schema` with type definitions |
| "Shows time tracking dashboard" | `cody-ui-schema` with widget config |
| "Records the work start time" | `cody-rules` with event recording logic |
| "List of all time entries" | `cody-resolve` with query filters |

---

## Checklist for Writing Element Descriptions

- [ ] Is the description understandable by business users?
- [ ] Does it explain what happens in THIS specific process step?
- [ ] Are technical implementation details in element details instead?
- [ ] Are YAML examples using concrete values (not types)?
- [ ] For UI elements: did you ask the user about visual representation (ASCII mockup, markdown table, wireframe, or screenshot)?
- [ ] Are open questions tagged with @TODO?
- [ ] Is markdown formatting used appropriately?
- [ ] Is the description concise but complete for this step?
- [ ] Does it avoid duplicating element details content?

---

## Common Mistakes

### ❌ Mistake 1: Too Technical

```markdown
❌ Bad:
The command handler validates the schema and if valid, records an event to the event store which triggers projections to update the read model.

✅ Better:
System records the clock-in time and starts tracking work hours.
```

---

### ❌ Mistake 2: Missing Context

```markdown
❌ Bad:
```yaml
trackingId: track1
```

✅ Better:
```yaml
trackingId: track1
employee: Anna
location: loc-abc
```

Provides context about what the tracking session represents.
```

---

### ❌ Mistake 3: Duplicating Element Details

```markdown
❌ Bad:
```cody-schema
{
  "timeTrackingId": "string|format:uuid",
  "employeeId": "string|format:uuid"
}
```

✅ Better:
```yaml
trackingId: track1
employee: Anna
```

Use YAML with examples, not schema definitions.
```

---

### ❌ Mistake 4: No Description at All

```markdown
❌ Bad:
[Empty description]

✅ Better:
Employee clocks out for lunch break. Time tracking is paused until return.
```

Even a simple sentence helps business understanding.

---

## Examples from Real-World Models

### UI Element - Time Tracker (Active State)

```markdown
- clocked In: true

Time is ticking

```yaml
trackingId: track1
```

## ASCII Mockup

```bash
┌─────────────────────────────────────┐
│  Time Tracker                       │
├─────────────────────────────────────┤
│         09:23:45                    │
│      Time in progress               │
│    Started: 09:00 AM                │
├─────────────────────────────────────┤
│     [ Pause ]  [ Clock Out ]        │
└─────────────────────────────────────┘
```
```

**Why it works:**
- Shows current state (clocked in)
- Provides visual mockup
- Includes example data
- Business-friendly language

---

### Command Element - Clock Out For Break

```markdown
```yaml
trackingId: track1
```
```

**Why it works:**
- Minimal, shows only required data
- Clear from context what happens
- Technical details in element details

---

### Event Element - Employee Clocked In After Break

```markdown
```yaml
trackingId: track1
# ...
breaks:
  - 
    startTime: 1pm
    endTime: now()|time()
```
```

**Why it works:**
- Shows what changed (break end time)
- Uses `# ...` to indicate unchanged data
- Uses `now()|time()` to show dynamic value

---

### Information Element - Time Tracking

```markdown
```yaml
trackingId: track1
employee: Anna
location: loc-abc
day: 2026-03-05
startTime: 9am
```
```

**Why it works:**
- Complete state snapshot
- Concrete example values
- Easy to understand for business users

---

### Hotspot Element - UI Concept Question

```markdown
@TODO: Should Time Tracker be visible across the app?
We could place it in:
1. sidebar
2. topbar
3. or a time tracker bottom bar
4. Popover in bottom right corner on every page would also be an option.
```

**Why it works:**
- Clear @TODO tag
- Lists all options
- Invites discussion

---

## Summary

| Aspect | Element Description | Element Details |
|--------|-------------------|-----------------|
| **Scope** | Local (slice-specific) | Global (all similar elements) |
| **Audience** | Business users, all team members | Technical users, developers |
| **Format** | Markdown with YAML examples | Code blocks (cody-*) |
| **Content** | Process context, scenarios, mockups | Schema, rules, queries, handlers |
| **Editing** | Inline (double-click element) | Details sidebar editor |
| **Purpose** | Explain what happens here | Define technical specification |

**Remember**: Element descriptions are for local, process-specific documentation visible to everyone. Element details are for global, technical documentation shared by all similar elements.
