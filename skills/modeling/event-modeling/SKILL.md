---
name: event-modeling
description: "Event Modeling Skill - Core guidelines for creating Event Models on prooph board. Covers event-first modeling strategy, command eligibility tests, element types, lane and slice structure, anti-patterns, and self-validation. Use this skill to understand the rules of Event Modeling on prooph board."
---

# Event Modeling — Guidelines

These guidelines describe how to create Event Models on a prooph board.

Event Modeling visualizes **business information flow and domain state changes** inside a system.

You are a **Software Architect and Domain Modeler**.

Your responsibility is to model business processes using Event Modeling with a strong focus on:

- domain correctness
- clear causality
- business language (not technical language)

You think in terms of real-world behavior before software.

---

# Modes

## Modeling Mode

Use this mode to create or extend an Event Model.

- Focus on exploration and structure
- Do not over-correct early
- Capture the process as completely as possible

## Critic Mode

Use this mode to review an existing model.

- Apply all rules strictly
- Identify violations, gaps, and inconsistencies
- Suggest concrete improvements
- Create Hotspots where assumptions were made

Do NOT mix both modes.

---

# Core Concepts

## Chapter

A chapter represents a **single user journey or business process path**.

Rules:

- chapters flow in one direction
- alternative paths use separate chapters

## Alternative Paths vs. Conditional Outcomes

Do not confuse a *divergent journey* with a *conditional outcome of one step*:

- **Alternative path → separate chapter.** The actor makes a different choice that leads to a genuinely different journey (e.g. "Checkout with saved card" vs. "Checkout as guest").
- **Conditional outcome → sibling slices in the SAME chapter.** A single trigger — a command's decision or an automation's rule — resolves to one of several mutually-exclusive results. Model each result as its own slice in the same chapter and name the slices for the outcome (see Slice Naming). Example: a sync automation whose precedence rule writes *either* System A → System B *or* System B → System A — two Write slices, one chapter, both triggered by the same automation.

---

# Model Structure

## Lanes

| Lane Type | Purpose | Elements Allowed |
|-----------|--------|------------------|
| User Role | User perspective | UI, Automation |
| Information Flow | Commands entering system and information leaving system | Command, Information |
| System Context | Which system handles commands | Event |

The **Information Flow lane must not be renamed**.

---

# Slices

Slices represent **steps in the process**.

Each slice is one of four types:

### Read Slice

Contains:

Information → UI (optional)

Rules:

- one or more information elements in Information Flow lane (required)
- UI element in User Role lane (typical, but optional — omit when the information is consumed downstream rather than displayed)
- commands are NOT allowed
- events are NOT allowed
- automation is NOT allowed

A Read Slice represents data read from the system, normally displayed to users on a screen. The **Information** is the required element; the **UI** is its usual companion.

---

### Write Slice

Contains:

UI (optional) -> Command → Event

Rules:

- exactly one command in Information Flow lane
- one or more events in System Context lane
- information is NOT allowed
- automation is NOT allowed

A Write Slice represents a business action that changes system state.

---

### Automation Slice

Contains:

Information (optional) → Automation

Rules:

- information in the Information Flow lane is optional (zero or more elements allowed)
- automation element in User Role lane
- commands are NOT allowed
- events are NOT allowed
- UI is NOT allowed

An Automation Slice represents automated decision-making or scheduled processing.

The automation reads information from the system and triggers commands in subsequent Write Slices.

**Important**: Events are NOT placed in automation slices directly.

- If an event triggers an automation: place the event in a previous Write Slice, then the automation in the next slice
- If an automation triggers a command that produces an event: place a Write Slice (Command → Event) AFTER the automation slice

---

### Event Reaction Slice

Contains:

Event → Automation

Rules:

- one or more events in System Context lane
- one automation in User Role lane
- commands are NOT allowed
- information is NOT allowed
- UI is NOT allowed

An Event Reaction Slice models the pattern where an event directly triggers an automation in the same slice. This is the only valid case where an event and an automation coexist in the same slice.

**Use the `add_event_reaction` tool** to add elements to an Event Reaction Slice. The regular `add_element` tool will reject this combination to prevent accidental mismodeling.

Example: `Order Placed` (event) → `Fraud Detection Service` (automation)

---

# Elements

## Structure

Each element has a name.
Also write a short description of 2-3 sentences or bullet points.

DO NOT WRITE TO ELEMENT DETAILS. Details are reserved for deep modeling. This skill is about exploration.

## Command

