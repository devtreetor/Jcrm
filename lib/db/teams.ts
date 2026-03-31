import { type SupabaseClient } from '@supabase/supabase-js';
import type { Team, CreateTeamPayload } from '@/types/team.types';

export async function getTeams(supabase: SupabaseClient): Promise<Team[]> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Team[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch teams';
    throw new Error(message);
  }
}

export async function createTeam(supabase: SupabaseClient, payload: CreateTeamPayload): Promise<Team> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as Team;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create team';
    throw new Error(message);
  }
}

export async function getTeamByLeadId(supabase: SupabaseClient, teamLeadId: string): Promise<Team | null> {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('team_lead_id', teamLeadId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Team | null;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch team';
    throw new Error(message);
  }
}
