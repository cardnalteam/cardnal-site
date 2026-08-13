/* Cardnal v0.1 — recommendation engine.
 *
 * Pure functions. No chrome.* APIs, no DOM. Everything it knows comes from
 * ruleset.json, so updating reward rates never touches this file.
 *
 * Exported as an ES module so the same code runs in the popup and in Node tests.
 */

export const TIE_THRESHOLD_PCT = 0.25; // below this spread, we don't claim a winner

// ---------------------------------------------------------------- merchant

/** Normalise a hostname for matching: lowercase, strip www. and trailing dot. */
export function normaliseHost(host) {
  return String(host || '').toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
}

/**
 * Identify the merchant from a URL. Exact host match only — no fuzzy matching,
 * because a near-match on a lookalike domain is a wrong answer, not a helpful one.
 * Returns null when the host isn't in the ruleset.
 */
export function identifyMerchant(url, ruleset) {
  let host, path;
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    host = normaliseHost(u.hostname);
    path = u.pathname || '/';
  } catch {
    return null;
  }

  for (const m of ruleset.merchants) {
    const hit = m.domains.some(d => {
      const dn = normaliseHost(d);
      return host === dn || host.endsWith('.' + dn);
    });
    if (!hit) continue;

    // path overrides can change the category (Amazon Fresh vs Amazon retail)
    let categoryId = m.categoryId;
    let categorySource = 'domain';
    for (const o of (m.pathOverrides || [])) {
      if (path.startsWith(o.startsWith)) {
        categoryId = o.categoryId;
        categorySource = 'path';
        break;
      }
    }
    return {
      merchantId: m.merchantId,
      name: m.name,
      categoryId,
      categorySource,
      confidence: m.confidence || 'medium',
      note: m.note || null
    };
  }
  return null;
}

// ---------------------------------------------------------------- rates

/**
 * Which rule applies for this card at this merchant/category.
 * Precedence: merchant-specific bonus > category bonus > base rate.
 * Where two bonuses tie, the merchant-specific one wins.
 */
export function resolveRate(card, context) {
  const { merchantId, categoryId } = context;
  let best = null;

  for (const b of (card.bonuses || [])) {
    if (b.excludesMerchants && b.excludesMerchants.includes(merchantId)) continue;

    const matchesMerchant = b.match.merchantId && b.match.merchantId === merchantId;
    const matchesCategory = b.match.categoryId && b.match.categoryId === categoryId;
    if (!matchesMerchant && !matchesCategory) continue;

    const candidate = {
      value: b.value,
      unit: b.unit,
      source: matchesMerchant ? 'merchant_bonus' : 'category_bonus',
      specificity: matchesMerchant ? 2 : 1,
      note: b.note || null,
      cap: b.cap || null,
      verified: b.verified === true,
      verifiedAt: b.verifiedAt || null
    };
    if (!best || candidate.specificity > best.specificity || candidate.value > best.value) {
      best = candidate;
    }
  }

  if (best) return best;

  return {
    value: card.base.value,
    unit: card.base.unit,
    source: 'base_rate',
    specificity: 0,
    note: null,
    cap: null,
    verified: false,
    verifiedAt: null
  };
}

// ---------------------------------------------------------------- ranking

/**
 * Rank a wallet for one merchant.
 *
 * Cash and points are ranked in SEPARATE groups and never converted into one
 * another — a point's value depends on how it's redeemed, and we don't know that.
 * Different point currencies (MR vs UR) are also separate groups.
 */
