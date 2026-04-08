# Cody Command Skill - Command Element Details Specification

This document describes the structure and patterns for creating Command element details in the Cody/prooph board system.

## Overview

Commands in this system represent **business actions that change persistent system state**. Each command triggers one or more events and follows the Event Sourcing pattern.

Command details contain structured markdown with code blocks that define:

1. **Command Type** - Aggregate command classification
2. **Schema** - Input data structure and validation
3. **UI Schema** - Form presentation and widget configuration
4. **Dependencies** - External data requirements
5. **Command Handler** - Business logic rules and event recording
6. **Configuration** - Command behavior metadata

### Related Documentation

- [Rule Engine](https://wiki.prooph-board.com/board_workspace/Rule-Engine.html) — Details on the rule engine used for command handler configuration
- [JEXL Expressions](https://wiki.prooph-board.com/board_workspace/Expressions.html) — Documentation for JEXL expressions used in `cody-rules`, `cody-schema`, and `cody-ui-schema` code blocks

---

## Structure Template

```markdown
## [Command Type]

of aggregate: [AggregateName]

## Schema

```cody-schema
{
  "fieldName": "type|constraints",
  "optionalField?": "type",
  "refField": "/Service/Entity:identifier"
}
```

## UI Schema

```cody-ui-schema
{
  "ui:title": "Form Title",
  "ui:button": {
    "label": "Save",
    "icon": "save-icon"
  },
  "fieldName": {
    "ui:widget": "hidden",
    "ui:readonly": true
  }
}
```

## Dependencies

```cody-dependencies
{
  "QueryName": {
    "type": "query",
    "alias": "aliasName"
  }
}
```

## Command Handler

```cody-rules
[
  {
    "rule": "always | condition",
    "if": "$> condition",
    "if_not": "$> condition",
    "then": {
      "record": {
        "event": "Event Name",
        "mapping": "$> command"
      },
      "throw": {
        "error": "$> 'Error message'"
      },
      "log": {
        "msg": "$> 'Log message'"
      },
      "trigger": {
        "command": "CommandName",
        "mapping": {}
      }
    },
    "stop": true
  }
]
```

## Configuration

```cody-metadata
{
  "aggregateCommand": true,
  "streamCommand": false,
  "newAggregate": true
}
```

---

## Detailed Specifications

### 1. Command Type Declaration

**Required for all commands**

Commands are classified by their relationship to aggregates:

```markdown
## Aggregate Command

of aggregate: [AggregateName]
```

**Examples:**

```markdown
## Aggregate Command

of aggregate: Order
```

```markdown
## Aggregate Command

of aggregate: Customer
```

---

### 2. Schema Definition

**Required for all commands** - defines input data structure

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
  "firstName": "string",
  "lastName": "string",
  "email": "string|format:email",
  "phone?": "string",
  "termsAccepted": "boolean",
  "locationId": "/App/Location:locationId"
}
```

**Schema with Enum:**
```cody-schema
{
  "leadId": "string|format:uuid",
  "status": "enum:took_place,no_show,cancelled",
  "notes?": "string"
}
```

**Schema with Nested Object:**
```cody-schema
{
  "contractId": "string|format:uuid",
  "contractPartner": {
    "lastName": "string",
    "firstName": "string"
  },
  "child": {
    "lastName": "string",
    "firstName": "string",
    "birthday": "string|format:date"
  }
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

---

### 3. UI Schema

**Optional** - defines form presentation

#### UI Schema Properties

| Property | Description |
|----------|-------------|
| `ui:title` | Form title |
| `ui:button` | Submit button configuration |
| `ui:order` | Field ordering |
| `ui:form` | Form-level configuration |
| `fieldName.ui:widget` | Widget type for field |
| `fieldName.ui:readonly` | Read-only field |
| `fieldName.ui:title` | Custom field label |
| `fieldName.ui:placeholder` | Placeholder text |
| `fieldName.ui:options` | Widget-specific options |

#### Widget Types

- `hidden` - Hidden field
- `textarea` - Multi-line text
- `DataSelect` - Dropdown with data source

#### UI Schema Examples

**Minimal UI Schema:**
```cody-ui-schema
{
  "leadId": {
    "ui:widget": "hidden"
  }
}
```

**Empty UI Schema:**
```cody-ui-schema
{}
```

**Full UI Schema with Form Configuration:**
```cody-ui-schema
{
  "ui:title": "Document Call",
  "ui:button": {
    "icon": "phone-off",
    "label": "Hang Up"
  },
  "ui:order": [
    "viewingAppointment",
    "children",
    "daysPerWeek",
    "startDate",
    "preferredWeekdays",
    "interestedInSubsidizedSeat",
    "comment",
    "whatIsImportantQuestion",
    "firstName",
    "*"
  ],
  "whatIsImportantQuestion": {
    "ui:title": "What is important for you? (Saxer)",
    "ui:widget": "textarea",
    "ui:placeholder": "Create dreams ...\n\nOther parents like ...",
    "ui:options": {
      "rows": 5,
      "grid": {
        "sx": {
          "marginTop": 8
        }
      }
    }
  },
  "firstName": {
    "ui:options": {
      "grid": {
        "sx": {
          "marginTop": 8
        }
      }
    }
  },
  "leadId": {
    "ui:widget": "hidden"
  },
  "locationId": {
    "ui:widget": "hidden"
  },
  "status": {
    "ui:widget": "hidden"
  },
  "channel": {
    "ui:widget": "hidden"
  },
  "viewingAppointment": {
    "status": {
      "ui:widget": "hidden"
    }
  },
  "inquirySubmittedAt": {
    "ui:widget": "hidden"
  },
  "termsAccepted": {
    "ui:widget": "hidden"
  }
}
```

**UI Schema with DataSelect:**
```cody-ui-schema
{
  "leadId": {
    "ui:widget": "hidden"
  },
  "locationId": {
    "ui:widget": "DataSelect",
    "ui:readonly": true,
    "ui:options": {
      "data": "/App/Locations",
      "value": "$> data.locationId",
      "text": "$> data.name"
    }
  },
  "comment": {
    "ui:title": "Additional comment by lead",
    "ui:widget": "textarea",
    "ui:readonly": false,
    "ui:options": {
      "rows": 5
    }
  }
}
```

**UI Schema with Success Redirect:**
```cody-ui-schema
{
  "ui:button": {
    "label": "save",
    "icon": "zip-disk"
  },
  "contractId": {
    "ui:widget": "hidden"
  },
  "leadId": {
    "ui:widget": "hidden"
  },
  "locationId": {
    "ui:readonly": true,
    "ui:widget": "DataSelect",
    "ui:options": {
      "data": "/App/Locations",
      "label": "$> data.name",
      "value": "$> data.locationId"
    },
    "ui:title": "Location Id"
  },
  "comments": {
    "ui:widget": "textarea",
    "ui:options": {
      "rows": 5
    }
  },
  "monthlyRateBaby": {
    "ui:title": "Monthly Rate Baby"
  },
  "monthlyRateKid": {
    "ui:title": "Monthly Rate Kid"
  },
  "ui:form": {
    "successRedirect": {
      "mapping": {
        "contractId": "$> data.contractId"
      },
      "page": "ContractDetails"
    }
  }
}
```

---

### 4. Dependencies

**Optional** - declares external data requirements

#### Dependencies Syntax

```cody-dependencies
{
  "QueryName": {
    "type": "query",
    "alias": "variableName"
  }
}
```

#### Examples

**Empty Dependencies:**
```cody-dependencies
{}
```

**With Query Dependency:**
```cody-dependencies
{
  "GetContract": {
    "type": "query",
    "alias": "contract"
  }
}
```

---

### 5. Command Handler (Rules)

**Required for all commands** - defines business logic

> The command handler uses the [Rule Engine](https://wiki.prooph-board.com/board_workspace/Rule-Engine.html) to define command behavior. See the wiki for full documentation of rule types, actions, and expression syntax.

#### Rule Structure

```cody-rules
[
  {
    "rule": "always | condition",
    "if": "$> boolean_expression",
    "if_not": "$> boolean_expression",
    "then": {
      // Action object
    },
    "else": {
      // Alternative action
    },
    "stop": true
  }
]
```

#### Rule Types

| Rule | Description |
|------|-------------|
| `always` | Always execute the action |
| `condition` | Execute based on condition |

#### Action Types

**1. Record Event**
```cody-rules
{
  "rule": "always",
  "then": {
    "record": {
      "event": "Event Name",
      "mapping": "$> command"
    }
  }
}
```

**2. Throw Error**
```cody-rules
{
  "rule": "condition",
  "if_not": "$> meta.user|role('KL')",
  "then": {
    "throw": {
      "error": "$> 'Operation not allowed'"
    }
  }
}
```

**3. Log Message**
```cody-rules
{
  "rule": "condition",
  "if": "$> information.signed",
  "then": {
    "log": {
      "msg": "$> 'Contract {{command.contractId}} is already signed. Aborting ...'"
    }
  },
  "stop": true
}
```

**4. Trigger Command (Automation)**
```cody-rules
{
  "rule": "condition",
  "if": "$> event.leadId",
  "then": {
    "trigger": {
      "command": "HandOutContractToLead",
      "mapping": {
        "leadId": "$> event.leadId"
      }
    }
  },
  "else": {
    "log": {
      "msg": "$> 'Contract was added, but no lead assigned. Aborting ...'"
    }
  }
}
```

**5. Assign Variable**
```cody-rules
{
  "rule": "always",
  "then": {
    "assign": {
      "variable": "status",
      "value": "$> command.channel == 'phone' ? 'reached' : 'new'"
    }
  }
}
```

**6. Record Event with Transformed Data**
```cody-rules
{
  "rule": "always",
  "then": {
    "record": {
      "event": "Lead Entered by Location Head",
      "mapping": {
        "$merge": "$> command",
        "status": "$> status"
      }
    }
  }
}
```

#### Multiple Rules Example

```cody-rules
[
  {
    "rule": "condition",
    "if_not": "$> meta.user|role('KL')",
    "then": {
      "throw": {
        "error": "$> 'Only a user with role KL can hand out contracts to leads'"
      }
    }
  },
  {
    "rule": "condition",
    "if": "$> information|get('status') == 'contract_signed'",
    "then": {
      "throw": {
        "error": "$> 'Cannot hand out a contract to lead: {{state.leadId}}. The lead already has a signed contract!'"
      }
    }
  },
  {
    "rule": "always",
    "then": {
      "record": {
        "event": "Contract handed out to lead",
        "mapping": "$> command"
      }
    }
  }
]
```

#### Conditional Event Recording

```cody-rules
[
  {
    "rule": "condition",
    "if": "$> command.status == 'took_place'",
    "then": {
      "record": {
        "event": "Viewing Appointment took place",
        "mapping": "$> command|unset('status')"
      }
    }
  },
  {
    "rule": "condition",
    "if": "$> command.status == 'no_show'",
    "then": {
      "record": {
        "event": "Lead Did Not Show Up to Viewing Appointment",
        "mapping": "$> command|unset('status')"
      }
    }
  },
  {
    "rule": "condition",
    "if": "$> command.status == 'cancelled'",
    "then": {
      "record": {
        "event": "Lead Cancelled Viewing Appointment",
        "mapping": "$> command|unset('status')"
      }
    }
  }
]
```

---

### 6. Configuration Metadata

**Required for all commands** - defines command behavior

#### Configuration Properties

| Property | Type | Description |
|----------|------|-------------|
| `aggregateCommand` | boolean | Is this an aggregate command |
| `streamCommand` | boolean | Is this a stream command |
| `newAggregate` | boolean | Does this create a new aggregate |

#### Configuration Examples

**New Aggregate:**
```cody-metadata
{
  "aggregateCommand": true,
  "streamCommand": false,
  "newAggregate": true
}
```

**Existing Aggregate:**
```cody-metadata
{
  "aggregateCommand": true,
  "newAggregate": false
}
```

**With Public Flag:**
```cody-metadata
{
  "aggregateCommand": true,
  "newAggregate": false
}
```

---

## Expression Syntax

> Expressions use the [JEXL expression language](https://wiki.prooph-board.com/board_workspace/Expressions.html). The `$>` prefix marks a JEXL expression in Cody code blocks.

### Available Variables

| Variable | Description |
|----------|-------------|
| `$> command` | The command data |
| `$> information` | Current aggregate state |
| `$> state` | Alias for information |
| `$> meta.user` | Current user context |
| `$> event` | Triggering event (in automation) |
| `$> contract` | Dependency alias |

### Common Expressions

**Role Check:**
```
$> meta.user|role('KL')
```

**Property Access:**
```
$> command.leadId
$> information.status
$> event.leadId
```

**Conditional:**
```
$> command.channel == 'phone' ? 'reached' : 'new'
```

**Data Transformation:**
```
$> command|unset('status')
$> information|get('status', 'default')
```

**String Interpolation:**
```
$> 'Cannot convert lead {{command.leadId}}. No contract was handed over!'
```

---

## Complete Examples

### Example 1: Simple Create Command

```markdown
## Aggregate Command

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

## UI Schema

```cody-ui-schema
{
  "leadId": {
    "ui:widget": "hidden"
  }
}
```

## Dependencies

```cody-dependencies
{}
```

## Command Handler

```cody-rules
[  
  {
    "rule": "always",
    "then": {
      "record": {
        "event": "Lead Submitted",
        "mapping": "$> command"
      }
    }
  }
]
```

## Configuration

```cody-metadata
{
  "aggregateCommand": true,
  "newAggregate": true
}
```

---

### Example 2: Command with Validation

```markdown
## Aggregate Command

of aggregate: Lead

## Schema

```cody-schema
{
  "leadId": "string|format:uuid"
}
```

## UI Schema

```cody-ui-schema
{
  "leadId": {
    "ui:widget": "hidden"
  },
  "locationId": {
    "ui:widget": "DataSelect",
    "ui:options": {
      "data": "/App/Locations",
      "value": "$> data.locationId",
      "text": "$> data.name"
    }
  },
  "comment": {
    "ui:title": "Additional comment by lead",
    "ui:widget": "textarea",
    "ui:readonly": true,
    "ui:options": {
      "rows": 5
    }
  }
}
```

## Dependencies

```cody-dependencies
{}
```

## Command Handler

```cody-rules
[
  {
    "rule": "condition",
    "if_not": "$> meta.user|role('KL')",
    "then": {
      "throw": {
        "error": "$> 'Cannot convert lead {{command.leadId}}. No contract was handed over!'"
      }
    }
  },
  {
    "rule": "always",
    "then": {
      "record": {
        "event": "Lead Converted",
        "mapping": "$> command"
      }
    }
  }
]
```

## Configuration

```cody-metadata
{
  "aggregateCommand": true,
  "newAggregate": false
}
```

---

### Example 3: Command with Multiple Conditional Events

```markdown
## Aggregate Command

of aggregate: Lead

## Schema

```cody-schema
{
  "leadId": "string|format:uuid",
  "status": "enum:took_place,no_show,cancelled",
  "notes?": "string"
}
```

## UI Schema

```cody-ui-schema
{
  "leadId": {
    "ui:widget": "hidden"
  },
  "notes": {
    "ui:widget": "textarea",
    "ui:options": {
      "rows": 5
    }
  }
}
```

## Dependencies

```cody-dependencies
{}
```

## Command Handler

```cody-rules
[
  {
    "rule": "condition",
    "if_not": "$> meta.user|role('KL')",
    "then": {
      "throw": {
        "error": "$> 'Operation not allowed'"
      }
    }
  },
  {
    "rule": "condition",
    "if": "$> command.status == 'took_place'",
    "then": {
      "record": {
        "event": "Viewing Appointment took place",
        "mapping": "$> command|unset('status')"
      }
    }
  },
  {
    "rule": "condition",
    "if": "$> command.status == 'no_show'",
    "then": {
      "record": {
        "event": "Lead Did Not Show Up to Viewing Appointment",
        "mapping": "$> command|unset('status')"
      }
    }
  },
  {
    "rule": "condition",
    "if": "$> command.status == 'cancelled'",
    "then": {
      "record": {
        "event": "Lead Cancelled Viewing Appointment",
        "mapping": "$> command|unset('status')"
      }
    }
  }
]
```

## Configuration

```cody-metadata
{
  "aggregateCommand": true,
  "newAggregate": false
}
```

---

### Example 4: Command with Variable Assignment

```markdown
## Aggregate Command

of aggregate: Lead

## Schema

```cody-schema
{
  "$ref": "/App/Lead"
}
```

## UI Schema

```cody-ui-schema
{
  "ui:order": [
    "locationId",
    "channel",
    "termsAccepted",
    "*"
  ],
  "leadId": {
    "ui:widget": "hidden"
  },
  "locationId": {
    "ui:widget": "DataSelect",
    "ui:readonly": true,
    "ui:options": {
      "data": "/App/Locations",
      "value": "$> data.locationId",
      "text": "$> data.name"
    }
  },
  "comment": {
    "ui:title": "Additional comment by lead",
    "ui:widget": "textarea",
    "ui:readonly": false,
    "ui:options": {
      "rows": 5
    }
  },
  "whatIsImportantQuestion": {
    "ui:title": "What is important for you? (Saxer)",
    "ui:widget": "textarea",
    "ui:options": {
      "rows": 5
    }
  },
  "inquirySubmittedAt": {
    "ui:widget": "hidden"
  },
  "status": {
    "ui:widget": "hidden"
  }
}
```

## Dependencies

```cody-dependencies
{}
```

## Command Handler

```cody-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "status",
        "value": "$> command.channel == 'phone' ? 'reached' : 'new'"
      }
    }
  },
  {
    "rule": "always",
    "then": {
      "record": {
        "event": "Lead Entered by Location Head",
        "mapping": {
          "$merge": "$> command",
          "status": "$> status"
        }
      }
    }
  }
]
```

## Configuration

```cody-metadata
{
  "aggregateCommand": true,
  "newAggregate": true
}
```

---

### Example 5: Command with Early Exit

```markdown
## Aggregate Command

