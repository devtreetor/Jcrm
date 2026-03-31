import { type SupabaseClient } from '@supabase/supabase-js';
import type { CallLog, CreateCallLogPayload } from '@/types/call.types';

export async function getCallLogsByLead(
  supabase: SupabaseClient,
  leadId: string
): Promise<CallLog[]> {
  try {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('lead_id', leadId)
      .order('called_at', { ascending: false });

    if (error) throw error;
    return data as CallLog[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch call logs';
    throw new Error(message);
  }
}

export async function createCallLog(
  supabase: SupabaseClient,
  leadId: string,
  callerId: string,
  payload: CreateCallLogPayload
): Promise<CallLog> {
  try {
    const { data, error } = await supabase
      .from('call_logs')
      .insert({
        lead_id: leadId,
        caller_id: callerId,
        status: payload.status,
        notes: payload.notes ?? null,
        callback_date: payload.callback_date ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as CallLog;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create call log';
    throw new Error(message);
  }
}

export async function getCallbacksForCaller(
  supabase: SupabaseClient,
  callerId: string
): Promise<CallLog[]> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('caller_id', callerId)
      .not('callback_date', 'is', null)
      .gte('callback_date', now)
      .order('callback_date', { ascending: true });

    if (error) throw error;
    return data as CallLog[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch callbacks';
    throw new Error(message);
  }
}

export async function getCallCountsByRange(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string,
  callerId?: string
): Promise<number> {
  try {
    let query = supabase
      .from('call_logs')
      .select('id', { count: 'exact', head: true })
      .gte('called_at', startDate)
      .lte('called_at', endDate);

    if (callerId) {
      query = query.eq('caller_id', callerId);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to count calls';
    throw new Error(message);
  }
}
