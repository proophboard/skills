# Cody Information Skill - Information Element Details Specification

This document describes the structure and patterns for creating Information element details in the Cody/prooph board system.

## Overview

Information elements represent **data that can be read from the system**. They define queryable data structures, their presentation, and how they're retrieved from the database.

Information details contain structured markdown with code blocks that define:

1. **Schema** - Data structure and validation
2. **UI Schema** - Presentation configuration (tables, forms, etc.)
3. **Query Schema** - Input parameters for queries
4. **Query Resolver** - How to fetch the data
5. **Configuration** - Collection and entity metadata
6. **Initialize** - Default value initialization (optional)
7. **Projection** - Event-sourced projections (for read models)

### Related Documentation

- [Rule Engine](https://wiki.prooph-board.com/board_workspace/Rule-Engine.html) — Details on the rule engine used for query resolvers, projections, and initialization rules
- [JEXL Expressions](https://wiki.prooph-board.com/board_workspace/Expressions.html) — Documentation for JEXL expressions used in `cody-resolve`, `cody-projection`, `cody-initialize`, `cody-schema`, and `cody-ui-schema` code blocks

---

## Structure Template

### For Entity (Single Item)

```markdown
## Schema

```cody-schema
{
  "id": "string|format:uuid|title:Id",
  "name": "string",
  "field?": "type"
}
```

## UI Schema

```cody-ui-schema
{
  "id": {
    "ui:widget": "hidden"
  }
}
```

## Query Schema

```cody-query-schema
{
  "id": "string|format:uuid"
}
```

## Query Resolver

```cody-resolve
{
  "where": {
    "rule": "always",
    "then": {
      "filter": {
        "eq": {
          "prop": "id",
          "value": "$> query.id"
        }
      }
    }
  }
}
```

## Configuration

```cody-metadata
{
  "hasIdentifier": true,
  "identifier": "id",
  "isList": false,
  "isQueryable": true,
  "query": "App.GetItem",
  "collection": "items_collection",
  "ns": "/App",
  "entity": true
}
```

## Initialize

```cody-initialize
[]
```

---

### For List

```markdown
## Schema

```cody-schema
{
  "$items": "/App/ItemType"
}
```

## UI Schema

```cody-ui-schema
{
  "ui:table": {
    "columns": [
      "field1",
      "field2"
    ]
  }
}
```

## Query Schema

```cody-query-schema
{}
```

## Query Resolver

```cody-resolve
{
  "where": {
    "rule": "always",
    "then": {
      "filter": {
        "any": true
      }
    }
  }
}
```

## Configuration

```cody-metadata
{
  "ns": "/App",
  "collection": "items_collection",
  "entity": false,
  "identifier": "id"
}
```

---

## Detailed Specifications

### 1. Schema Definition

**Required for all information elements**

#### Single Entity Schema

```cody-schema
{
  "id": "string|format:uuid|title:Id",
  "requiredField": "type|constraints",
  "optionalField?": "type",
  "nestedObject": {
    "field": "type"
  },
  "$title": "Display Title"
}
```

#### List Schema

```cody-schema
{
  "$items": "/App/ItemType",
  "$title": "Items"
}
```

#### Schema with Nested Objects

```cody-schema
{
  "contractId": "string|format:uuid",
  "contractPartner": {
    "lastName": "string|minLength:1",
    "firstName": "string|minLength:1",
    "address": {
      "street": "string",
      "streetNumber": "string",
      "zipCode": "string",
      "city": "string"
    }
  },
  "child": {
    "lastName": "string",
    "firstName": "string",
    "birthday?": "string|format:date"
  }
}
```

#### Schema with Enum and Arrays

```cody-schema
{
  "status": "enum:new,reached,not_reached,contract_signed",
  "channel": "enum:website,phone,email",
  "children?": {
    "$items": {
      "firstName": "string",
      "birthday?": "string|format:date"
    }
  },
  "weekDays": {
    "mon": "boolean|default:true",
    "tue": "boolean|default:true",
    "$title": "Week Days"
  }
}
```

#### Schema with Reference Types

```cody-schema
{
  "locationId": "/App/Location:locationId",
  "leadId?": "/App/Lead:leadId",
  "bankAccount": "/App/BankAccount:bankAccountId"
}
```

---

### 2. UI Schema

**Optional** - defines how data is presented

#### Hidden Fields

```cody-ui-schema
{
  "id": {
    "ui:widget": "hidden"
  },
  "internalField": {
    "ui:widget": "hidden"
  }
}
```

#### DataSelect Widget

```cody-ui-schema
{
  "locationId": {
    "ui:widget": "DataSelect",
    "ui:options": {
      "data": "/App/Locations",
      "value": "$> data.locationId",
      "text": "$> data.name"
    },
    "ui:title": "Location"
  }
}
```

#### Textarea Widget

```cody-ui-schema
{
  "comment": {
    "ui:title": "Additional comment",
    "ui:widget": "textarea",
    "ui:readonly": true,
    "ui:options": {
      "rows": 5
    }
  }
}
```

#### Table Configuration (List Views)

```cody-ui-schema
{
  "ui:title": "",
  "ui:table": {
    "columns": [
      "firstName",
      "lastName",
      "email",
      {
        "field": "status",
        "headerName": "Status"
      },
      {
        "field": "dateField",
        "headerName": "Date",
        "value": "$> row.dateField|date()"
      },
      {
        "field": "nestedObject",
        "value": "$> '{{row.nestedObject.firstName}} {{row.nestedObject.lastName}}'"
      },
      {
        "field": "conditional",
        "value": "$> row.viewingAppointment? row.viewingAppointment|date() : '-'"
      },
      {
        "field": "actions",
        "type": "actions",
        "actions": [
          {
            "type": "link",
            "pageLink": {
              "page": "App.ItemDetails",
              "mapping": {
                "itemId": "$> row.itemId"
              }
            },
            "button": {
              "label": "View Details",
              "icon": "open-in-new",
              "color": "default"
            }
          }
        ]
      }
    ]
  }
}
```

#### UI Options with Actions

```cody-ui-schema
{
  "ui:options": {
    "actions": []
  }
}
```

#### List Item with Custom Styling

```cody-ui-schema
{
  "ui:list": {
    "items": {
      "ui:title:expr": "$> data.name",
      "ui:options": {
        "grid": {
          "props": {
            "sx": {
              "border": 1,
              "borderRadius": 1,
              "borderColor": "grey.300",
              "padding:expr": "$> theme.spacing|call(2)"
            }
          }
        },
        "actions": [
          {
            "type": "link",
            "pageLink": {
              "page": "App.ContactFormStep1",
              "mapping": {
                "locationId": "$> data.locationId"
              }
            },
            "position": "bottom-left",
            "button": {
              "label": "Contact"
            }
          }
        ]
      },
      "hiddenField": {
        "ui:widget": "hidden"
      }
    }
  }
}
```

---

### 3. Query Schema

**Required for queryable information** - defines input parameters

#### No Parameters

```cody-query-schema
{}
```

#### With Parameters

```cody-query-schema
{
  "itemId": "string|format:uuid",
  "$title": "Get Item"
}
```

#### Multiple Parameters

```cody-query-schema
{
  "locationId": "string|format:uuid",
  "status": "string",
  "$title": "Get Location Leads"
}
```

---

### 4. Query Resolver

**Required for queryable information** - defines how to fetch data

> Query resolvers use the [Rule Engine](https://wiki.prooph-board.com/board_workspace/Rule-Engine.html) to define data retrieval rules including `where` filters, `orderBy` sorting, and `findById`/`find` lookups.

#### Empty Resolver (returns all)

```cody-resolve
{}
```

#### Simple Filter by ID

```cody-resolve
{
  "where": {
    "rule": "always",
    "then": {
      "filter": {
        "eq": {
          "prop": "itemId",
          "value": "$> query.itemId"
        }
      }
    }
  }
}
```

#### Filter with Role-Based Access

```cody-resolve
{
  "rules": [
    {
      "rule": "condition",
      "if_not": "$> meta.user|role('KL')",
      "then": {
        "throw": {
          "error": "$> 'Operation not allowed'"
        }
      }
    }
  ],
  "where": {
    "rule": "always",
    "then": {
      "filter": {
        "and": [
          {
            "eq": {
              "prop": "locationId",
              "value": "$> meta.user|attr('location', '__')"
            }
          },
          {
            "not": {
              "anyOf": {
                "prop": "status",
                "valueList": "$> ['contract_signed', 'abandoned']"
              }
            }
          }
        ]
      }
    }
  },
  "orderBy": {
    "prop": "createdAt",
    "sort": "desc"
  }
}
```

#### Conditional Filter

```cody-resolve
{
  "rules": [
    {
      "rule": "condition",
      "if_not": "$> meta.user|role(['Admin', 'KL', 'Management'])",
      "then": {
        "throw": {
          "error": "$> 'Operation not allowed'"
        }
      }
    }
  ],
  "where": {
    "rule": "condition",
    "if": "$> meta.user|role('KL')",
    "then": {
      "filter": {
        "eq": {
          "prop": "locationId",
          "value": "$> meta.user|attr('location', '___')"
        }
      }
    },
    "else": {
      "filter": {
        "any": true
      }
    }
  }
}
```

#### Complex Query with Multiple Steps

```cody-resolve
{
  "rules": [
    {
      "rule": "always",
      "then": {
        "findById": {
          "information": "/App/Lead",
          "id": "$> query.leadId",
          "variable": "lead"
        }
      }
    },
    {
      "rule": "always",
      "then": {
        "find": {
          "information": "/App/Parent",
          "filter": {
            "and": [
              {
                "eq": {
                  "prop": "lastName",
                  "value": "$> lead.lastName"
                }
              },
              {
                "eq": {
                  "prop": "firstName",
                  "value": "$> lead.firstName"
                }
              }
            ]
          }
        }
      }
    }
  ]
}
```

#### Filter with Date Conditions

```cody-resolve
{
  "where": {
    "rule": "always",
    "then": {
      "filter": {
        "and": [
          {
            "lte": {
              "prop": "attempts",
              "value": "$> 3"
            }
          },
          {
            "lte": {
              "prop": "deliverAt",
              "value": "$> now()|isoDateTime()"
            }
          }
        ]
      }
    }
  }
}
```

---

### 5. Configuration Metadata

**Required for all information elements**

#### Entity Configuration

```cody-metadata
{
  "hasIdentifier": true,
  "identifier": "itemId",
  "isList": false,
  "isQueryable": true,
  "query": "App.GetItem",
  "collection": "items_collection",
  "ns": "/App",
  "entity": true
}
```

#### List Configuration

```cody-metadata
{
  "hasIdentifier": true,
  "isList": true,
  "isQueryable": true,
  "itemIdentifier": "itemId",
  "itemType": "App.Item",
  "query": "App.GetItems",
  "collection": "items_collection",
  "ns": "/App",
  "entity": false
}
```

#### Simple Collection (No Query)

```cody-metadata
{
  "ns": "/App",
  "collection": "items_collection",
  "entity": false,
  "identifier": "itemId"
}
```

#### Static View (No Collection)

```cody-metadata
{
  "ns": "/App",
  "collection": false
}
```

#### Queryable List (Not Tied to Collection)

```cody-metadata
{
  "ns": "/App",
  "collection": false,
  "entity": false,
  "identifier": "parentId"
}
```

---

### 6. Initialize

**Optional** - default values for new items

> Initialize rules use the [Rule Engine](https://wiki.prooph-board.com/board_workspace/Rule-Engine.html) to set default values when creating new items.

```cody-initialize
[]
```

#### With Default Values

```cody-initialize
[
  {
    "rule": "condition",
    "if_not": "$> data.groups",
    "then": {
      "assign": {
        "variable": "data",
        "value": "$> data|set('groups', [])"
      }
    }
  }
]
```

---

### 7. Projection (Event-Sourced Read Models)

**Optional** - for building read models from events

> Projections use the [Rule Engine](https://wiki.prooph-board.com/board_workspace/Rule-Engine.html) to define event handlers with `when`/`given`/`then` clauses. Each case handles one event type, with `upsert` actions writing to the read model.

#### Projection with Multiple Event Handlers

```cody-projection
{
  "name": "MailOutboxProjection",
  "live": true,
  "cases": [
    {
      "when": "Lead Submitted",
      "given": [
        {
          "rule": "always",
          "then": {
            "assign": {
              "variable": "leadMailId",
              "value": "$> uuid()"
            }
          }
        },
        {
          "rule": "always",
          "then": {
            "findById": {
              "information": "/App/Location",
              "id": "$> event.locationId",
              "variable": "location"
            }
          }
        }
      ],
      "then": {
        "execute": {
          "rules": [
            {
              "rule": "always",
              "then": {
                "upsert": {
                  "information": "/App/MailOutbox",
                  "id": "$> leadMailId",
                  "set": {
                    "mailId": "$> leadMailId",
                    "recipients": [
                      {
                        "to": "$> event.email"
                      }
                    ],
                    "template": "$> 'lead-thank-you'",
                    "variables": {
                      "firstName": "$> event.firstName",
                      "lastName": "$> event.lastName",
                      "locationName": "$> location.name"
                    },
                    "deliverAt": "$> eventCreatedAt",
                    "attempts": "$> 0"
                  }
                }
              }
            }
          ]
        }
      }
    },
    {
      "when": "Lead Not Reached By Phone",
      "given": [
        {
          "rule": "always",
          "then": {
            "assign": {
              "variable": "mailId",
              "value": "$> uuid()"
            }
          }
        },
        {
          "rule": "always",
          "then": {
            "findById": {
              "information": "/App/Lead",
              "id": "$> event.leadId",
              "variable": "lead"
            }
          }
        }
      ],
      "then": {
        "upsert": {
          "id": "$> mailId",
          "set": {
            "mailId": "$> mailId",
            "recipients": [
              {
                "to": "$> lead.email"
              }
            ],
            "template": "$> 'lead-not-reached'",
            "variables": {
              "firstName": "$> lead.firstName",
              "lastName": "$> lead.lastName"
            },
            "deliverAt": "$> eventCreatedAt",
            "attempts": "$> 0"
          }
        }
      }
    }
  ]
}
```

---

## Complete Examples

### Example 1: Single Entity (Lead)

```markdown
## Schema

```cody-schema
{
  "leadId": "string|format:uuid",
  "firstName": "string",
  "lastName": "string",
  "email": "string|format:email",
  "phone?": "string",
  "locationId": "/App/Location:locationId",
  "status": "enum:new,reached,not_reached,contract_handed_over,contract_signed,abandoned",
  "inquirySubmittedAt": "string|format:date-time",
  "channel": "enum:website,phone,email",
  "children?": {
    "$items": {
      "firstName": "string",
      "birthday?": "string|format:date"
    }
  },
  "viewingAppointment?": {
    "at": "string|format:date-time",
    "status": "enum:scheduled,took_place,no_show,cancelled|default:scheduled",
    "notes?": "string"
  }
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

## Query Schema

```cody-query-schema
{
  "leadId": "string|format:uuid"
}
```

## Query Resolver

```cody-resolve
{
  "where": {
    "rule": "always",
    "then": {
      "filter": {
        "any": true
      }
    }
  }
}
```

## Configuration

```cody-metadata
{
  "ns": "/App",
  "collection": "leads_collection",
  "identifier": "leadId",
  "entity": true
}
```

---

### Example 2: List with Table View (My Location Leads)

```markdown
## Schema

```cody-schema
{
  "$items": "/App/Lead"
}
```

## UI Schema

```cody-ui-schema
{
  "ui:title": false,
  "ui:table": {
    "columns": [
      "firstName",
      "lastName",
      "email",
      "phone",
      {
        "field": "status",
        "headerName": "Status"
      },
      {
        "field": "channel"
      },
      {
        "field": "inquirySubmittedAt",
        "headerName": "Inquiry From",
        "value": "$> row.inquirySubmittedAt|date()"
      },
      {
        "field": "viewingAppointment",
        "headerName": "Viewing",
        "value": "$> row.viewingAppointment? row.viewingAppointment|date() : '-'"
      },
      {
        "field": "actions",
        "type": "actions",
        "actions": [
          {
            "type": "link",
            "pageLink": {
              "page": "App.LeadDetails",
              "mapping": {
                "leadId": "$> row.leadId"
              }
            },
            "button": {
              "label": "View Details",
              "icon": "open-in-new",
              "color": "default"
            }
          }
        ]
      }
    ]
  }
}
```

## Query Schema

```cody-query-schema
{}
```

## Query Resolver

```cody-resolve
{
  "rules": [
    {
      "rule": "condition",
      "if_not": "$> meta.user|role('KL')",
      "then": {
        "throw": {
          "error": "$> 'Operation not allowed'"
        }
      }
    }
  ],
  "where": {
    "rule": "always",
    "then": {
      "filter": {
        "and": [
          {
            "eq": {
              "prop": "locationId",
              "value": "$> meta.user|attr('location', '__')"
            }
          },
          {
            "not": {
              "anyOf": {
                "prop": "status",
                "valueList": "$> ['contract_signed', 'abandoned']"
              }
            }
          }
        ]
      }
    }
  },
  "orderBy": {
    "prop": "inquirySubmittedAt",
    "sort": "desc"
  }
}
```

## Configuration

```cody-metadata
{
  "ns": "/App",
  "collection": "leads_collection",
  "entity": false,
  "identifier": "leadId"
}
```

---

### Example 3: Entity with Nested Objects (Contract)

```markdown
## Schema

```cody-schema
{
  "contractId": "string|format:uuid|title:Contract Id",
  "locationId": "/App/Location:locationId",
  "leadId?": "/App/Lead:leadId",
  "contractPartner": {
    "lastName": "string|minLength:1",
    "firstName": "string|minLength:1",
    "address": {
      "street": "string|minLength:1",
      "streetNumber": "string|minLength:1",
      "zipCode": "string|minLength:1",
      "city": "string|minLength:1"
    }
  },
  "child": {
    "lastName": "string|minLength:1",
    "firstName": "string|minLength:1",
    "birthday?": "string|format:date"
  },
  "entryDate": "string|format:date|title:Entry Date",
  "weekDays": {
    "mon": "boolean|default:true|title:Mon",
    "tue": "boolean|default:true|title:Tue",
    "wed": "boolean|default:true|title:Wed",
    "thu": "boolean|default:true|title:Thu",
    "fri": "boolean|default:true|title:Fri",
    "$title": "Week Days"
  },
  "careDetails": {
    "allDay": "boolean|default:true|title:All Day",
    "lunch": "boolean|default:true|title:Lunch"
  },
  "comments?": "string",
  "monthlyRateBaby": "number|title:Monthly Rate Baby",
  "monthlyRateKid": "number|title:Monthly Rate Kid",
  "signed": "boolean|default:false",
  "$title": "Contract"
}
```

## UI Schema

```cody-ui-schema
{
  "contractId": {
    "ui:widget": "hidden"
  },
  "locationId": {
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
  }
}
```

## Query Schema

```cody-query-schema
{
  "contractId": "string|format:uuid|title:Contract Id",
  "$title": "Get Contract"
}
```

## Query Resolver

```cody-resolve
{}
```

## Configuration

```cody-metadata
{
  "hasIdentifier": true,
  "identifier": "contractId",
  "isList": false,
  "isQueryable": true,
  "query": "App.GetContract",
  "collection": "contracts_collection",
  "ns": "/App",
  "entity": true
}
```

## Initialize

```cody-initialize
[]
```

---

### Example 4: Static View (Similar Parents Hint)

```markdown
## Static View

## Schema

```cody-schema
{}
```

## UI Schema

```cody-ui-schema
{
  "ui:title": "⚠️ Existing parent found!",
  "ui:description": "Please verify if the lead is already known as a parent in ACR-Hub. At least one parent with a similar name was found."
}
```

## Configuration

```cody-metadata
{
  "ns": "/App",
  "collection": false
}
```

---

### Example 5: Queryable List (Not Tied to Collection)

```markdown
## Queryable List

Not tied to a collection

## Schema

```cody-schema
{
  "$items": "/App/Parent"
}
```

## UI Schema

```cody-ui-schema
{
  "ui:table": {
    "columns": [
      "lastName",
      "firstName"
    ]
  }
}
```

## Query

```cody-query-schema
{
  "leadId": "string|format:uuid"
}
```

## Query Resolver

```cody-resolve
{
  "rules": [
    {
      "rule": "always",
      "then": {
        "findById": {
          "information": "/App/Lead",
          "id": "$> query.leadId",
          "variable": "lead"
        }
      }
    },
    {
      "rule": "always",
      "then": {
        "find": {
          "information": "/App/Parent",
          "filter": {
            "and": [
              {
                "eq": {
                  "prop": "lastName",
                  "value": "$> lead.lastName"
                }
              },
              {
                "eq": {
                  "prop": "firstName",
                  "value": "$> lead.firstName"
                }
              }
            ]
          }
        }
      }
    }
  ]
}
```

## Configuration

```cody-metadata
{
  "ns": "/App",
  "collection": false,
  "entity": false,
  "identifier": "parentId"
}
```

---

### Example 6: Projection Collection (Mail Outbox)

```markdown
## Todo List

Projection collection used as worker queue

## Todo Item Schema

```cody-schema
{
  "$items": {
    "mailId": "string|format:uuid",
    "recipients": {
      "$items": {
        "to": "string|format:email",
        "cc?": "boolean",
        "bcc?": "boolean"
      }
    },
    "template": "string",
    "variables": {},
    "deliverAt": "string|format:date-time",
    "attempts": "integer|default:0",
    "lastError?": "string"
  }
}
```

## UI Schema

```cody-ui-schema
{
  "ui:table": {
    "columns": [
      "template"
    ]
  }
}
```

## Query

```cody-query-schema
{}
```

## Query Resolver

```cody-resolve
{
  "where": {
    "rule": "always",
    "then": {
      "filter": {
        "and": [
          {
            "lte": {
              "prop": "attempts",
              "value": "$> 3"
            }
          },
          {
            "lte": {
              "prop": "deliverAt",
              "value": "$> now()|isoDateTime()"
            }
          }
        ]
      }
    }
  }
}
```

## Projection

```cody-projection
{
  "name": "MailOutboxProjection",
  "live": true,
  "cases": [
    {
      "when": "Lead Submitted",
      "given": [
        {
          "rule": "always",
          "then": {
            "assign": {
              "variable": "leadMailId",
              "value": "$> uuid()"
            }
          }
        },
        {
          "rule": "always",
          "then": {
            "findById": {
              "information": "/App/Location",
              "id": "$> event.locationId",
              "variable": "location"
            }
          }
        }
      ],
      "then": {
        "execute": {
          "rules": [
            {
              "rule": "always",
              "then": {
                "upsert": {
                  "information": "/App/MailOutbox",
                  "id": "$> leadMailId",
                  "set": {
                    "mailId": "$> leadMailId",
                    "recipients": [
                      {
                        "to": "$> event.email"
                      }
                    ],
                    "template": "$> 'lead-thank-you'",
                    "variables": {
                      "firstName": "$> event.firstName",
                      "lastName": "$> event.lastName",
                      "locationName": "$> location.name"
                    },
                    "deliverAt": "$> eventCreatedAt",
                    "attempts": "$> 0"
                  }
                }
              }
            }
          ]
        }
      }
    }
  ]
}
```

## Configuration

```cody-metadata
{
  "ns": "/App",
  "collection": "mail_outbox_collection",
  "entity": false,
  "identifier": "mailId"
}
```

---

## Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `{"eq": {"prop": "status", "value": "new"}}` |
| `ne` | Not equals | `{"ne": {"prop": "status", "value": "deleted"}}` |
| `lt` | Less than | `{"lt": {"prop": "age", "value": 18}}` |
| `lte` | Less than or equal | `{"lte": {"prop": "attempts", "value": 3}}` |
| `gt` | Greater than | `{"gt": {"prop": "price", "value": 100}}` |
| `gte` | Greater than or equal | `{"gte": {"prop": "quantity", "value": 1}}` |
| `in` | In list | `{"in": {"prop": "status", "valueList": ["new", "pending"]}}` |
| `not` | Negation | `{"not": {"eq": {...}}}` |
| `and` | Logical AND | `{"and": [{"eq": {...}}, {"gt": {...}}]}` |
| `or` | Logical OR | `{"or": [{"eq": {...}}, {"eq": {...}}]}` |
| `any` | Match any (no filter) | `{"any": true}` |

---

## Expression Syntax

### Available Variables

| Variable | Description |
|----------|-------------|
| `$> query` | Query parameters |
| `$> row` | Current row in table columns |
| `$> data` | Current data item |
| `$> meta.user` | Current user |
| `$> event` | Event data (in projections) |
| `$> information` | Current state (in projections) |
| `$> eventCreatedAt` | Event timestamp |

### Common Expressions

**Date Formatting:**
```
$> row.dateField|date()
$> row.inquirySubmittedAt|date()
```

**Conditional Value:**
```
$> row.viewingAppointment? row.viewingAppointment|date() : '-'
```

**String Interpolation:**
```
$> '{{row.child.firstName}} {{row.child.lastName}}'
$> '{{data.lastName}}, {{data.firstName}}'
```

**User Properties:**
```
$> meta.user|role('KL')
$> meta.user|attr('location', '__')
$> meta.user|role(['Admin', 'KL', 'Management'])
```

**UUID Generation:**
```
$> uuid()
```

**Current Timestamp:**
```
$> now()|isoDateTime()
```

---

## Checklist for Creating New Information Elements

- [ ] Determine if it's a single entity or list
- [ ] Define schema with all fields and types
- [ ] Add optional fields with `?` suffix
- [ ] Configure UI schema for presentation
- [ ] Mark ID fields as hidden widgets
- [ ] Configure DataSelect for reference fields
- [ ] Define query schema (if queryable)
- [ ] Create query resolver with appropriate filters
- [ ] Add role-based access control if needed
- [ ] Set configuration metadata
- [ ] Specify collection and namespace
- [ ] Add initialize block if defaults needed
- [ ] Create projection if event-sourced read model

---

## Information Types Summary

| Type | Description | Example |
|------|-------------|---------|
| **Entity** | Single item from collection | `Lead`, `Contract`, `Location` |
| **List** | Multiple items with table view | `Contracts`, `My Location Leads` |
| **Queryable List** | Filtered list with custom query | `Similar Parents for Lead` |
| **Static View** | No data, just UI configuration | `Similar Parents Hint` |
| **Projection** | Event-sourced read model | `Mail Outbox` |
