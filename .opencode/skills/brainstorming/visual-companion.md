# Visual Companion Guide

## What is the Visual Companion?

The Visual Companion is a **web-based interactive tool** for showing mockups, diagrams, and visual options during brainstorming sessions. Instead of showing static text descriptions, you can display visual examples in a browser so users can see designs directly.

## When to Offer It

**Offer it when:**
- The topic involves visual elements (mockups, layouts, UI designs)
- Comparing different visual approaches (A vs B vs C)
- The user would benefit from seeing rather than imagining

**Skip it when:**
- The topic is purely conceptual (strategy, requirements)
- Text-based comparison is sufficient

## How to Offer

In your brainstorming message, include this offer **as its own message** (no other content):

```
Some of what we're working on might be easier to explain if I can show it to you
in a web browser. I can put together mockups, diagrams, comparisons, and other
visuals as we go. This feature is still new and can be token-intensive.

Want to try it? (Requires opening a local URL)
```

## How to Use It

### Step 1: User Accepts

When the user says "yes" or agrees to use the visual companion:

### Step 2: Create Visual Content

Create a simple HTML file with your mockup/design. For Lookitry, use the design tokens from REGLAS_IMPORTANTES.md:
- Colors: `#FF5C3A` (accent), `#0a0a0a` (base), `#141414` (cards)
- Typography: Plus Jakarta Sans (headlines), DM Sans (body)
- Dark mode default

### Step 3: Serve Locally

Use Python's built-in HTTP server to serve the file:

```bash
# In the project directory
python -m http.server 8765
```

### Step 4: Open in Browser

Provide the URL to the user (usually `http://localhost:8765/mockup.html`).

### Step 5: Iterate

Based on user feedback, update the mockup and refresh.

## Example Mockup Structure

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Widget Collection Mockup</title>
  <style>
    /* Import fonts */
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;950&family=DM+Sans:wght@400;500;600&display=swap');

    /* Design tokens */
    :root {
      --accent: #FF5C3A;
      --accent-glow: rgba(255, 92, 58, 0.25);
      --bg-primary: #0a0a0a;
      --bg-card: #141414;
      --border-color: #262626;
      --text-primary: #ffffff;
      --text-muted: #666666;
    }

    body {
      font-family: 'DM Sans', sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      padding: 40px;
      max-width: 1400px;
      margin: 0 auto;
    }

    h1 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 950;
      letter-spacing: -0.02em;
    }

    /* Mockup specific styles */
    .split-layout {
      display: grid;
      grid-template-columns: 60% 40%;
      gap: 32px;
    }

    /* etc */
  </style>
</head>
<body>
  <!-- Your mockup content here -->
</body>
</html>
```

## Best Practices

1. **Keep it simple** - Focus on layout, not full implementation
2. **Use real colors** - Match Lookitry's design tokens exactly
3. **Show multiple options** - Let user compare A/B/C visually
4. **Responsive previews** - Show how it looks on different screen sizes
5. **Interactive elements** - Add hover states to show interactions

## Limitations

- **Token-intensive** - Creating and iterating mockups uses more tokens
- **Requires user action** - User must open the local URL
- **Not persistent** - Each mockup is temporary

## File Location

Save mockup files temporarily in the project root:
- `/tmp/lookitry-mockup.html` (for Python server)

Or create a dedicated folder:
- `docs/superpowers/mockups/` (for permanent mockups)