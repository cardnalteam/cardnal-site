import { readFileSync } from 'node:fs';
import { identifyMerchant, resolveRate, rankCards, recommend } from '../src/engine.js';

const ruleset = JSON.parse(readFileSync(new URL('../data/ruleset.json', import.meta.url)));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); console.log(`  PASS  ${name}`); pass++; }
  catch (e) { console.log(`  FAIL  ${name}\n        ${e.message}`); fail++; }
}
function eq(a, b, msg) {
  const A = JSON.stringify(a), B = JSON.stringify(b);
  if (A !== B) throw new Error(`${msg || ''} expected ${B}, got ${A}`);
}
function ok(v, msg) { if (!v) throw new Error(msg || 'expected truthy'); }

const ALL = ['chase_prime_visa','chase_freedom_unlimited','amex_blue_cash_preferred','amex_gold','chase_sapphire_preferred'];

console.log('\nMERCHANT DETECTION');
t('exact host matches', () => eq(identifyMerchant('https://www.amazon.com/dp/B01', ruleset).merchantId, 'amazon'));
t('www stripped', () => eq(identifyMerchant('https://amazon.com/', ruleset).merchantId, 'amazon'));
t('subdomain matches parent', () => eq(identifyMerchant('https://smile.amazon.com/x', ruleset).merchantId, 'amazon'));
t('unknown host returns null', () => eq(identifyMerchant('https://bespoke-lamps.co/cart', ruleset), null));
t('lookalike domain is NOT matched', () => eq(identifyMerchant('https://amazon.com.evil.co/', ruleset), null));
t('non-http scheme returns null', () => eq(identifyMerchant('chrome://extensions', ruleset), null));
t('garbage url returns null', () => eq(identifyMerchant('not a url', ruleset), null));
t('path override changes category', () => {
  const m = identifyMerchant('https://www.amazon.com/alm/storefront?x=1', ruleset);
  eq(m.categoryId, 'groceries'); eq(m.categorySource, 'path');
});
t('default path keeps merchant category', () => eq(identifyMerchant('https://amazon.com/dp/x', ruleset).categoryId, 'online_retail'));
t('carries confidence through', () => eq(identifyMerchant('https://target.com/', ruleset).confidence, 'medium'));

console.log('\nRATE RESOLUTION');
const card = id => ruleset.cards.find(c => c.cardId === id);
t('merchant bonus beats category bonus', () => {
  const r = resolveRate(card('chase_prime_visa'), { merchantId: 'amazon', categoryId: 'online_retail' });
  eq(r.value, 5); eq(r.source, 'merchant_bonus');
});
t('category bonus applies when no merchant rule', () => {
  const r = resolveRate(card('chase_freedom_unlimited'), { merchantId: 'chipotle', categoryId: 'dining' });
  eq(r.value, 3); eq(r.source, 'category_bonus');
});
t('falls back to base rate', () => {
  const r = resolveRate(card('chase_freedom_unlimited'), { merchantId: 'amazon', categoryId: 'online_retail' });
  eq(r.value, 1.5); eq(r.source, 'base_rate');
});
t('excludesMerchants is honoured (Target is not a supermarket)', () => {
  const r = resolveRate(card('amex_blue_cash_preferred'), { merchantId: 'target', categoryId: 'groceries' });
  eq(r.value, 1); eq(r.source, 'base_rate');
});
t('grocery bonus applies at Whole Foods', () => {
  const r = resolveRate(card('amex_blue_cash_preferred'), { merchantId: 'whole_foods', categoryId: 'groceries' });
  eq(r.value, 6);
});
t('cap metadata survives resolution', () => {
  const r = resolveRate(card('amex_blue_cash_preferred'), { merchantId: 'whole_foods', categoryId: 'groceries' });
  ok(r.cap && r.cap.amountCents === 600000, 'cap should be carried');
});

console.log('\nRANKING — currencies stay separate');
t('cash and points are never merged', () => {
  const r = rankCards(ALL, { merchantId: 'chipotle', categoryId: 'dining' }, ruleset, 'none');
  ok(r.cashGroup.length === 3, 'three cash cards');
  eq(r.pointGroups.map(g => g.currency).sort(), ['MR','UR']);
});
t('MR and UR are separate groups', () => {
  const r = rankCards(ALL, { merchantId: 'chipotle', categoryId: 'dining' }, ruleset, 'points');
  eq(r.pointGroups.length, 2);
});
t('cash preference picks the best cash card', () => {
  const r = rankCards(ALL, { merchantId: 'chipotle', categoryId: 'dining' }, ruleset, 'cash');
  eq(r.winner.cardId, 'chase_freedom_unlimited'); // 3% dining
  eq(r.winnerBasis, 'preference_cash');
});
t('points preference picks the best points card', () => {
  const r = rankCards(ALL, { merchantId: 'chipotle', categoryId: 'dining' }, ruleset, 'points');
  eq(r.winner.cardId, 'amex_gold');              // 4x dining
  eq(r.winnerBasis, 'preference_points');
});
t('no preference prefers certain value (cash)', () => {
  const r = rankCards(ALL, { merchantId: 'chipotle', categoryId: 'dining' }, ruleset, 'none');
  eq(r.winner.currency, 'cash');
  eq(r.winnerBasis, 'no_preference_prefers_cash');
});
t('points preference falls back when wallet has no points card', () => {
  const r = rankCards(['chase_prime_visa','chase_freedom_unlimited'], { merchantId: 'amazon', categoryId: 'online_retail' }, ruleset, 'points');
  eq(r.winner.cardId, 'chase_prime_visa');
  eq(r.winnerBasis, 'only_option');
});
t('deterministic ordering on identical rates', () => {
  const a = rankCards(ALL, { merchantId: 'target', categoryId: 'superstore' }, ruleset, 'cash');
  const b = rankCards([...ALL].reverse(), { merchantId: 'target', categoryId: 'superstore' }, ruleset, 'cash');
  eq(a.winner.cardId, b.winner.cardId);
});
t('lower annual fee breaks a rate tie', () => {
  const r = rankCards(['amex_blue_cash_preferred','chase_prime_visa'], { merchantId: 'target', categoryId: 'superstore' }, ruleset, 'cash');
  eq(r.winner.cardId, 'chase_prime_visa'); // both 1%, Prime Visa has no fee
});

