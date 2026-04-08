# Cody Automation Skill - Automation Element Details Specification

This document describes the structure and patterns for creating Automation element details in the Cody/prooph board system.

## Overview

Automation elements represent **automated reactions to events**. They listen for specific events and trigger commands, send notifications, or perform other automated actions.

Automation details contain structured markdown with code blocks that define:

1. **Event Reaction** - Declaration that this automation reacts to events
2. **Dependencies** - External data requirements (queries, services)
3. **Automation Rules** - Business logic for event handling

---

## Structure Template

### Simple Automation

```markdown
## Event Reaction

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

---

### Automation with Dependencies

```markdown
## Event Reaction

## Dependencies

```cody-dependencies
{
  "QueryName": {
    "type": "query",
    "alias": "variableName",
    "options": {
      "query": {
        "param": "$> event.fieldId"
      }
    }
  },
  "AuthService": {
    "type": "service"
  }
}
```

## Automation

```cody-rules
[
  {
    "rule": "condition",
    "if": "$> variableName|first()",
    "then": {
      "trigger": {
        "command": "CommandName",
        "mapping": {
          "field": "$> variableName|first()|get('fieldId')"
        }
      }
    }
  }
]
```

---

## Detailed Specifications

### 1. Event Reaction Declaration

**Required for all automations**

```markdown
## Event Reaction
```

This declares that the automation reacts to events. The specific event is determined by the event this automation element is placed after in the chapter flow.

---

### 2. Dependencies

**Optional** - declares external data requirements

#### Query Dependency

```cody-dependencies
{
  "GetPlannedReminder": {
    "type": "query",
    "alias": "plannedReminder",
    "options": {
      "query": {
        "leadId": "$> event.leadId"
      }
    }
  }
}
```

#### Service Dependency

```cody-dependencies
{
  "AuthService": {
    "type": "service"
  }
}
```

#### Multiple Dependencies

```cody-dependencies
{
  "AuthService": {
    "type": "service"
  },
  "GetLead": {
    "type": "query",
    "alias": "lead"
  },
  "GetPlannedViewingReminder": {
    "type": "query",
    "alias": "plannedReminder",
    "options": {
      "query": {
        "leadId": "$> event.leadId"
      }
    }
  }
}
```

#### Empty Dependencies

```cody-dependencies
{}
```

---

### 3. Automation Rules

**Required for all automations** - defines event handling logic

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

---

## Action Types

### 1. Trigger Command

