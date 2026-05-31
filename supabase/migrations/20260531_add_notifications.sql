-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.users(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policy: Users can only see their own notifications
create policy "users_read_own_notifications" on public.notifications
  for select using (auth.uid() = recipient_id);

-- Policy: Users can only update their own notifications
create policy "users_update_own_notifications" on public.notifications
  for update using (auth.uid() = recipient_id);
