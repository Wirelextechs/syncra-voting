-- RLS Policies for Syncra Voting
-- This app uses the anon key for all operations (no auth), so we grant full access to the anon role.

-- Elections
alter table elections enable row level security;
drop policy if exists "allow_all_elections" on elections;
create policy "allow_all_elections" on elections for all using (true) with check (true);

-- Categories
alter table categories enable row level security;
drop policy if exists "allow_all_categories" on categories;
create policy "allow_all_categories" on categories for all using (true) with check (true);

-- Candidates
alter table candidates enable row level security;
drop policy if exists "allow_all_candidates" on candidates;
create policy "allow_all_candidates" on candidates for all using (true) with check (true);

-- Voters
alter table voters enable row level security;
drop policy if exists "allow_all_voters" on voters;
create policy "allow_all_voters" on voters for all using (true) with check (true);

-- Votes
alter table votes enable row level security;
drop policy if exists "allow_all_votes" on votes;
create policy "allow_all_votes" on votes for all using (true) with check (true);
