import { type SupabaseClient } from '@supabase/supabase-js';
import type { Lead, LeadFilters, StageHistory } from '@/types/lead.types';

export async function getLeads(
  supabase: SupabaseClient,
  filters: LeadFilters
): Promise<{ leads: Lead[]; count: number }> {
  try {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' });

    if (filters.stage) {
      query = query.eq('stage', filters.stage);
    }
    if (filters.assigned_tl_id) {
      query = query.eq('assigned_tl_id', filters.assigned_tl_id);
    }
    if (filters.assigned_cl_id) {
      query = query.eq('assigned_cl_id', filters.assigned_cl_id);
    }
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters.state) {
      query = query.ilike('state', `%${filters.state}%`);
    }
    if (filters.search) {
      query = query.ilike('school_name', `%${filters.search}%`);
    }

    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    return { leads: data as Lead[], count: count ?? 0 };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch leads';
    throw new Error(message);
  }
}

export async function getLeadById(supabase: SupabaseClient, id: string): Promise<Lead> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Lead;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch lead';
    throw new Error(message);
  }
}

export async function assignLead(
  supabase: SupabaseClient,
  id: string,
  assignedTlId: string | null,
  assignedClId: string | null
): Promise<Lead> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({
        assigned_tl_id: assignedTlId,
        assigned_cl_id: assignedClId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to assign lead';
    throw new Error(message);
  }
}

export async function updateLeadStage(
  supabase: SupabaseClient,
  id: string,
  stage: string,
  changedBy: string,
  fromStage: string
): Promise<Lead> {
  try {
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .update({ stage })
      .eq('id', id)
      .select()
      .single();

    if (leadError) throw leadError;

    const { error: historyError } = await supabase
      .from('stage_history')
      .insert({
        lead_id: id,
        changed_by: changedBy,
        from_stage: fromStage,
        to_stage: stage,
      });

    if (historyError) throw historyError;

    return lead as Lead;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update lead stage';
    throw new Error(message);
  }
}

export async function getStageHistory(
  supabase: SupabaseClient,
  leadId: string
): Promise<StageHistory[]> {
  try {
    const { data, error } = await supabase
      .from('stage_history')
      .select('*')
      .eq('lead_id', leadId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return data as StageHistory[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch stage history';
    throw new Error(message);
  }
}

export async function batchInsertLeads(
  supabase: SupabaseClient,
  leads: Array<{
    school_name: string;
    location: string;
    city: string;
    state: string;
    board: string;
    principal_phone: string;
    chairman_phone: string;
    principal_name: string;
    chairman_name: string;
    import_batch_id: string;
  }>
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert(leads)
      .select('id');

    if (error) throw error;
    return data?.length ?? 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to batch insert leads';
    throw new Error(message);
  }
}
