# prooph board AI Agent Skills

AI agent skills for [prooph board](https://flow.prooph-board.com) - enabling AI agents to support users in Event Modeling.

## Overview

This repository contains skill packages that can be installed to AI agents (Cursor, Claude Code, Aider, etc.) that connect to the prooph board MCP server. 
The skills teach agents how to properly create and work with prooph board elements.

## Available Skills

Browse the skills catalog at [skills.prooph-board.com](https://skills.prooph-board.com).

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

## Contribution

We welcome contributions! Have you developed custom skills for AI agents working on and with prooph board? Share them with the community.

For detailed contribution guidelines — including how to structure a skill, add screenshots, and test locally — see [CONTRIBUTING.md](CONTRIBUTING.md).

### Skill Ideas

Here are some examples of skills the community could benefit from:

- **Code Generation Skills** — Generate code in different languages, frameworks, or runtimes from prooph board models (e.g., TypeScript/Node.js, Python/FastAPI, Java/Spring, Go)
- **Specialized Modeling Skills** — Domain-specific modeling guidelines, pattern libraries, or notation extensions
- **Analysis Skills** — Perform information completeness checks on the model, find accidental complexity, detect coupling issues, or identify bad naming
- **Legacy System Analysis Skills** — Analyze legacy codebases and document findings as chapters on prooph board
- **Ticketing Integration Skills** — Synchronize slices with ticketing systems like Jira, GitHub Issues, Linear, etc.
- **Validation Skills** — Validate models against best practices, naming conventions, or architectural constraints

### How to Contribute

1. **Develop your skill** following the [skill package structure](#skill-package-structure) above
2. **Create a pull request** with your skill package in the appropriate `skills/` subdirectory
3. Ensure your `SKILL.md` is well-documented with examples and your `skill.json` has accurate metadata
4. Wait for review — we'll check quality, relevance, and adherence to conventions

### Reward: Free Workspace Seat

For each accepted and merged skill contribution, you'll receive **one additional permanent free seat** on your prooph board workspace.

After your PR gets accepted, we'll contact you and ask for the workspace ID that should receive the additional seat.

## License

MIT 