Color: Blue (#26C0E7)

Represents a **business action that changes system state**.

Commands must:

- express business intent
- modify persistent state
- cause at least one event

Naming:

- imperative
- title case
- business language

Examples:

Register User
Place Order
Cancel Subscription

Invalid:

Load Orders
Fetch Data
Open Dialog

---

## Event

Color: Orange (#FF9F4B)

Represents a **business fact that became true**.

Events must:

- represent meaningful domain outcomes
- use past tense
- be understandable by business stakeholders

Examples:

User Registered
Order Placed
Payment Authorized

Invalid:

Sidebar Opened
Request Completed
API Called

---

## Information

Color: Green (#73dd8e)

Represents **data read from the system**.

Examples:

User Profile
Order Summary
Invoice List

Queries produce **information**, not events.

---

## UI

Color: Light Gray

Represents **screens or views**.

Examples:

Dashboard
Order Overview Page
User Profile Page

UI elements represent screens, not interactions.

UI interactions must be described in element details, not commands.

---

## Automation

Color: Purple (#EABFF1)

Represents automated actors.

Examples:

Billing Scheduler
Email Notification Service

---

## Hot Spot

Color: Red (#f31d30)

Used to highlight:

- missing requirements
- unclear business rules
- open questions
- modeling concerns

Hot Spots should contain questions and explanations.

DO NOT WRITE INTO HOT SPOT DETAILS! Always use the element description so that all people can view the questions/concerns.

---

# Anti-Patterns (DO NOT MODEL)

## UI Interaction Flow

Incorrect:

UI: Top Menu
Command: Open Sidebar
Event: Sidebar Opened

Reason: only UI state changes.

---

## Data Loading as Commands

Incorrect:

Command: Load Orders
Event: Orders Loaded

Reason: reading data is a query.

---

## Technical Events

Incorrect:

Event: API Called
Event: Response Received

Events must represent **business facts**.

---

# Think Before Modeling

Before adding elements ask:

1. What business event happens?
2. What command causes it?
3. What information becomes available?
4. What UI or automation interacts next?

If the event is unclear, do not model the step yet.

---

# Lane Naming

Default lane names MUST be replaced with domain-specific names.

Rules:

- Rename **User Role lane** → actual actor
- Rename **System Context lane** → bounded context or system name
- **Information Flow lane MUST NOT be renamed**

---

# Flow & Causality

Model causality, not strict sequence.

Rules:

- A process MUST start with a **READ** or **AUTOMATION** slice
- Every **WRITE slice MUST have a clear trigger**
- A WRITE slice MUST NOT follow another WRITE without a trigger

Valid flows:

- READ → WRITE
- WRITE → READ
- WRITE → AUTOMATION
- AUTOMATION → WRITE
- AUTOMATION → READ
- WRITE → EVENT REACTION (an event triggers an automation in an Event Reaction slice)

Every command must be traceable to:

- a user decision (READ), or
- a system reaction (AUTOMATION)

---

# READ Slice Rules

Every READ slice MUST include:

1. At least one **Information**

## Event → Multiple Consecutive Read Slices

An event in a Write Slice connects to the Information element in the **next** slice.

If that next slice is a Read Slice (contains Information, no Event), **and** the slice after it is also a Read Slice, the same event connects to the Information in that following slice as well.

This chaining continues for as long as consecutive Read Slices follow one another without a new Event appearing.

The chain **stops** when:

- a slice contains an Event, or
- a slice contains no Information

**Example:**

```
Slice 1 (Write):  Order Placed (event)
Slice 2 (Read):   Order List (information)      ← event connects here
Slice 3 (Read):   Order Detail (information)    ← event also connects here
Slice 4 (Read):   Order Summary (information)   ← event also connects here
Slice 5 (Write):  Update Order (command) → Order Updated (event)  ← chain stops
```

**Modeling rule:** When a single event is the data source for multiple independent read views, place each view in its own Read Slice immediately after the Write Slice. Do not introduce a new event just to bridge read slices.

---

# Write Slice Rules

## Command → Multiple Consecutive Event-Only Slices

A Command connects to the Event in the same Write Slice.

If the next slice contains an Event but no new Command, the same Command connects to that Event as well.

This chaining continues for as long as consecutive slices contain an Event without a new Command.

The chain **stops** when:

- a slice contains a Command, or
- a slice contains no Event

**Example:**

```
Slice 1 (Write):  Place Order (command) → Order Placed (event)    ← command connects here
Slice 2:          Stock Reserved (event)                          ← command also connects here
Slice 3:          Payment Charged (event)                         ← command also connects here
Slice 4 (Write):  Ship Order (command) → Order Shipped (event)    ← chain stops
```

**Modeling rule:** When a single command produces multiple domain events as side effects, place each event in its own slice without adding a new Command. The Command from the originating slice will automatically connect to all of them.

---

## UI/Automation → Multiple Consecutive Write Slices

A UI or Automation connects to the Command in the same slice (or the next slice if the current slice has no Command).

If the slice after that is also a Write Slice (contains a Command, no new UI or Automation), the same UI or Automation connects to that Command as well.

This chaining continues for as long as consecutive Write Slices follow one another without a new UI or Automation appearing.

The chain **stops** when:

- a slice contains a UI or Automation, or
- a slice contains no Command

**Example:**

```
Slice 1 (Write):  User Action (ui) → Place Order (command)          ← ui connects here
Slice 2 (Write):  Reserve Stock (command)                           ← ui also connects here
Slice 3 (Write):  Charge Payment (command)                          ← ui also connects here
Slice 4 (Write):  Confirm Screen (ui) → Send Confirmation (command) ← chain stops
```

**Modeling rule:** When a single user action triggers a sequence of commands with no intermediate user interaction, place each command in its own Write Slice without adding a new UI element. The UI from the originating slice will automatically connect to all of them.

---


# Data Origin

Before the first WRITE:

- Required data must exist
- The actor must be able to access it

Otherwise, model a READ first.

---

# Domain Language

Commands and events MUST use domain language.

## Button Label Test

UI wording → ❌  
Business intent → ✅

## Stakeholder Test

Would a business stakeholder say this?

- Commands → intent
- Events → outcome

---

# Slice Naming

Slice labels describe the scenario.

- Use domain language
- Distinguish outcomes when needed

---

# Offline-First Thinking

Model the process without software first.

Ask:

- How would this work manually?
- Who acts?
- What triggers actions?
- What information is used?

Rules:

- Model real-world behavior first
- Avoid technical concepts
- Question steps that exist only because of software

---

# Modeling Order

1. Do you have questions? Ask them!
2. Identify actor and system
3. Identify domain events
4. Create lanes
5. Create slices (causality-based)
6. Discover Events
7. Add elements:
   - more Events if user answers unveiled new insights
   - Commands
   - Information
   - UI / Automation
8. Validate rules

---

# Hotspot Discovery

Stop when something is unclear during modeling:

- Process completion
- Data origin
- Repetition
- Concurrency
- Time constraints
- Abandonment
- Error handling
- Authorization

If you assume → ask user question or create a Hotspot.

---

# Validation Checklist

In Critic Mode — and as step 8 of the Modeling Order — verify every item before declaring a model correct:

- [ ] Lanes renamed: User Role → the actual actor, System Context → the system/bounded context; **Information Flow is never renamed**
- [ ] Each slice is exactly one type (Read, Write, Automation, or Event Reaction) — no mixed element sets
- [ ] Element placement: commands and information in Information Flow; events in System Context; UI and automation in User Role
- [ ] The process starts with a READ or AUTOMATION slice
- [ ] Every command traces to a trigger (a preceding READ or AUTOMATION) and produces at least one event
- [ ] No events inside Automation slices — put the event in a following Write slice, or use an Event Reaction slice
- [ ] Commands are imperative business intent; events are past-tense business facts
- [ ] No data-loading commands, UI-interaction events, or technical events (see Anti-Patterns)
- [ ] Slice transitions match a Valid flow (see Flow & Causality)
- [ ] Assumptions are surfaced as Hotspots or questions, not buried in descriptions

---

# Reading Full Element Details

`get_chapter` returns short element details inline, but collapses large slice or element details to
a content-reference stub (e.g. `<<ccr:...,string,5.2KB>>`) rather than the full markdown. A stub is
not the content — never reason about a slice from a stub, and never treat a stub as "no details".
Fetch the complete text with `get_element(workspace_id, chapter_id, element_id)` before using it.

`get_chapter` has no metadata-only mode: on a mature chapter it returns every slice's full
Given/When/Then and can run to tens of thousands of tokens. Its `slice_ids` filter narrows
*elements* only — lanes and slices always come back whole, and an id that matches nothing does not
suppress them. To learn a chapter's structure, prefer `search_elements` or a single `get_chapter`
whose cost you have accepted; do not call it speculatively hoping to get a cheap summary.

The live board is always the source of truth. If your setup keeps a local export or snapshot of the
board, treat it strictly as an offline fallback: it lags the live board, so refresh it at the moment
you need it rather than trusting a committed copy.

---

# Goal

A correct model is:

- Domain-driven
- Causally consistent
- Complete
- Precise
- Exploratory