Triggers a command with mapped data:

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
    }
  }
]
```

### 2. Trigger Command with Multiple Notifications

```cody-rules
[
  {
    "rule": "always",
    "then": {
      "trigger": {
        "command": "SendNotification",
        "mapping": {
          "notificationId": "$> uuid()",
          "severity": "$> 'success'",
          "tag": "$> 'new-lead-' + event.leadId",
          "msg": "$> 'New lead submitted: ' + event.firstName + ' ' + event.lastName",
          "to": "$> locationHead.userId",
          "plannedFor": "$> eventCreatedAt|isoDateTime()"
        }
      }
    }
  },
  {
    "rule": "always",
    "then": {
      "trigger": {
        "command": "SendNotification",
        "mapping": {
          "notificationId": "$> uuid()",
          "severity": "$> 'warning'",
          "tag": "$> 'new-lead-reminder-' + event.leadId",
          "msg": "$> 'Attention! New lead not contacted within 24h: ' + event.firstName + ' ' + event.lastName",
          "to": "$> locationHead.userId",
          "plannedFor": "$> eventCreatedAt|addDays(1)|isoDateTime()"
        }
      }
    }
  }
]
```

### 3. Log Message

```cody-rules
[
  {
    "rule": "condition",
    "if_not": "$> plannedReminder|first()",
    "then": {
      "log": {
        "msg": "$> 'No new lead reminder planned. Aborting ...'"
      }
    },
    "stop": true
  }
]
```

### 4. Log with Multiple Parts

```cody-rules
[
  {
    "rule": "condition",
    "if_not": "$> locationHead",
    "then": {
      "log": {
        "msg": [
          "$> 'No KL found for location: '",
          "$> event.locationId",
          "$> '. Aborting notifications.'"
        ]
      }
    },
    "stop": true
  }
]
```

### 5. Assign Variable

```cody-rules
[
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "locationHead",
        "value": "$> locationHeadMatch|first()"
      }
    }
  }
]
```

### 6. Lookup Users

```cody-rules
[
  {
    "rule": "always",
    "then": {
      "lookup": {
        "users": {
          "filter": {
            "eq": {
              "prop": "attributes.location",
              "value": "$> event.locationId"
            }
          },
          "variable": "locationHeadMatch"
        }
      }
    }
  }
]
```

### 7. For Each Loop

```cody-rules
[
  {
    "rule": "always",
    "then": {
      "forEach": {
        "variable": "plannedReminders",
        "then": {
          "trigger": {
            "command": "DiscardNotification",
            "mapping": {
              "notificationId": "$> item|get('notificationId')"
            }
          }
        }
      }
    }
  }
]
```

### 8. Execute Nested Rules

```cody-rules
[
  {
    "rule": "condition",
    "if_not": "$> event.viewingAppointment",
    "then": {
      "execute": {
        "rules": [
          {
            "rule": "condition",
            "if_not": "$> plannedReminder|first()",
            "then": {
              "log": {
                "msg": "$> 'No viewing appointment planned. Aborting ...'"
              }
            },
            "else": {
              "trigger": {
                "command": "DiscardNotification",
                "mapping": {
                  "notificationId": "$> plannedReminder|first()|get('notificationId')"
                }
              }
            }
          }
        ]
      }
    },
    "stop": true
  }
]
```

---

## Complete Examples

### Example 1: Simple Command Trigger

```markdown
## Event Reaction

## Automation

```cody-rules
[
  {
    "rule": "condition",
    "if": "$> event.itemId",
    "then": {
      "trigger": {
        "command": "ProcessItem",
        "mapping": {
          "itemId": "$> event.itemId"
        }
      }
    },
    "else": {
      "log": {
        "msg": "$> 'Event received, but no item assigned. Aborting ...'"
      }
    }
  }
]
```

---

### Example 2: Command Trigger with Query Dependency

```markdown
## Event Reaction

## Dependencies

```cody-dependencies
{
  "GetOrder": {
    "type": "query",
    "alias": "order"
  }
}
```

## Automation

```cody-rules
[
  {
    "rule": "condition",
    "if": "$> order.customerId",
    "then": {
      "trigger": {
        "command": "NotifyCustomer",
        "mapping": {
          "customerId": "$> order.customerId"
        }
      }
    },
    "else": {
      "log": {
        "msg": "$> 'Order was processed, but it has no customer assigned. Aborting ...'"
      }
    }
  }
]
```

---

### Example 3: Discard Reminder with Query

```markdown
## Event Reaction

## Dependencies

```cody-dependencies
{
  "GetPlannedTaskReminders": {
    "type": "query",
    "alias": "plannedReminders",
    "options": {
      "query": {
        "taskId": "$> event.taskId"
      }
    }
  }
}
```

## Automation

```cody-rules
[
  {
    "rule": "condition",
    "if_not": "$> plannedReminders|first()",
    "then": {
      "log": {
        "msg": "$> 'No task reminders planned. Aborting ...'"
      }
    },
    "stop": true
  },
  {
    "rule": "always",
    "then": {
      "forEach": {
        "variable": "plannedReminders",
        "then": {
          "trigger": {
            "command": "DiscardNotification",
            "mapping": {
              "notificationId": "$> item|get('notificationId')"
            }
          }
        }
      }
    }
  }
]
```

---

### Example 4: Notify Responsible User about New Item

