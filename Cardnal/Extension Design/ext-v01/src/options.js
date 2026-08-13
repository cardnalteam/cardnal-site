import { getState, setState, loadRuleset } from './storage.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const PREFS = [
  { id: 'cash',   label: 'Cash back',       hint: 'Prioritise direct cash value' },
  { id: 'points', label: 'Points & miles',  hint: 'Prioritise transferable travel rewards' },
  { id: 'none',   label: 'No preference',   hint: 'Show the best of each, prefer the certain one' }
];

function flash(el, msg) { el.textContent = msg; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 1800); }

async function main() {
  const [state, ruleset] = await Promise.all([getState(), loadRuleset()]);
  let selected = new Set(state.cards);
  let pref = state.preference;

  const cardsEl = document.getElementById('cards');
  cardsEl.innerHTML = ruleset.cards.map(c => `
    <div class="row${selected.has(c.cardId) ? ' on' : ''}" data-id="${esc(c.cardId)}">
      <span class="chip" style="background:${esc(c.colorHex)}"></span>
      <span class="t"><b>${esc(c.displayName)}</b>
        <span>${esc(c.issuer)} · ${c.annualFeeCents ? '$' + (c.annualFeeCents/100) + ' fee' : 'no annual fee'} · ${esc(c.currencyLabel)}</span></span>
      <span class="box">✓</span>
    </div>`).join('');

  cardsEl.addEventListener('click', async e => {
    const row = e.target.closest('.row'); if (!row) return;
    const id = row.dataset.id;
    selected.has(id) ? selected.delete(id) : selected.add(id);
    row.classList.toggle('on', selected.has(id));
    await setState({ cards: [...selected] });
    flash(document.getElementById('cardStatus'), `Saved — ${selected.size} card${selected.size === 1 ? '' : 's'} in your wallet`);
  });

  const prefsEl = document.getElementById('prefs');
  const drawPrefs = () => {
    prefsEl.innerHTML = PREFS.map(p => `
      <div class="row radio${pref === p.id ? ' on' : ''}" data-id="${p.id}">
        <span class="t"><b>${esc(p.label)}</b><span>${esc(p.hint)}</span></span>
        <span class="box"></span>
      </div>`).join('');
  };
  drawPrefs();
  prefsEl.addEventListener('click', async e => {
    const row = e.target.closest('.row'); if (!row) return;
    pref = row.dataset.id; drawPrefs();
    await setState({ preference: pref });
    flash(document.getElementById('prefStatus'), 'Saved');
  });

  document.getElementById('merchants').innerHTML =
    ruleset.merchants.map(m => `<span class="tag">${esc(m.domains[0])}</span>`).join('');
  document.getElementById('meta').textContent =
    `ruleset ${ruleset.rulesetVersion} · ${ruleset.merchants.length} stores · ${ruleset.cards.length} cards`;
}
main();
