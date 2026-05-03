-- ============================================================
-- EnglishAI — Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text unique,
  avatar_url text,
  is_premium boolean default false,
  premium_until timestamptz,
  lemon_customer_id text,
  lemon_subscription_id text,
  subscription_status text default 'free', -- free | active | cancelled | expired
  streak_days int default 0,
  last_activity_date date,
  total_xp int default 0,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    split_part(new.email, '@', 1) || '_' || floor(random() * 9999)::text
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── CATEGORIES ──────────────────────────────────────────────
create table categories (
  id text primary key,
  title text not null,
  description text,
  emoji text,
  color text,
  is_premium boolean default false,
  sort_order int default 0
);

insert into categories values
  ('tenses',      'Tenses',               'All English tenses',               '🕐', '#4ECDC4', false, 1),
  ('grammar',     'Grammar',              'Core grammar rules',                '📝', '#DDA0DD', false, 2),
  ('vocabulary',  'Vocabulary',           'Words & phrases',                   '📚', '#FFD93D', false, 3),
  ('it-english',  'IT English',           'For software developers',           '👨‍💻', '#4D96FF', true,  4),
  ('business',    'Business',             'Workplace communication',           '💼', '#20B2AA', true,  5),
  ('ielts-toefl', 'IELTS / TOEFL',        'Academic English & exam prep',     '🎓', '#FF8B94', true,  6),
  ('travel',      'Travel',               'Airport, hotel, directions',        '✈️', '#87CEEB', false, 7),
  ('medical',     'Medical English',      'For healthcare professionals',      '🏥', '#6BCB77', true,  8);

-- ─── UNITS ───────────────────────────────────────────────────
create table units (
  id text primary key,
  category_id text references categories(id),
  title text not null,
  description text,
  emoji text,
  color text,
  level text check (level in ('A1','A2','B1','B2','C1','C2')),
  is_premium boolean default false,
  sort_order int default 0,
  questions_count int default 5,
  created_at timestamptz default now()
);

-- Insert all units (sample — app generates more via AI)
insert into units (id, category_id, title, description, emoji, color, level, is_premium, sort_order) values
  -- Tenses
  ('present-simple',      'tenses', 'Present Simple',       'Habits, facts, routines',              '🕐', '#4ECDC4', 'A1', false, 1),
  ('present-continuous',  'tenses', 'Present Continuous',   'Actions happening now',                '⏳', '#45B7D1', 'A1', false, 2),
  ('past-simple',         'tenses', 'Past Simple',          'Completed past actions',               '📅', '#96CEB4', 'A2', false, 3),
  ('past-continuous',     'tenses', 'Past Continuous',      'Ongoing past actions',                 '🔄', '#FFEAA7', 'A2', false, 4),
  ('present-perfect',     'tenses', 'Present Perfect',      'Past with present relevance',          '✅', '#DDA0DD', 'B1', false, 5),
  ('past-perfect',        'tenses', 'Past Perfect',         'Action before another past action',    '⏮',  '#F0A500', 'B1', false, 6),
  ('future-will',         'tenses', 'Future (will)',         'Predictions and decisions',            '🔮', '#FF8B94', 'A2', false, 7),
  ('future-going-to',     'tenses', 'Future (going to)',    'Plans and intentions',                 '🎯', '#A8E6CF', 'A2', false, 8),
  ('present-perfect-cont','tenses', 'Present Perfect Continuous', 'Duration up to now',           '⌛', '#C9B1FF', 'B1', true,  9),
  ('future-perfect',      'tenses', 'Future Perfect',       'Action completed before future point', '🚀', '#FFA07A', 'B2', true,  10),
  -- Grammar
  ('conditionals-1',      'grammar', 'First Conditional',   'Real possibilities',                   '1️⃣', '#FFD93D', 'A2', false, 1),
  ('conditionals-2',      'grammar', 'Second Conditional',  'Hypothetical situations',              '2️⃣', '#F0A500', 'B1', false, 2),
  ('conditionals-3',      'grammar', 'Third Conditional',   'Past hypotheticals & regrets',         '3️⃣', '#FF8B94', 'B1', true,  3),
  ('passive-voice',       'grammar', 'Passive Voice',        'Object-focused sentences',             '🔃', '#6BCB77', 'B1', false, 4),
  ('modal-verbs',         'grammar', 'Modal Verbs',          'can, must, should, might',             '💭', '#4D96FF', 'A2', false, 5),
  ('articles',            'grammar', 'Articles',             'a, an, the — when to use',             '📝', '#FF6B6B', 'A1', false, 6),
  ('reported-speech',     'grammar', 'Reported Speech',      'Saying what others said',              '💬', '#DDA0DD', 'B1', true,  7),
  ('relative-clauses',    'grammar', 'Relative Clauses',     'who, which, that, where',              '🔗', '#4ECDC4', 'B1', true,  8),
  -- Vocabulary
  ('prepositions',        'vocabulary', 'Prepositions',      'in, on, at, by, for',                  '📍', '#C9B1FF', 'A1', false, 1),
  ('phrasal-verbs',       'vocabulary', 'Phrasal Verbs',     'Common verb + particle combos',        '🔗', '#FFA07A', 'B1', false, 2),
  ('idioms',              'vocabulary', 'Idioms',             'Common English expressions',           '🎭', '#FF6B6B', 'B1', true,  3),
  ('collocations',        'vocabulary', 'Collocations',       'Words that go together',               '🤝', '#96CEB4', 'B1', true,  4),
  -- IT English
  ('it-vocabulary',       'it-english', 'IT Vocabulary',     'Tech terms & jargon',                  '💻', '#4D96FF', 'B1', true,  1),
  ('code-review-english', 'it-english', 'Code Review English','PR comments & feedback',             '👀', '#45B7D1', 'B1', true,  2),
  ('standup-meetings',    'it-english', 'Standup & Meetings', 'Daily standups, retros, planning',   '🗣️', '#20B2AA', 'B2', true,  3),
  ('technical-writing',   'it-english', 'Technical Writing',  'Docs, READMEs, tickets',             '📋', '#87CEEB', 'B2', true,  4),
  ('job-interview-it',    'it-english', 'IT Job Interview',   'Interview Q&A for developers',       '🎯', '#6BCB77', 'B2', true,  5),
  -- Business
  ('business-emails',     'business', 'Business Emails',     'Professional correspondence',          '📧', '#20B2AA', 'B1', true,  1),
  ('presentations',       'business', 'Presentations',       'Giving effective presentations',       '📊', '#4ECDC4', 'B2', true,  2),
  ('negotiations',        'business', 'Negotiations',        'Deals, offers, compromises',           '🤝', '#FFD93D', 'B2', true,  3),
  ('small-talk',          'business', 'Small Talk',          'Casual professional conversation',     '☕', '#FF8B94', 'B1', true,  4),
  -- IELTS/TOEFL
  ('ielts-writing',       'ielts-toefl', 'IELTS Writing',    'Task 1 & Task 2 practice',            '✍️', '#FF8B94', 'C1', true,  1),
  ('ielts-speaking',      'ielts-toefl', 'IELTS Speaking',   'Speaking test preparation',           '🎤', '#DDA0DD', 'C1', true,  2),
  ('academic-vocabulary', 'ielts-toefl', 'Academic Vocabulary','High-level academic words',         '🎓', '#C9B1FF', 'C1', true,  3),
  -- Travel
  ('airport',             'travel', 'At the Airport',        'Check-in, customs, boarding',          '✈️', '#87CEEB', 'A2', false, 1),
  ('hotel',               'travel', 'At the Hotel',          'Booking, requests, complaints',        '🏨', '#96CEB4', 'A2', false, 2),
  ('directions',          'travel', 'Directions',            'Asking & giving directions',           '🗺️', '#FFEAA7', 'A1', false, 3);

