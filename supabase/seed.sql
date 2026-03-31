create extension if not exists pgcrypto;

-- Create Local Admin User
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, recovery_sent_at, last_sign_in_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values (
  '00000000-0000-0000-0000-000000000000', 
  '00000000-0000-0000-0000-000000000001', 
  'authenticated', 
  'authenticated', 
  'admin@jigyasu.com', 
  crypt('Admin123!', gen_salt('bf')), 
  now(), now(), now(), 
  '{"provider":"email","providers":["email"]}', 
  '{"full_name":"Local Admin"}', 
  now(), now(), 
  '', '', '', ''
) ON CONFLICT DO NOTHING;

insert into public.users (id, full_name, email, role, is_active)
values (
  '00000000-0000-0000-0000-000000000001', 
  'Local Admin', 
  'admin@jigyasu.com', 
  'admin',
  true
) ON CONFLICT DO NOTHING;

-- Create a mock Team Lead
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, recovery_sent_at, last_sign_in_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values (
  '00000000-0000-0000-0000-000000000000', 
  '00000000-0000-0000-0000-000000000002', 
  'authenticated', 
  'authenticated', 
  'tl@jigyasu.com', 
  crypt('Lead123!', gen_salt('bf')), 
  now(), now(), now(), 
  '{"provider":"email","providers":["email"]}', 
  '{"full_name":"Test Team Lead"}', 
  now(), now(), 
  '', '', '', ''
) ON CONFLICT DO NOTHING;

insert into public.users (id, full_name, email, role, is_active)
values (
  '00000000-0000-0000-0000-000000000002', 
  'Test Team Lead', 
  'tl@jigyasu.com', 
  'team_lead',
  true
) ON CONFLICT DO NOTHING;

-- Create a mock Caller
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, 
  email_confirmed_at, recovery_sent_at, last_sign_in_at, 
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values (
  '00000000-0000-0000-0000-000000000000', 
  '00000000-0000-0000-0000-000000000003', 
  'authenticated', 
  'authenticated', 
  'caller@jigyasu.com', 
  crypt('Caller123!', gen_salt('bf')), 
  now(), now(), now(), 
  '{"provider":"email","providers":["email"]}', 
  '{"full_name":"Test Caller"}', 
  now(), now(), 
  '', '', '', ''
) ON CONFLICT DO NOTHING;

insert into public.users (id, full_name, email, role, team_lead_id, is_active)
values (
  '00000000-0000-0000-0000-000000000003', 
  'Test Caller', 
  'caller@jigyasu.com', 
  'caller',
  '00000000-0000-0000-0000-000000000002',
  true
) ON CONFLICT DO NOTHING;

-- Seed some mock leads (unassigned)
insert into public.leads (school_name, city, state, stage)
values 
  ('Delhi Public School', 'Delhi', 'Delhi', 'uncontacted'),
  ('St. Xaviers High School', 'Mumbai', 'Maharashtra', 'uncontacted'),
  ('Kendriya Vidyalaya', 'Bangalore', 'Karnataka', 'uncontacted')
ON CONFLICT DO NOTHING;
