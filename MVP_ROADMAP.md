# Cardnal MVP Roadmap

**Document status:** Living project document  
**Last updated:** 2026-08-03  
**Owner:** Cardnal technical founder  
**Product:** Cardnal — recommend the right card to use before a purchase.

> This document is the source of truth for MVP scope, decisions, progress, risks, and handoffs. Every contributor or agent must read it before starting work and update it before handing work off.

---

## 1. Product vision

Cardnal helps people get more value from the credit cards they already own by answering:

> **“Which card should I use for this purchase?”**

The first product should make a useful recommendation quickly, explain why it made that recommendation, and avoid asking for sensitive financial credentials.

### Core user promise

> Add the cards you already own, search for a merchant or spending category, and Cardnal tells you which card is likely to earn the best rewards.

### Initial target user

People who own multiple rewards cards and know they may be leaving rewards on the table, but do not remember every card’s rules.

---

## 2. Current state

### Existing marketing site

The repository currently contains a polished static landing page and waitlist flow:

- `index.html` — landing page and interactive product preview
- `netlify/functions/waitlist.js` — server-side waitlist endpoint
- `netlify.toml` — Netlify deployment and API redirect configuration
- `supabase-setup.sql` — waitlist table and RLS setup
- `README.md` — current deployment instructions

### Current deployment reality

The site is configured for **Netlify**, not Vercel. Do not migrate it merely for consistency. Keep it on Netlify unless there is a concrete benefit to moving it.

The product application can be deployed separately, likely on Vercel, with its own repository and environment variables.

### Infrastructure assumptions

- Domain: `getcardnal.com`, registered through Porkbun
- Early company email: one shared Gmail account plus Porkbun forwarding/SMTP aliases
- GitHub: one Cardnal organization with separate site and product repositories
- Supabase: development and production environments, not necessarily separate unrelated databases for site and product

### Explicitly not built yet

- Product authentication
- User profiles
- Card catalog
- User-owned card collection
- Merchant/category search
- Reward rules engine
- Recommendation API/UI
- Admin workflow for maintaining card and reward data
- Product analytics
- Legal documents and production privacy review

---

## 3. MVP paths

There are several valid paths. They differ mainly in how much product infrastructure is built before validating demand.

### Path A — Concierge/manual MVP

**Goal:** Validate whether users value Cardnal recommendations before building a full application.

#### Experience

1. User joins the waitlist.
2. User submits the cards they own through a simple form or onboarding call.
3. User sends a merchant/category question.
4. Cardnal returns a recommendation manually or through an internal spreadsheet/tool.

#### Build

- Improve waitlist and add a short research form.
- Create a private spreadsheet or admin table for cards and rewards.
- Build a minimal internal recommendation worksheet.
- Send recommendations by email.

#### Advantages

- Fastest path to real user conversations.
- Lowest engineering and data-maintenance cost.
- Reveals whether users trust and act on recommendations.
- Useful for discovering confusing reward-rule edge cases.

#### Disadvantages

- Not self-serve.
- Recommendations do not scale.
- Harder to measure product retention accurately.
- Requires founder/operator time.

#### Best use

Run this alongside application development or as a one- to two-week validation sprint. It should not be mistaken for the final product.

---

### Path B — Rules-first web MVP (recommended)

**Goal:** Build the smallest self-serve product that proves the core recommendation loop.

#### Experience

1. User signs up.
2. User selects cards from a curated catalog.
3. User searches for a merchant or selects a category.
4. Cardnal shows the best eligible card, reward rate, and explanation.
5. User can change their card collection and search again.

#### Build

- Supabase Auth.
- Profiles and user-owned cards.
- Curated card catalog.
- Merchants/categories.
- Versioned reward rules.
- Deterministic recommendation endpoint.
- Mobile-first product UI.
- Basic feedback event: useful/not useful.

#### Advantages

