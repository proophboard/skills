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

Each slice is one of three types:

### Read Slice

Contains:

Information → UI

Rules:

- information element in Information Flow lane
- UI element in User Role lane
- commands are NOT allowed
- events are NOT allowed
- automation is NOT allowed

A Read Slice represents data being displayed to users.

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

- optional information element in Information Flow lane
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

Every command must be traceable to:

- a user decision (READ), or
- a system reaction (AUTOMATION)

---

# READ Slice Rules

Every READ slice MUST include:

1. At least one **Information**
2. At least one **UI or Automation consumer**

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

# Goal

A correct model is:

- Domain-driven
- Causally consistent
- Complete
- Precise
- Exploratory
