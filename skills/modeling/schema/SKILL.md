---
name: schema
description: Add a complete schema to commands, events, or information elements based on example data or event modeling context.
---

# Schema

## Goal

Add a complete data schema to a selected element (command, event, or information) on the board.

The schema is written to the **element details**, not the description.

---

## Supported Elements

- Command
- Event
- Information

---

## Schema Format

Use the prooph board shorthand JSON schema format if not specified otherwise by the user.

Wrap the schema in:

```schema
{

}
```

---

## Instructions

### 1. Check Existing Schema

- If the element already has a schema in its details:
    - Do not overwrite it unless explicitly asked

---

### 2. Determine Schema Source

#### Preferred: Example Data

- Check if the element description contains example data
- If yes:
    - Parse it as JSON
    - Use it as the primary source for schema inference

#### Otherwise: Event Modeling Context

- Derive schema from the modeling flow:

**Command**
- Represents user intent
- Include all required input fields

**Event**
- Represents a fact that happened
- Include the full payload of the event

**Information**
- Represents state
- Include the full data structure

---

## 3. Schema Inference Heuristics

Use the following rules to infer field types and structure:

---

### Primitive Types

- String:
    - Default type for unknown values
    - Names, titles, descriptions

- Number:
    - Integers or floats in example data

- Boolean:
    - true / false values

---

### Common Naming Conventions

- `id`, `*Id`, `*ID` → string|format:uuid
- `createdAt`, `updatedAt`, `*At`, `*Date` → string|format:datetime
- `email` → string|format:email
- `price`, `amount`, `total` → number
- `count`, `quantity` → integer

---

### Arrays

- If value is a list → use array `$items: {}`
- Infer item type from elements

---

### Nested Objects

- Preserve object structure as nested schema

---

### Optional Fields

- If a field is missing in some example entries:
  → mark as optional with `?`

---

### Enums (only when very obvious)

- If a field has a small, stable set of values:
  → infer enum using `"a" | "b" | "c"`

Only apply when the domain strongly suggests a fixed set. Otherwise use `string`.

---

## 4. Field Addition Rule (IMPORTANT SAFETY CONSTRAINT)

Only add fields that are:

- explicitly present in example data, OR
- strongly implied by naming conventions (id, timestamps, totals), OR
- universally expected in the domain context of the element type

Do NOT invent business-specific fields unless they are explicitly visible or clearly required by the model.

If uncertain → ask the user.

---

## 5. Ensure Completeness

- Schema must represent the full structure of the element
- Example data may be partial and must not limit completeness
- Avoid guessing missing domain-specific fields

---

## 6. Ask for Clarification (if needed)

Ask the user if:
- Field meaning is unclear
- Type cannot be inferred reliably
- Required vs optional is ambiguous
- Domain-specific fields are missing from context

---

## 7. Generate Schema

- Use prooph board shorthand JSON schema
- Keep structure clean and consistent
- Prefer explicit nesting over flattening

---

## 8. Write Schema

- Write schema to **element details**
- Do not modify element description

---

## Notes

- Example data is partial by design — schema is not
- Details are shared across similar elements
- Maintain consistency across commands/events of same name

---

## Examples

### Example 1: Command

**Place Order**

Example data:
```json
{
  "customerId": "c123",
  "items": [
    { "productId": "p1", "quantity": 2 }
  ]
}
```

Schema:
```schema
{
  "customerId": "string"
  "items": {
    "$items": {
      "productId": "string"
      "quantity": "number"
    }
  }
}
```

---

### Example 2: Event

**Order Placed**

Example data:
```json
{
  "orderId": "o123",
  "customerId": "c123",
  "total": 99.99,
  "createdAt": "2024-01-01T10:00:00Z"
}
```

Schema:
```schema
{
  "orderId": "string"
  "customerId": "string"
  "total": "number"
  "createdAt": "string|datetime"
}
```

---

### Example 3: Information

**Order**

No example data available.

Derived from event modeling context.

Schema:
```schema
{
  "id": "string|format:uuid",
  "customerId": "string|format:uuid",
  "status": "enum:pending,paid,shipped,cancelled",
  "items": {
    "$tiems": {
      "productId": "string|format:uuid",
      "quantity": "integer",
      "price": "number"
    }
  },
  "total": "integer",
  "createdAt": "string|datetime",
  "updatedAt?": "string|datetime"
}
```

## prooph board Cody reference docs

For further information, read the schema documentation `./docs/Schema.md`