- Directly tests the core product promise.
- No bank integrations or transaction data required.
- Easy to explain to users.
- Reasonable scope for a first technical product.
- Recommendation behavior can be tested deterministically.

#### Disadvantages

- Reward data requires careful research and maintenance.
- Users must manually select cards.
- Merchant matching will initially be incomplete.
- Does not yet prove automated transaction-level value.

#### Best use

This is the recommended MVP path after the landing page and waitlist are operational.

---

### Path C — Rules-first mobile app

**Goal:** Deliver the same core experience as Path B as a native or cross-platform mobile app.

#### Advantages

- Better fit for an in-the-moment purchase decision.
- Future access to location, widgets, notifications, and mobile shortcuts.
- Stronger long-term product surface.

#### Disadvantages

- Slower iteration and higher build cost.
- App-store review and release overhead.
- Authentication, deep links, analytics, and mobile UX add scope.
- Does not solve the initial reward-data problem.

#### Best use

Do this after a web MVP demonstrates repeated usage, unless user research strongly proves a mobile-only workflow is essential.

---

### Path D — Bank/card integrations first

**Goal:** Automatically discover cards or transactions through financial-data integrations.

#### Advantages

- Less manual setup for users.
- Potentially more automated recommendations.
- Could support transaction-level insights later.

#### Disadvantages

- Significant security, privacy, legal, vendor, and reliability complexity.
- Integration costs and vendor dependency.
- Sensitive financial data creates a much higher risk profile.
- Slows validation of the basic recommendation value.

#### Best use

Do not use this for the first MVP. Revisit only after proving that users want recommendations and manual card selection is a meaningful adoption barrier.

---

### Recommended sequence

Use a combined sequence:

1. **Concierge validation:** interview and manually help early waitlist users.
2. **Rules-first web MVP:** build the self-serve core loop.
3. **Mobile surface:** only after repeated usage is demonstrated.
4. **Integrations:** only when evidence shows they unlock meaningful retention or conversion.

---

## 4. MVP scope

### Must have

- Account creation and sign-in.
- User can select cards they own from a curated list.
- User can remove or update cards.
- User can search a merchant or choose a category.
- System returns a best-card recommendation.
- Recommendation includes reward rate and plain-language reason.
- System displays data freshness/source context where relevant.
- Basic error, loading, and empty states.
- Mobile-responsive UI.
- Secure row-level access controls.
- Basic event tracking and user feedback.

### Should have

- Merchant aliases and normalized search.
- “No clear winner” response when rules are incomplete or tied.
- Reward caps and minimum-spend conditions where known.
- Effective dates for rotating or expiring rules.
- Admin-only workflow for editing cards, merchants, and rules.
- Email feedback or onboarding follow-up.

### Not in MVP

- Bank or issuer login.
- Storage of full card numbers, CVVs, or banking credentials.
- Automatic transaction monitoring.
- Guaranteed rewards or financial advice claims.
- Complete coverage of every card and merchant.
- Native mobile app.
- Social features.
- Automated statement reconciliation.
- Complex points valuation across travel programs.
- Paid subscriptions before value and retention are validated.

---

## 5. Product architecture

### Repositories

Use one GitHub organization with at least:

```text
cardnal-site     # marketing site and waitlist
cardnal-app      # product application
```

A private infrastructure/data repository can be added later for shared migrations, seed data, and operational documentation. Do not store secrets in any repository.

### Deployments

```text
getcardnal.com / www.getcardnal.com  -> marketing site (Netlify initially)
app.getcardnal.com                  -> product app (Vercel likely)
```

The app may use a framework such as Next.js, but the choice must be recorded in the decision log before implementation.

### Supabase environments

Use separate projects for:

```text
cardnal-development
cardnal-production
```

The landing-site waitlist can remain in the production project initially, or move into a dedicated site project if access boundaries require it. Decide explicitly; do not create duplicated databases without a reason.

