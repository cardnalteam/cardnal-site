# Rate verification — do this before anyone outside the team installs

**Every rule in `data/ruleset.json` has `verified: false`.** The values were seeded
from general knowledge of published card terms. Nobody has opened an issuer page
and checked them. Until that happens, treat the whole dataset as a draft.

## The job

For each bonus in each card:

1. Open the card's `termsUrl`.
2. Find the rate, the category wording, any cap, and any exclusions.
3. Correct the JSON if it differs.
4. Set `"verified": true`, `"verifiedAt": "YYYY-MM-DD"`, `"verifiedBy": "<initials>"`.

**5 cards × ~3 rules = ~15 checks.** Perhaps an hour. At 35 cards it's a recurring
job, not a one-off — which is the real reason to keep the card count low.

## What to watch for

| Trap | Why it matters |
|---|---|
| "US supermarkets" excludes Target and Walmart | Blue Cash Preferred and Amex Gold both have this. Encoded via `excludesMerchants`. |
| Caps reset on a calendar year vs. cardmember year | Different issuers differ. `cap.period` must match the terms. |
| Rotating categories | None in this 5-card set, deliberately. They expire quarterly and need a different update cadence. |
| Rates that require enrolment or membership | Prime Visa's 5% needs an active Prime membership. Recorded in `note`. |
| Delivery coded as dining | Both Amex Gold and Sapphire treat DoorDash as dining. Encoded as an explicit `delivery` bonus rather than relying on category inheritance. |

## Cadence once live

- **Quarterly:** re-check every card with a rotating category.
- **On issuer announcement:** Chase/Amex publish changes ahead of time; watch the terms pages.
- **Every rule shows its age in the UI** once `verifiedAt` is populated — stale data becomes visible rather than silent.
