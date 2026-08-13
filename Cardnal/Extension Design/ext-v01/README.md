# Cardnal v0.1 — seed ruleset + bare extension

Purpose: get something functional into 5–20 browsers and find out whether people
click it while shopping. Not a product. Data correctness > polish.

## Install (unpacked)

1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select this folder
3. Click the Cardnal icon → **Settings** → tick your cards, pick a preference
4. Visit a supported store, click the icon

## What it does

Detects one of 5 merchants from the tab URL, ranks the cards you selected for that
merchant's category, and shows the winner with a one-sentence reason. Everywhere
else it says it doesn't know.

## What it deliberately does not do

No checkout injection. No purchase totals. No dollar deltas. No default card. No
welcome bonuses. No card offers. No bank connections. No points-to-dollar
valuation. No AI.

## Layout

```
manifest.json              MV3, two permissions: storage + activeTab
data/ruleset.json          ALL reward data. Update rates here, never in code.
src/engine.js              Pure logic. No chrome.* calls. Runs in Node.
src/storage.js             chrome.storage wrapper — keys and defaults in one place
src/popup.html/.js         The one screen users see
src/options.html/.js       Card selection + preference
tests/engine.test.mjs      39 tests, no framework: `node tests/engine.test.mjs`
VERIFICATION.md            How to verify rates before shipping
```

## Tests

```bash
node tests/engine.test.mjs
```

Covers merchant detection (including lookalike-domain rejection), rate precedence,
currency separation, preference handling, tie-breaking, all abstention paths, and
ruleset integrity.
