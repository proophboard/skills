# Cody Event Skill - Event Element Details Specification

This document describes the structure and patterns for creating Event element details in the Cody/prooph board system.

## Overview

Events in this system represent **business facts that became true**. They are the result of commands and represent immutable records of what happened in the domain.

Event details contain structured markdown with code blocks that define:

1. **Event Type** - Aggregate event classification
2. **Schema** - Event data structure
3. **State Apply Rules** - How the event updates aggregate state
4. **Configuration** - Event visibility metadata

---

## Structure Template

```markdown
## Aggregate Event

of aggregate: [AggregateName]

## Schema

```cody-schema
{
  "fieldName": "type|constraints",
  "optionalField?": "type",
  "refField": "/Service/Entity:identifier"
}
```

## State Apply Rules

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information",
            "event"
          ]
        }
      }
    }
  }
]
```

## Configuration

```cody-metadata
{
  "aggregateEvent": true,
  "public": false
}
```

---

## Detailed Specifications

### 1. Event Type Declaration

**Required for all events**

Events are classified by their relationship to aggregates:

```markdown
## Aggregate Event

of aggregate: [AggregateName]
```

**Examples:**

```markdown
## Aggregate Event

of aggregate: Order
```

```markdown
## Aggregate Event

of aggregate: Customer
```

**Note:** Some events may have an empty aggregate name (for domain events that don't update state):

```markdown
## Aggregate Event

of aggregate: 
```

---

### 2. Schema Definition

**Required for all events** - defines event payload structure

#### Schema Syntax

```cody-schema
{
  "requiredField": "type|constraints",
  "optionalField?": "type",
  "enumField": "enum:value1,value2,value3",
  "refField": "/Service/Entity:identifier",
  "nestedObject": {
    "field": "type"
  }
}
```

#### Type Reference

| Type | Description |
|------|-------------|
| `string` | Text value |
| `string|format:uuid` | UUID string |
| `string|format:email` | Email address |
| `string|format:date` | Date string (YYYY-MM-DD) |
| `string|format:date-time` | ISO datetime string |
| `boolean` | True/false |
| `integer` | Whole number |
| `enum:v1,v2,v3` | Enumerated values |
| `/Service/Entity:id` | Reference to entity |

#### Schema Examples

**Simple Schema:**
```cody-schema
{
  "leadId": "string|format:uuid",
  "notes?": "string"
}
```

**Schema with Enum:**
```cody-schema
{
  "leadId": "string|format:uuid",
  "status": "enum:took_place,no_show,cancelled"
}
```

**Schema Reference:**
```cody-schema
{
  "$ref": "/App/Lead"
}
```

```cody-schema
{
  "$ref": "/App/PreparedContract"
}
```

```cody-schema
{
  "$ref": "/App/Contract"
}
```

**Schema with Reference Type:**
```cody-schema
{
  "leadId": "/App/Lead:leadId",
  "locationId": "/App/Location:locationId"
}
```

---

### 3. State Apply Rules

**Required for all events** - defines how event updates aggregate state

#### Rule Structure

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": { /* state transformation */ }
      }
    }
  }
]
```

#### State Transformation Patterns

**1. Simple Merge (Event data overwrites state)**
```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information",
            "event"
          ]
        }
      }
    }
  }
]
```

**2. Merge with Additional Fields**
```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information",
            "event",
            {
              "status": "$> 'new'",
              "channel": "$> 'website'",
              "inquirySubmittedAt": "$> eventCreatedAt"
            }
          ]
        }
      }
    }
  }
]
```

**3. Replace State with Event**
```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": "$> event"
      }
    }
  }
]
```

**4. Update Specific Field**
```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information"
          ],
          "status": "$> 'contract_handed_over'"
        }
      }
    }
  }
]
```

**5. Update Nested Object**
```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information"
          ],
          "viewingAppointment": "$> information|get('viewingAppointment', {})|set('status', 'took_place')|set('notes', event.notes)"
        }
      }
    }
  }
]
```

**6. Set Boolean Flag**
```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information",
            "event"
          ],
          "signed": "$> true"
        }
      }
    }
  }
]
```

---

### 4. Configuration Metadata

**Required for all events** - defines event visibility

#### Configuration Properties

| Property | Type | Description |
|----------|------|-------------|
| `aggregateEvent` | boolean | Is this an aggregate event |
| `public` | boolean | Is this event public (default: false) |

#### Configuration Examples

**With Aggregate Event Flag:**
```cody-metadata
{
  "aggregateEvent": true,
  "public": false
}
```

**Minimal Configuration:**
```cody-metadata
{
  "public": false
}
```

---

## Expression Syntax

### Available Variables

| Variable | Description |
|----------|-------------|
| `$> event` | The event data |
| `$> information` | Current aggregate state |
| `$> eventCreatedAt` | Timestamp when event was created |

### Common Expressions

**Property Access:**
```
$> event.leadId
$> information.status
```

**State Transformation:**
```
$> information|get('viewingAppointment', {})
$> information|get('viewingAppointment', {})|set('status', 'took_place')
```

**String Interpolation:**
```
$> 'website'
$> 'new'
$> 'reached'
$> 'not_reached'
$> 'contract_handed_over'
$> 'contract_signed'
```

**Boolean Values:**
```
$> true
$> false
```

**Timestamp:**
```
$> eventCreatedAt
```

---

## Complete Examples

### Example 1: Simple Event with Merge

```markdown
## Aggregate Event

