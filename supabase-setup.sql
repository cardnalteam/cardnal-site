-- Cardnal waitlist table
create table if not exists public.waitlist (
  id          uuid         primary key default gen_random_uuid(),
  email       text         not null unique,
  created_at  timestamptz  not null default now()
);

-- case-insensitive uniqueness (the function lowercases, this is belt-and-braces)
create unique index if not exists waitlist_email_lower_idx
  on public.waitlist (lower(email));

-- Lock the table down. RLS on with no policies means anon/authenticated keys
-- cannot read or write it at all. The serverless function uses the service-role
-- key, which bypasses RLS -- so signups still work, but nobody can scrape the
-- list from the browser.
alter table public.waitlist enable row level security;
