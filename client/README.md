# Atom — web client

Angular 22 single-page app using standalone components, zoneless change detection, signals,
`httpResource`, Signal Forms, Angular Material 3 (with a Material 3 Expressive layer) and
Tailwind CSS v4. See the [root README](../README.md) for the full project overview.

```bash
npm install
npm start             # dev server on http://localhost:4200, proxies /api to :8080
npm run test:ci       # Vitest unit tests
npm run lint          # angular-eslint
npm run format        # Prettier (also sorts Tailwind classes)
npm run build         # production build in dist/atom/browser
```

## Conventions

Follows the current Angular style guide:

- **No type suffixes in file or class names.** Files are named for what they contain:
  `habit-row.ts` (component `HabitRow`), `habits-api.ts` (service `HabitsApi`),
  `session.ts` (service `Session`), `models/habit.ts`. Generate code with the Angular CLI,
  which follows this naming (`ng generate service habits-api`).
- **Services use `@Service()`**, which provides them automatically at the root. Use
  `@Service({ autoProvided: false })` for a service that must be provided explicitly.
- Name services by their role rather than by a generic noun: `…Api` for HTTP clients
  (`HabitsApi`), `Session` for the signed-in user, `Notifier`, `Confirmer`, `ShareLauncher`.
- One concept per file; tests sit next to the code as `*.spec.ts`.

## Styling

Styling has three layers, each with one job:

| File                          | Responsibility                                                          |
| ----------------------------- | ----------------------------------------------------------------------- |
| `src/styles.scss`             | Angular Material M3 theme (`mat.theme`), base `body` styles             |
| `src/styles/_expressive.scss` | M3 Expressive tokens (shapes, springs) and Material component overrides |
| `src/tailwind.css`            | Tailwind v4, with its theme mapped onto the Material system tokens      |

The palette in `src/styles/_theme-colors.scss` was generated with
`ng generate @angular/material:theme-color`.

### Tailwind is the Material design system

`src/tailwind.css` replaces Tailwind's defaults with the app's Material 3 tokens, so only
on-system values exist and everything follows light/dark mode automatically:

- **Colours** are the M3 colour roles: `bg-primary-container`, `text-on-surface-variant`,
  `border-outline-variant`, … (Tailwind's default palette is removed).
- **Type** uses the M3 type scale: `type-title-large`, `type-body-small`, … plus
  emphasized styles such as `type-display-small-emphasized`. Refine with `font-brand`,
  `font-semibold` or `tracking-*`.
- **Shape** follows the M3 Expressive scale: `rounded-xs` (4px) … `rounded-xl` (28px),
  `rounded-lg-increased`, `rounded-xl-increased`, `rounded-full`.
- **Elevation**: `shadow-level1` … `shadow-level5`.
- **Motion**: `ease-spring`, `ease-spring-fast`, `ease-effects`.
- **Breakpoints** are the M3 window size classes: `medium:` (600px), `expanded:` (840px),
  `large:` (1200px), `xlarge:` (1600px).
- **App patterns**: `page` (page container), `eyebrow`, and `icon-<n>` for `<mat-icon>` sizes on
  the spacing scale (`icon-6` = 24px).

### Conventions

- Put utilities in templates (including `host: { class: '…' }` for a component's own element).
  Don't use `@apply`.
- Theme Angular Material **components** through Material tokens, not utilities: globally with
  `mat.*-overrides` in `_expressive.scss`, or per element with a token property such as
  `[--mat-card-filled-container-color:var(--mat-sys-primary-container)]`.
- Tailwind's utilities live in CSS cascade layers, while Angular Material's styles are unlayered
  and always win. When a utility must override a property Material sets on its own element (e.g.
  `position` on a FAB, or a `<mat-icon>` size), use the important modifier: `fixed!`, `icon-4.5!`.
- Inside arbitrary values reference the Material variables (`var(--mat-sys-primary)`); the theme
  is `@theme inline`, so `--color-*` variables are not emitted.
- Keep component stylesheets for intricate internals only — currently the heatmap, the check-in
  button's morph animation, and Material list internals in the navigation drawer.
- Reusable UI goes into components (`PageHeader`, `EmptyState`, …) rather than global classes.
