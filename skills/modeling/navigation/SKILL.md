---
name: prooph-board-navigation
description: "Prooph Board Navigation Skill - Parses deeplinks, retrieves chapter data via MCP, focuses on referenced elements or slices, and generates deeplinks for precise user navigation."
---

# Prooph Board — Navigation

This skill defines how to **interpret and generate deeplinks for prooph board**.

You are responsible for:

- extracting identifiers from deeplinks
- retrieving chapter data via MCP tools
- focusing responses on a specific element or slice
- generating deeplinks for user navigation

This skill is **read-only and focus-oriented**.

---

# Core Principle

## Deeplinks Are References, Not Resources

A deeplink is a **pointer to a location**, not something to open.

**DO NOT:**

- fetch the URL
- open the URL
- interpret it as content

**DO:**

1. extract identifiers
2. retrieve data via MCP
3. focus your response accordingly

---

# Deeplink Structure

```
https://flow.prooph-board.com/link/{workspaceId}/{chapterId}/{type}/{targetId}
```

Where:

- `workspaceId` → workspace identifier
- `chapterId` → chapter identifier
- `type` → `element` or `slice`
- `targetId` → elementId or sliceId

---

# Behavior 1 — Resolving Deeplinks

Use this when the user provides a deeplink.

## Step 1 — Parse the Deeplink

Extract:

- workspaceId
- chapterId
- type
- targetId

---

## Step 2 — Retrieve Chapter Data

Use MCP tool:

- `get_chapter_details(workspaceId, chapterId)`

---

## Step 3 — Locate Target

Based on `type`:

### element

- find element by `elementId` in chapter data

### slice

- find slice by `sliceId` in chapter data

---

## Step 4 — Focus the Response

Once located:

- treat the element/slice as the **primary context**
- apply user instructions ONLY to that target
- ignore unrelated parts unless explicitly requested

---

# Focus Rules

When a deeplink is used:

- the response MUST be scoped to the referenced element or slice
- do NOT analyze the entire chapter unless asked
- do NOT generalize beyond the target

---

# Error Handling

## Target Not Found

If the element/slice cannot be found:

- state that it was not found in the chapter
- ask the user for clarification or a correct link

---

## Invalid Deeplink

If structure is invalid or incomplete:

- explain what is missing
- ask for a valid deeplink

---

## Missing Type

If `type` is missing:

- do NOT guess
- ask the user whether it refers to an element or slice

---

# Behavior 2 — Generating Deeplinks

Use this when:

- referencing specific elements or slices
- summarizing work
- asking targeted questions
- guiding user navigation

---

## Deeplink Format

Always generate links in this format:

```
https://flow.prooph-board.com/link/{workspaceId}/{chapterId}/{type}/{targetId}
```

---

## When to Generate Deeplinks

Create deeplinks when:

- pointing to specific modeling issues
- referencing elements in feedback
- asking questions about a specific element/slice
- summarizing important parts of a model

---

## Example Usage

Instead of:

> The "Place Order" command looks incorrect.

Write:

> The command “Place Order” may violate modeling rules:  
> https://flow.prooph-board.com/link/{workspaceId}/{chapterId}/element/{elementId}

---

# Precision Rules

- always use exact IDs from data
- NEVER invent IDs
- NEVER approximate or truncate IDs

---

# Anti-Patterns

## Fetching Deeplinks

Incorrect:

- treating the URL as a data source

---

## Losing Focus

Incorrect:

- analyzing unrelated elements when a deeplink is provided

---

## Guessing Targets

Incorrect:

- assuming element/slice when not specified
- inventing IDs

---

# Integration with Other Skills

After resolving a deeplink:

- use **Event Modeling skills** for modeling or critique
- remain scoped to the referenced element/slice

---

# Goal

Correct behavior means:

- precise parsing of deeplinks
- deterministic data retrieval via MCP
- strict focus on referenced element or slice
- clear, navigable deeplink generation for the user
