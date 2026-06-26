# Schema

> Add a schema definition to **commands**, **events**, and **information**

## Overview

prooph board provides syntax highlighting and autocomplete for code blocks tagged with `schema`

```schema
{
    "customerId": "string:format:uuid",
    "name": "string|minLength:1",
    "email": "string|format:email",
    "age": "integer:minimum:18",
    "tags": {
        "$items": "string"
    },
    "status": "enum:new,onboarded,archived",
    "address": {
        "street": "string",
        "city": "string",
        "zipCode": "string"
    }    
}
```

The schema is a shortened version of JSON Schema that's easier to read and write. It can be compiled to JSON Schema
using simple translation rules. See [Cody Engine schema compiler](https://github.com/proophboard/cody-engine/blob/main/packages/cody/src/lib/hooks/utils/json-schema/json-schema-from-shorthand.ts) for reference.

This skill instructs an agent to add schema tags to supported elements and derive a schema from example data and the surrounding event modeling context, as well as the user prompt.

## Documentation

For more detailed documentation, you can check the [prooph board v1 wiki](https://wiki.prooph-board.com/board_workspace/Schema.html#shorthand-json-schema)

*Please Note: The link points to the official wiki pages of the old prooph board. prooph board v2 supports the same shorthand schema syntax, but it is fully decoupled from Cody Engine*
