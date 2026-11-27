---
name: html-wireframe
description: Create focused, realistic HTML wireframes for prooph board
  UI elements, including reusable HTML snippets and safe integration
  with Exploration Mode runtime data and user input.
---

# HTML Wireframes

Create and maintain HTML wireframes that clarify a modeled user
experience. A wireframe is a communication tool, not a mandatory
artifact or a standalone application.

## When to use a wireframe

Create or update a wireframe when it meaningfully improves understanding
of what a user sees, decides, or does during a process step. Do not add
wireframes merely to decorate every UI-related element.

Keep each wireframe focused on the current process step. Show the
information and actions relevant to that step rather than implementing a
complete application.

A wireframe may be static. Add interaction only when it helps
communicate or explore the modeled step, such as entering form data,
choosing an option, or demonstrating a meaningful action. Do not
implement business rules, event-apply rules, queries, or other domain
behavior in the wireframe; those belong in the appropriate play
functions and related skills.

## Inspect before creating

Before creating or changing a wireframe:

1.  Inspect the existing HTML snippets and relevant wireframes.
2.  Follow the existing product context, visual conventions, and
    available design system.
3.  Reuse an existing snippet when it fits.
4.  Create or change a snippet only when doing so provides meaningful
    reuse.

Do not invent a new design system when a suitable one already exists. If
the model describes an existing product, reflect its UI conventions. If
it describes a new product, choose a coherent and plausible design.

## HTML snippets

HTML snippets are reusable HTML fragments available across the
workspace. A snippet can be imported into an HTML element using:

``` html
<!-- @import snippet-slug -->
```

A snippet's slug is generated from its name by lowercasing it and
replacing spaces with dashes, unless an explicit slug is supplied.

Snippets can be used for: - **Shared design system:** for example,
reusable CSS in a `<style>` tag. - **Shared behavior:** for example,
reusable JavaScript functions in a `<script>` tag. - **Reusable HTML
components:** fragments imported into multiple wireframes.

Use snippets pragmatically. Prefer an existing snippet or create one
when a shared style, function, or component will genuinely be reused.
Keep simple, step-specific wireframes self-contained. Do not extract
every repeated markup detail or turn the wireframes into an unnecessary
component framework.

## Visual and implementation principles

-   Make the relevant information, user decision, and available actions
    immediately clear.
-   Prefer realistic, focused interfaces over generic boxes and labels.
-   Use plain HTML, CSS, and vanilla JavaScript. Keep the implementation
    lightweight and avoid frameworks or unnecessary dependencies.
-   Use semantic HTML, visible labels, native controls,
    keyboard-accessible interactions, and readable contrast.
-   Ensure the wireframe remains understandable when runtime data is
    unavailable.
-   Do not add controls that do nothing. Every visible interactive
    control should work or be clearly disabled with a reason.
-   Keep behavior limited to presentation and collecting user input for
    the modeled process.
-   Do not put CSS or JavaScript in separate code blocks. Embed style and script
    tags in the html.
-   Add a wireframe html code block always to the description of the UI element.
-   Do not use CSS settings like `m̀ax-width` smaller than 1024px for content containers.
    HTML is rendered into a virtual screen of 1024x768 pixels, then scaled to fit the viewport.

## Runtime data expressions

In Exploration Mode, a wireframe can display current runtime data
through expressions such as:

``` html
<span>{{ state.TodoManagement.Todo.title }}</span>
```

The runtime performs textual substitution of each
`{{ state.Context.Element }}` expression with the current JSON value. If
an expression cannot be resolved, it is replaced with an empty string.

**Never assume the runtime is present.** HTML wireframes can also be
rendered in Presentation Mode and normal HTML Preview, and Exploration
Mode may run before data has been seeded. Always provide useful static
fallback content.

### Safely reading structured values

For arrays or objects, place the expression inside a quoted JavaScript
string, then parse it with guarded error handling. This avoids invalid
JavaScript when the expression is unresolved or substituted with a JSON
value.

For example:

``` html
<script>
  const rawTodos = '{{ state.TodoManagement.TodoList }}';
  let todos = [];

  try {
    const parsed = JSON.parse(rawTodos);
    if (Array.isArray(parsed)) {
      todos = parsed;
    }
  } catch (error) {
    // Keep the static empty-list fallback.
  }
</script>
```

Adapt the fallback to the wireframe. For an object, use a representative
static object; for a list, use a representative list or an empty state.
Render fallback content that still communicates the intended UI.

When displaying runtime-derived text, escape it before inserting it into
HTML. Do not assume runtime values are safe to concatenate into markup.

## Capturing user input

In Exploration Mode, a wireframe can capture form or click data with
`window.storage.save({...})`. The runtime passes the captured data to
the UI element's `interact(storage, state)` play function.

Always guard calls to `window.storage`, because it is not available in
Presentation Mode or normal HTML Preview:

``` js
if (window.storage && typeof window.storage.save === 'function') {
  window.storage.save({
    title: titleInput.value,
    until: untilInput.value
  });
}
```

Capture only the input needed by the modeled interaction. Do not
implement domain behavior in the HTML. For example, a form may capture a
requested title and due date, while validation and business decisions
belong in the appropriate play function or other dedicated skill.

If the runtime is unavailable, the wireframe should remain usable for
preview and should not throw an error merely because `window.storage` is
missing. It may show the entered values locally or otherwise provide
graceful feedback, as appropriate to the purpose of the wireframe.

## Final check

Before considering a wireframe complete, verify that:

-   It clarifies a real user experience or process step.
-   Existing snippets, design conventions, and relevant wireframes were
    checked first.
-   Shared snippets are used where they add value, without unnecessary
    abstraction.
-   The interface is focused on the current step.
-   Runtime expressions have useful static fallbacks, including when
    expressions resolve to empty strings.
-   Structured runtime values are parsed defensively.
-   Runtime-derived text is safely rendered.
-   Every `window.storage.save(...)` call is guarded.
-   Previewing without the runtime does not produce errors.
-   Interactions communicate the step and capture needed input without
    duplicating business logic that belongs in play functions.
-   The HTML remains lightweight, accessible, and understandable.