of aggregate: Lead

## Schema

```cody-schema
{
  "$ref": "/App/Lead"
}
```

## State Apply Rules

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information",
            "event"
          ]
        }
      }
    }
  }
]
```

## Configuration

```cody-metadata
{
  "public": false
}
```

---

### Example 2: Event with Status Update

```markdown
## Aggregate Event

of aggregate: Lead

## Schema

```cody-schema
{
  "leadId": "string|format:uuid",
  "firstName": "string",
  "lastName": "string",
  "email": "string|format:email",
  "phone?": "string",
  "termsAccepted": "boolean",
  "locationId": "/App/Location:locationId"
}
```

## State Apply Rules

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information",
            "event",
            {
              "channel": "$> 'website'",
              "status": "$> 'new'",
              "inquirySubmittedAt": "$> eventCreatedAt"
            }
          ]
        }
      }
    }
  }
]
```

## Configuration

```cody-metadata
{
  "public": false
}
```

---

### Example 3: Event with Nested Object Update

```markdown
## Aggregate Event

of aggregate: Lead

## Schema

```cody-schema
{
  "leadId": "string|format:uuid",
  "notes?": "string"
}
```

## State Apply Rules

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information"
          ],
          "viewingAppointment": "$> information|get('viewingAppointment', {})|set('status', 'took_place')|set('notes', event.notes)"
        }
      }
    }
  }
]
```

## Configuration

```cody-metadata
{
  "public": false
}
```

---

### Example 4: Event with Boolean Flag

```markdown
## Aggregate Event

of aggregate: Contract

## Schema

```cody-schema
{
  "$ref": "/App/Contract"
}
```

## State Apply Rules

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information",
            "event"
          ],
          "signed": "$> true"
        }
      }
    }
  }
]
```

## Configuration

```cody-metadata
{
  "public": false
}
```

---

### Example 5: Event that Replaces State

```markdown
## Aggregate Event

of aggregate: Lead

## Schema

```cody-schema
{
  "$ref": "/App/Lead"
}
```

## State Apply Rules

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": "$> event"
      }
    }
  }
]
```

## Configuration

```cody-metadata
{
  "public": false
}
```

---

### Example 6: Event with Status Change Only

```markdown
## Aggregate Event

of aggregate: Lead

## Schema

```cody-schema
{
  "leadId": "string|format:uuid"
}
```

## State Apply Rules

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information"
          ],
          "status": "$> 'contract_signed'"
        }
      }
    }
  }
]
```

## Configuration

```cody-metadata
{
  "public": false
}
```

---

### Example 7: Event with Reference Type

```markdown
## Aggregate Event

of aggregate: 

## Schema

