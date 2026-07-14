# SCSS Base

Reusable SCSS foundation: design tokens, mixins, and base styles. Copy the
`styles/` folder into a project (or vendor it as a package / submodule) and
configure it per project with `@use ... with` — never fork the shared files.
One exception: `_type.scss` holds the type ramp and is *meant* to be edited
per project (type roles are mixins, not overridable tokens).

## Structure

```
styles/
  _layers.scss          @layer order — must load first
  main.scss             entry point, import once per app
  abstracts/            ZERO CSS output — safe to @use from every component
    _config.scss        all tokens, all !default (override per project)
    _functions.scss     bp(), fluid()
    _mixins.scss        breakpoints, content-grid, hover, truncation, visually-hidden, skeleton
    _type.scss          fluid type roles: text-h1..h4, text-body, -small, -button, -uppercase
    _type-stepped.scss  same roles, stepped at md instead of fluid (opt-in)
    _index.scss         forwards config, functions, mixins, and one type file
  base/                 CSS output — imported once via main.scss
    _reset.scss         minimal modern reset             → @layer reset
    _theme.scss         custom properties (colors, gutter) → @layer base
    _typography.scss    element defaults via type roles  → @layer base
    _globals.scss       body colors, accent-color, :focus-visible, reduced motion
    _utilities.scss     .skeleton, .visually-hidden(-focusable), text utils → @layer utilities
```

## Setup

**1. Entry** — import once (e.g. in `main.ts`): `import './styles/main.scss'`

**2. PostCSS** — ship `postcss.config.cjs` with the project. `light-dark()` (the
theming engine) needs it transpiled for browsers older than mid-2024. Vite picks
it up automatically; no dist build step needed.

**3. Fonts** — the base loads no font files. Add the project's `@font-face`
rules (use `font-display: swap`) and set `$font-stack-body` in the
override. For a duo-font setup also set `$font-stack-heading`; left unset,
headings use the body font. Both are exposed as `--font-body` /
`--font-heading`, and the type role mixins apply them automatically — so a
component that wants the heading font just writes
`font-family: var(--font-heading)`.

**4. Per-project overrides** — configure at the `@use` site, never by editing
the shared files:

```scss
@use 'scss-base/styles/abstracts' with (
  $max-container-width: 1280px,
  $font-stack-body: ('Inter', sans-serif),
  $font-stack-heading: ('Clash Display', sans-serif), // omit for single-font setup
  $colors: ( /* role: (light, dark) */ ),
);
```

**5. In components** — one line gives every token + mixin at no CSS cost:

```scss
@use '@/styles/abstracts' as *;

.card {
  padding: var(--gutter);
  @include from(md) { padding: 2rem; }
}
```

Or inject it everywhere so components never write it:

```ts
// vite.config.ts
css: {
  preprocessorOptions: {
    scss: { additionalData: `@use "@/styles/abstracts" as *;\n` },
  },
},
```

## Overrides

Every token in `_config.scss` is `!default`. Rules:

- The override must be the **first** `@use` of the abstracts in the project.
- Map overrides **replace the whole map** — include every key you want to keep.
- `$gutters` needs a `base` key (the default). Every other key must be a
  `$breakpoints` name (anything else errors at compile time) and overrides
  `--gutter` from that width up — add, remove, or reorder tiers freely;
  they're always emitted in ascending width order.

| Token | What it does | Affects layout / calc? |
|---|---|---|
| `$colors` | `role: (light, dark)` palette → `--color-*` | — |
| `$font-stack-body` | body/base font family → `--font-body` | — |
| `$font-stack-heading` | heading font family → `--font-heading` (defaults to the body font) | — |
| `$breakpoints` | `sm/md/lg/xl` → the `from/until/between` mixins | Yes — every responsive rule shifts |
| `$max-container-width` | max width of constrained `content-grid` content | Yes — content column width |
| `$gutters` | page edge padding → `--gutter` (`base` + any breakpoint-named tiers) | Yes — page margins & grid columns |
| `$fluid-from` / `$fluid-to` | viewport range (px) the fluid type scales across | Yes — recomputes every `fluid()` clamp |
| `$transition-duration` | default duration for `hover()` and motion | No |

Example:

```scss
@use 'scss-base/styles/abstracts' with (
  $max-container-width: 1280px,
  $font-stack-body: ('Inter', sans-serif),
  $gutters: (base: 20px, sm: 32px, xl: 48px),
  $breakpoints: (sm: 600px, md: 768px, lg: 1024px, xl: 1280px),
);
```

