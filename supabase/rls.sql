-- Jiyasu Sales App — Row Level Security Policies
-- Run this SQL after schema.sql in Supabase SQL editor.

-- USERS table
alter table public.users enable row level security;
create policy "admin_all_users" on public.users
  for all using (auth.jwt()->>'role' = 'admin');
create policy "self_read" on public.users
  for select using (auth.uid() = id);

-- LEADS table
alter table public.leads enable row level security;
create policy "admin_all_leads" on public.leads
  for all using (auth.jwt()->>'role' = 'admin');
create policy "tl_team_leads" on public.leads
  for all using (
    auth.jwt()->>'role' = 'team_lead'
    and assigned_tl_id = auth.uid()
  );
create policy "caller_own_leads" on public.leads
  for select using (
    auth.jwt()->>'role' = 'caller'
    and assigned_cl_id = auth.uid()
  );

-- CALL_LOGS table
alter table public.call_logs enable row level security;
create policy "admin_all_logs" on public.call_logs
  for all using (auth.jwt()->>'role' = 'admin');
create policy "tl_team_logs" on public.call_logs
  for select using (
    auth.jwt()->>'role' = 'team_lead'
    and exists (
      select 1 from public.leads l
      where l.id = call_logs.lead_id
      and l.assigned_tl_id = auth.uid()
    )
  );
create policy "caller_own_logs" on public.call_logs
  for all using (
    auth.jwt()->>'role' = 'caller'
    and caller_id = auth.uid()
  );

-- STAGE_HISTORY table
alter table public.stage_history enable row level security;
create policy "admin_all_history" on public.stage_history
  for all using (auth.jwt()->>'role' = 'admin');
create policy "tl_team_history" on public.stage_history
  for select using (
    auth.jwt()->>'role' = 'team_lead'
    and exists (
      select 1 from public.leads l
      where l.id = stage_history.lead_id
      and l.assigned_tl_id = auth.uid()
    )
  );
create policy "caller_own_history" on public.stage_history
  for select using (
    auth.jwt()->>'role' = 'caller'
    and changed_by = auth.uid()
  );

-- IMPORT_BATCHES table
alter table public.import_batches enable row level security;
create policy "admin_all_batches" on public.import_batches
  for all using (auth.jwt()->>'role' = 'admin');

-- TEAMS table
alter table public.teams enable row level security;
create policy "admin_all_teams" on public.teams
  for all using (auth.jwt()->>'role' = 'admin');
create policy "tl_own_team" on public.teams
  for select using (team_lead_id = auth.uid());