console.log('\nEND TO END');
t('Amazon + all cards + no preference → Prime Visa 5%', () => {
  const r = recommend({ url: 'https://www.amazon.com/dp/B01', walletCardIds: ALL, preference: 'none', ruleset });
  eq(r.status, 'ok'); eq(r.winner.cardId, 'chase_prime_visa'); eq(r.winner.rate.value, 5);
  ok(/Highest rewards at Amazon/.test(r.reason), 'reason names the merchant: ' + r.reason);
});
t('Chipotle + points preference → Amex Gold 4x', () => {
  const r = recommend({ url: 'https://chipotle.com/order', walletCardIds: ALL, preference: 'points', ruleset });
  eq(r.winner.cardId, 'amex_gold'); eq(r.winner.rate.unit, 'multiplier');
});
t('Whole Foods + cash preference → Blue Cash 6%', () => {
  const r = recommend({ url: 'https://www.wholefoodsmarket.com/', walletCardIds: ALL, preference: 'cash', ruleset });
  eq(r.winner.cardId, 'amex_blue_cash_preferred'); eq(r.winner.rate.value, 6);
});
t('DoorDash maps delivery → Amex Gold 4x on points', () => {
  const r = recommend({ url: 'https://www.doordash.com/store/1', walletCardIds: ALL, preference: 'points', ruleset });
  eq(r.winner.cardId, 'amex_gold'); eq(r.winner.rate.value, 4);
});
t('every ok result carries a non-empty reason', () => {
  for (const url of ['https://amazon.com/','https://target.com/','https://chipotle.com/','https://wholefoodsmarket.com/','https://doordash.com/']) {
    for (const pref of ['cash','points','none']) {
      const r = recommend({ url, walletCardIds: ALL, preference: pref, ruleset });
      if (r.status === 'ok') ok(r.reason && r.reason.length > 3, `missing reason for ${url}/${pref}`);
    }
  }
});

console.log('\nABSTENTION');
t('unknown merchant → no_merchant', () => {
  eq(recommend({ url: 'https://bespoke-lamps.co/', walletCardIds: ALL, preference: 'none', ruleset }).status, 'no_merchant');
});
t('empty wallet → no_cards', () => {
  eq(recommend({ url: 'https://amazon.com/', walletCardIds: [], preference: 'none', ruleset }).status, 'no_cards');
});
t('chrome:// page → no_merchant', () => {
  eq(recommend({ url: 'chrome://newtab', walletCardIds: ALL, preference: 'none', ruleset }).status, 'no_merchant');
});
t('all cards at base rate → all_equal', () => {
  // Target: superstore. Nothing in the ruleset bonuses superstore, so everything is base rate.
  const r = recommend({ url: 'https://target.com/', walletCardIds: ['amex_gold','chase_sapphire_preferred'], preference: 'points', ruleset });
  eq(r.status, 'all_equal');
});
t('single card never claims a comparison', () => {
  const r = recommend({ url: 'https://amazon.com/', walletCardIds: ['chase_prime_visa'], preference: 'none', ruleset });
  eq(r.status, 'ok'); eq(r.isTie, false); eq(r.cashGroup.length, 1);
});

console.log('\nDATA INTEGRITY');
t('every merchant has domains and a known category', () => {
  for (const m of ruleset.merchants) {
    ok(m.domains && m.domains.length, `${m.merchantId} has no domains`);
    ok(ruleset.categories[m.categoryId], `${m.merchantId} → unknown category ${m.categoryId}`);
  }
});
t('every card has a base rate, terms URL and currency', () => {
  for (const c of ruleset.cards) {
    ok(c.base && typeof c.base.value === 'number', `${c.cardId} base rate`);
    ok(/^https:\/\//.test(c.termsUrl), `${c.cardId} termsUrl`);
    ok(c.currency, `${c.cardId} currency`);
  }
});
t('every bonus references a real category or merchant', () => {
  const mids = new Set(ruleset.merchants.map(m => m.merchantId));
  for (const c of ruleset.cards) for (const b of c.bonuses) {
    if (b.match.categoryId) ok(ruleset.categories[b.match.categoryId], `${c.cardId} → ${b.match.categoryId}`);
    if (b.match.merchantId) ok(mids.has(b.match.merchantId), `${c.cardId} → ${b.match.merchantId}`);
  }
});
t('every bonus carries verification metadata', () => {
  for (const c of ruleset.cards) for (const b of c.bonuses) {
    ok('verified' in b && 'verifiedAt' in b, `${c.cardId} bonus missing verification fields`);
  }
});
t('units are consistent with currency', () => {
  for (const c of ruleset.cards) {
    const expected = c.currency === 'cash' ? 'percent' : 'multiplier';
    eq(c.base.unit, expected, `${c.cardId} base unit`);
    for (const b of c.bonuses) eq(b.unit, expected, `${c.cardId} bonus unit`);
  }
});

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
