# Wireframe Sketch

> Generate hand-drawn style SVG wireframes with a sketchy, professional aesthetic.

## Overview

Wireframe Sketch creates visual mockups as SVG images with a hand-drawn, sketchy appearance. Unlike ASCII mockups which use text characters, wireframes are actual graphics that render in the browser — providing a more polished, stakeholder-friendly presentation directly on your prooph board canvas.

This skill teaches AI agents how to generate valid SVG wireframes with proper layout, spacing, and visual hierarchy for UI elements in your Event Models.

## Pros and Cons

### Advantages

- **Professional appearance** — Hand-drawn style wireframes look polished and approachable, making them ideal for presentations to non-technical stakeholders, clients, or design reviews.
- **Visual clarity** — SVG wireframes show layout, spacing, colors, and typography exactly as intended. No ambiguity from text-based representations.
- **Rich visual language** — Use colors for states (success, warning, error), varied button styles, icons, and proper visual hierarchy to communicate design intent clearly.
- **Renders inline** — SVGs display directly in prooph board when uploaded as UI element attachments, visible alongside your model.

### Disadvantages

- **Higher token cost** — SVG wireframes consume significantly more tokens than ASCII mockups. A single wireframe can use 500-2000+ tokens depending on complexity. Use them strategically when visual fidelity matters.
- **More complex to generate** — Requires careful calculation of coordinates, spacing, and validation to ensure the SVG renders without errors. AI agents must follow strict encoding rules.
- **Not editable on canvas** — Unlike ASCII mockups (plain text), SVG wireframes cannot be edited directly on the prooph board canvas. Changes require regenerating and re-uploading the file.

## When to Use

| ✅ Use Wireframe Sketch | ❌ Use Alternatives |
|---|---|
| Presenting to non-technical stakeholders or clients | Quick iteration during early modeling sessions |
| Design reviews requiring visual polish | Token budget is limited |
| Complex layouts where spatial relationships matter | Simple state documentation for developers |
| Final documentation for handoff to UI developers | Internal technical discussions |

## Comparison: Wireframe vs ASCII Mockup

| Feature | Wireframe Sketch | ASCII Mockup |
|---|---|---|
| **Appearance** | Professional, hand-drawn style | Technical, text-based |
| **Token cost** | High (500-2000+ tokens) | Low (50-200 tokens) |
| **Editability** | Regenerate and re-upload | Edit directly on canvas |
| **Best for** | Stakeholders, design reviews | Developers, quick documentation |
| **Visual detail** | Colors, typography, spacing | Basic layout structure |
| **File format** | SVG image | Plain text code block |

## Usage

Once installed, your AI agent will know how to generate SVG wireframes for UI elements. The wireframes are created on-the-fly during event modeling sessions and uploaded directly to UI elements — no files saved to disk.

### Example Output

A wireframe includes:
- Warm paper-tone background (`#FFFEF7`)
- Sketchy filter for hand-drawn edges
- Comic Sans MS font for informal, approachable text
- Proper spacing and visual hierarchy
- Legend identifying the wireframe

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
  <defs>
    <filter id="sketchy">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="800" fill="#FFFEF7"/>
  
  <!-- Content with sketchy shapes -->
  <path d="M48 120 Q600 118 1152 120..." filter="url(#sketchy)"/>
  <text x="68" y="180" font-family="Comic Sans MS, cursive, sans-serif">Dashboard</text>
</svg>
