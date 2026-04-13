---
name: ascii-mockups
description: "ASCII Mockups Skill - Guide for creating ASCII mockups in UI element descriptions on prooph board. Covers visual state representation and documenting UI variations using text-based wireframes."
---

# ASCII Mockups for UI Element Descriptions

This document describes how to create effective **ASCII mockups** for UI elements in prooph board.

---

## Structure

ASCII mockups go inside a `bash` code block under a `## ASCII Mockup` heading:

````markdown
## ASCII Mockup

```bash
┌─────────────────────────────────────┐
│  Time Tracker                       │
├─────────────────────────────────────┤
│         09:23:45                    │
│      Time in progress               │
├─────────────────────────────────────┤
│     [ Pause ]  [ Clock Out ]        │
└─────────────────────────────────────┘
```
````

---

## Patterns

### Pattern 1: State Description with Mockup

````markdown
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
````

**Use cases:**
- Show UI state variations
- Visual mockups for developer reference
- Document interactive elements

---

### Pattern 2: Dashboard / Feature Overview

````markdown
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
````

**Use cases:**
- Dashboard/overview screens
- Card-based layouts
- Provide visual layout reference

---

### Pattern 3: State Variations

Document different UI states with separate mockups:

````markdown
- clocked in: true

Time is ticking

## ASCII Mockup

```bash
┌─────────────────────────────────────┐
│  Time Tracker                       │
├─────────────────────────────────────┤
│         09:23:45                    │
│      Time in progress               │
└─────────────────────────────────────┘
```
````

````markdown
- clocked in: false

Time is not ticking

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
````

**Use cases:**
- Document different UI states
- Show how UI changes based on data
- Help developers understand state transitions

---

### Pattern 4: Blocked / Disabled State

````markdown
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
````

---

## Alternative: Markdown Tables for List Views

For list/overview screens, markdown tables are often more practical than ASCII mockups:

```markdown
## List View

| Name | Email | Status | Last Activity |
|------|-------|--------|---------------|
| Anna M. | anna@example.com | Active | 2026-03-05 |
| Bob K. | bob@example.com | Inactive | 2026-02-28 |
```

**Use when:**
- List/overview screens
- Tabular data presentation
- Lightweight alternative to ASCII mockups

---

## Best Practices

### Keep It Simple

Focus on the elements that matter for this process step. Don't include every UI detail.

```bash
✅ Good: Simple, clear structure
┌──────────────────┐
│  Time Tracker    │
├──────────────────┤
│  09:23:45        │
│  [Pause] [Out]   │
└──────────────────┘
```

```bash
❌ Avoid: Pixel-perfect with too much detail
┌─────────────────────────────────────────────┐
│ ☰  My App            🌐 User ▾    🔔 3     │
├─────────────────────────────────────────────┤
...
```

---

### Show What Changes

If the mockup documents a specific state, make the state clear:

```markdown
- clocked in: true
```

Or add a label in the mockup:

```bash
│  (Blocked State)                    │
```

---

### Use Consistent Styling

Pick a mockup style and stick with it across the model:
- Box-drawing characters: `┌─┐│├┤└┘`
- Button representation: `[ Button ]`
- Icons: `⚠️ 🔔 🌐` (sparingly)

---

## Common Mistakes

### Too Detailed

```markdown
❌ Bad: Every CSS class, spacing, and color noted

✅ Better: Show layout and key elements only
```

---

### Outdated Mockups

Keep mockups in sync with actual UI changes. Outdated mockups create confusion.
