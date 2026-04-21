-- Create call_photos table for storing multiple photos per call log
create table if not exists public.call_photos (
  id uuid primary key default gen_random_uuid(),
  call_log_id uuid not null references public.call_logs(id) on delete cascade,
  photo_url text not null,
  created_at timestamptz not null default now()
);

-- Create index for fast lookup by call_log_id
create index if not exists idx_call_photos_call_log_id on public.call_photos(call_log_id);

-- Create storage bucket for call photos
insert into storage.buckets (id, name, public)
values ('call-photos', 'call-photos', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to call-photos bucket
create policy "Authenticated users can upload call photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'call-photos');

-- Allow public read access to call photos
create policy "Public read access for call photos"
on storage.objects for select
to public
using (bucket_id = 'call-photos');

-- Allow service role to manage call photos
create policy "Service role full access to call photos"
on storage.objects for all
to service_role
using (bucket_id = 'call-photos');
