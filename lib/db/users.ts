import { type SupabaseClient } from '@supabase/supabase-js';
import type { User, CreateUserPayload, UpdateUserPayload } from '@/types/user.types';

export async function getUsers(supabase: SupabaseClient): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as User[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch users';
    throw new Error(message);
  }
}

export async function getUserById(supabase: SupabaseClient, id: string): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as User;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch user';
    throw new Error(message);
  }
}

export async function getUserByEmail(supabase: SupabaseClient, email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as User | null;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch user by email';
    throw new Error(message);
  }
}

export async function createUser(supabase: SupabaseClient, payload: CreateUserPayload): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create user';
    throw new Error(message);
  }
}

export async function updateUser(supabase: SupabaseClient, id: string, payload: UpdateUserPayload): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update user';
    throw new Error(message);
  }
}

export async function getUsersByTeamLead(supabase: SupabaseClient, teamLeadId: string): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('team_lead_id', teamLeadId)
      .eq('role', 'caller')
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;
    return data as User[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch team callers';
    throw new Error(message);
  }
}

export async function getTeamLeads(supabase: SupabaseClient): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'team_lead')
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;
    return data as User[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch team leads';
    throw new Error(message);
  }
}

export async function getMentionableUsers(
  supabase: SupabaseClient,
  userId: string,
  role: string,
  teamLeadId: string | null
): Promise<User[]> {
  try {
    if (role === 'admin') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .neq('id', userId)
        .order('full_name');
      if (error) throw error;
      return data as User[];
    } else if (role === 'team_lead') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .neq('id', userId)
        .or(`role.eq.admin,role.eq.team_lead,and(role.eq.caller,team_lead_id.eq.${userId})`)
        .order('full_name');
      if (error) throw error;
      return data as User[];
    } else {
      const orQuery = teamLeadId 
        ? `role.eq.admin,id.eq.${teamLeadId}` 
        : 'role.eq.admin';
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .neq('id', userId)
        .or(orQuery)
        .order('full_name');
      if (error) throw error;
      return data as User[];
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch mentionable users';
    throw new Error(message);
  }
}
