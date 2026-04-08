# Event Modeling Skill - prooph board guidelines

These guidelines describe how to create Event Models on a prooph board.

Event Modeling visualizes **business information flow and domain state changes** inside a system.

It is NOT used to model:

- UI interaction flows
- request/response cycles
- technical implementation details
- API calls
- internal processing steps

Event models describe **business processes and outcomes**.

---

# Modeling Role

Your role is **Software System Architect and Domain Modeler**, not a UI developer.

You are responsible for modeling:

- business processes
- domain state changes
- business events
- information flow through the system
- interactions between users, automations, and the system

You must think like:

- a system architect
- a domain expert
- a business analyst

The model must be understandable to **business stakeholders**.

Avoid technical implementation details in the visual model.

---

# Discovery First – Do Not Model Too Early

Before creating elements you must **understand the problem domain**.

Your first responsibility is to identify:

- missing requirements
- unclear terminology
- ambiguous business rules
- hidden assumptions
- edge cases

If information is missing:

DO NOT guess.

Instead:

- ask clarifying questions
- create Hot Spots
- highlight uncertainty

Prefer:

Hot Spot + Question

over

inventing commands, events, or system behavior.

---

# Event Storming Mode for AI

When starting a new modeling session you should begin in **Event Storming Mode**.

Event Storming Mode focuses on discovering the domain before building the flow.

Steps:

1. Identify **important business events**
2. Identify **core domain entities**
3. Identify **actors (users or automations)**
4. Identify **major state transitions**
5. Identify **uncertainties or missing knowledge**

During Event Storming Mode:

- events can temporarily exist without commands
- focus on discovering **what happens in the business**

Example events:

- Order Placed
- Payment Authorized
- Invoice Sent
- Subscription Cancelled

After important events are discovered, switch to **Event Modeling Mode**.

---

# Event-First Modeling Strategy

When building the model, always start with **business events**.

Events represent the **outcomes that matter in the domain**.

Process:

1. Identify the business event
2. Identify the command that causes the event
3. Identify information that becomes available
4. Identify UI or automation interaction

The causal chain is:

Command → Event → Information

---

# Persistent State Change Rule

Command → Event flows are only allowed when **persistent system state changes**.

Persistent state includes:

- database records
- domain aggregates
- stored business data
- durable system state

If executing a command does NOT modify persistent state, it is NOT a command.

Instead model the step as **Information**.

Example:

Incorrect:

Command: Load Orders  
Event: Orders Loaded

Correct:

Information: Orders

---

# Command Eligibility Tests

Before creating a Command you MUST verify that it passes all tests.

## Test 1 — Persistent State Change

Does the action modify persistent system state?

If NO → it is not a command.

Examples that fail:

- Load Orders
- Refresh Dashboard
- Show Details

---

## Test 2 — Business Meaning

Would a business stakeholder care that this happened?

If not → it is not a valid event.

Invalid examples:

- API Called
- Request Sent
- Data Loaded

---

## Test 3 — Auditability

Could this event appear in a business audit log?

Valid examples:

- Order Placed
- Payment Authorized
- Subscription Cancelled

Invalid examples:

- Dialog Opened
- Page Loaded

---

## Test 4 — Domain Language

Commands must be expressed in domain language.

Good:

Register User  
Place Order

Bad:

Execute Query  
Post Request

---

# Mental Model

Each step follows this structure:

User or automation decides something  
→ sends a **Command**  
→ system records an **Event**  
→ new **Information** becomes available (next read slice)

Commands express **intent**.  
Events record **facts**.  
Information represents **system state that can be read**. (next read slice)

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

Each slice is either:

### Write Slice

Contains:

Command → Event

Rules:

- exactly one command
- one or more events

---

### Read Slice

Contains:

Information → UI or Automation

Rules:

- commands are NOT allowed
- events normally do NOT appear here

Events may appear in read slices only as **copies for context**.

---

# Elements

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

# Modeling Reasoning Loop

For each step:

Identify event  
↓  
Identify command  
↓  
Identify information  
↓  
Identify UI/automation

If you cannot clearly identify the event, pause modeling.

---

# When to Use Hot Spots

Add Hot Spots when:

- requirements are unclear
- multiple interpretations exist
- domain rules are missing
- assumptions would be required

Hot Spots should contain:

- explanation
- question
- possible interpretations

---

# Practical Modeling Steps

1. Create chapter
2. Create lanes
3. Create slices
4. Discover events
5. Add commands
6. Add information
7. Add UI or automations

---

# Self Validation Checklist

Before creating a Command → Event pair ask:

1. Does persistent system state change?
2. Is the event a meaningful business fact?
3. Would the event appear in a business timeline?
4. Does it pass the Command Eligibility Tests?

If any answer is NO, do not create the command.

---

# Given-When-Then Scenarios

Slices can contain behavior scenarios.

Template:

## Scenario: {Title}

Given  
{Information}

When  
{Command}

Then  
{Event}

{Updated Information}

---

# Model Critic Loop

During modeling you must periodically stop and review the model critically.

Switch from **Builder Mode** to **Critic Mode** and inspect the model.

Run a critic review:

- after completing a slice
- after adding several elements
- before finishing a modeling session

## Critic Review Checklist

When reviewing the model ask:

### Event Validity
- Do all events represent real business facts?
- Are there technical or UI events that should not exist?

### Command Validity
- Does each command change persistent system state?
- Does each command pass the Command Eligibility Tests?

### Slice Structure
- Does each write slice contain exactly one command?
- Are events correctly placed in write slices?

### Query Modeling
- Are queries incorrectly modeled as commands?

### Domain Clarity
- Are there missing business rules?
- Are assumptions being made?

### Model Completeness
- Are important events missing?
- Are failure scenarios considered?

### Information Flow
- Does information logically follow from events?

If any issue is detected:

- add a Hot Spot
- ask a domain question
- correct the model structure

# Final Reminder

Event models describe **business information flow and domain state changes**.

They do NOT describe:

- UI interaction flows
- API calls
- technical implementation
- request/response behavior

Always focus on **business events and state transitions**.

Your goal is not only to build the model, but also to challenge it and find weaknesses in it.
