# Cody UI Skill - UI Element Details Specification

This document describes the structure and patterns for creating UI element details in the Cody/prooph board system.

## Overview

UI elements in this system represent **pages/screens** in the application. Each UI element's details contain structured markdown with code blocks that define:

1. **Page Metadata** - Route, breadcrumb, title, parent relationships
2. **Sidebar Configuration** - Navigation menu entry (for top-level pages)
3. **Views Configuration** - Data views and their UI schemas
4. **Actions/Commands** - Buttons and interactions available on the page

---

## Structure Template

```markdown
## [Page Type]

```cody-metadata
{
  "route": "/path/to/page",
  "breadcrumb": "Display Name",
  "title": "Page Title",
  "parent": "parentId",
  "type": "dialog",
  "mainPage": "ParentPageName"
}
```

## Sidebar (Top-Level Pages Only)

```cody-sidebar
{
  "label": "Menu Label",
  "icon": "icon-name",
  "position": 5,
  "hidden:expr": "$> !user|role('KL')"
}
```

## Views

```cody-views
[
  "ViewName",
  {
    "view": "ViewName",
    "type": "form",
    "loadState": false,
    "data": {},
    "uiSchema": {}
  }
]
```

## Actions

```cody-commands
[
  {
    "type": "command",
    "command": "CommandName",
    "position": "top-right",
    "button": {},
    "data": {},
    "uiSchema": {}
  }
]
```

---

## Detailed Specifications

### 1. Cody Metadata

**Required for all pages**

```cody-metadata
{
  "route": "string - URL path with optional path parameters (e.g., /leads/:leadId)",
  "breadcrumb": "string - Display name in breadcrumb navigation",
  "title": "string - Page title (can use expr for dynamic titles)",
  "parent": "string (optional) - Parent page ID for nested pages",
  "type": "dialog (optional) - Opens as dialog instead of full page",
  "mainPage": "string (optional) - Parent page to return to after dialog"
}
```

**Examples:**

```cody-metadata
{
  "route": "/website/:locationId/contact-form-step-1",
  "breadcrumb": "Contact / Step 1",
  "title": ""
}
```

```cody-metadata
{
  "parent": "hziMHJ7RyHZ8SuKkN7JXvs",
  "route": "/leads/:leadId",
  "breadcrumb": "Lead Details"
}
```

```cody-metadata
{
  "title:expr": "$> 'Phone: ' + page|data('/App/Lead')|get('phone', 'No phone number')",
  "route": "/leads/:leadId/call",
  "breadcrumb": "Lead Call",
  "type": "dialog",
  "mainPage": "LeadDetails"
}
```

---

### 2. Cody Sidebar

**For top-level pages only** - defines navigation menu entry

```cody-sidebar
{
  "label": "string - Menu item label",
  "icon": "string - Icon name (e.g., 'account-group-outline', 'file-sign', 'web')",
  "position": "number (optional) - Menu position order",
  "hidden:expr": "string (optional) - Expression to conditionally hide"
}
```

**Examples:**

```cody-sidebar
{
  "label": "Leads",
  "icon": "account-group-outline",
  "hidden:expr": "$> !user|role('KL')"
}
```

```cody-sidebar
{
  "label": "Website",
  "icon": "web"
}
```

```cody-sidebar
{
  "label": "Contracts",
  "icon": "file-sign",
  "position": 5,
  "hidden:expr": "$> !user|role('KL')"
}
```

---

### 3. Cody Views

**Defines data views and their presentation**

#### Simple View Reference

```cody-views
[
  "ViewName"
]
```

#### View with Configuration

```cody-views
[
  {
    "view": "ViewName",
    "type": "form",
    "loadState": false,
    "data": {
      "field": "$> uuid()",
      "field2": "$> routeParams.id"
    },
    "uiSchema": {
      "ui:title": "Form Title",
      "fieldName": {
        "ui:widget": "hidden"
      }
    }
  }
]
```

#### View with Conditional Visibility

```cody-views
[
  {
    "view": "ViewName",
    "hidden": true
  },
  {
    "view": "ConditionalView",
    "hidden:expr": "$> page|data('/App/SomeData', [])|count() == 0"
  },
  {
    "view": "MainView",
    "uiSchema": {
      "fieldName": {
        "ui:widget": "hidden"
      },
      "listField": {
        "items": {
          "ui:title:expr": "$> value|get('firstName')",
          "ui:options": {
            "actions": [
              {
                "type": "command",
                "command": "ActionCommand",
                "button": {
                  "icon": "file-sign",
                  "label": "Action"
                },
                "position": "bottom-left"
              }
            ]
          }
        }
      }
    }
  }
]
```

#### List View with Custom Styling

```cody-views
[
  {
    "view": "Locations",
    "type": "list",
    "uiSchema": {
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
  }
]
```

---

### 4. Cody Commands (Actions)

**Defines buttons and interactions on the page**

#### Command Button

```cody-commands
[
  {
    "type": "command",
    "command": "CommandName",
    "position": "top-right | bottom-left | bottom-right",
    "data": {
      "field": "$> routeParams.id",
      "field2": "$> page|data('/App/View', {})|get('property')"
    },
    "button": {
      "label": "Button Label",
      "icon": "icon-name",
      "variant": "outlined | text | contained",
      "color": "success | error | secondary",
      "hidden:expr": "$> condition"
    },
    "uiSchema": {
      "ui:form": {
        "successRedirect": {
          "page": "TargetPage",
          "mapping": {
            "field": "$> data.field"
          }
        }
      }
    },
    "connectTo": "/App/Form/Path",
    "directSubmit": true
  }
]
```

#### Link Button

```cody-commands
[
  {
    "type": "link",
    "pageLink": "TargetPageName",
    "position": "bottom-left",
    "button": {
      "label": "Skip",
      "variant": "outlined",
      "color": "secondary"
    }
  }
]
```

#### Link with Data Mapping

```cody-commands
[
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
```

---

## Button Properties

| Property | Values | Description |
|----------|--------|-------------|
| `label` | string | Button text |
| `icon` | string | Icon name (e.g., `phone`, `send`, `plus`, `pencil`) |
| `variant` | `contained`, `outlined`, `text` | Button style |
| `color` | `default`, `success`, `error`, `secondary` | Button color |
| `hidden:expr` | expression | Condition to hide button |
| `disabled:expr` | expression | Condition to disable button |

---

## Position Values

- `top-right` - Primary actions (create, edit, add)
- `bottom-left` - Primary submit/continue actions
- `bottom-right` - Secondary actions (change, move)

---

## Expression Syntax

Expressions use `$>` prefix and pipe operators:

```
$> page|data('/App/Lead', {})|get('phone', 'default')
$> user|role('KL')
$> data|attr('location')
$> uuid()
$> now()|isoDateTime()
$> value|get('firstName')
$> theme.spacing|call(2)
```

---

## Page Types

### Top-Level Page

- Has sidebar configuration
- Route starts at root (e.g., `/location/leads`)
- Appears in main navigation

```markdown
## Top-Level Page

```cody-metadata
{
  "route": "/location/leads",
  "title": "Leads",
  "breadcrumb": "Leads"
}
```

## Sidebar

```cody-sidebar
{
  "label": "Leads",
  "icon": "account-group-outline"
}
```
```

### Sub-Level Page

- Has parent reference
- Nested route (e.g., `/leads/:leadId`)
- No sidebar configuration

```markdown
## Sub-Level Page

```cody-metadata
{
  "parent": "parentId",
  "route": "/leads/:leadId",
  "breadcrumb": "Lead Details"
}
```
```

### Dialog Page

- Opens as modal dialog
- Has `type: "dialog"` and `mainPage` reference
- Returns to main page after action

```markdown
## Sub-Level Page

```cody-metadata
{
  "title:expr": "$> 'Phone: ' + page|data('/App/Lead')|get('phone')",
  "route": "/leads/:leadId/call",
  "breadcrumb": "Lead Call",
  "type": "dialog",
  "mainPage": "LeadDetails"
}
```
```

---

## Complete Examples

### Example 1: Top-Level List Page

```markdown
## Top-Level Page

```cody-metadata
{
  "route": "/location/leads",
  "title": "Leads",
  "breadcrumb": "Leads"
}
```

## Sidebar

```cody-sidebar
{
  "label": "Leads",
  "icon": "account-group-outline",
  "hidden:expr": "$> !user|role('KL')"
}
```

## Views

```cody-views
[
  "MyLocationLeads"
]
```

## Actions

```cody-commands
[
  {
    "type": "command",
    "command": "EnterLeadManually",
    "data": {
      "leadId": "$> uuid()",
      "locationId": "$> user|attr('location')",
      "status": "$> 'new'",
      "inquirySubmittedAt": "$> now()|isoDateTime()"
    },
    "position": "top-right",
    "button": {
      "label": "Lead",
      "icon": "plus"
    }
  }
]
```
```

### Example 2: Detail Page with List Actions

```markdown
## Sub-Level Page

```cody-metadata
{
  "parent": "hziMHJ7RyHZ8SuKkN7JXvs",
  "route": "/leads/:leadId",
  "breadcrumb": "Lead Details"
}
```

## Views

```cody-views
[
  {
    "view": "SimilarParentsForLead",
    "hidden": true
  },
  {
    "view": "SimilarParentsHint",
    "hidden:expr": "$> page|data('/App/SimilarParentsForLead', [])|count() == 0 || page|data('/App/Lead')|get('existingParent')"
  },
  {
    "view": "Lead",
    "uiSchema": {
      "children": {
        "items": {
          "ui:title:expr": "$> value|get('firstName')",
          "firstName": {
            "ui:widget": "hidden"
          },
          "ui:options": {
            "actions": [
              {
                "type": "command",
                "command": "AddContract",
                "data": {
                  "contractId": "$> uuid()",
                  "locationId": "$> data.locationId",
                  "leadId": "$> data.leadId"
                },
                "button": {
                  "icon": "file-sign",
                  "label": "Contract",
                  "variant": "outlined",
                  "style": {
                    "marginTop": 2
                  }
                },
                "position": "bottom-left"
              }
            ]
          }
        }
      }
    }
  }
]
```

## Actions

```cody-commands
[
  {
    "type": "link",
    "pageLink": "LeadCall",
    "position": "bottom-left",
    "button": {
      "icon": "phone",
      "label": "Call"
    }
  },
  {
    "type": "command",
    "command": "DocumentViewingAppointment",
    "data": {
      "leadId": "$> routeParams.leadId",
      "notes": "$> page|data('/App/Lead', {})|get('viewingAppointment.notes')"
    },
    "position": "bottom-left",
    "button": {
      "icon": "eye",
      "label": "Document Viewing Appointment",
      "disabled:expr": "$> !page|data('/App/Lead')|get('viewingAppointment.at', false)"
    }
  },
  {
    "type": "command",
    "command": "MoveLeadToOtherLocation",
    "position": "bottom-right",
    "data": {
      "leadId": "$> routeParams.leadId",
      "locationId": "$> page|data('/App/Lead')|get('locationId')"
    },
    "button": {
      "variant": "outlined",
      "icon": "map-marker-right-outline",
      "label": "Change Location"
    }
  },
  {
    "type": "command",
    "command": "EnrichLeadInformation",
    "position": "top-right",
    "button": {
      "icon": "pencil"
    },
    "data": "$> page|data('/App/Lead', {})"
  },
  {
    "type": "command",
    "command": "AbandonLead",
    "position": "top-right",
    "button": {
      "icon": "account-cancel",
      "variant": "text",
      "color": "error"
    },
    "data": {
      "leadId": "$> routeParams.leadId"
    }
  }
]
```
```

### Example 3: Form Page with Redirect

```markdown
## Sub-Level Page

```cody-metadata
{
  "route": "/website/:locationId/contact-form-step-1",
  "breadcrumb": "Contact / Step 1",
  "title": ""
}
```

## Views

```cody-views
[
  {
    "type": "form",
    "view": "LeadFormStep1",
    "loadState": false,
    "data": {
      "leadId": "$> uuid()",
      "locationId": "$> routeParams.locationId"
    },
    "uiSchema": {
      "ui:title": "Contact Form | Step 1",
      "locationId": {
        "ui:widget": "hidden"
      },
      "termsAccepted": {
        "ui:title": "Terms and Conditions"
      }
    }
  }
]
```

## Actions

```cody-commands
[
  {
    "type": "command",
    "command": "SubmitLead",
    "connectTo": "/App/LeadFormStep1/Form",
    "button": {
      "label": "Continue with step 2",
      "icon": "send"
    },
    "position": "bottom-left",
    "uiSchema": {
      "ui:form": {
        "successRedirect": {
          "page": "ContactFormStep2",
          "mapping": {
            "locationId": "$> routeParams.locationId",
            "leadId": "$> data.leadId"
          }
        }
      }
    }
  }
]
```
```

### Example 4: Dialog Page

```markdown
## Sub-Level Page

```cody-metadata
{
  "title:expr": "$> 'Phone: ' + page|data('/App/Lead')|get('phone', 'No phone number')",
  "route": "/leads/:leadId/call",
  "breadcrumb": "Lead Call",
  "type": "dialog",
  "mainPage": "LeadDetails"
}
```

## Views

```cody-views
[
  {
    "view": "Lead",
    "hidden": true
  }
]
```

## Actions

```cody-commands
[
  {
    "type": "command",
    "command": "DocumentSuccessfulLeadCall",
    "position": "bottom-left",
    "button": {
      "icon": "phone-check-outline",
      "label": "reached",
      "color": "success"
    },
    "uiSchema": {
      "ui:form": {
        "successRedirect": "LeadDetails"
      }
    },
    "data": "$> page|data('/App/Lead', {})"
  },
  {
    "type": "command",
    "command": "TrackLeadNotReached",
    "directSubmit": true,
    "data": {
      "leadId": "$> routeParams.leadId"
    },
    "position": "bottom-left",
    "button": {
      "icon": "phone-cancel-outline",
      "label": "Not Reached",
      "variant": "outlined",
      "color": "error"
    },
    "uiSchema": {
      "ui:form": {
        "successRedirect": "LeadDetails"
      }
    }
  }
]
```
```

---

## Common Icon Names

- `phone` - Phone call actions
- `send` - Submit/send actions
- `plus` - Add/create actions
- `pencil` - Edit actions
- `file-sign` - Contract/document actions
- `eye` - View/preview actions
- `account-cancel` - Cancel/reject actions
- `phone-check-outline` - Successful call
- `phone-cancel-outline` - Failed call
- `map-marker-right-outline` - Location/move actions
- `web` - Website
- `account-group-outline` - Users/groups

---

## Widget Types

- `hidden` - Hidden field
- `textarea` - Multi-line text input
- `DataSelect` - Dropdown with data source
- `default` - Standard input based on field type

---

## UI Schema Options

### Field Level

```json
{
  "fieldName": {
    "ui:title": "Custom Label",
    "ui:widget": "hidden",
    "ui:readonly": true,
    "ui:options": {
      "rows": 5
    }
  }
}
```

### List Items

```json
{
  "listField": {
    "items": {
      "ui:title:expr": "$> value|get('name')",
      "ui:options": {
        "actions": [...]
      }
    }
  }
}
```

### Form Level

```json
{
  "ui:title": "Form Title",
  "ui:form": {
    "successRedirect": {
      "page": "TargetPage",
      "mapping": {...}
    }
  }
}
```

---

## Data Binding Patterns

### Route Parameters

```
$> routeParams.leadId
$> routeParams.locationId
```

### Page Data

```
$> page|data('/App/Lead', {})
$> page|data('/App/Lead')|get('phone', 'default')
```

### User Data

```
$> user|role('KL')
$> user|attr('location')
```

### Generated Values

```
$> uuid()
$> now()|isoDateTime()
```

### Data Transformation

```
$> data|set('status', 'new')
$> value|get('firstName')
```

---

## Checklist for Creating New UI Elements

- [ ] Determine page type (Top-Level, Sub-Level, Dialog)
- [ ] Define route with path parameters
- [ ] Set breadcrumb navigation
- [ ] Add parent reference (for sub-level pages)
- [ ] Configure sidebar (for top-level pages)
- [ ] Define views and their data sources
- [ ] Configure UI schemas for forms/lists
- [ ] Add action buttons with appropriate positions
- [ ] Configure button properties (icon, label, variant, color)
- [ ] Set up success redirects for forms
- [ ] Add conditional visibility expressions where needed
