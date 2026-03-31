-- Jiyasu Sales App — Database Schema
-- Run this SQL in Supabase SQL editor to create all tables.

-- USERS
create table public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'team_lead', 'caller')),
  team_lead_id uuid references public.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- TEAMS
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  team_lead_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- IMPORT_BATCHES
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  imported_by uuid not null references public.users(id),
  source_event text,
  total_rows int not null default 0,
  error_rows int not null default 0,
  imported_at timestamptz not null default now()
);

-- LEADS
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  location text,
  city text,
  state text,
  board text,
  principal_phone text,
  chairman_phone text,
  stage text not null default 'uncontacted' check (stage in (
    'uncontacted','contacted','interested',
    'demo_booked','mql','proposal_sent','won','lost'
  )),
  assigned_tl_id uuid references public.users(id) on delete set null,
  assigned_cl_id uuid references public.users(id) on delete set null,
  import_batch_id uuid references public.import_batches(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cl_requires_tl check (
    assigned_cl_id is null or assigned_tl_id is not null
  )
);

-- CALL_LOGS
create table public.call_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  caller_id uuid not null references public.users(id),
  status text not null check (status in (
    'answered','not_answered','busy',
    'wrong_number','interested','not_interested'
  )),
  notes text,
  callback_date timestamptz,
  called_at timestamptz not null default now()
);

-- STAGE_HISTORY
create table public.stage_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  changed_by uuid not null references public.users(id),
  from_stage text not null,
  to_stage text not null,
  changed_at timestamptz not null default now()
);

-- Updated_at trigger for leads
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on public.leads
  for each row execute function update_updated_at();

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
