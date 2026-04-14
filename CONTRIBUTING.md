# Contributing to prooph board Skills

Thank you for contributing! Whether you're adding a new skill, improving documentation, or fixing a bug, your contribution helps the entire community.

For each accepted skill contribution, you receive **one additional permanent free seat** on your prooph board workspace.

## Adding a New Skill

### 1. Choose a Category

Place your skill in the appropriate category folder:

- `skills/modeling/` — Event Modeling and modeling-related skills
- `skills/code-gen/` — Code Generation skills
- `skills/[new-category]/` — Create a new category folder if needed

### 2. Create the Skill Folder

Create a new folder under the category with a descriptive, hyphenated name:

```
skills/[category]/my-new-skill/
```

### 3. Add Required Files

Every skill requires at minimum:

```
my-new-skill/
├── skill.json    # Metadata (required)
└── SKILL.md      # Agent instructions (required)
└── README.md     # User information
```

#### skill.json

```json
{
  "name": "my-new-skill",
  "version": "1.0.0",
  "description": "Brief description of what the skill does and when to use it.",
  "category": "modeling",
  "dependencies": ["proophboard-mcp"],
  "elementTypes": ["command", "event", "information", "ui", "automation", "hotspot"],
  "tags": ["modeling", "best-practices"],
  "authors": ["Your Name"],
  "license": "MIT"
}
```

**Field reference:**

| Field | Required | Description                                                        |
|-------|----------|--------------------------------------------------------------------|
| `name` | Yes | Hyphenated skill identifier (e.g., `my-new-skill`)                 |
| `version` | Yes | Semantic version (e.g., `1.0.0`)                                   |
| `description` | Yes | Concise description of the skill's purpose                         |
| `category` | Yes | Category folder name (e.g., `modeling`, `code-gen`)                |
| `dependencies` | Yes | Always `["proophboard-mcp"]` for now                               |
| `elementTypes` | Yes | Element types this skill supports (see below)                      |
| `tags` | Yes | Tags used for browsing and filtering on the skills catalog website |
| `authors` | Yes | Author name or organization                                        |
| `license` | Yes | License identifier (e.g., `MIT`)                                   |

**elementTypes:**
- Skills typically list multiple types: `["command", "event", "information", "ui", "automation", "hotspot"]`

#### SKILL.md

The SKILL.md file contains the instructions the AI agent follows when this skill is installed. It should include:

- YAML frontmatter with `name` and `description`
- Clear, actionable guidance for the agent
- Examples and patterns where helpful
- Anti-patterns to avoid

````markdown
---
name: my-new-skill
description: "Short description of the skill's purpose."
---

# My New Skill - Title

Introduction paragraph explaining what this skill teaches the agent.

## Patterns

### Pattern 1: Title

Description of when to use this pattern.

```markdown
Example of what the agent should write.
```

**Use cases:**
- When the user needs X
- When documenting Y
````

## Skill README.md (User-Facing Documentation)

In addition to `SKILL.md`, each skill should have a `README.md` for **human users** browsing the skills catalog website. This is different from `SKILL.md`:

- **SKILL.md** — Agent-facing instructions (detailed, technical, structured for AI consumption)
- **README.md** — User-facing documentation (overview, pros/cons, when to use, examples)

### README.md Structure

````markdown
# Skill Name

> One-sentence description of what the skill does.

## Overview

Explain what the skill does and why it exists.

## Why [Skill Name]

Key benefits for users.

## When to Use

| ✅ Use When | ❌ Skip When |
|---|---|
| Condition A | Condition B |

## Usage

Brief explanation of how the skill works. Include a small code example if applicable.

### Examples

<!-- Add screenshots here -->
<!-- ![Description](_assets/example.png) -->

## Best Practices

Quick tips for getting the most out of the skill.
````

## Adding Screenshots and Assets

Use the `_assets/` folder to store images, screenshots, and videos referenced in your README.md.

### Folder Structure

```
my-new-skill/
├── skill.json
├── SKILL.md
├── README.md
└── _assets/
    ├── example-overview.png
    ├── example-pattern-1.png
    └── demo-video.mp4
```

### Referencing Assets

In your README.md, reference assets with a relative path:

```markdown
![Description](_assets/example-overview.png)
```

**Important:** The `_assets/` folder is:
- **Included** in the website rendering (images appear on the skill detail page)
- **Excluded** from the skill download zip (agents don't need screenshots)

### Image Guidelines

- Use clear, well-lit screenshots from prooph board
- Consider using dark mode screenshots if they match the prooph board aesthetic
- Keep file sizes reasonable (under 500KB when possible)
- Use descriptive filenames: `example-overview.png`, `pattern-write-slice.png`

## Building and Testing Locally

Before submitting a pull request, build and preview the catalog to verify:

1. Your skill renders correctly
2. Tags appear as expected
3. Images display properly
4. The download zip includes the right files

### Prerequisites

- Node.js 18+ installed

### Steps

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Build and serve locally:**

   ```bash
   npm run dev
   ```

   This builds the site and opens it at `http://localhost:3000`.

3. **Verify your skill:**
   - Navigate to your skill on the overview page
   - Check that the description, version, and tags display correctly
   - Click through to the detail page
   - Switch between the **Documentation** and **SKILL.md** tabs
   - Verify images load correctly
   - Test the download button (should download a `.zip` file)

4. **Check tag pages:**
   - Click on your skill's tags to ensure tag pages list your skill correctly

5. **Verify the zip contents:**
   - Download your skill and confirm it contains `skill.json`, `SKILL.md`, and any other agent-relevant files
   - Confirm `README.md` and `_assets/` are **not** included in the zip

### Rebuilding After Changes

```bash
npm run build      # Rebuild only
npm run dev        # Rebuild + serve
npm run serve      # Serve without rebuilding
```

## Pull Request Guidelines

1. **One skill per PR** — Keep PRs focused and easy to review
2. **Include both SKILL.md and README.md** — Both files should be complete
3. **Add screenshots** if your skill benefits from visual examples
4. **Test locally** before submitting — ensure everything renders correctly
5. **Use meaningful tags** — Help users find your skill through the catalog

### Review Checklist

Your PR will be checked for:

- [ ] Valid `skill.json` with all required fields
- [ ] `SKILL.md` with YAML frontmatter (`name` and `description`)
- [ ] `README.md` with user-facing documentation
- [ ] Tags are relevant and useful for browsing
- [ ] Images referenced in README.md exist in `_assets/`
- [ ] No sensitive or private information in the skill content
- [ ] Skill follows the naming and structure conventions

## After Acceptance

Once your skill is merged:

1. We'll contact you for your **prooph board workspace ID**
2. An additional free seat will be added to your workspace
3. Your skill will appear on the public skills catalog at the next deployment

## Questions?

If you have questions about contributing, skill structure, or the review process, open an issue in the repository.