### Environment rules

- Development and production credentials must be different.
- The Supabase service-role key is server-only.
- Browser-exposed Supabase keys must be protected by RLS.
- `.env` files must remain ignored and uncommitted.
- Production credentials must be stored in the deployment provider’s secret store.

---

## 6. Proposed data model

Use Supabase migrations as the source of truth. Do not make production-only dashboard edits without creating a migration afterward.

### Supabase Auth

Use `auth.users` for authentication. Never implement or store passwords in application tables.

### `profiles`

```text
id              uuid primary key -> auth.users.id
 display_name    text nullable
created_at      timestamptz
updated_at      timestamptz
```

### `cards`

The canonical catalog of supported cards.

```text
id              uuid primary key
issuer          text not null
name            text not null
network         text nullable
annual_fee      numeric nullable
is_active       boolean not null
source_url      text nullable
created_at      timestamptz
updated_at      timestamptz
```

### `user_cards`

Cards selected by a user.

```text
id              uuid primary key
user_id         uuid -> auth.users.id
card_id         uuid -> cards.id
nickname        text nullable
is_active       boolean not null
created_at      timestamptz
updated_at      timestamptz
```

Add a unique constraint on `(user_id, card_id)`.

### `merchants`

```text
id              uuid primary key
name            text not null
normalized_name text not null
category        text nullable
website         text nullable
is_active       boolean not null
created_at      timestamptz
updated_at      timestamptz
```

### `merchant_aliases`

Optional but recommended once search begins.

```text
id              uuid primary key
merchant_id     uuid -> merchants.id
alias           text not null
normalized_alias text not null
```

### `reward_rules`

The core rules table. Rules must be time-aware and source-backed.

```text
id                  uuid primary key
card_id             uuid -> cards.id
merchant_id         uuid nullable -> merchants.id
category            text nullable
reward_rate         numeric not null
reward_type         text not null
spend_cap           numeric nullable
cap_period          text nullable
effective_from      date not null
effective_until     date nullable
terms_url           text nullable
source              text nullable
notes               text nullable
is_active           boolean not null
created_at          timestamptz
updated_at          timestamptz
```

A rule should identify either a merchant, a category, or a documented general/default case. Avoid silently treating missing data as zero rewards.

### `recommendation_events`

Use this for product analytics and debugging, not transaction surveillance.

```text
id                    uuid primary key
user_id               uuid nullable -> auth.users.id
merchant_id           uuid nullable -> merchants.id
category              text nullable
recommended_card_id  uuid nullable -> cards.id
reward_rate           numeric nullable
result                text not null
created_at            timestamptz
```

Do not store full card numbers, banking credentials, transaction amounts, or transaction histories in the MVP.

---

## 7. Recommendation behavior

### Initial deterministic algorithm

Given a user’s active cards and a merchant/category:

1. Normalize the user’s search input.
2. Resolve the input to a merchant, alias, or category.
3. Load currently active rules whose effective dates include today.
4. Restrict candidates to cards in the user’s `user_cards` collection.
5. Prefer merchant-specific rules over category rules.
6. Apply known caps and eligibility constraints.
7. Rank by effective reward value.
8. Return the winner, alternatives, explanation, source, and freshness.
9. If rules are missing, conflicting, or ambiguous, say so clearly instead of fabricating precision.

### Recommendation response shape

The API contract should eventually resemble:

```json
{
  "query": "Amazon",
  "matchedMerchant": "Amazon",
  "recommendation": {
    "cardId": "...",
    "cardName": "Prime Visa",
    "rewardRate": 5,
    "rewardType": "cashback",
    "reason": "Highest known reward for this merchant."
  },
  "alternatives": [],
  "dataFreshness": "2026-08-03",
  "disclaimer": "Rewards and terms can change. Verify current terms before applying a card."
}
```

### Trust requirements

