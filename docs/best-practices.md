# Best Practices & Coding Rules

This document describes the conventions that must be followed when contributing to this project.
All rules are enforced by ESLint and TypeScript — run `npm run lint` before `npm run build`.

---

## TypeScript / JavaScript

### Indentation and formatting

- Use **4 spaces** for indentation (no tabs).
- Use **single quotes** for strings.
- Always add a **semicolon** at the end of statements.
- Add **trailing commas** on the last item of multi-line arrays, objects, imports, and exports — but not in function argument lists.

```ts
// Good
const options = [
    'foo',
    'bar',
];

function doSomething(a: string, b: number) { ... }

// Bad — missing trailing comma in multi-line array
const options = [
    'foo',
    'bar'
];

// Bad — trailing comma in function args
function doSomething(a: string, b: number,) { ... }
```

### Braces are always required

Every `if`, `else`, `for`, `while`, and similar block must use curly braces, even for a single statement.

```ts
// Good
if (!value) {
    return;
}

// Bad
if (!value) return;
```

### Variable names

Identifiers must be at least 2 characters long. Single-letter names are forbidden, with the sole exceptions of `t` (i18n translation function), `x`, and `y` (coordinates).

```ts
// Good
const index = 0;
const evt = event;

// Bad
const i = 0;
const e = event;
```

### Blank lines

Follow these spacing rules consistently:

- Add a **blank line after a block of variable declarations** before the first statement that is not a declaration.
- Add a **blank line before `return`** when there is any code above it in the same block.
- Add a **blank line before and after** multi-line block statements (`if`, `for`, `while`, `switch`, …).

```ts
// Good
function example(items: string[]): string {
    const first = items[0];
    const second = items[1];

    if (first === second) {
        return first;
    }

    const combined = first + second;

    return combined;
}
```

No extra blank lines should be introduced beyond what these rules require — unnecessary whitespace creates noise in diffs.

### No alignment spaces

Do not add extra spaces to visually align values across lines. Use only natural indentation.

```ts
// Good
const a = 1;
const longer = 2;

// Bad
const a      = 1;
const longer = 2;
```

### Comments

Use the `/* starred-block */` style for multi-line comments. Single-line `//` comments are fine for brief inline notes. Only comment the **why**, not the what — well-named identifiers already describe what the code does.

### Event handlers — prefer `currentTarget`

When accessing the element that triggered an event, use `evt.currentTarget` rather than `evt.target`. It is more precise and type-safe for DOM event handlers.

```ts
// Good
function onInput(evt: Event) {
    const input = evt.currentTarget as HTMLInputElement;
    ...
}
```

---

## Vue components

- Use **Vue 3 Composition API** with `<script setup lang="ts">`.
- Always use `<style scoped>` to keep styles local to the component.
- All **user-facing strings** must go through `vue-i18n` (`t('key')`). No hardcoded UI text.
- Props must be typed with TypeScript (`defineProps<{ ... }>()`).
- Use `useTemplateRef` (Vue 3.5+) to access template refs.

### Attribute inheritance

When a component has **multiple root elements** (e.g., a button + a `<Teleport>`), Vue disables automatic attribute inheritance. In that case:

- Add `defineOptions({ inheritAttrs: false })` to the component.
- Manually apply `v-bind="$attrs"` on the intended root element.

### Dynamic inline styles

The `:style` binding must only contain **CSS custom properties** (variables), never raw CSS property values. Actual visual properties belong in the `<style scoped>` block where they can be controlled by class selectors.

```vue
<!-- Good: pass coordinates as CSS variables, consume them in CSS -->
<div :style="{ '--anchor-top': `${rect.top}px` }" class="tooltip" />

<!-- Bad: CSS properties directly in :style -->
<div :style="{ top: `${rect.top}px` }" />
```

---

## CSS

All design tokens are defined in `src/assets/variables.css`. **Never hardcode** colors, z-index values, spacing, font sizes, shadows, or transition durations — always use the corresponding CSS custom property.

| Category | Variables |
|---|---|
| Colors | `--color-primary`, `--color-secondary`, `--color-background`, `--color-text`, `--color-warning`, `--color-error`, … |
| Spacing | `--spacing-xs/sm/md/lg`, `--field-padding`, `--field-padding-sm`, `--field-margin`, `--section-padding` |
| Typography | `--font-size-xs/sm/md/lg/xl/xxl` |
| Borders | `--border-radius`, `--border-radius-sm`, `--border-radius-round` |
| Transitions | `--transition-fast`, `--transition-normal` |
| Shadows | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |
| Z-index | `--zIndex-modal`, `--zIndex-menu`, `--zIndex-main-menu`, … |

```css
/* Good */
.tooltip {
    z-index: var(--zIndex-modal);
    background-color: var(--color-background-mute);
    transition: opacity var(--transition-normal) ease;
}

/* Bad */
.tooltip {
    z-index: 1000;
    background-color: #f2f2f2;
    transition: opacity 300ms ease;
}
```

For viewport-relative sizing, prefer **dynamic viewport units** (`dvh`, `dvw`) over `vh`/`vw` to correctly handle mobile browser chrome.

---

## Workflow

1. Run `npm run lint` — fix all errors before proceeding.
2. Run `npm run build` — ensure the project compiles with no TypeScript errors.
3. Manually verify the feature using `tests/scenarios.md` as a checklist.