of aggregate: Contract

## Schema

```cody-schema
{
  "$ref": "/App/Contract"
}
```

## UI Schema

```cody-ui-schema
{
  "contractId": {
    "ui:widget": "hidden"
  },
  "locationId": {
    "ui:readonly": true,
    "ui:widget": "DataSelect",
    "ui:options": {
      "data": "/App/Locations",
      "label": "$> data.name",
      "value": "$> data.locationId"
    },
    "ui:title": "Location Id"
  },
  "leadId": {
    "ui:widget": "hidden"
  },
  "signed": {
    "ui:widget": "hidden"
  }
}
```

## Dependencies

```cody-dependencies
{}
```

## Command Handler

```cody-rules
[
  {
    "rule": "condition",
    "if": "$> information.signed",
    "then": {
      "log": {
        "msg": "$> 'Contract {{command.contractId}} is already signed. Aborting ...'"
      }
    },
    "stop": true
  },
  {
    "rule": "always",
    "then": {
      "record": {
        "event": "Contract Signed",
        "mapping": "$> command"
      }
    }
  }
]
```

## Configuration

```cody-metadata
{
  "aggregateCommand": true,
  "newAggregate": false
}
```

---

### Example 6: Automation with Command Trigger

```markdown
## Automation

```cody-rules
[
  {
    "rule": "condition",
    "if": "$> event.leadId",
    "then": {
      "trigger": {
        "command": "HandOutContractToLead",
        "mapping": {
          "leadId": "$> event.leadId"
        }
      }
    },
    "else": {
      "log": {
        "msg": "$> 'Contract was added, but no lead assigned. Aborting ...'"
      }
    }
  }
]
```

---

## Automation Pattern

Automation elements use a simplified structure:

```markdown
## Automation

