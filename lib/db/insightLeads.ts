import { type SupabaseClient } from '@supabase/supabase-js';
import type { Lead, LeadStage } from '@/types/lead.types';
import type { InsightsRange } from '@/types/team.types';
import { getDateRange } from '@/lib/db/insights';

export interface CalledLeadRow {
  call_id: string;
  caller_name: string;
  status: string;
  notes: string | null;
  called_at: string;
  lead_id: string;
  school_name: string;
  city: string | null;
  state: string | null;
  stage: LeadStage;
}

export async function getLeadsByStageInRange(
  supabase: SupabaseClient,
  stage: LeadStage,
  range: InsightsRange,
  teamLeadId?: string,
  callerId?: string
): Promise<Lead[]> {
  const { start, end } = getDateRange(range);

  let query = supabase
    .from('leads')
    .select('*')
    .eq('stage', stage)
    .gte('updated_at', start)
    .lte('updated_at', end)
    .order('updated_at', { ascending: false });

  if (teamLeadId) {
    query = query.eq('assigned_tl_id', teamLeadId);
  }
  if (callerId) {
    query = query.eq('assigned_cl_id', callerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Lead[];
}

export async function getCalledLeadsInRange(
  supabase: SupabaseClient,
  range: InsightsRange,
  teamLeadId?: string,
  callerId?: string
): Promise<{ calls: CalledLeadRow[]; leads: Lead[] }> {
  const { start, end } = getDateRange(range);

  // Build call_logs query with joined lead data
  let callQuery = supabase
    .from('call_logs')
    .select('id, caller_id, status, notes, called_at, lead_id, users!caller_id(full_name), leads!lead_id(id, school_name, city, state, stage, location, board, principal_phone, chairman_phone, principal_name, chairman_name, assigned_tl_id, assigned_cl_id, import_batch_id, created_at, updated_at)')
    .gte('called_at', start)
    .lte('called_at', end)
    .order('called_at', { ascending: false });

  if (callerId) {
    callQuery = callQuery.eq('caller_id', callerId);
  }

  // If teamLeadId, get all callers under that TL first
  if (teamLeadId) {
    const { data: teamUsers } = await supabase
      .from('users')
      .select('id')
      .eq('team_lead_id', teamLeadId);

    const callerIds = teamUsers?.map((u: { id: string }) => u.id) ?? [];
    if (callerIds.length === 0) {
      return { calls: [], leads: [] };
    }
    callQuery = callQuery.in('caller_id', callerIds);
  }

  const { data, error } = await callQuery;
  if (error) throw error;

  type RawRow = {
    id: string;
    caller_id: string;
    status: string;
    notes: string | null;
    called_at: string;
    lead_id: string;
    users: { full_name: string } | null;
    leads: Lead | null;
  };

  const rows = (data ?? []) as unknown as RawRow[];

  // Build call log list
  const calls: CalledLeadRow[] = rows.map((row) => ({
    call_id: row.id,
    caller_name: row.users?.full_name ?? 'Unknown',
    status: row.status,
    notes: row.notes,
    called_at: row.called_at,
    lead_id: row.lead_id,
    school_name: row.leads?.school_name ?? 'Unknown',
    city: row.leads?.city ?? null,
    state: row.leads?.state ?? null,
    stage: (row.leads?.stage ?? 'uncontacted') as LeadStage,
  }));

  // Deduplicate leads
  const leadMap = new Map<string, Lead>();
  for (const row of rows) {
    if (row.leads && !leadMap.has(row.lead_id)) {
      leadMap.set(row.lead_id, row.leads);
    }
  }

  return { calls, leads: Array.from(leadMap.values()) };
}
