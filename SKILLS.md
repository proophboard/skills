# prooph board AI Agent Skills

A collection of AI agent skills for [prooph board](https://flow.prooph-board.com) that enable AI agents connected via the prooph board MCP server to support users in Event Modeling and optionally Cody Engine development.

## Skill Categories

### Event Modeling Skills

Skills for creating and working with event models on prooph board.

| Skill | Description | Path |
|-------|-------------|------|
| [Event Modeling](skills/modeling/event-modeling/) | Core event modeling guidelines and best practices | `skills/modeling/event-modeling/` |
| [Element Description](skills/modeling/element-description/) | Writing effective local element descriptions | `skills/modeling/element-description/` |
| [Slice Scenarios](skills/modeling/slice-scenarios/) | Given-When-Then scenario documentation for slices | `skills/modeling/slice-scenarios/` |

### Code Generation Skills

Skills that generate code from prooph board Event Modeling slices for specific languages and frameworks.

| Skill | Description | Path |
|-------|-------------|------|
| [Axon 5 Kotlin — Write Slice](skills/code-gen/axon5kotlin/write-slice/) | Generate Kotlin write slices (Command → decide → Events → evolve → State) for Axon Framework 5 | `skills/code-gen/axon5kotlin/write-slice/` |
| [Axon 5 Kotlin — Read Slice](skills/code-gen/axon5kotlin/read-slice/) | Generate Kotlin read slices (projection + query handler + REST + tests) for Axon Framework 5 | `skills/code-gen/axon5kotlin/read-slice/` |
| [Axon 5 Kotlin — Automation Slice](skills/code-gen/axon5kotlin/automation-slice/) | Generate Kotlin automation slices (event → command via CommandDispatcher) for Axon Framework 5 | `skills/code-gen/axon5kotlin/automation-slice/` |

### Cody Engine Skills

Skills specifically designed for working with the [Cody Engine](https://github.com/proophboard/cody-engine) in combination with prooph board.

*Only recommended for users already familiar with Cody Engine as a low-code event sourcing runtime*

| Skill | Description | Path |
|-------|-------------|------|
| [Command](skills/cody/command/) | Command element details specification | `skills/cody/command/` |
| [Event](skills/cody/event/) | Event element details specification | `skills/cody/event/` |
| [Information](skills/cody/information/) | Information element details specification | `skills/cody/information/` |
| [Automation](skills/cody/automation/) | Automation element details specification | `skills/cody/automation/` |
| [UI](skills/cody/ui/) | UI element (page/screen) details specification | `skills/cody/ui/` |

## Installation

### For AI Agents

AI agents that support skill loading (e.g., Cursor, Claude Code, Aider) can install skills by:

1. **Manual Copy**: Copy the desired skill package directory into your agent's skills folder
2. **Symlink**: Create a symlink to the skill package (for development)
3. **Full Install**: Clone this repository and point your agent to the `skills/` directory

### For Users

Users should:

1. Download or clone this repository
2. Identify the skills relevant to their use case
3. Copy the skill package to their AI agent's skills directory
4. Follow the agent-specific instructions to load the skill

## Skill Package Structure

Each skill package follows this structure:

```
skills/
├── [category]/
│   └── [skill-name]/
│       ├── SKILL.md      # Main skill documentation (required)
│       └── skill.json    # Metadata (required)
```

### skill.json Format

```json
{
  "name": "skill-name",
  "version": "1.0.0",
  "description": "Brief description of the skill",
  "category": "category-name",
  "dependencies": ["proophboard-mcp"],
  "elementTypes": ["command", "event", "information"],
  "authors": ["prooph software GmbH"],
  "license": "MIT"
}
```

## Prerequisites

- A prooph board account and workspace
- An AI agent that connects to the [prooph board MCP server](https://flow.prooph-board.com/docs/mcp-server)
- Basic understanding of [Event Modeling concepts](https://eventmodeling.org/posts/what-is-event-modeling/)

## License

MIT
