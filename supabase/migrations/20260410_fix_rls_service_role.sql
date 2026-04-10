-- Fix: Allow service_role to bypass RLS on import_batches and leads tables.
-- The service_role should bypass RLS by default, but as a safety net we
-- recreate the policies with explicit WITH CHECK clauses that also permit
-- the service_role PostgreSQL role.

-- ─── IMPORT_BATCHES ─────────────────────────────────────────────────────
-- Drop existing policy
DROP POLICY IF EXISTS "admin_all_batches" ON public.import_batches;

-- Recreate with service_role bypass: allow admin JWT users AND the
-- service_role PostgreSQL role (used by the service-role key from the API)
CREATE POLICY "admin_all_batches" ON public.import_batches
  FOR ALL
  USING (
    auth.jwt()->>'role' = 'admin'
    OR current_setting('role') = 'service_role'
  )
  WITH CHECK (
    auth.jwt()->>'role' = 'admin'
    OR current_setting('role') = 'service_role'
  );

-- ─── LEADS ──────────────────────────────────────────────────────────────
-- Drop the admin policy for leads (other policies stay unchanged)
DROP POLICY IF EXISTS "admin_all_leads" ON public.leads;

-- Recreate with service_role bypass
CREATE POLICY "admin_all_leads" ON public.leads
  FOR ALL
  USING (
    auth.jwt()->>'role' = 'admin'
    OR current_setting('role') = 'service_role'
  )
  WITH CHECK (
    auth.jwt()->>'role' = 'admin'
    OR current_setting('role') = 'service_role'
  );