```cody-rules
[
  {
    "rule": "condition",
    "if": "$> event.fieldName",
    "then": {
      "trigger": {
        "command": "CommandName",
        "mapping": {
          "field": "$> event.fieldName"
        }
      }
    },
    "else": {
      "log": {
        "msg": "$> 'Error message'"
      }
    }
  }
]
```

**With Dependencies:**

```markdown
## Dependencies

```cody-dependencies
{
  "GetContract": {
    "type": "query",
    "alias": "contract"
  }
}
```

## Automation

```cody-rules
[
  {
    "rule": "condition",
    "if": "$> contract.leadId",
    "then": {
      "trigger": {
        "command": "ConvertLead",
        "mapping": {
          "leadId": "$> contract.leadId"
        }
      }
    },
    "else": {
      "log": {
        "msg": "$> 'Contract was signed, but it has no lead assigned. Aborting ...'"
      }
    }
  }
]
```

---

## Checklist for Creating New Commands

- [ ] Determine aggregate name
- [ ] Define schema with all required fields
- [ ] Add optional fields with `?` suffix
- [ ] Use proper type annotations (uuid, email, date, etc.)
- [ ] Create UI schema for form fields
- [ ] Mark ID fields as hidden widgets
- [ ] Configure DataSelect for reference fields
- [ ] Define command handler rules
- [ ] Add validation rules (role checks, state checks)
- [ ] Record appropriate event(s)
- [ ] Set configuration metadata
- [ ] Specify `newAggregate: true` for create commands
- [ ] Use `newAggregate: false` for update commands

---

## Common Patterns

### Create New Aggregate

```cody-metadata
{
  "aggregateCommand": true,
  "newAggregate": true
}
```

Schema should include ID field:
```cody-schema
{
  "leadId": "string|format:uuid",
  ...
}
```

### Update Existing Aggregate

```cody-metadata
{
  "aggregateCommand": true,
  "newAggregate": false
}
```

### Validation Pattern

```cody-rules
[
  {
    "rule": "condition",
    "if_not": "$> meta.user|role('KL')",
    "then": {
      "throw": {
        "error": "$> 'Operation not allowed'"
      }
    }
  },
  {
    "rule": "condition",
    "if": "$> information|get('status') == 'already_done'",
    "then": {
      "throw": {
        "error": "$> 'Cannot perform action. Already done!'"
      }
    }
  },
  {
    "rule": "always",
    "then": {
      "record": {
        "event": "Action Completed",
        "mapping": "$> command"
      }
    }
  }
]
```

### Data Transformation Pattern

```cody-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "computedValue",
        "value": "$> command.field == 'x' ? 'a' : 'b'"
      }
    }
  },
  {
    "rule": "always",
    "then": {
      "record": {
        "event": "Event Name",
        "mapping": {
          "$merge": "$> command",
          "computedField": "$> computedValue"
        }
      }
    }
  }
]
```