- Show why a card won.
- Cite or link to a source when practical.
- Show when a rule was last reviewed.
- Represent uncertainty.
- Never claim a guaranteed return.
- Preserve enough rule/version information to debug a recommendation later.

---

## 8. Data operations and admin plan

Reward data is a product dependency, not a one-time seed task.

### Initial data strategy

Start with a narrow, high-confidence catalog:

- 10–20 commonly held cards.
- 20–50 common merchants/categories.
- Only rules that can be verified from issuer terms or official sources.

Do not promise complete card coverage at launch.

### Admin requirements

Before expanding coverage, create a restricted admin workflow or documented seed process to:

- Add and deactivate cards.
- Add merchants and aliases.
- Add/version reward rules.
- Record source URLs and review dates.
- Flag stale rules.
- Review user-reported incorrect recommendations.

No user should be able to modify the canonical reward catalog through normal client-side permissions.

---

## 9. Security, privacy, and legal boundaries

### MVP security requirements

- Supabase RLS enabled on all user-owned tables.
- Users can only read/write their own profiles and `user_cards`.
- Public clients cannot modify cards or reward rules.
- Admin operations require server-side authorization.
- Service-role keys never reach the browser.
- Validate input on both client and server.
- Rate-limit public endpoints.
- Log operational errors without logging secrets or sensitive user data.
- Use HTTPS in every deployed environment.
- Enable 2FA on Porkbun, GitHub, Netlify, Vercel, Supabase, and email accounts.

### Product language

Cardnal should be framed as an informational rewards tool, not a financial advisor. Include appropriate language that:

- Rewards and issuer terms can change.
- Recommendations are based on available data.
- Users should verify current terms.
- Cardnal does not guarantee rewards.

Before public launch, review privacy, terms, data retention, affiliate disclosures, and applicable financial-product marketing requirements with qualified counsel.

---

## 10. Execution phases

### Phase 0 — Accounts and foundations

- [ ] Confirm Porkbun access and domain renewal ownership.
- [ ] Configure `hello@getcardnal.com` and `admin@getcardnal.com` forwarding/SMTP.
- [ ] Secure shared Gmail with 2FA and recovery codes.
- [ ] Create Cardnal GitHub organization.
- [ ] Create `cardnal-site` and `cardnal-app` repositories.
- [ ] Create deployment teams/projects.
- [ ] Create development Supabase project.
- [ ] Document production project ownership and access.
- [ ] Add a shared password-vault process.

**Exit criteria:** founders can independently access the company organizations, deploy safely, and recover accounts.

### Phase 1 — Waitlist and validation

- [ ] Deploy the current landing site.
- [ ] Connect the site waitlist to Supabase.
- [ ] Test duplicate, invalid, rate-limit, and failure cases.
- [ ] Add basic analytics with privacy-conscious settings.
- [ ] Interview initial signups.
- [ ] Run concierge recommendations for a small cohort.
- [ ] Record the most-requested merchants, cards, and questions.

**Exit criteria:** evidence that target users understand the promise and want recommendations for real purchases.

### Phase 2 — Product foundation

- [ ] Choose app framework and record the decision.
- [ ] Bootstrap app repository and local development.
- [ ] Configure development environment variables.
- [ ] Add Supabase Auth.
- [ ] Add migrations for profiles, cards, user cards, merchants, and reward rules.
- [ ] Add RLS policies and tests.
- [ ] Seed the first narrow catalog.
- [ ] Add CI for linting, type checks, and tests.

**Exit criteria:** a test user can sign in, select cards, and data remains isolated correctly.

### Phase 3 — Recommendation loop

- [ ] Build merchant/category search.
- [ ] Build rule matching and ranking service.
- [ ] Add recommendation API contract.
- [ ] Build recommendation result UI.
- [ ] Add source/freshness/disclaimer display.
- [ ] Add empty, ambiguous, and no-data states.
- [ ] Add useful/not-useful feedback.
- [ ] Record recommendation events without sensitive transaction data.

