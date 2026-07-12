# SCSS Base

A drop-in SCSS foundation: cascade layers, design tokens, fluid type, theming
via `light-dark()`, a small mixin/utility set, and a modern reset.

## Three rules

1. **Import `main.scss` once**, at your app entry (globally). It emits the
   reset, theme, typography, globals, and utilities — in that order, under the
   layers declared in `_layers.scss`. Importing it more than once duplicates CSS.

2. **Import `abstracts` in every component module.** It's zero-output (pure
   `@forward`), so it's free to pull in anywhere for tokens, functions, and
   mixins:

   ```scss
   @use '../../styles/abstracts' as *;
   ```

3. **Wrap component styles in `@layer components`.** Anything you write outside a
   layer beats *every* layer — including utilities — so a forgotten wrapper
   silently makes the component un-overridable. This failure is invisible until a
   utility mysteriously stops working.

   ```scss
   @use '../../styles/abstracts' as *;

   @layer components {
     .button { color: var(--color-text); }
   }
   ```

## Layers

`_layers.scss` sets the priority order once:

```scss
@layer reset, base, components, utilities;
```

A later layer beats an earlier one regardless of specificity; unlayered styles
beat all of them. Pick a layer by asking what a rule should beat and lose to —
not by selector weight. Most of your code belongs in `components`. Add a new
layer (e.g. `vendor` below `components`) only to force a whole group of styles to
always win or lose — such as overriding a third-party stylesheet — never for
organization.

## Overriding tokens

All tokens in `abstracts/_config.scss` are `!default`, so override them at the
single `@use` site (a thin `app.scss` that then loads `main`):

```scss
@use 'styles/abstracts' with (
  $max-container-width: 1140px,
  $font-stack: ('Inter', sans-serif)
);
@use 'styles/main';
```

Colors and layout scalars are exposed as CSS custom properties — use
`var(--color-primary)`, `var(--color-text)`, `var(--gutter)` in components rather
than hard-coding values. Breakpoints stay Sass values (custom properties can't be
used in `@media`); reach them via the `from()` / `until()` / `between()` mixins.

## Fluid vs. stepped type

`abstracts/_index.scss` forwards `type` (sizes scale fluidly with the viewport).
To step sizes at breakpoints instead, swap that one line for `type-stepped`.
Keep whichever you use; the two expose the same mixin names (`text-h1` … ).
