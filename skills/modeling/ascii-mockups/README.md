# ASCII Mockups

> Create text-based UI wireframes directly in prooph board element descriptions.

## Overview

ASCII Mockups let you document UI layouts using plain text characters. Instead of images or design files, the mockup is written directly in the element description as a code block — visible and editable on the canvas itself.

This skill teaches AI agents how to create effective ASCII mockups for UI elements in your Event Models.

## Pros and Cons

### Advantages

- **Plain text** — Mockups live directly on UI elements in prooph board. Anyone can read and edit them without leaving the canvas.
- **Cheap to create** — ASCII mockups consume very few tokens, making them efficient for AI agents to generate during modeling sessions.
- **No external tools needed** — No image files, no design software, no upload steps. Everything stays in one place.
- **Version control friendly** — Since they're plain text, changes are tracked in the model history just like any other text content.

### Disadvantages

- **Technical appearance** — Text-based mockups look more like developer artifacts than polished wireframes. They may feel out of place for non-technical stakeholders.
- **Canvas space** — ASCII mockups take up room in the element description, which can make the Event Model harder to navigate when zooming out. Use them when the detail matters, not for every UI element.

## When to Use

| ✅ Use ASCII Mockups | ❌ Use Alternatives |
|---|---|
| Documenting UI states in the flow | High-fidelity design reviews |
| Quick layout references for developers | Presenting to external stakeholders |
| Keeping everything in one place | Complex visual designs with many details |

## Usage

Once installed, your AI agent will know how to create ASCII mockups for UI elements. The mockups are written in the element description using `bash` code blocks:

````markdown
## ASCII Mockup

```bash
┌─────────────────────────────────────┐
│  Dashboard                          │
├─────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐         │
│  │  Stats   │  │  Charts  │         │
│  └──────────┘  └──────────┘         │
└─────────────────────────────────────┘
```
````

### Examples

<!-- Add screenshots here -->

<!-- Example 1: Simple state mockup -->
<!-- ![Simple ASCII mockup](_assets/example-simple.png) -->

<!-- Example 2: Dashboard mockup -->
<!-- ![Dashboard ASCII mockup](_assets/example-dashboard.png) -->

<!-- Example 3: State variation mockup -->
<!-- ![State variation ASCII mockup](_assets/example-states.png) -->

## Tips

- Keep mockups simple — focus on layout and key elements, not pixel-perfect details
- Use consistent styling across all mockups in your model
- Document state variations when the UI changes significantly based on data