-- ─── DAILY LIMITS ────────────────────────────────────────────
create table daily_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  date date default current_date,
  units_completed int default 0,
  unique(user_id, date)
);

-- ─── COMPLETED EXERCISES ─────────────────────────────────────
create table user_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  unit_id text references units(id),
  score int not null,          -- correct answers
  total int not null,          -- total questions
  xp_earned int default 0,
  completed_at timestamptz default now()
);

create index on user_progress(user_id);
create index on user_progress(unit_id);
create index on user_progress(completed_at desc);

-- ─── LEADERBOARD VIEW ────────────────────────────────────────
create or replace view leaderboard as
select
  p.id,
  p.username,
  p.avatar_url,
  p.total_xp,
  p.streak_days,
  count(distinct up.unit_id) as units_completed,
  count(up.id) as total_sessions,
  round(avg(up.score::numeric / up.total * 100), 1) as avg_score,
  rank() over (order by p.total_xp desc) as rank
from profiles p
left join user_progress up on up.user_id = p.id
group by p.id
order by p.total_xp desc;

-- ─── XP FUNCTION ─────────────────────────────────────────────
create or replace function add_xp(p_user_id uuid, p_score int, p_total int)
returns int as $$
declare
  v_xp int;
  v_pct float;
begin
  v_pct := p_score::float / p_total;
  v_xp := case
    when v_pct >= 0.9 then 50
    when v_pct >= 0.7 then 35
    when v_pct >= 0.5 then 20
    else 10
  end;

  update profiles
  set
    total_xp = total_xp + v_xp,
    last_activity_date = current_date,
    streak_days = case
      when last_activity_date = current_date - 1 then streak_days + 1
      when last_activity_date = current_date then streak_days
      else 1
    end
  where id = p_user_id;

  return v_xp;
end;
$$ language plpgsql security definer;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
alter table profiles enable row level security;
alter table daily_usage enable row level security;
alter table user_progress enable row level security;

create policy "Public profiles viewable" on profiles for select using (true);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

create policy "Users see own usage" on daily_usage for select using (auth.uid() = user_id);
create policy "Users insert own usage" on daily_usage for insert with check (auth.uid() = user_id);
create policy "Users update own usage" on daily_usage for update using (auth.uid() = user_id);

create policy "Users see own progress" on user_progress for select using (auth.uid() = user_id);
create policy "Users insert own progress" on user_progress for insert with check (auth.uid() = user_id);
