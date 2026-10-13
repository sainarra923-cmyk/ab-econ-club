-- GENERATED FILE. Paste this whole file into Supabase > SQL Editor and click Run.
-- To change it, edit supabase/schema.sql or src/content/placeholder.json and run: node scripts/build-setup-sql.mjs

-- AB Econ Club database setup.
-- Safe to run more than once.

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  slug text not null unique,
  title text,
  grade text,
  bio text,
  photo_url text,
  is_admin boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text not null default '',
  cover_url text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  emailed_at timestamptz,
  author_id uuid references public.profiles (id) on delete set null,
  byline text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Added after first release; keeps older databases in sync.
alter table public.posts add column if not exists byline text;

create index if not exists posts_published_idx on public.posts (status, published_at desc);
create index if not exists posts_tags_idx on public.posts using gin (tags);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  link text,
  created_at timestamptz not null default now()
);

create index if not exists events_starts_idx on public.events (starts_at);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

create table if not exists public.newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  post_id uuid references public.posts (id) on delete set null,
  recipient_count integer not null default 0,
  sent_at timestamptz not null default now()
);

-- ============================================================
-- Helper functions
-- ============================================================

create or replace function public.my_profile_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.profiles where user_id = auth.uid() and active limit 1;
$$;

create or replace function public.is_officer()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and active);
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and active and is_admin);
$$;

-- Keep updated_at current.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- Officers can edit their own profile, but only the admin can change
-- admin status, active status, or which login a profile belongs to.
create or replace function public.protect_profile_fields()
returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new.is_admin := old.is_admin;
    new.active := old.active;
    new.user_id := old.user_id;
    new.sort_order := old.sort_order;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- When a login is created:
