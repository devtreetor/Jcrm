-- Jigyasu Sales App — Database Schema
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
    'demo_booked','meeting_fixed','meeting_done','negotiation','proposal_sent','won','lost'
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
