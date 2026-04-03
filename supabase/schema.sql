-- Run this in the Supabase SQL Editor to create the required tables

create table if not exists players (
  id text primary key,
  name text not null,
  color text not null,
  created_at text not null
);

create table if not exists games (
  id text primary key,
  name text not null,
  game_type text not null,
  player_ids text[] not null default '{}',
  rounds jsonb not null default '[]',
  status text not null default 'active',
  created_at text not null,
  finished_at text,
  winner_ids text[],
  lower_is_better boolean default true
);

-- Allow public read/write (for a personal app without auth)
alter table players enable row level security;
alter table games enable row level security;

create policy "allow all" on players for all using (true) with check (true);
create policy "allow all" on games for all using (true) with check (true);