--   * the very first login becomes the admin (that's you),
--   * invited officers get a profile using the name and title from the invite,
--   * anyone else gets nothing, so a stray sign-up can't post.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  base_slug text;
  final_slug text;
  display_name text;
  n integer := 1;
begin
  if exists (select 1 from public.profiles where user_id = new.id) then
    return new;
  end if;

  if exists (select 1 from public.profiles where is_admin) and new.invited_at is null then
    return new;
  end if;

  display_name := coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1));
  base_slug := trim(both '-' from regexp_replace(lower(display_name), '[^a-z0-9]+', '-', 'g'));
  if base_slug = '' then base_slug := 'officer'; end if;
  final_slug := base_slug;
  while exists (select 1 from public.profiles where slug = final_slug) loop
    n := n + 1;
    final_slug := base_slug || '-' || n;
  end loop;

  insert into public.profiles (user_id, name, slug, title, is_admin, sort_order)
  values (
    new.id,
    display_name,
    final_slug,
    nullif(new.raw_user_meta_data ->> 'title', ''),
    not exists (select 1 from public.profiles where is_admin),
    case when exists (select 1 from public.profiles where is_admin) then 50 else 0 end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- If you created your login before running this file, make the oldest login the admin.
insert into public.profiles (user_id, name, slug, is_admin, sort_order)
select u.id, split_part(u.email, '@', 1), 'admin-' || left(u.id::text, 8), true, 0
from auth.users u
where not exists (select 1 from public.profiles where is_admin)
order by u.created_at
limit 1;

-- ============================================================
-- Security rules (row level security)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.events enable row level security;
alter table public.subscribers enable row level security;
alter table public.newsletter_sends enable row level security;
-- subscribers and newsletter_sends have no policies on purpose:
-- only the server (with the secret key) can read or write them.

-- Explicit access grants, so this works whether or not the project
-- exposes new tables automatically. The row rules below still apply.
grant usage on schema public to anon, authenticated, service_role;
grant select on public.profiles, public.posts, public.events to anon, authenticated;
grant insert, update, delete on public.profiles, public.posts, public.events to authenticated;
revoke all on public.subscribers, public.newsletter_sends from anon, authenticated;
grant all on public.profiles, public.posts, public.events, public.subscribers, public.newsletter_sends to service_role;
grant execute on function public.my_profile_id(), public.is_officer(), public.is_admin() to anon, authenticated, service_role;

drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles
  for select using (true);

drop policy if exists "officers edit own profile" on public.profiles;
create policy "officers edit own profile" on public.profiles
  for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "admin adds profiles" on public.profiles;
create policy "admin adds profiles" on public.profiles
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin removes profiles" on public.profiles;
create policy "admin removes profiles" on public.profiles
  for delete to authenticated using (public.is_admin());

drop policy if exists "published posts are public" on public.posts;
create policy "published posts are public" on public.posts
  for select using (status = 'published' or public.is_officer());

drop policy if exists "officers write posts" on public.posts;
create policy "officers write posts" on public.posts
  for insert to authenticated
  with check (public.is_officer() and (author_id = public.my_profile_id() or public.is_admin()));

drop policy if exists "authors edit own posts" on public.posts;
create policy "authors edit own posts" on public.posts
  for update to authenticated
  using (author_id = public.my_profile_id() or public.is_admin())
  with check (author_id = public.my_profile_id() or public.is_admin());

drop policy if exists "authors delete own posts" on public.posts;
create policy "authors delete own posts" on public.posts
  for delete to authenticated
  using (author_id = public.my_profile_id() or public.is_admin());

drop policy if exists "events are public" on public.events;
create policy "events are public" on public.events
  for select using (true);

drop policy if exists "officers manage events" on public.events;
create policy "officers manage events" on public.events
  for all to authenticated
  using (public.is_officer())
  with check (public.is_officer());

-- ============================================================
-- Image storage
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 8388608, array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Each officer uploads into a folder named after their login id.
drop policy if exists "officers upload images" on storage.objects;
create policy "officers upload images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'images'
    and public.is_officer()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "officers delete own images" on storage.objects;
create policy "officers delete own images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- ============================================================
-- Placeholder content (only added if the tables are empty).
-- Delete it any time from the admin area.
-- ============================================================

do $$
begin
  if not exists (select 1 from public.profiles where user_id is null) and not exists (select 1 from public.posts) then
    insert into public.profiles (name, slug, title, grade, bio, sort_order) values ('Club President', 'club-president', 'President', '12th grade', 'Placeholder officer. Replace this with a real name, photo, and a couple of sentences about what you''re into in economics, or delete this profile from the Officers page in the admin area.', 1);
    insert into public.profiles (name, slug, title, grade, bio, sort_order) values ('Vice President', 'vice-president', 'Vice President', '11th grade', 'Placeholder officer. Runs meeting logistics and the competition calendar.', 2);
    insert into public.profiles (name, slug, title, grade, bio, sort_order) values ('Head of Research', 'head-of-research', 'Head of Research', '11th grade', 'Placeholder officer. Edits the blog and helps members turn ideas into posts.', 3);
    insert into public.posts (slug, title, excerpt, body, tags, status, published_at, author_id) values ('why-the-fed-cant-fix-things-overnight', 'Why the Fed can''t fix things overnight', 'Interest rate changes take a year or more to work through the economy. Here''s the chain of events, and why it makes the Fed''s job so hard.', 'When the Federal Reserve raises or cuts its target interest rate, the headlines make it sound like a switch being flipped. In practice it''s more like turning a cargo ship. Milton Friedman described monetary policy as working with "long and variable lags," and that phrase still explains most of what makes central banking hard.

## The chain of events

A rate change doesn''t touch prices directly. It moves through a sequence of decisions made by millions of people:

1. **Borrowing costs change.** Banks adjust rates on mortgages, car loans, credit cards, and business credit within days or weeks.
2. **Spending plans change.** Families delay buying a house. A company postpones building a new warehouse. This takes months, because big purchases are planned well in advance.
3. **Hiring changes.** With fewer orders coming in, businesses slow hiring. Workers with less income spend less.
4. **Prices respond.** Only after demand has cooled do firms feel pressure to slow price increases.

Each step has its own delay, and they stack. Economists'' estimates vary, but the full effect on inflation is commonly thought to take a year or more to show up.

## Why the lag matters

| What the Fed sees today | What it actually reflects |
| --- | --- |
| This month''s inflation number | Decisions made many months ago |
| Today''s job report | Hiring plans made last quarter |
| A rate change it makes now | Conditions roughly a year from now |

This is the core problem. The Fed is steering by looking in the rearview mirror. If it waits until inflation has clearly fallen before cutting rates, it has probably waited too long, and the economy may already be slowing more than intended. If it acts early, it risks reacting to a blip.

## What this means for reading the news

Next time you see a headline that says a rate decision "didn''t work," check how long ago it happened. A move from three months ago has barely started doing its job. The more useful question is what the Fed expects the economy to look like a year out, which is why its statements and projections often move markets more than the rate decision itself.

*This is a placeholder post written to show how the blog looks. Edit or delete it from the admin area.*', array['Macro', 'Policy']::text[], 'published', now() - interval '2 days', (select id from public.profiles where slug = 'head-of-research'));
    insert into public.posts (slug, title, excerpt, body, tags, status, published_at, author_id) values ('the-economics-of-the-lunch-line', 'The economics of the lunch line', 'Why the cookies are always gone by the time you get there, and what a cafeteria queue has in common with concert tickets and rent control.', 'Every school day, a few hundred students run a live experiment in one of economics'' oldest questions: what happens when something is in demand but its price can''t move?

## A price that never changes

The cafeteria charges the same price for a cookie on Monday at 11:00 as it does on Friday at 12:30, no matter how many are left. When the price can''t rise to match demand, something else has to decide who gets the goods. In the lunch line, that something is **time**.

Students who get there first get the cookies. Everyone else pays in minutes waiting, and some pay and still go home empty-handed. Economists call this **non-price rationing**: when price isn''t allowed to do the sorting, queues, lotteries, or connections do it instead.

## The same pattern, everywhere

- **Concert tickets** sold below what fans would pay sell out in seconds, and the line moves online to whoever has the fastest connection or the best bot.
- **Rent-controlled apartments** can have long waitlists, so the people who get them are often whoever applied first, not whoever needs them most.
- **Free samples** at a store attract a line that would vanish if they cost a dollar.

In each case, the shortage isn''t just about how much exists. It''s about a price that''s held below the point where the amount people want matches the amount available.

## Is that bad?

Not necessarily. Schools keep lunch prices fixed for good reasons: fairness, simplicity, and making sure everyone can afford a meal. Rationing by time can feel fairer than rationing by money. But it has a cost that doesn''t show up on a receipt: all the minutes spent waiting.

A few ideas a cafeteria could try, each with tradeoffs worth debating at a meeting:

- Release cookies in batches across lunch periods so later students have a chance.
- Let students pre-order.
- Make more cookies, if the budget allows.

Which would you pick, and who wins and loses under each?

*This is a placeholder post written to show how the blog looks. Edit or delete it from the admin area.*', array['Micro']::text[], 'published', now() - interval '9 days', (select id from public.profiles where slug = 'vice-president'));
    insert into public.posts (slug, title, excerpt, body, tags, status, published_at, author_id) values ('welcome-to-ab-econ', 'Welcome to AB Econ: what we''re doing this year', 'Weekly discussions, competition prep, guest speakers, and a blog written by members. Here''s how the year will work.', 'Welcome to the Acton-Boxborough Economics Club. Whether you''ve taken AP Macro or you''ve never read an economics article in your life, there''s a place for you here.

## What we do

- **Weekly meetings.** We pick a topic from the news, break down the economics behind it, and argue about it.
- **Competitions.** We prepare teams for economics competitions throughout the year. Check the Resources page for the list.
- **Guest speakers.** People who use economics in their work, from finance to public policy, come talk to the club.
- **This blog.** Members write short pieces explaining an idea, a chart, or a news story. Officers can help you edit before it goes up.

## How to get involved

Come to any meeting. No sign-up needed. If you want to write for the blog, talk to any officer and we''ll help you get a first post published.

To get new posts in your inbox, sign up for the newsletter at the bottom of any page.

*This is a placeholder post written to show how the blog looks. Edit or delete it from the admin area.*', array['Club News']::text[], 'published', now() - interval '16 days', (select id from public.profiles where slug = 'club-president'));
    insert into public.events (title, description, location, starts_at, ends_at) values ('Club fair', 'Find us at the club fair to sign up and meet the officers.', 'Main lobby', ((date_trunc('day', now() at time zone 'America/New_York') + interval '-14 days' + time '14:30') at time zone 'America/New_York'), ((date_trunc('day', now() at time zone 'America/New_York') + interval '-14 days' + time '14:30') at time zone 'America/New_York') + interval '90 minutes');
    insert into public.events (title, description, location, starts_at, ends_at) values ('Weekly meeting: inflation in the news', 'We''ll look at the latest inflation report and talk through what''s driving prices. No prep needed.', 'Room TBD', ((date_trunc('day', now() at time zone 'America/New_York') + interval '3 days' + time '14:30') at time zone 'America/New_York'), ((date_trunc('day', now() at time zone 'America/New_York') + interval '3 days' + time '14:30') at time zone 'America/New_York') + interval '60 minutes');
    insert into public.events (title, description, location, starts_at, ends_at) values ('Guest speaker: careers that use economics', 'A guest speaker talks about how economics shows up in their job. Bring questions.', 'Library', ((date_trunc('day', now() at time zone 'America/New_York') + interval '10 days' + time '14:30') at time zone 'America/New_York'), ((date_trunc('day', now() at time zone 'America/New_York') + interval '10 days' + time '14:30') at time zone 'America/New_York') + interval '60 minutes');
    insert into public.events (title, description, location, starts_at, ends_at) values ('Competition practice round', 'Timed practice questions in teams of three. Good prep for upcoming economics competitions.', 'Room TBD', ((date_trunc('day', now() at time zone 'America/New_York') + interval '17 days' + time '14:30') at time zone 'America/New_York'), ((date_trunc('day', now() at time zone 'America/New_York') + interval '17 days' + time '14:30') at time zone 'America/New_York') + interval '75 minutes');
  end if;
end;
$$;
