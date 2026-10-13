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
