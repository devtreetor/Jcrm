-- Add principal_name and chairman_name columns to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS principal_name text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS chairman_name text;
