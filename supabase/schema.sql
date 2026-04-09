-- Syncra Voting System Database Schema

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Elections Table
create table elections (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  institution text not null,
  status text default 'draft' check (status in ('draft', 'open', 'closed')),
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Categories Table (e.g., President, General Secretary)
create table categories (
  id uuid default gen_random_uuid() primary key,
  election_id uuid references elections(id) on delete cascade,
  name text not null
);

-- Candidates Table
create table candidates (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  photo_url text,
  votes_count integer default 0
);

-- Voters Table
create table voters (
  id uuid default gen_random_uuid() primary key,
  election_id uuid references elections(id) on delete cascade,
  identifier text not null, -- index number, staff id, etc.
  name text not null,
  phone text,
  class text,
  otp text,
  otp_sent boolean default false,
  voted boolean default false,
  unique(election_id, identifier)
);

-- Votes Table (Auditing)
create table votes (
  id uuid default gen_random_uuid() primary key,
  voter_id uuid references voters(id),
  candidate_id uuid references candidates(id),
  category_id uuid references categories(id),
  created_at timestamp with time zone default now(),
  unique(voter_id, category_id) -- Prevent double voting in same category
);

-- Enable Real-time for live results
alter publication supabase_realtime add table candidates, elections, voters;

-- Row Level Security: grant full access to anon key (no auth in this app)
alter table elections  enable row level security;
alter table categories enable row level security;
alter table candidates enable row level security;
alter table voters     enable row level security;
alter table votes      enable row level security;

create policy "allow_all_elections"  on elections  for all using (true) with check (true);
create policy "allow_all_categories" on categories for all using (true) with check (true);
create policy "allow_all_candidates" on candidates for all using (true) with check (true);
create policy "allow_all_voters"     on voters     for all using (true) with check (true);
create policy "allow_all_votes"      on votes      for all using (true) with check (true);

-- Function to safely increment candidate votes
create or replace function increment_candidate_votes(candidate_uuid uuid)
returns void
language plpgsql
security definer
as $$
begin
  update candidates
  set votes_count = votes_count + 1
  where id = candidate_uuid;
end;
$$;
