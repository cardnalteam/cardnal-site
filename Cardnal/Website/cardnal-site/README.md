# Cardnal — landing page + waitlist

```
index.html                     the page
netlify.toml                   build config + /api/waitlist route
netlify/functions/waitlist.js  serverless endpoint (holds the Supabase key)
supabase-setup.sql             table schema
```

## 1. Supabase

Open your project → **SQL Editor** → paste `supabase-setup.sql` → Run.

That creates `public.waitlist` with `id` (uuid), `email` (text, unique), and
`created_at` (timestamptz), plus a case-insensitive unique index. It also turns
on Row Level Security with **no policies**, which means the anon key can't read
or write the table at all — only the serverless function, using the service-role
key, can insert. Nobody can scrape your signup list from the browser.

## 2. Netlify environment variables

Site settings → Environment variables → add both:

| Key | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` secret |

The service-role key bypasses RLS, so it must never be committed to git or
referenced in client-side JavaScript. It's read only inside the function via
`process.env`.

## 3. Deploy

```bash
netlify deploy --prod
```

Or drag the folder into the Netlify dashboard. Functions are picked up
automatically from `netlify/functions`.

To run locally with the function working:

```bash
npm i -g netlify-cli
netlify dev          # serves the page and /api/waitlist together
```

Plain `python3 -m http.server` will serve the page, but signups will fail
because there's no function runtime.

## How the signup works

Browser posts `{ email }` to `/api/waitlist`. The function validates the email,
rate-limits by IP (6 requests/minute), lowercases the address, and inserts.

| Response | What the page shows |
|---|---|
| `201` | Green button, "You're in. We'll email you when your spot opens up." |
| `409` duplicate | "That email is already on the list — you're all set." |
| `400` invalid | Red border on the field + the reason |
| `429` rate limited | "Too many attempts. Give it a minute and try again." |
| `500`/`502` | "Something went wrong on our end. Try again in a moment." |
| network failure | "Couldn't reach the server. Check your connection and try again." |

Duplicates are detected from Postgres error `23505` (unique violation), so the
check is race-free — two simultaneous submissions can't both succeed.

## Notes

- Merchant and card names are plain text; no third-party logos are reproduced.
  Get licensing before adding real brand marks.
- The waitlist email is the only data collected. No card details are requested
  anywhere in the flow.
