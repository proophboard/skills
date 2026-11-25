# HTML Wireframes

> Create focused, realistic HTML wireframes for prooph board UI elements.

## Overview

HTML Wireframes teaches AI agents how to create and maintain HTML wireframes for UI elements in prooph board. A wireframe is a communication tool, not a mandatory artifact — it clarifies what a user sees, decides, or does during a process step.

Unlike visual wireframes (SVG) or ASCII mockups, HTML wireframes are interactive and run in the browser. They support:

- **Static preview:** Works in Presentation Mode or normal HTML Preview
- **Exploration Mode:** Displays runtime data via `{{ state.Context.Element }}` expressions
- **User input:** Captures form or click data via `window.storage.save(...)`

This skill is ideal for prototyping interactions, demonstrating state variations, and showing users exactly how a feature will work.

## Pros and Cons

### Advantages

- **Interactive preview** — HTML wireframes run in the browser, showing real behavior (form submission, click handlers) during Exploration Mode.
- **Runtime-aware** — Display live data from your event model using expressions like `{{ state.TodoManagement.Todo.title }}`.
- **Reusable components** — Shared HTML snippets (CSS, JavaScript, components) can be imported into multiple wireframes.
- **Accessible by default** — Semantic HTML, visible labels, native controls, and keyboard navigation work out of the box.
- **Realistic feedback** — Users see and interact with something that feels like the final product, not a sketch or text diagram.

### Disadvantages

- **Higher cognitive load** — Agents must balance HTML structure, CSS styling, JavaScript behavior, and runtime integration.
- **Runtime-specific features** — Exploration Mode capabilities (`window.storage`, `{{ ... }}` expressions) are unavailable in Presentation Mode, requiring graceful fallbacks.
- **More complex than ASCII** — Unlike plain-text ASCII mockups, HTML requires proper escaping, safe string interpolation, and defensive JavaScript.

## When to Use

| ✅ Use HTML Wireframes | ❌ Use Alternatives                                     |
|---|--------------------------------------------------------|
| Demonstrating form submission and user input | Quick documentation during early modeling              |
| Showing state variations with live data | Token budget is limited                                |
| Prototyping interactions (buttons, selects, modals) | Early-stage presentations (use SVG wireframes)         |
| Exploring runtime data flow in Exploration Mode | Internal technical discussions (ASCII mockups suffice) |
| Sharing reusable styles or components | Simple state documentation                             |

## Comparison: Wireframe Types

| Feature | HTML Wireframes                                  | SVG Wireframes                                  | ASCII Mockups |
|---|--------------------------------------------------|-------------------------------------------------|---|
| **Appearance** | Realistic, interactive UI                        | Hand-drawn, professional graphics               | Text-based |
| **Interactivity** | Full (JavaScript + `window.storage`)             | None (static image)                             | None (static text) |
| **Runtime data** | Yes (`{{ state... }}`)                           | No                                              | No |
| **Token cost** | Medium-High                                      | High (500-2000+ tokens)                         | Low (50-200 tokens) |
| **Editability** | Generate with AI, edit in integrated HTML Editor | Regenerate and re-upload                        | Edit directly on canvas |
| **Best for** | Interactive prototyping, state demos             | early Stakeholder presentations | Developers, quick docs |
| **Browser preview** | Yes (runs HTML)                                  | Yes (renders SVG)                               | Yes (code block) |

## Usage

Once installed, your AI agent will know how to:

1. Create focused, realistic HTML wireframes for UI elements
2. Use shared HTML snippets for reusable CSS, JavaScript, or components
3. Display runtime data via `{{ state.Context.Element }}` expressions
4. Capture user input via `window.storage.save({...})` (Exploration Mode only)
5. Provide graceful fallbacks when runtime is unavailable

### HTML Snippets

Shared snippets are reusable HTML fragments available across your workspace. A snippet can be imported into any HTML wireframe:

```html
<!-- @import snippet-slug -->
```

