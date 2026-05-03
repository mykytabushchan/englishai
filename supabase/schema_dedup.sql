-- ============================================================
-- EnglishAI — Extended Schema: AI Exercise Deduplication
-- Add this to your existing schema (or run fresh)
-- ============================================================

-- ─── EXERCISE FINGERPRINTS ───────────────────────────────────
-- Stores a hash of every exercise a user has seen.
-- Prevents repeats without storing full exercise text.
create table if not exists seen_exercises (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references profiles(id) on delete cascade not null,
  unit_id     text references units(id) not null,
  fingerprint text not null,          -- SHA-256 of (sentence + correct_answer)
  seen_at     timestamptz default now()
);

create unique index seen_exercises_user_unit_fp
  on seen_exercises(user_id, unit_id, fingerprint);

create index seen_exercises_user_unit
  on seen_exercises(user_id, unit_id);

-- ─── EXERCISE POOL (CACHE) ────────────────────────────────────
-- Stores generated exercises so they can be reused across users
-- while still checking per-user fingerprints.
create table if not exists exercise_pool (
  id           uuid default uuid_generate_v4() primary key,
  unit_id      text references units(id) not null,
  fingerprint  text not null unique,  -- same hash schema
  type         text not null,         -- multiple_choice | fill_blank | reorder | error_correction
  difficulty   int default 1,         -- 1=easy, 2=medium, 3=hard
  data         jsonb not null,        -- full exercise JSON
  use_count    int default 0,
  created_at   timestamptz default now()
);

create index exercise_pool_unit on exercise_pool(unit_id);
create index exercise_pool_unit_diff on exercise_pool(unit_id, difficulty);

-- ─── GENERATION LOG ──────────────────────────────────────────
-- Tracks AI generation requests for analytics and cost monitoring
create table if not exists generation_log (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references profiles(id) on delete cascade,
  unit_id      text references units(id),
  exercises_generated int,
  exercises_from_cache int,
  tokens_used  int,
  created_at   timestamptz default now()
);

-- ─── UNIT STATS VIEW (for "millions" counter) ─────────────────
-- Calculates theoretical max unique exercises per unit
create or replace view unit_exercise_stats as
select
  u.id,
  u.title,
  u.category_id,
  -- Pool: exercises already generated
  count(ep.id) as pool_size,
  -- Theoretical max based on combinatorics
  -- 4 exercise types × 3 difficulties × ~2000 possible sentence seeds
  4 * 3 * 2000 as theoretical_max,
  -- Global unique exercises seen
  count(distinct ep.fingerprint) as unique_generated
from units u
left join exercise_pool ep on ep.unit_id = u.id
group by u.id, u.title, u.category_id;

-- ─── FUNCTION: Get unseen exercises for a user ────────────────
create or replace function get_unseen_exercises(
  p_user_id  uuid,
  p_unit_id  text,
  p_count    int default 5
)
returns setof exercise_pool as $$
  select ep.*
  from exercise_pool ep
  where ep.unit_id = p_unit_id
    and ep.fingerprint not in (
      select fingerprint
      from seen_exercises
      where user_id = p_user_id
        and unit_id = p_unit_id
    )
  order by random()
  limit p_count;
$$ language sql security definer;

-- ─── FUNCTION: Mark exercises as seen ─────────────────────────
create or replace function mark_exercises_seen(
  p_user_id     uuid,
  p_unit_id     text,
  p_fingerprints text[]
)
returns void as $$
  insert into seen_exercises(user_id, unit_id, fingerprint)
  select p_user_id, p_unit_id, unnest(p_fingerprints)
  on conflict (user_id, unit_id, fingerprint) do nothing;
$$ language sql security definer;

-- ─── FUNCTION: Count seen/total for progress ──────────────────
create or replace function get_user_unit_progress(
  p_user_id uuid,
  p_unit_id text
)
returns table(seen_count bigint, pool_count bigint, theoretical_max bigint) as $$
  select
    (select count(*) from seen_exercises where user_id = p_user_id and unit_id = p_unit_id),
    (select count(*) from exercise_pool where unit_id = p_unit_id),
    (4 * 3 * 2000)::bigint
$$ language sql security definer;

-- ─── GLOBAL STATS VIEW (for landing page "millions" counter) ──
create or replace view platform_stats as
select
  (select count(*) from profiles) as total_users,
  (select count(*) from user_progress) as total_sessions,
  (select coalesce(sum(score), 0) from user_progress) as total_correct_answers,
  (select count(*) from exercise_pool) as exercises_in_pool,
  -- Theoretical total: 37 units × 4 types × 3 difficulties × 2000 seeds
  (37 * 4 * 3 * 2000) as theoretical_exercises_total,
  (select count(*) from units) as total_units,
  (select count(*) from categories) as total_categories;
