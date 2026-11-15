# Semantic colors

Keep the established navy storefront and staff interface. This guard does not introduce a new palette or restyle existing screens.

Use existing semantic component classes (`button-primary`, `badge-success`, `badge-warning`, `badge-danger`, `field-error`, `muted`) and CSS custom properties from `src/app/globals.css`. Prefer these roles when extending a component:

| Role | Existing CSS property |
| --- | --- |
| Page / inset background | `--paper` / `--paper-deep` |
| Card surface | `--surface` |
| Main / secondary text | `--ink` / `--muted` |
| Divider / border | `--line` |
| Primary action / hover | `--action` / `--action-dark` |
| Success / warning / error | `--success` / `--warning` / `--danger` |

For example, use `color: oklch(var(--danger))` for an error in a stylesheet, or `className="field-error"` for an existing error element. The current Tailwind configuration exposes `ink`, `paper`, and `action`, so `text-ink`, `bg-paper`, and `border-action` are supported utility examples. Other CSS properties above are not automatically Tailwind utilities; add an intentional semantic mapping to `tailwind.config.ts` if needed. Do not infer a new color from the visual name of a stock palette.

## Automated guard

`npm run lint` runs the regular project lint followed by `scripts/eslint-semantic-colors.cjs`. That runner loads the local rule `scripts/eslint-rules/no-raw-tailwind-colors.js` through ESLint 8's programmatic `rulePaths` option and checks source JS/TS files. It fails on errors or warnings. No downloaded lint plugin is required. The rule rejects built-in Tailwind palette utilities in JSX `className` and `class` attributes:

```tsx
// Rejected, including responsive/state variants and opacity modifiers:
<div className="bg-red-50 text-gray-700 md:hover:border-blue-300/50" />
<div className={`card ${failed ? "text-red-500" : "text-ink"}`} />

// Allowed:
<div className="card badge-danger" />
<div className={active ? "bg-action text-paper" : "bg-paper text-ink"} />
```

It inspects static strings, template segments, inline conditionals/logical expressions, arrays, and inline class helper arguments/object keys. It covers Tailwind's named shade palettes, black/white, background/text/border, rings, outlines, shadows, SVG fill/stroke, gradients, and related color utilities. Semantic custom names, sizing classes, `transparent`, `current`, and `inherit` remain allowed. Error messages point here; there is no automatic color replacement because the correct semantic role depends on context.

Scope is deliberately bounded: this is an AST check of inline JSX class expressions, not a CSS migration or runtime evaluator. It does not resolve imported/variable class strings, concatenated or interpolated fragments that assemble a utility name, JSX spread props, arbitrary CSS colors such as `bg-[#123456]`, stylesheet declarations, or `@apply`. Review those uses explicitly and keep them semantic. Text content, documentation strings, and URL attributes outside class expressions are not inspected. Existing stylesheet literals are retained to preserve the established design; consolidating them is separate work.

Run the isolated parser/regression suite with `node --test tests/lint/*.test.cjs`. It exercises rejected palette classes and accepted semantic classes, CSS module references, prose, and URLs without starting or seeding the application database. Run the source guard alone with `node scripts/eslint-semantic-colors.cjs`.

The custom rule is enabled by the runner, not `.eslintrc.json`, so Next's built-in lint and ordinary editor ESLint integration do not need to resolve a local plugin. They do not enforce this additional check by themselves. Use `npm run lint`, `npm run check`, or the release pipeline `npm run check:release` to enforce it before a build/release.
