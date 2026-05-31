import { type SupabaseClient } from '@supabase/supabase-js';
import type { InsightsData, InsightsRange } from '@/types/team.types';

export function getDateRange(range: InsightsRange): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();
  let start: Date;

  switch (range) {
    case 'day':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case '6m':
      start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      break;
    default: {
      const _exhaustive: never = range;
      throw new Error(`Unknown range: ${_exhaustive}`);
    }
  }

  return { start: start.toISOString(), end };
}

export async function getInsights(
  supabase: SupabaseClient,
  range: InsightsRange,
  teamLeadId?: string,
  callerId?: string
): Promise<InsightsData> {
  try {
    const { start, end } = getDateRange(range);

    let callQuery = supabase
      .from('call_logs')
      .select('id', { count: 'exact', head: true })
      .gte('called_at', start)
      .lte('called_at', end);

    if (callerId) {
      callQuery = callQuery.eq('caller_id', callerId);
    }

    const { count: totalCalls, error: callError } = await callQuery;
    if (callError) throw callError;

    const stageCountQuery = async (stage: string): Promise<number> => {
      let query = supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('stage', stage)
        .gte('updated_at', start)
        .lte('updated_at', end);

      if (teamLeadId) {
        query = query.eq('assigned_tl_id', teamLeadId);
      }
      if (callerId) {
        query = query.eq('assigned_cl_id', callerId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    };

    const [demosBooked, meetingsFixed, meetingsDone, negotiations, proposalsSent, won, lost] = await Promise.all([
      stageCountQuery('demo_booked'),
      stageCountQuery('meeting_fixed'),
      stageCountQuery('meeting_done'),
      stageCountQuery('negotiation'),
      stageCountQuery('proposal_sent'),
      stageCountQuery('won'),
      stageCountQuery('lost'),
    ]);

    return {
      total_calls: totalCalls ?? 0,
      demos_booked: demosBooked,
      meetings_fixed: meetingsFixed,
      meetings_done: meetingsDone,
      negotiations,
      proposals_sent: proposalsSent,
      won,
      lost,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch insights';
    throw new Error(message);
  }
}

export async function getCallInsights(
  supabase: SupabaseClient,
  range: InsightsRange,
  teamLeadId?: string
): Promise<Array<{ caller_id: string; caller_name: string; call_count: number }>> {
  try {
    const { start, end } = getDateRange(range);

    let query = supabase
      .from('call_logs')
      .select('caller_id, users!caller_id(full_name)')
      .gte('called_at', start)
      .lte('called_at', end);

    if (teamLeadId) {
      const { data: teamUsers } = await supabase
        .from('users')
        .select('id')
        .eq('team_lead_id', teamLeadId);

      const callerIds = teamUsers?.map((u: { id: string }) => u.id) ?? [];
      
      if (callerIds.length === 0) {
        return [];
      }
      query = query.in('caller_id', callerIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    const callerMap = new Map<string, { name: string; count: number }>();

    if (data) {
      for (const row of data as unknown as Array<{ caller_id: string; users: { full_name: string } | null }>) {
        const existing = callerMap.get(row.caller_id);
        if (existing) {
          existing.count += 1;
        } else {
          callerMap.set(row.caller_id, {
            name: row.users?.full_name ?? 'Unknown',
            count: 1,
          });
        }
      }
    }

    return Array.from(callerMap.entries()).map(([callerId, info]) => ({
      caller_id: callerId,
      caller_name: info.name,
      call_count: info.count,
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch call insights';
    throw new Error(message);
  }
}
