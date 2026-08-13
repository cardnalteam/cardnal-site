# Cardnal Brand Design System v1.0

**`cardnal-brand-system.html`** — the handbook. Open it in a browser. Every component
in section 09 is live CSS, not a screenshot, so what renders is the specification.

## Files

| File | What it is |
|---|---|
| `cardnal-brand-system.html` | The full system, 25 sections, self-contained |
| `tokens/cardnal.tokens.css` | Canonical CSS custom properties — import this |
| `tokens/tailwind.config.js` | The same tokens mapped for your Next.js + Tailwind stack |
| `tokens/logo-*.svg` / `.png` | The mark in red, black, and white |

## Using it

```js
// app/layout.tsx
import './tokens/cardnal.tokens.css'
```

```jsx
<button className="bg-red-500 text-white rounded-md shadow-brand font-sans">
  Reserve your spot
</button>
```

## Three rules that are easy to get wrong

1. **Brand red is not error red.** `--red-500` is brand and primary action only.
   Errors use `--alert` (#A61B2B) and always carry an icon plus a text label.
2. **Semantic colors have a `-text` variant** for a reason. `--success` at 3.4:1
   fails AA as type; `--success-text` at 5.4:1 passes. Use the base for fills only.
3. **In dark mode, red text is `--red-400`.** `--red-500` on `--ink-950` measures
   4.1:1 and fails. Button fills stay `--red-500`.

## Governance

Owner: Cardnal · Co-Founders: Suhas and Abhi.
Adding a token requires two surfaces that need it. This document wins over any
component that disagrees with it.