```markdown
## Event Reaction

## Dependencies

```cody-dependencies
{
  "AuthService": {
    "type": "service"
  }
}
```

## Automation

Assuming one responsible user per group.

```cody-rules
[
  {
    "rule": "always",
    "then": {
      "lookup": {
        "users": {
          "filter": {
            "eq": {
              "prop": "attributes.group",
              "value": "$> event.groupId"
            }
          },
          "variable": "responsibleUserMatch"
        }
      }
    }
  },
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "responsibleUser",
        "value": "$> responsibleUserMatch|first()"
      }
    }
  },
  {
    "rule": "condition",
    "if_not": "$> responsibleUser",
    "then": {
      "log": {
        "msg": [
          "$> 'No responsible user found for group: '",
          "$> event.groupId",
          "$> '. Aborting notifications.'"
        ]
      }
    },
    "stop": true
  },
  {
    "rule": "always",
    "then": {
      "trigger": {
        "command": "SendNotification",
        "mapping": {
          "notificationId": "$> uuid()",
          "severity": "$> 'success'",
          "tag": "$> 'new-item-' + event.itemId",
          "msg": "$> 'New item submitted: ' + event.title",
          "to": "$> responsibleUser.userId",
          "plannedFor": "$> eventCreatedAt|isoDateTime()"
        }
      }
    }
  },
  {
    "rule": "always",
    "then": {
      "trigger": {
        "command": "SendNotification",
        "mapping": {
          "notificationId": "$> uuid()",
          "severity": "$> 'warning'",
          "tag": "$> 'new-item-reminder-' + event.itemId",
          "msg": "$> 'Attention! New item not reviewed within 24h: ' + event.title",
          "to": "$> responsibleUser.userId",
          "plannedFor": "$> eventCreatedAt|addDays(1)|isoDateTime()"
        }
      }
    }
  }
]
```

---

### Example 5: Schedule Appointment Reminder with Complex Logic

```markdown
## Event Reaction

## Dependencies

```cody-dependencies
{
  "GetPlannedViewingReminder": {
    "type": "query",
    "alias": "plannedReminder",
    "options": {
      "query": {
        "leadId": "$> event.leadId"
      }
    }
  },
  "AuthService": {
    "type": "service"
  }
}
```

## Automation

```cody-rules
[
  {
    "rule": "condition",
    "if_not": "$> event.viewingAppointment",
    "then": {
      "execute": {
        "rules": [
          {
            "rule": "condition",
            "if_not": "$> plannedReminder|first()",
            "then": {
              "log": {
                "msg": "$> 'No viewing appointment planned. Aborting ...'"
              }
            },
            "else": {
              "trigger": {
                "command": "DiscardNotification",
                "mapping": {
                  "notificationId": "$> plannedReminder|first()|get('notificationId')"
                }
              }
            }
          }
        ]
      }
    },
    "stop": true
  },
  {
    "rule": "condition",
    "if": "$> plannedReminder|first()",
    "then": {
      "execute": {
        "rules": [
          {
            "rule": "always",
            "then": {
              "assign": {
                "variable": "reminderDate",
                "value": "$> plannedReminder|first()|get('plannedFor')|isoDate()"
              }
            }
          },
          {
            "rule": "always",
            "then": {
              "assign": {
                "variable": "viewingAppointmentDate",
                "value": "$> event.viewingAppointment|isoDate()"
              }
            }
          },
          {
            "rule": "condition",
            "if": "$> reminderDate == viewingAppointmentDate",
            "then": {
              "log": {
                "msg": "$> 'Reminder is already scheduled. Aborting ...'"
              }
            },
            "stop": true
          },
          {
            "rule": "always",
            "then": {
              "trigger": {
                "command": "DiscardNotification",
                "mapping": {
                  "notificationId": "$> plannedReminder|first()|get('notificationId')"
                }
              }
            }
          }
        ]
      }
    }
  },
  {
    "rule": "always",
    "then": {
      "lookup": {
        "users": {
          "filter": {
            "eq": {
              "prop": "attributes.location",
              "value": "$> event.locationId"
            }
          },
          "variable": "locationHeadMatch"
        }
      }
    }
  },
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "locationHead",
        "value": "$> locationHeadMatch|first()"
      }
    }
  },
  {
    "rule": "condition",
    "if_not": "$> locationHead",
    "then": {
      "log": {
        "msg": [
          "$> 'No KL found for location: '",
          "$> event.locationId",
          "$> '. Aborting notifications.'"
        ]
      }
    },
    "stop": true
  },
  {
    "rule": "always",
    "then": {
      "trigger": {
        "command": "SendNotification",
        "mapping": {
          "notificationId": "$> uuid()",
          "severity": "$> 'info'",
          "tag": "$> 'viewing-reminder-{{event.leadId}}'",
          "msg": "$> 'Viewing appointment planned for {{event.viewingAppointment|localDateTime()}} with: {{event.firstName}} {{event.lastName}}'",
          "to": "$> locationHead.userId",
          "plannedFor": "$> event.viewingAppointment|subDays(1)|isoDate() + 'T07:00:00.000Z'"
        }
      }
    }
  }
]
```