```cody-schema
{
  "leadId": "string|format:uuid",
  "locationId": "/App/Location:locationId"
}
```

## State Apply Rules

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information",
            "event"
          ]
        }
      }
    }
  }
]
```

## Configuration

```cody-metadata
{
  "public": false
}
```

---

## State Apply Patterns

### Pattern 1: Full Merge

Merges event data into existing state:

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information",
            "event"
          ]
        }
      }
    }
  }
]
```

### Pattern 2: Merge with Computed Fields

Adds computed or derived fields:

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information",
            "event",
            {
              "status": "$> 'new'",
              "timestamp": "$> eventCreatedAt"
            }
          ]
        }
      }
    }
  }
]
```

### Pattern 3: Partial Update

Updates only specific fields:

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information"
          ],
          "status": "$> 'reached'"
        }
      }
    }
  }
]
```

### Pattern 4: Nested Object Update

Updates nested object with get/set pattern:

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information"
          ],
          "nestedField": "$> information|get('nestedField', {})|set('property', event.value)"
        }
      }
    }
  }
]
```

### Pattern 5: Complete Replace

Replaces entire state with event:

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": "$> event"
      }
    }
  }
]
```

---

## Common Status Values

Based on the Lead Gen domain:

| Status | Description |
|--------|-------------|
| `new` | Newly created lead |
| `reached` | Lead was reached by phone |
| `not_reached` | Lead could not be reached |
| `contract_handed_over` | Contract was given to lead |
| `contract_signed` | Lead signed the contract |
| `abandoned` | Lead was abandoned |

### Viewing Appointment Status

| Status | Description |
|--------|-------------|
| `scheduled` | Appointment is scheduled |
| `took_place` | Appointment happened |
| `no_show` | Lead didn't show up |
| `cancelled` | Appointment was cancelled |

---

## Event Naming Conventions

Events should be named in **past tense** as they represent facts that happened:

**Good:**
- `Lead Submitted`
- `Lead reached by phone`
- `Contract Signed`
- `Viewing Appointment took place`
- `Lead Did Not Show Up to Viewing Appointment`

**Avoid:**
- `Submit Lead` (present tense - sounds like command)
- `Signing Contract` (continuous - not a fact)

---

## Checklist for Creating New Events

- [ ] Determine aggregate name
- [ ] Define schema with all event fields
- [ ] Use past tense for event name
- [ ] Choose appropriate state apply pattern
- [ ] Add status updates if needed
- [ ] Handle nested object updates with get/set
- [ ] Set configuration metadata
- [ ] Mark as `public: false` for internal events
- [ ] Use `eventCreatedAt` for timestamps

---

## Comparison: Command vs Event

| Aspect | Command | Event |
|--------|---------|-------|
| **Tense** | Imperative (Submit Lead) | Past (Lead Submitted) |
| **Purpose** | Request action | Record fact |
| **Handler** | `cody-rules` with `record` | `cody-apply-rules` with `assign` |
| **Validation** | Can throw errors | Always succeeds |
| **State** | Triggers state change | Applies state change |

---

## Special Variables in Apply Rules

| Variable | Context | Example |
|----------|---------|---------|
| `information` | Current aggregate state | `$> information.status` |
| `event` | Event payload | `$> event.leadId` |
| `eventCreatedAt` | Event timestamp | `$> eventCreatedAt` |

---

## Advanced Patterns

### Pattern: Conditional Status Based on Event Data

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information",
            "event",
            {
              "status": "$> event.channel == 'phone' ? 'reached' : 'new'"
            }
          ]
        }
      }
    }
  }
]
```

### Pattern: Preserve Existing Data While Updating

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information",
            {
              "viewingAppointment": "$> information|get('viewingAppointment', {})|set('status', event.status)"
            }
          ]
        }
      }
    }
  }
]
```

### Pattern: Merge Event with Override

Event data takes precedence, then add computed fields:

```cody-apply-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "information",
        "value": {
          "$merge": [
            "information",
            "event",
            {
              "updatedAt": "$> eventCreatedAt",
              "updatedBy": "$> meta.user.id"
            }
          ]
        }
      }
    }
  }
]
```
