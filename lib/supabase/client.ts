import { createClient } from '@supabase/supabase-js';

let clientInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseBrowserClient() {
  if (clientInstance) return clientInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase public environment variables');
  }

  clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  return clientInstance;
}