---

### Example 6: Schedule Task Completion Reminder

```markdown
## Event Reaction

## Dependencies

```cody-dependencies
{}
```

## Automation

```cody-rules
[
  {
    "rule": "always",
    "then": {
      "trigger": {
        "command": "SendNotification",
        "mapping": {
          "notificationId": "$> uuid()",
          "severity": "$> 'warning'",
          "tag": "$> 'fill-datasheet-reminder-{{event.contractId}}'",
          "msg": "$> 'A datasheet was handed out to {{event.parents[0].firstName}} {{event.parents[0].lastName}} at {{eventCreatedAt|localDate()}}, but we did not receive an answer yet. Please contact the parents and ask if everything is ok'",
          "to": "$> meta.user.userId",
          "plannedFor": "$> eventCreatedAt|addDays(7)|isoDate() + 'T07:00:00.000Z'"
        }
      }
    }
  }
]
```

---

## Notification Patterns

### Immediate Notification

```cody-rules
[
  {
    "rule": "always",
    "then": {
      "trigger": {
        "command": "SendNotification",
        "mapping": {
          "notificationId": "$> uuid()",
          "severity": "$> 'success'",
          "tag": "$> 'action-completed'",
          "msg": "$> 'Action completed successfully'",
          "to": "$> meta.user.userId",
          "plannedFor": "$> eventCreatedAt|isoDateTime()"
        }
      }
    }
  }
]
```

### Scheduled Reminder (Future)

```cody-rules
[
  {
    "rule": "always",
    "then": {
      "trigger": {
        "command": "SendNotification",
        "mapping": {
          "notificationId": "$> uuid()",
          "severity": "$> 'warning'",
          "tag": "$> 'reminder-task'",
          "msg": "$> 'Reminder: Task needs attention'",
          "to": "$> userId",
          "plannedFor": "$> eventCreatedAt|addDays(1)|isoDateTime()"
        }
      }
    }
  }
]
```

### Scheduled at Specific Time

```cody-rules
[
  {
    "rule": "always",
    "then": {
      "trigger": {
        "command": "SendNotification",
        "mapping": {
          "notificationId": "$> uuid()",
          "severity": "$> 'info'",
          "tag": "$> 'morning-reminder'",
          "msg": "$> 'Morning reminder message'",
          "to": "$> userId",
          "plannedFor": "$> eventCreatedAt|addDays(1)|isoDate() + 'T07:00:00.000Z'"
        }
      }
    }
  }
]
```

---

## Severity Levels

| Severity | Use Case |
|----------|----------|
| `success` | Positive confirmation (item created, action completed) |
| `info` | Informational messages (appointment scheduled) |
| `warning` | Reminders requiring attention (follow-up needed) |
| `error` | Critical issues (failed operations) |

---

## Expression Syntax

### Available Variables

| Variable | Description |
|----------|-------------|
| `$> event` | The triggering event data |
| `$> meta.user` | Current user |
| `$> eventCreatedAt` | Event timestamp |
| `$> item` | Current item in forEach loop |
| `$> order` | Dependency alias (query result) |
| `$> customer` | Dependency alias (query result) |
| `$> plannedReminder` | Dependency alias (query result) |

### Common Expressions

**Access Event Data:**
```
$> event.itemId
$> event.title
$> event.groupId
$> event.taskId
$> event.dueDate
$> event.assignee.firstName
```

**Date/Time Operations:**
```
$> eventCreatedAt|isoDateTime()
$> eventCreatedAt|isoDate()
$> eventCreatedAt|localDate()
$> eventCreatedAt|localDateTime()
$> eventCreatedAt|addDays(1)|isoDateTime()
$> eventCreatedAt|addDays(7)|isoDate() + 'T07:00:00.000Z'
$> event.dueDate|subDays(1)|isoDate() + 'T07:00:00.000Z'
$> event.dueDate|isoDate()
```

**Query Result Access:**
```
$> plannedReminder|first()
$> plannedReminder|first()|get('notificationId')
$> plannedReminder|first()|get('plannedFor')|isoDate()
$> order.customerId
$> customer.email
$> customer.groupId
```

**String Concatenation:**
```
$> 'New item: ' + event.title + ' by ' + event.assignee.lastName
$> 'task-reminder-' + event.taskId
$> 'completion-reminder-{{event.orderId}}'
```

**User Lookup:**
```
$> responsibleUserMatch|first()
$> responsibleUser.userId
$> meta.user.userId
```

**String Interpolation in Messages:**
```
$> 'Appointment planned for {{event.dueDate|localDateTime()}} with: {{event.assignee.firstName}} {{event.assignee.lastName}}'
$> 'A task was assigned to {{event.assignee.firstName}} {{event.assignee.lastName}} at {{eventCreatedAt|localDate()}}...'
```

---

## Checklist for Creating New Automations

- [ ] Identify the triggering event
- [ ] Determine if dependencies are needed (queries, services)
- [ ] Define query dependencies with appropriate filters
- [ ] Add validation rules (check if data exists)
- [ ] Add early exit with `stop: true` for abort conditions
- [ ] Log meaningful messages for debugging
- [ ] Use `lookup` for finding users by attributes
- [ ] Schedule notifications with appropriate `plannedFor` timestamps
- [ ] Use unique tags for notification deduplication
- [ ] Consider forEach loops for multiple items
- [ ] Handle edge cases (no user found, no data available)

---

## Automation Categories

### 1. Status Change Automations

Triggered when an aggregate changes state:

- `Change Order Status to shipped`
- `Change Order Status to delivered`

### 2. Notification Automations

Send immediate or scheduled notifications:

- `Notify team about new item`
- `Notify manager about status change`

### 3. Reminder Scheduling

Schedule future reminders:

- `Schedule Task Completion Reminder`
- `Schedule Review Reminder`
- `Schedule appointment reminder after call`
- `Schedule reminder if deadline is set`

### 4. Reminder Discard/Cleanup

Cancel planned reminders when no longer needed:

- `Discard task completion reminder`
- `Discard new item reminder if item processed`
- `Discard new item reminder if next step is scheduled`
- `Discard review reminder`

### 5. Email Sending

Trigger email notifications:

- `Send email` (multiple instances for different events)

---

## Common Patterns

### Pattern 1: Check Before Trigger

```cody-rules
[
  {
    "rule": "condition",
    "if_not": "$> dependency|first()",
    "then": {
      "log": {
        "msg": "$> 'No data found. Aborting ...'"
      }
    },
    "stop": true
  },
  {
    "rule": "always",
    "then": {
      "trigger": {
        "command": "CommandName",
        "mapping": {
          "id": "$> dependency|first()|get('id')"
        }
      }
    }
  }
]
```

### Pattern 2: User Lookup with Validation

```cody-rules
[
  {
    "rule": "always",
    "then": {
      "lookup": {
        "users": {
          "filter": {
            "eq": {
              "prop": "attributes.location",
              "value": "$> event.locationId"
            }
          },
          "variable": "userMatch"
        }
      }
    }
  },
  {
    "rule": "always",
    "then": {
      "assign": {
        "variable": "targetUser",
        "value": "$> userMatch|first()"
      }
    }
  },
  {
    "rule": "condition",
    "if_not": "$> targetUser",
    "then": {
      "log": {
        "msg": "$> 'No user found. Aborting ...'"
      }
    },
    "stop": true
  },
  {
    "rule": "always",
    "then": {
      "trigger": {
        "command": "SendNotification",
        "mapping": {
          "to": "$> targetUser.userId"
        }
      }
    }
  }
]
```

### Pattern 3: Duplicate Prevention

```cody-rules
[
  {
    "rule": "condition",
    "if": "$> existingReminder|first()",
    "then": {
      "execute": {
        "rules": [
          {
            "rule": "always",
            "then": {
              "assign": {
                "variable": "existingDate",
                "value": "$> existingReminder|first()|get('plannedFor')|isoDate()"
              }
            }
          },
          {
            "rule": "condition",
            "if": "$> existingDate == targetDate",
            "then": {
              "log": {
                "msg": "$> 'Reminder already scheduled. Aborting ...'"
              }
            },
            "stop": true
          }
        ]
      }
    }
  }
]
```

### Pattern 4: For Each Cleanup

```cody-rules
[
  {
    "rule": "condition",
    "if_not": "$> items|first()",
    "then": {
      "log": {
        "msg": "$> 'No items to process. Aborting ...'"
      }
    },
    "stop": true
  },
  {
    "rule": "always",
    "then": {
      "forEach": {
        "variable": "items",
        "then": {
          "trigger": {
            "command": "CleanupCommand",
            "mapping": {
              "id": "$> item|get('id')"
            }
          }
        }
      }
    }
  }
]
```

### Pattern 5: Conditional Notification Scheduling

```cody-rules
[
  {
    "rule": "always",
    "then": {
      "trigger": {
        "command": "SendNotification",
        "mapping": {
          "notificationId": "$> uuid()",
          "severity": "$> 'success'",
          "tag": "$> 'immediate-notification'",
          "msg": "$> 'Immediate message'",
          "to": "$> userId",
          "plannedFor": "$> eventCreatedAt|isoDateTime()"
        }
      }
    }
  },
  {
    "rule": "always",
    "then": {
      "trigger": {
        "command": "SendNotification",
        "mapping": {
          "notificationId": "$> uuid()",
          "severity": "$> 'warning'",
          "tag": "$> 'follow-up-reminder'",
          "msg": "$> 'Follow-up message'",
          "to": "$> userId",
          "plannedFor": "$> eventCreatedAt|addDays(1)|isoDateTime()"
        }
      }
    }
  }
]
```

---

## Best Practices

1. **Always validate dependencies exist** before using them
2. **Use `stop: true`** after abort conditions to prevent further execution
3. **Log meaningful messages** for debugging and monitoring
4. **Use unique tags** for notifications to enable deduplication
5. **Schedule reminders at appropriate times** (e.g., `T07:00:00.000Z` for morning)
6. **Handle missing users gracefully** with log messages
7. **Use `forEach` for batch operations** on multiple items
8. **Check for existing reminders** before scheduling duplicates
9. **Use severity levels appropriately** (success, info, warning, error)
10. **Document automation purpose** in the description field
