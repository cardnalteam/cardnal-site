/* Thin wrapper over chrome.storage.local so the popup and options page agree
   on keys and defaults, and so tests can stub one module instead of many. */

const DEFAULTS = { cards: [], preference: 'none', onboarded: false };

export async function getState() {
  const got = await chrome.storage.local.get(Object.keys(DEFAULTS));
  return { ...DEFAULTS, ...got };
}
export async function setState(patch) {
  await chrome.storage.local.set(patch);
}
export async function loadRuleset() {
  const res = await fetch(chrome.runtime.getURL('data/ruleset.json'));
  if (!res.ok) throw new Error('ruleset unavailable');
  return res.json();
}
