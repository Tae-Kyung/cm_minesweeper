-- =========================================================================
-- MINESWEEPER LEADERBOARD DATABASE SCHEMA
-- Execute this SQL script in your Supabase SQL Editor to initialize the database table
-- =========================================================================

-- Create the high-scores leaderboard table
create table if not exists public.minesweeper_scores (
  id uuid default gen_random_uuid() primary key,
  player_name text not null,
  difficulty text not null,      -- 'beginner', 'intermediate', 'expert'
  time_seconds numeric(5, 1) not null, -- Clamped game timer (up to tenth-of-second precision)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.minesweeper_scores enable row level security;

-- Configure security policy: Allow public select access to read high scores
create policy "Allow public read access"
on public.minesweeper_scores
for select
using (true);

-- Configure security policy: Allow public insert access to record new scores
create policy "Allow public insert access"
on public.minesweeper_scores
for insert
with check (true);

-- Helpful indexing for ranking queries
create index if not exists idx_scores_difficulty_time on public.minesweeper_scores (difficulty, time_seconds asc);
