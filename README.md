# Cardnal waitlist site

Branded Cardnal landing page and waitlist endpoint.

## Project files

- `index.html` — landing page and waitlist form
- `api/waitlist.js` — Vercel serverless endpoint
- `supabase-setup.sql` — waitlist table and security setup
- `MVP_ROADMAP.md` — living product roadmap and handoff instructions

## Supabase setup

1. Open the Cardnal Supabase project.
2. Go to **SQL Editor → New query**.
3. Paste and run `supabase-setup.sql`.
4. Confirm that `public.waitlist` exists in **Table Editor**.

## Deploy to Vercel

Import this GitHub repository into Vercel with:

- Framework preset: **Other**
- Root directory: repository root
- Build command: blank
- Output directory: blank

Add these Vercel environment variables for Preview and Production:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

The service-role key must never be committed or placed in `index.html`. After adding variables, redeploy the project.

## Test the waitlist

Open the deployed Vercel URL and submit a new email. Confirm the row appears in Supabase. Then test:

- Invalid email
- Duplicate email
- Empty email
- Temporary server failure behavior

The browser submits to `/api/waitlist`; Vercel maps that URL to `api/waitlist.js`.

## Custom domain

In Vercel, open **Project → Settings → Domains** and add:

```text
getcardnal.com
www.getcardnal.com
```

Add the exact DNS records Vercel displays in Porkbun. Do not remove Porkbun email records such as MX, SPF, DKIM, or DMARC.