export function rankCards(walletCardIds, context, ruleset, preference = 'none') {
  const byId = Object.fromEntries(ruleset.cards.map(c => [c.cardId, c]));
  const cards = walletCardIds.map(id => byId[id]).filter(Boolean);

  const scored = cards.map(card => {
    const rate = resolveRate(card, context);
    return {
      cardId: card.cardId,
      displayName: card.displayName,
      issuer: card.issuer,
      colorHex: card.colorHex,
      currency: card.currency,
      currencyLabel: card.currencyLabel,
      annualFeeCents: card.annualFeeCents,
      foreignTxFeePct: card.foreignTxFeePct,
      termsUrl: card.termsUrl,
      rate
    };
  });

  // group by currency — comparison only ever happens inside a group
  const groups = {};
  for (const s of scored) (groups[s.currency] ||= []).push(s);
  for (const k of Object.keys(groups)) {
    groups[k].sort((a, b) =>
      b.rate.value - a.rate.value ||
      a.annualFeeCents - b.annualFeeCents ||      // tiebreak: cheaper card
      a.cardId.localeCompare(b.cardId)            // deterministic last resort
    );
  }

  const cashGroup = groups.cash || [];
  const pointGroups = Object.entries(groups)
    .filter(([k]) => k !== 'cash')
    .map(([currency, list]) => ({ currency, list }));

  // pick the headline card according to stated preference
  let winner = null;
  let winnerBasis = null;

  const bestCash = cashGroup[0] || null;
  const bestPoints = pointGroups
    .map(g => g.list[0])
    .sort((a, b) => b.rate.value - a.rate.value || a.cardId.localeCompare(b.cardId))[0] || null;

  if (preference === 'cash') {
    winner = bestCash || bestPoints;
    winnerBasis = bestCash ? 'preference_cash' : 'only_option';
  } else if (preference === 'points') {
    winner = bestPoints || bestCash;
    winnerBasis = bestPoints ? 'preference_points' : 'only_option';
  } else {
    // No preference. We can't compare cash to points, so we prefer the one whose
    // value is certain — cash — and surface the points winner alongside it.
    winner = bestCash || bestPoints;
    winnerBasis = bestCash && bestPoints ? 'no_preference_prefers_cash'
                : bestCash ? 'only_cash' : 'only_points';
  }

  // is the winner's group actually differentiated, or does everything tie?
  const winnerGroup = winner ? (groups[winner.currency] || []) : [];
  const spread = winnerGroup.length > 1
    ? winnerGroup[0].rate.value - winnerGroup[1].rate.value
    : null;
  const isTie = spread !== null && spread < TIE_THRESHOLD_PCT;

  return {
    winner,
    winnerBasis,
    isTie,
    spread,
    cashGroup,
    pointGroups,
    allGroups: groups
  };
}

// ---------------------------------------------------------------- explanation

/** One sentence saying why the winner won. Required — never null when status is ok. */
export function explain(result, context, ruleset, preference) {
  const w = result.winner;
  if (!w) return null;
  const catLabel = (ruleset.categories[context.categoryId] || {}).label || context.categoryId;
  const rateStr = w.rate.unit === 'percent' ? `${w.rate.value}%` : `${w.rate.value}x`;

  if (result.isTie) {
    const runnerUp = (result.allGroups[w.currency] || [])[1];
    if (w.annualFeeCents === 0 && runnerUp && runnerUp.annualFeeCents > 0) {
      return `Ties with ${runnerUp.displayName} at ${rateStr} — this one has no annual fee.`;
    }
    return `Several cards earn ${rateStr} here. Use whichever you prefer.`;
  }

  if (w.rate.source === 'merchant_bonus') {
    return `Highest rewards at ${context.merchantName} — ${rateStr}.`;
  }
  if (w.rate.source === 'category_bonus') {
    return `${catLabel} bonus — earns ${rateStr} here.`;
  }
  return `Earns ${rateStr} here, more than your other cards.`;
}

// ---------------------------------------------------------------- top level

/**
 * The single entry point the popup calls.
 * Always returns a status; "we don't know" is a first-class result.
 */
export function recommend({ url, walletCardIds, preference, ruleset }) {
  const base = { rulesetVersion: ruleset.rulesetVersion, publishedAt: ruleset.publishedAt };

  if (!walletCardIds || walletCardIds.length === 0) {
    return { status: 'no_cards', ...base };
  }

  const merchant = identifyMerchant(url, ruleset);
  if (!merchant) {
    return { status: 'no_merchant', ...base };
  }
  if (merchant.confidence === 'low') {
    return { status: 'low_confidence', merchant, ...base };
  }

  const context = {
    merchantId: merchant.merchantId,
    merchantName: merchant.name,
    categoryId: merchant.categoryId
  };

  const ranked = rankCards(walletCardIds, context, ruleset, preference);
  if (!ranked.winner) {
    return { status: 'no_cards', merchant, ...base };
  }

  const allSame = Object.values(ranked.allGroups)
    .every(g => g.length <= 1 || (g[0].rate.value - g[g.length - 1].rate.value) < TIE_THRESHOLD_PCT);
  const onlyBaseRates = Object.values(ranked.allGroups)
    .flat().every(c => c.rate.source === 'base_rate');

  if (allSame && onlyBaseRates && ranked.cashGroup.length + ranked.pointGroups.length > 1) {
    return {
      status: 'all_equal',
      merchant, context,
      groups: ranked.allGroups,
      categoryLabel: (ruleset.categories[context.categoryId] || {}).label,
      ...base
    };
  }

  return {
    status: 'ok',
    merchant,
    context,
    categoryLabel: (ruleset.categories[context.categoryId] || {}).label,
    winner: ranked.winner,
    winnerBasis: ranked.winnerBasis,
    isTie: ranked.isTie,
    cashGroup: ranked.cashGroup,
    pointGroups: ranked.pointGroups,
    reason: explain(ranked, context, ruleset, preference),
    unverifiedData: true, // every rule in v0.1 ships unverified — surfaced in the UI
    ...base
  };
}