**Exit criteria:** a user can complete the core loop in under one minute and understand the result.

### Phase 4 — Private beta

- [ ] Invite a small group of waitlist users.
- [ ] Monitor errors and recommendation feedback.
- [ ] Review incorrect or stale rules weekly.
- [ ] Measure activation, repeat searches, and useful feedback.
- [ ] Improve onboarding and merchant matching.
- [ ] Document support and incident procedures.

**Exit criteria:** users return voluntarily and recommendation quality is acceptable for the supported catalog.

### Phase 5 — Public MVP launch

- [ ] Production Supabase project reviewed and migrated.
- [ ] Production environment variables configured.
- [ ] Domain and app subdomain configured.
- [ ] Privacy policy and terms published.
- [ ] Monitoring and backups verified.
- [ ] Abuse/rate-limit controls tested.
- [ ] Support inbox tested.
- [ ] Launch checklist completed.

**Exit criteria:** the product can safely support early public users with known limitations clearly disclosed.

---

## 11. Success metrics

Track only metrics that inform product decisions.

### Activation

- Percentage of new users who add at least one card.
- Percentage who complete a first search.
- Time from signup to first recommendation.

### Value

- Repeat searches per active user.
- Useful/not-useful feedback rate.
- Recommendation click-through or saved result rate.
- Percentage of supported queries with a confident result.

### Retention

- Users returning within 7 and 30 days.
- Repeat usage across different merchants/categories.
- Qualitative reports of using Cardnal before purchases.

### Data quality

- Stale rules awaiting review.
- User-reported incorrect results.
- Recommendation errors and no-data rate.

Do not optimize for waitlist size alone. A smaller group that repeatedly uses recommendations is more valuable evidence.

---

## 12. Key risks and mitigations

| Risk | Mitigation |
|---|---|
| Reward rules become stale | Store effective dates, sources, and review dates; start with a narrow catalog |
| Recommendations are overconfident | Show explanations, sources, freshness, and uncertainty |
| Users do not want manual setup | Validate with concierge interviews before building integrations |
| Sensitive financial data creates exposure | Do not collect bank credentials, full card numbers, or transactions in MVP |
| Site and app environments become confused | Keep repositories, projects, variables, and deployment targets explicit |
| Shared account becomes a single point of failure | Use 2FA, recovery codes, password vault, and named organization members |
| Scope expands too early | Treat integrations, native mobile, and broad card coverage as post-MVP |
| Data model cannot represent changing rewards | Use versioned, time-bounded reward rules from the beginning |

---

## 13. Decision log

Record decisions here. Each entry should include the date, decision, context, and consequences.

| Date | Decision | Reason / consequence |
|---|---|---|
| 2026-08-03 | Keep the existing marketing site on Netlify initially. | It already uses Netlify functions and configuration; migration is not currently justified. |
| 2026-08-03 | Use a separate product repository and likely Vercel project. | Keeps marketing and application deployment concerns independent. |
| 2026-08-03 | Prefer separate Supabase development and production environments. | Prevents test data and schema changes from affecting real users. |
| 2026-08-03 | Recommended MVP path is rules-first web app, preceded by concierge validation. | Tests the core value without bank integrations or sensitive financial data. |
| 2026-08-03 | Do not require Google Workspace yet. | Use Porkbun forwarding/SMTP and one secured shared Gmail account while the team is small. |

_Add new decisions; do not silently rewrite old decisions. If a decision changes, add a new row explaining why._

---

## 14. Current status

Update this section at the end of every meaningful work session.

### In progress

- [ ] Establish company-owned accounts and access.
- [ ] Decide product app framework.
- [ ] Create the product repository.
- [ ] Create the development Supabase project.

### Completed

