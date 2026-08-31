-- ============================================================================
-- CHALLENGE 360° — SUPABASE SCHEMA (v2: teams, self-signup, leaderboard)
-- ============================================================================
-- Run this whole file once in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.
--
-- If you already ran the v1 schema, running this again just adds the new
-- teams/leaderboard/health-report pieces on top — nothing destructive.
-- ============================================================================

-- 1. TEAMS --------------------------------------------------------------------
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text default '',
  created_at timestamptz not null default now()
);

-- 2. PROFILES -------------------------------------------------------------
-- One row per auth user. Created automatically by a trigger whenever a new
-- user is created (self-signup, admin-created, or Google sign-in).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  is_active boolean not null default true,
  team_id uuid references public.teams (id) on delete set null,
  goal_points integer not null default 500,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists team_id uuid references public.teams (id) on delete set null;
alter table public.profiles add column if not exists goal_points integer not null default 500;

-- Auto-create a profile row for every new auth user (self-signup, admin-created,
-- or Google OAuth). Reads full_name / team_id from signup metadata if present.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, team_id)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name', -- Google OAuth provides "name"
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data ->> 'role', 'user'),
    nullif(new.raw_user_meta_data ->> 'team_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. DAILY LOGS ---------------------------------------------------------------
-- body/mind/heart/soul stay private (raw habit detail). The 5 extra columns
-- below are denormalized point totals ONLY — written by the app whenever it
-- saves a log — so the leaderboard/team dashboard can show scores without
-- exposing anyone's raw hydration/sleep/screen-time numbers.
create table if not exists public.daily_logs (
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  body jsonb not null default '{}'::jsonb,
  mind jsonb not null default '{}'::jsonb,
  heart jsonb not null default '{}'::jsonb,
  soul jsonb not null default '{}'::jsonb,
  notes text default '',
  total_score integer not null default 0,
  body_score integer not null default 0,
  mind_score integer not null default 0,
  heart_score integer not null default 0,
  soul_score integer not null default 0,
  strength_cardio_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table public.daily_logs add column if not exists total_score integer not null default 0;
alter table public.daily_logs add column if not exists body_score integer not null default 0;
alter table public.daily_logs add column if not exists mind_score integer not null default 0;
alter table public.daily_logs add column if not exists heart_score integer not null default 0;
alter table public.daily_logs add column if not exists soul_score integer not null default 0;
alter table public.daily_logs add column if not exists strength_cardio_completed boolean not null default false;

-- 4. GROUP WORKOUTS -----------------------------------------------------------
create table if not exists public.group_workouts (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  title text not null,
  group_name text not null default '',
  duration_minutes integer not null default 0,
  workout_type text not null default '',
  is_morning boolean not null default false,
  notes text default '',
  created_at timestamptz not null default now()
);

-- 5. CHARITY RECORDS -----------------------------------------------------------
create table if not exists public.charity_records (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  month_key text not null,
  completed boolean not null default false,
  title text not null default '',
  category text not null default 'other',
  amount_or_hours text default '',
  notes text default '',
  completed_date date,
  unique (user_id, month_key)
);

-- 6. HEALTH REPORT UPLOADS ------------------------------------------------------
-- The actual image files live in OUR Supabase Storage bucket "health-reports",
-- in a private per-user folder (health-reports/{user_id}/...). This table is
-- just a pointer + metadata row.
create table if not exists public.health_reports (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  source text not null default 'other', -- e.g. 'fitbit','apple_health','google_fit','garmin','other'
  storage_path text not null, -- path inside the health-reports bucket
  file_name text not null default '',
  notes text default '',
  uploaded_at timestamptz not null default now()
);

alter table public.health_reports add column if not exists storage_path text;
alter table public.health_reports add column if not exists file_name text not null default '';
-- Older installs may still have the retired Google Drive columns; harmless to
-- leave them, but drop them if you want a clean table:
-- alter table public.health_reports drop column if exists drive_file_id;
-- alter table public.health_reports drop column if exists drive_file_name;
-- alter table public.health_reports drop column if exists drive_view_link;
-- alter table public.health_reports drop column if exists drive_thumbnail_link;

-- 7. FEED (community activity feed + reactions) ---------------------------------
-- One post per user per day, written by the app right after a daily log is
-- saved. Only carries the summary a post needs (points, which pillars were
-- hit) — never the raw private habit detail from daily_logs.
create table if not exists public.feed_posts (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  total_score integer not null default 0,
  all_dimensions_completed boolean not null default false,
  kind text not null default 'log', -- 'log' | 'complete_day' | 'streak' | 'workout' | 'charity'
  message text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, date, kind)
);

create table if not exists public.feed_reactions (
  id text primary key,
  post_id text not null references public.feed_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id, emoji)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.group_workouts enable row level security;
alter table public.charity_records enable row level security;
alter table public.health_reports enable row level security;
alter table public.feed_posts enable row level security;
alter table public.feed_reactions enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- TEAMS policies — team names are needed on the public signup page (before
-- login), so SELECT is open to everyone; only admins may write.
drop policy if exists "teams_select_all" on public.teams;
create policy "teams_select_all" on public.teams
  for select using (true);

drop policy if exists "teams_write_admin_only" on public.teams;
create policy "teams_write_admin_only" on public.teams
  for insert with check (public.is_admin());

drop policy if exists "teams_update_admin_only" on public.teams;
create policy "teams_update_admin_only" on public.teams
  for update using (public.is_admin());

drop policy if exists "teams_delete_admin_only" on public.teams;
create policy "teams_delete_admin_only" on public.teams
  for delete using (public.is_admin());

-- PROFILES policies — every signed-in participant can see everyone's
-- name/team/role (needed for the leaderboard & team roster); only the owner
-- or an admin can update a row.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_select_all_authenticated" on public.profiles;
create policy "profiles_select_all_authenticated" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- DAILY LOGS policies — raw logs (habit detail) stay private to the owner/admin.
drop policy if exists "logs_select_own_or_admin" on public.daily_logs;
create policy "logs_select_own_or_admin" on public.daily_logs
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "logs_insert_own_or_admin" on public.daily_logs;
create policy "logs_insert_own_or_admin" on public.daily_logs
  for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "logs_update_own_or_admin" on public.daily_logs;
create policy "logs_update_own_or_admin" on public.daily_logs
  for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists "logs_delete_own_or_admin" on public.daily_logs;
create policy "logs_delete_own_or_admin" on public.daily_logs
  for delete using (user_id = auth.uid() or public.is_admin());

-- GROUP WORKOUTS policies — visible to everyone (team activity feed / weekly
-- bonus leaderboard); only the owner/admin can write.
drop policy if exists "workouts_select_own_or_admin" on public.group_workouts;
drop policy if exists "workouts_select_all_authenticated" on public.group_workouts;
create policy "workouts_select_all_authenticated" on public.group_workouts
  for select to authenticated using (true);

drop policy if exists "workouts_insert_own_or_admin" on public.group_workouts;
create policy "workouts_insert_own_or_admin" on public.group_workouts
  for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "workouts_update_own_or_admin" on public.group_workouts;
create policy "workouts_update_own_or_admin" on public.group_workouts
  for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists "workouts_delete_own_or_admin" on public.group_workouts;
create policy "workouts_delete_own_or_admin" on public.group_workouts
  for delete using (user_id = auth.uid() or public.is_admin());

-- CHARITY RECORDS policies — kept private (title/amount/notes can be personal);
-- the leaderboard only needs a completed/qualified flag, exposed via the
-- security-definer function below instead of broadening row-level SELECT.
drop policy if exists "charity_select_own_or_admin" on public.charity_records;
drop policy if exists "charity_select_all_authenticated" on public.charity_records;
create policy "charity_select_own_or_admin" on public.charity_records
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "charity_insert_own_or_admin" on public.charity_records;
create policy "charity_insert_own_or_admin" on public.charity_records
  for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "charity_update_own_or_admin" on public.charity_records;
create policy "charity_update_own_or_admin" on public.charity_records
  for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists "charity_delete_own_or_admin" on public.charity_records;
create policy "charity_delete_own_or_admin" on public.charity_records
  for delete using (user_id = auth.uid() or public.is_admin());

-- HEALTH REPORTS policies — private to the owner/admin (these link to a
-- personal Google Drive file, treat like any other personal health data).
drop policy if exists "health_reports_select_own_or_admin" on public.health_reports;
create policy "health_reports_select_own_or_admin" on public.health_reports
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "health_reports_insert_own_or_admin" on public.health_reports;
create policy "health_reports_insert_own_or_admin" on public.health_reports
  for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "health_reports_delete_own_or_admin" on public.health_reports;
create policy "health_reports_delete_own_or_admin" on public.health_reports
  for delete using (user_id = auth.uid() or public.is_admin());

-- FEED POSTS policies — this is the whole point of the feed, so SELECT is
-- open to everyone signed in; only the post's own author (or admin) writes it.
drop policy if exists "feed_posts_select_all_authenticated" on public.feed_posts;
create policy "feed_posts_select_all_authenticated" on public.feed_posts
  for select to authenticated using (true);

drop policy if exists "feed_posts_insert_own_or_admin" on public.feed_posts;
create policy "feed_posts_insert_own_or_admin" on public.feed_posts
  for insert with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "feed_posts_update_own_or_admin" on public.feed_posts;
create policy "feed_posts_update_own_or_admin" on public.feed_posts
  for update using (user_id = auth.uid() or public.is_admin());

drop policy if exists "feed_posts_delete_own_or_admin" on public.feed_posts;
create policy "feed_posts_delete_own_or_admin" on public.feed_posts
  for delete using (user_id = auth.uid() or public.is_admin());

-- FEED REACTIONS policies — visible to all, but you can only add/remove your
-- own reaction (never react as someone else).
drop policy if exists "feed_reactions_select_all_authenticated" on public.feed_reactions;
create policy "feed_reactions_select_all_authenticated" on public.feed_reactions
  for select to authenticated using (true);

drop policy if exists "feed_reactions_insert_own" on public.feed_reactions;
create policy "feed_reactions_insert_own" on public.feed_reactions
  for insert with check (user_id = auth.uid());

drop policy if exists "feed_reactions_delete_own" on public.feed_reactions;
create policy "feed_reactions_delete_own" on public.feed_reactions
  for delete using (user_id = auth.uid());

-- ============================================================================
-- LEADERBOARD FUNCTIONS
-- ============================================================================
-- daily_logs and charity_records stay private at the row level (owner/admin
-- only) so nobody can browse a teammate's raw hydration/sleep/donation
-- details. These SECURITY DEFINER functions expose ONLY the score/qualifier
-- fields every participant needs to see a fair leaderboard.

create or replace function public.get_leaderboard_daily_scores()
returns table (
  user_id uuid,
  date date,
  total_score integer,
  body_score integer,
  mind_score integer,
  heart_score integer,
  soul_score integer,
  strength_cardio_completed boolean
)
language sql
security definer set search_path = public
stable
as $$
  select user_id, date, total_score, body_score, mind_score, heart_score, soul_score, strength_cardio_completed
  from public.daily_logs;
$$;

grant execute on function public.get_leaderboard_daily_scores() to authenticated;

create or replace function public.get_leaderboard_charity_status()
returns table (user_id uuid, month_key text, completed boolean)
language sql
security definer set search_path = public
stable
as $$
  select user_id, month_key, completed from public.charity_records;
$$;

grant execute on function public.get_leaderboard_charity_status() to authenticated;

-- ============================================================================
-- SUPABASE STORAGE — health report screenshots
-- ============================================================================
-- Creates a private bucket "health-reports". Files are stored under
-- {user_id}/{filename} so ownership can be checked from the path itself.
insert into storage.buckets (id, name, public)
values ('health-reports', 'health-reports', false)
on conflict (id) do nothing;

drop policy if exists "health_reports_storage_select" on storage.objects;
create policy "health_reports_storage_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'health-reports'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

drop policy if exists "health_reports_storage_insert" on storage.objects;
create policy "health_reports_storage_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'health-reports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "health_reports_storage_delete" on storage.objects;
create policy "health_reports_storage_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'health-reports'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

-- ============================================================================
-- PROFILE PRIVACY + "BEYOND" REFLECTION JOURNAL
-- ============================================================================
alter table public.profiles add column if not exists leaderboard_visible boolean not null default true;

create table if not exists public.reflections (
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_key text not null, -- e.g. '2026-W36'
  content text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, week_key)
);

alter table public.reflections enable row level security;

drop policy if exists "reflections_select_own_or_admin" on public.reflections;
create policy "reflections_select_own_or_admin" on public.reflections
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "reflections_insert_own" on public.reflections;
create policy "reflections_insert_own" on public.reflections
  for insert with check (user_id = auth.uid());

drop policy if exists "reflections_update_own" on public.reflections;
create policy "reflections_update_own" on public.reflections
  for update using (user_id = auth.uid());

-- ============================================================================
-- SEED SOME STARTER TEAMS (edit / delete these, or add your own from Admin)
-- ============================================================================
insert into public.teams (name, description) values
  ('Team Alpha', ''),
  ('Team Bravo', ''),
  ('Team Charlie', '')
on conflict (name) do nothing;

-- ============================================================================
-- MAKE YOURSELF THE FIRST SUPER USER
-- ============================================================================
-- 1. Create your own account first, either:
--    a) Sign up through the app's own Signup page after deploying, OR
--    b) Supabase Dashboard → Authentication → Users → Add User.
-- 2. Then run this (replace the email):
--
--    update public.profiles set role = 'admin' where email = 'you@example.com';
--
-- That user can now log in and will see the Admin panel, from which they can
-- create teams and manage every participant.
-- ============================================================================
