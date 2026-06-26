---
layout: default
title: Schema
toc_order: 06
---

[Commands]({{site.baseUrl}}/event_storming/basic-concepts.html#command), [Events]({{site.baseUrl}}/event_storming/basic-concepts.html#event) and [Information]({{site.baseUrl}}/event_storming/basic-concepts.html#information)
can have a schema defined in the [Metadata]({{site.baseUrl}}/board_workspace/Metadata.html).

A schema describes the data structure associated with one of these types. Schema definitions play a central role when developing prototypes with [Cody Play]({{site.baseUrl}}/cody_play/a-playground-for-your-design.html)
and applications with prooph board [Cody]({{site.baseUrl}}/cody/introduction.html).

## Command Schema

Users create, update, or delete information in a system by entering information in a form and triggering an action.
Form fields are rendered based on a command schema and the server uses the command schema to validate incoming data.

## Event Schema

All information is stored as a series of events in an event store. Each event has a name, a unique event id, a created timestamp, and information attached. The information is described by the schema.

_Additionally, events have metadata which are system information in a key-value format._

## Information Schema

Information schema is used to automatically render views for certain information and to ensure that information always has the desired structure.

## JSON Schema

Cody Play/Engine uses [JSON Schema Draft-07](https://json-schema.org/draft-07) for schema definition.

You can describe complex data structures along with rich validation rules in JSON Schema. Since Cody Play/Engine is based on JavaScript, JSON Schema is a perfect match.
Open Source libraries like [React JSON Schema Form](https://rjsf-team.github.io/react-jsonschema-form/docs/){: .alert-link} provide powerful tools on top of JSON Schema.
{: .alert .alert-info}

## Shorthand JSON Schema

A drawback of JSON Schema is its own schema 🙃. It's a bit complicated to write JSON Schema, and it takes too much time. To get around the issue, prooph board supports a shortened and simplified
syntax that is translated by Cody.

Shorthand JSON Schema covers the most common use cases. If you need advanced JSON Schema validation rules like IF-THEN-ELSE, you have to write the schema in normal JSON Schema format. Cody usually detects
a normal JSON Schema automatically. If not, you can set `shorthand: false` as an attribute in the metadata of the element.
{: .alert .alert-warning}

In most cases the schema of a command, event, or information will be either an [object]({{site.baseUrl}}/board_workspace/Schema.html#shorthand-object) or a list also known as [array]({{site.baseUrl}}/board_workspace/Schema.html#shorthand-array) or a [reference]({{site.baseUrl}}/board_workspace/Schema.html#shorthand-reference) to another schema.


### Shorthand Object

Shorthand objects are like JSON objects. You define a key-value-mapping where the key is the property name within the schema and the value is the JSON Schema validation definition of the
format: `[type]|[keyword]:[value]|...`.

#### Optional Properties

Properties are required in the schema, unless they are suffixed with a question mark.

#### Defaults

If required properties are missing, but have a `default` defined, the default is set in the data structure.

#### Title

To set the title of an object use `$title` as a property name.

#### Shorthand Example

```JSON
{
  "$title": "Shortand Object Example",
  "name": "string|minLength:3",
  "age?": "integer|minimum:0|maximum:150",
  "newsletter": "boolean|default:true"  
}
```

#### JSON Schema Equivalent

```JSON
{
  "type": "object",
  "title": "Shortand Object Example",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 3
    },
    "age": {
      "type": "integer",
      "minimum": 0,
      "maximum": 150
    },
    "newsletter": {
      "type": "boolean",
      "default": true
    }
  },
  "required": [
    "name",
    "newsletter"
  ],
  "additionalProperties": false
}
```

#### Additional Properties

As you can see in the example, `additionalProperties` is set to `false` when translating shorthand into JSON Schema. 
A schema should be explicit to avoid surprise.

#### Nesting

Next to scalar types like `string, number, integer, boolean, enum`, a property can also be of type `ojbect, array, or reference`.

##### Nested Object

```JSON
{
  "address": {
    "street": "string",
    "city": "string"
  }
}
```

##### Nested Array

Array with scalar item type:

```JSON
{
  "categories": "string[]"
}
```

or

```JSON
{
  "categories": {
    "$items": "string"
  }
}
```

###### JSON Schema Result

```JSON
{
  "type": "object",
  "properties": {
    "categories": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": ["categories"],
  "additionalProperties": false
}
```

Array with object item type:

```JSON
{
  "addresses": {
    "$items": {
      "street": "string",
      "city": "string"
    }
  }
}
```

###### JSON Schema Result

```JSON
{
  "type": "object",
  "properties": {
    "addresses": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "street": {
            "type": "string"
          },
          "city": {
            "type": "string"
          }
        },
        "required": ["street", "city"],
        "additionalProperties": false
      }
    }
  },
  "required": ["addresses"],
  "additionalProperties": false
}
```

### Shorthand Array

A top level array schema is defined by the special keyword `$items` with its value being the schema definition of the array items.

#### Shorthand Example

```JSON
{
  "$items": "string"
}
```

#### JSON Schema Equivalent

```JSON
{
  "type": "array",
  "items": {"type":  "string"}
}
```
### Shorthand Reference

A schema (or a property of a schema) can reference another schema. So let's say we'ved defined an `Address` schema in the default namespace `App`:

```JSON
{
  "$title": "Address",
  "street": "string",
  "city": "string",
  "zipCode": "string"
}
```

#### JSON Schema Equivalent

```JSON
{
  "title": "Address",
  "type": "object",
  "properties": {
    "street": {"type": "string"},
    "city": {"type": "string"},
    "zipCode": {"type": "string"}
  },
  "required": ["street", "city", "zipCode"],
  "additionalProperties": false,
  "$id": "/definitions/app/address"
}
```

_Please Note: The `$id` property is automatically added by Cody while translating Shorthand into JSON Schema using the namespace and name of the information card._


Now we want to define an `AddressList` schema and reference the already defined `Address` schema:

```JSON
{
  "$items": {
    "$ref": "/App/Address"
  }
}
```

References are indicated by the special keyword `$ref` and point to another schema by using namespace + information name.

#### JSON Schema Equivalent

```JSON
{
  "type": "array",
  "items": {
    "$ref": "#/definitions/app/address"
  },
  "$id": "/definitions/app/address-list"
}
```

The entire schema registration and definition translation is done by Cody in the background. You don't need to worry about that when working with Cody Play/Engine.
And prooph board suggests references of known information schema when writing a schema. Suggestions are shown automatically, but you can also trigger them by pressing `Ctrl+Space`.
{: .alert .alert-info}