### Extending a map instead of replacing it

Merge the default map with your additions before passing it to `with (...)`:

```scss
@use 'sass:map';
@use 'scss-base/styles/abstracts/config' as base;

$my-colors: map.merge(base.$colors, (
  info: (#2f80ed, #56ccf2),
));

@use 'scss-base/styles/abstracts' with ($colors: $my-colors);
```

New keys work everywhere the defaults do: a new `$colors` role gets its
`--color-*` automatically, a new `$breakpoints` name works in the mixins, and
a new `$gutters` tier (named after a breakpoint) gets its own `--gutter`
override. Quote keys that collide with Sass color keywords (`red`, `green`, …).

### Extending or replacing mixins (optional facade)

`with (...)` only covers variables. If a project needs to add its own mixins —
or swap out one of the base ones — put a thin local file between components and
the package instead of importing the package directly:

```scss
// src/styles/abstracts/_index.scss
@forward 'scss-base/styles/abstracts' hide content-grid;

// replacement — same name, same call sites keep working
@mixin content-grid($gutter: var(--gutter)) {
  /* this project's variant */
}

// project-only addition
@mixin card-shadow {
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
}
```

Token overrides move here too (`@forward ... with (...)`). Components keep
writing `@use '@/styles/abstracts' as *;` — they never notice whether a mixin
came from the base or the facade. Not needed if variable overrides are enough;
in that case just `@use` the package directly as shown above.

Caveat: the base's own `base/` styles call the package's mixins internally, so
a replacement only affects your components, not CSS the base already emits.

## Theming

- Colors come from the `$colors` map only. Reference by role — `var(--color-bg)`,
  `var(--color-text)` — never by appearance.
- Theme switch = set `[data-theme='light'|'dark']` on `<html>`. No attribute
  follows the OS. That's the whole toggle — no per-theme blocks to sync.
- Icons: `mask-image` + `background-color: var(--color-icons)`, or
  `currentColor` SVGs. There is no icon-filter variable.

## Layout

Put `content-grid` on your top-level wrapper. Direct children are constrained to
`$max-container-width`; a child with `.full-bleed` goes edge-to-edge — no
negative-margin classes:

```html
<main class="content-grid">          <!-- .content-grid { @include content-grid; } -->
  <section>constrained</section>
  <section class="full-bleed">edge-to-edge slider</section>
</main>
```

Because children are grid items: vertical margins between them **don't collapse**
(use `gap` or explicit margins), and the constrain/full-bleed rule applies to
**direct children only** — re-apply `content-grid` if you nest deeper.

`--gutter` is a custom property, usable in `calc()`. Full-height sections:
`100dvh`, not `100vh`.

## Responsive & type

- Breakpoints only via mixins: `@include from(md)`, `until(md)`,
  `between(md, lg)`. An unknown name errors at compile time.
- Type is role mixins (`text-h1`, `text-body`…), not element selectors. When a
  design gives you an `<h2>` that should look like an h3, `@include text-h3`.
  Each role carries its font: heading roles set `var(--font-heading)`, text
  roles set `var(--font-body)` — so a role looks right on any element.
- Tailor the roles in `_type.scss` to each project's design — that file is the
  expected per-project edit. Fluid is the default; swap the last `@forward` in
  `abstracts/_index.scss` to `'type-stepped'` for sizes that step at `md` —
  same mixin names, nothing else changes.

## Cascade layers

Order is `reset, base, components, utilities`. A later layer beats an earlier one
regardless of specificity; unlayered styles beat every layer. So put component
styles in `@layer components` if you want utilities to override them, or leave
them unlayered to always win. This is why nothing here needs `!important`.

## Notes

- `hover()` already guards touch devices and respects reduced motion — prefer it
  over hand-writing `:hover`.
- Truncation: `@include text-truncate` (or `.text-truncate`) for one line,
  `@include line-clamp(3)` for multi-line. Both need a constrained width.
- Skip link: put
  `<a class="visually-hidden-focusable" href="#main">Skip to content</a>` as
  the first element in `<body>` — hidden until keyboard-focused.
- `skeleton` is a mixin (works in CSS Modules / scoped styles) but needs the
  global `shimmer` keyframes from `main.scss`. In scoped/module styles reference
  it as `:global(shimmer)` if your tooling rewrites animation names.

## Build (standalone check)

```
npm install
npm run build     # compiles styles/main.scss → dist/main.css, runs PostCSS
```

In a real project Vite/webpack compile the SCSS and pick up `postcss.config.cjs`
automatically.