Snippets can contain:

- **Shared design system:** CSS in a `<style>` tag (button styles, layout utility classes)
- **Shared behavior:** JavaScript functions in a `<script>` tag
- **Reusable components:** HTML fragments imported into multiple wireframes

Use snippets pragmatically — create one only when genuinely reusable. Keep step-specific wireframes self-contained.

### Runtime Data Expressions

In Exploration Mode, wireframes can display current runtime data:

```html
<span>{{ state.TodoManagement.Todo.title }}</span>
```

**Always provide static fallback content.** Runtime expressions are replaced with empty strings if unresolved, so write defensive HTML that remains useful without the runtime.

### Safely Reading Structured Values

For arrays or objects, parse runtime JSON defensively:

```html
<script>
  const rawTodos = '{{ state.TodoManagement.TodoList }}';
  let todos = [];

  try {
    const parsed = JSON.parse(rawTodos);
    if (Array.isArray(parsed)) {
      todos = parsed;
    }
  } catch (error) {
    // Keep static fallback (empty list)
  }
</script>
```

### Capturing User Input

Use `window.storage.save({...})` to capture form or click data in Exploration Mode:

```html
<script>
  function handleSubmit() {
    if (window.storage && typeof window.storage.save === 'function') {
      window.storage.save({
        title: document.getElementById('title').value,
        until: document.getElementById('until').value
      });
    }
  }
</script>
```

Guard all calls — `window.storage` is unavailable in Presentation Mode.

## Examples

### Focused Wireframe for a Process Step

```html
<div class="ui-card">
  <h2>Set Todo Deadline</h2>
  <form onsubmit="handleSubmit(event)">
    <label for="title">Todo Title</label>
    <input id="title" type="text" placeholder="e.g., Submit report">

    <label for="until">Deadline</label>
    <input id="until" type="date">

    <button type="submit">Set Deadline</button>
  </form>
</div>
```

### With Runtime Data and Fallback

```html
<div class="ui-card">
  <h2>{{ title || 'Set Todo Deadline' }}</h2>
  <p>{{ description || 'Enter a title and deadline for your todo.' }}</p>

  <form onsubmit="handleSubmit(event)">
    <label for="title">Todo Title</label>
    <input id="title" type="text" value="{{ title || '' }}">

    <label for="until">Deadline</label>
    <input id="until" type="date">

    <button type="submit">Set Deadline</button>
  </form>
</div>
```

### Shared Snippet (CSS Styles)

**Snippet name:** `ui-card-styles`

```html
<style>
  .ui-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 24px;
    max-width: 500px;
    margin: 0 auto;
  }
  .ui-card h2 {
    margin-top: 0;
    font-size: 20px;
    color: #333;
  }
  .ui-card label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
  }
  .ui-card input {
    width: 100%;
    padding: 10px;
    margin-bottom: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .ui-card button {
    width: 100%;
    padding: 10px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .ui-card button:hover {
    background-color: #2980b9;
  }
</style>
```

Then import into a wireframe:

```html
<!-- @import ui-card-styles -->

<div class="ui-card">
  <h2>Set Todo Deadline</h2>
  <!-- ... -->
</div>
```

## Example

![HTML Wireframe in Exploration Mode](_assets/html_wireframe_in_exploartion_mode.png)

## Final Check

Before considering a wireframe complete:

- [ ] It clarifies a real user experience or process step
- [ ] Existing snippets, design conventions, and relevant wireframes were checked first
- [ ] Shared snippets are used where they add value, without unnecessary abstraction
- [ ] The interface is focused on the current step
- [ ] Runtime expressions have useful static fallbacks
- [ ] Structured runtime values are parsed defensively
- [ ] Runtime-derived text is safely rendered
- [ ] Every `window.storage.save(...)` call is guarded
- [ ] Previewing without the runtime does not produce errors
- [ ] Interactions communicate the step and capture needed input
- [ ] The HTML remains lightweight, accessible, and understandable
