import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let serverInstance: SupabaseClient | null = null;

export function getSupabaseServiceClient(): SupabaseClient {
  if (serverInstance) return serverInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables (URL or SERVICE_ROLE_KEY)');
  }

  serverInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverInstance;
}
