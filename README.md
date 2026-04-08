# prooph board AI Agent Skills

AI agent skills for [prooph board](https://flow.prooph-board.com) - enabling AI agents to support users in Event Modeling.

## Overview

This repository contains skill packages that can be installed to AI agents (Cursor, Claude Code, Aider, etc.) that connect to the prooph board MCP server. 
The skills teach agents how to properly create and work with prooph board elements.

## Available Skills

See [SKILLS.md](SKILLS.md) for the complete list of available skills and their documentation.

### Quick Categories

- **Event Modeling Skills** - Core event modeling guidelines, element descriptions, and slice scenarios
- **Cody Engine Skills** - Technical specifications for Command, Event, Information, Automation, and UI element details

## Installation

1. Clone or download this repository
2. Copy the desired skill package(s) to your AI agent's skills directory
3. Restart or reload your agent to pick up the new skills

For detailed installation instructions, see [SKILLS.md](SKILLS.md).

## Skill Package Structure

Each skill package contains:

```
skill-package/
├── SKILL.md      # Main skill documentation
└── skill.json    # Metadata (name, version, dependencies)
```

## License

MIT 
