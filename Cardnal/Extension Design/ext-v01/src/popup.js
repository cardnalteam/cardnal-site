import { recommend } from './engine.js';
import { getState, loadRuleset } from './storage.js';

const root = document.getElementById('root');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const rateStr = r => r.unit === 'percent' ? `${r.value}%` : `${r.value}x`;

document.getElementById('settings').addEventListener('click', () => chrome.runtime.openOptionsPage());

function cardRow(c, first) {
  return `<div class="row${first ? ' first' : ''}">
    <span class="chip" style="background:${esc(c.colorHex || '#9AA1AB')}"></span>
    <span><span class="t">${esc(c.displayName)}</span>
      <span class="sub" style="display:block">${esc(c.issuer)}</span></span>
    <span class="v">${esc(rateStr(c.rate))}</span>
  </div>`;
}

function groupsHtml(res) {
  let html = '';
  if (res.cashGroup && res.cashGroup.length) {
    html += `<div class="grouphd">Cash back</div>` +
            res.cashGroup.map((c, i) => cardRow(c, i === 0)).join('');
  }
  for (const g of (res.pointGroups || [])) {
    if (!g.list.length) continue;
    const label = g.list[0].currencyLabel || `${g.currency} points`;
    html += `<div class="grouphd">${esc(label)}</div>` +
            g.list.map((c, i) => cardRow(c, i === 0)).join('');
  }
  return html;
}

function merchantBlock(m) {
  const initial = (m.name || '?').trim()[0].toUpperCase();
  return `<div class="merchant">
    <span><span class="lb">You're shopping at</span><span class="nm" style="display:block">${esc(m.name)}</span></span>
    <span class="tile">${esc(initial)}</span>
  </div>`;
}

function render(res, prefLabel) {
  document.getElementById('prefLabel').textContent = prefLabel;

  if (res.status === 'no_cards') {
    root.innerHTML = `<div class="empty">
      <h3>No cards yet</h3>
      <p>Add the cards already in your wallet and Cardnal starts working immediately.</p>
      <button class="btn btn-p" id="setup">Add your cards</button></div>`;
    document.getElementById('setup').addEventListener('click', () => chrome.runtime.openOptionsPage());
    return;
  }

  if (res.status === 'no_merchant') {
    root.innerHTML = `<div class="empty">
      <h3>We don't know this store yet</h3>
      <p>Cardnal supports a small set of stores in this early version. We won't guess.</p>
      <button class="btn" id="setup">See supported stores</button></div>`;
    document.getElementById('setup').addEventListener('click', () => chrome.runtime.openOptionsPage());
    return;
  }

  if (res.status === 'low_confidence') {
    root.innerHTML = merchantBlock(res.merchant) +
      `<div class="note amber"><b>Not confident here</b>We can't reliably tell what this page is, so we're not recommending a card.</div>`;
    return;
  }

  if (res.status === 'all_equal') {
    root.innerHTML = merchantBlock(res.merchant) +
      `<div class="note plain"><b>Every card earns the same here</b>None of your cards has a bonus for ${esc(res.categoryLabel || 'this category')}. Use whichever you prefer.</div>` +
      groupsHtml({ cashGroup: res.groups.cash || [],
                   pointGroups: Object.entries(res.groups).filter(([k]) => k !== 'cash')
                     .map(([currency, list]) => ({ currency, list })) });
    return;
  }

  // status === 'ok'
  const w = res.winner;
  let html = merchantBlock(res.merchant);
  html += `<div class="eyebrow">${res.isTie ? 'Either works' : 'Best card in your wallet'}</div>`;
  html += `<div class="win">
    <div class="top"><span><span class="nm">${esc(w.displayName)}</span>
      <span class="iss" style="display:block">${esc(w.issuer)}</span></span></div>
    <div class="rate"><b>${esc(rateStr(w.rate))}</b><i>${esc(w.rate.unit === 'percent' ? 'back' : (w.currencyLabel || 'points'))}</i></div>
    <div class="why">${esc(res.reason)}</div>
  </div>`;

  if (res.winnerBasis === 'no_preference_prefers_cash') {
    const bestPoints = (res.pointGroups[0] || {}).list?.[0];
    if (bestPoints) {
      html += `<div class="note info"><b>Also worth knowing</b>${esc(bestPoints.displayName)} earns ${esc(rateStr(bestPoints.rate))} ${esc(bestPoints.currencyLabel)} here. We can't compare points to cash, so we show both.</div>`;
    }
  }

  html += groupsHtml(res);

  if (w.rate.cap) {
    const cap = (w.rate.cap.amountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    html += `<div class="note amber"><b>Has a cap</b>This rate applies up to ${esc(cap)} per year, then drops to ${esc(w.rate.cap.thenValue)}${w.rate.cap.thenUnit === 'percent' ? '%' : 'x'}. We can't track your spending, so check where you are.</div>`;
  }
  if (w.foreignTxFeePct > 0) {
    html += `<div class="note plain"><b>Foreign transaction fee</b>${esc(w.displayName)} charges ${esc(w.foreignTxFeePct)}% on purchases abroad.</div>`;
  }
  if (res.unverifiedData) {
    html += `<div class="note amber"><b>Rates not yet verified</b>This is an early build. Reward rates were seeded by hand and haven't been checked against issuer terms. Confirm before relying on them.</div>`;
  }
  root.innerHTML = html;
}

/* Resolve the URL of the page the user is looking at.
   ?tabUrl= is a test hook: when the popup is opened as a normal tab (automated
   testing), chrome.tabs.query would return the popup itself. Harmless in
   production because the real popup is never opened with a query string. */
async function resolveActiveUrl() {
  const override = new URLSearchParams(location.search).get('tabUrl');
  if (override) return override;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url || '';
}

async function main() {
  try {
    const [state, ruleset] = await Promise.all([getState(), loadRuleset()]);
    const activeUrl = await resolveActiveUrl();
    const prefLabel = { cash: 'cash back', points: 'points & miles', none: 'no preference' }[state.preference] || '';
    const res = recommend({
      url: activeUrl,
      walletCardIds: state.cards,
      preference: state.preference,
      ruleset
    });
    render(res, prefLabel);
  } catch (e) {
    root.innerHTML = `<div class="note amber"><b>Something went wrong</b>${esc(e.message)}. Your cards are safe.</div>`;
  }
}
main();