- [x] Purchase `getcardnal.com` through Porkbun.
- [x] Build initial marketing landing page.
- [x] Build initial waitlist function and Supabase schema.
- [x] Define separate marketing-site and product-app direction.
- [x] Replace the landing page with a focused branded waitlist page.

### Blocked / needs decision

- [ ] Confirm exact company email forwarding and SMTP configuration.
- [ ] Confirm GitHub organization owner and second admin.
- [ ] Choose product framework.
- [ ] Choose initial card/merchant catalog.

### Next three actions

1. Deploy the branded waitlist page and test the live `/api/waitlist` endpoint.
2. Create and secure the company-owned GitHub/deployment/Supabase organizations.
3. Create the `cardnal-app` repository and bootstrap local development.

---

## 15. Agent and contributor handoff instructions

These instructions are mandatory for every coding agent, human contributor, or future session working on Cardnal.

### Before starting work

1. Read this entire file, especially **Current State**, **MVP Scope**, **Current Status**, and **Decision Log**.
2. Inspect the relevant repository files before proposing changes.
3. Check existing work and do not overwrite or discard changes you did not create.
4. Identify which phase and checklist item the task belongs to.
5. Confirm the task does not expand the MVP beyond the stated non-goals.
6. If requirements conflict with this document, stop and record the conflict in the handoff notes before coding.

### While working

1. Keep changes narrowly scoped to the assigned task.
2. Follow existing project conventions.
3. Never commit secrets, service-role keys, personal credentials, or real user data.
4. Add or update tests for behavior that can regress.
5. Use migrations for database changes.
6. Preserve backward compatibility unless the task explicitly authorizes a breaking change.
7. Record new assumptions and decisions in the Decision Log.
8. Update relevant checklist items only when they are actually complete.

### Before handing off

The contributor must update this document in the same change whenever applicable:

- **Current status:** mark completed/in-progress/blocked items.
- **Next three actions:** replace with the most useful next steps.
- **Decision log:** add decisions made during the task.
- **Risks:** add newly discovered risks or remove resolved ones with explanation.
- **Data model/API sections:** update them if schemas or contracts changed.
- **Last updated:** set to the current date.

The handoff must include:

```text
Task:
What changed:
Files changed:
Tests/checks run:
What passed:
What failed or was not run:
Current status:
Known limitations:
Open questions:
Recommended next action:
Environment/secret setup needed:
```

### Handoff quality rules

- Do not say “done” if tests were not run; say what was and was not verified.
- Do not hide failed checks or known limitations.
- Do not leave undocumented schema, API, or deployment changes.
- Do not ask the next agent to rediscover information that can be recorded here.
- If work is incomplete, leave the repository in a coherent state and document the exact continuation point.
- If blocked, document the blocker and the decision needed rather than making an irreversible assumption.

### Required final response format for agents

Every agent should end its work with a concise summary using this structure:

```markdown
## Handoff

### Completed
- ...

### Verification
- ...

### Not completed / blocked
- ...

### Files changed
- ...

### Roadmap updates
- ...

### Next recommended action
- ...
```

### Updating this document is part of the task

Any agent that changes product architecture, scope, deployment, data model, security behavior, or project status must update `MVP_ROADMAP.md` before handing off. A handoff without the corresponding roadmap update is incomplete.

---

## 16. MVP definition of done

Cardnal MVP is ready for a controlled public launch when:

- A new user can sign up securely.
- A user can select and manage cards they own.
- A user can search supported merchants/categories.
- The system returns a deterministic recommendation or clearly explains why it cannot.
- The recommendation includes a reason, source/freshness context, and disclaimer.
- User data is isolated through tested RLS policies.
- No sensitive financial credentials are collected.
- The initial catalog has documented sources and review dates.
- Production deployment, environment variables, backups, logging, and rate limits are verified.
- Privacy and terms pages are available.
- A small beta group has completed the core loop and provided feedback.
- Known limitations are visible and documented.
- This roadmap’s status, decisions, and next actions are current.
