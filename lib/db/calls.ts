import { type SupabaseClient } from '@supabase/supabase-js';
import type { CallLog, CallPhoto, CreateCallLogPayload } from '@/types/call.types';

export async function getCallLogsByLead(
  supabase: SupabaseClient,
  leadId: string
): Promise<CallLog[]> {
  try {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*, caller:caller_id(full_name, role)')
      .eq('lead_id', leadId)
      .order('called_at', { ascending: false });

    if (error) throw error;

    const logs = data as CallLog[];

    // Batch-fetch photos for all call logs
    if (logs.length > 0) {
      const logIds = logs.map((l) => l.id);
      const { data: photos, error: photosError } = await supabase
        .from('call_photos')
        .select('*')
        .in('call_log_id', logIds)
        .order('created_at', { ascending: true });

      if (!photosError && photos) {
        const photosByLog = new Map<string, CallPhoto[]>();
        for (const photo of photos as CallPhoto[]) {
          const existing = photosByLog.get(photo.call_log_id) || [];
          existing.push(photo);
          photosByLog.set(photo.call_log_id, existing);
        }
        for (const log of logs) {
          log.photos = photosByLog.get(log.id) || [];
        }
      }
    }

    return logs;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch call logs';
    throw new Error(message);
  }
}

export async function createCallLog(
  supabase: SupabaseClient,
  leadId: string,
  callerId: string,
  payload: CreateCallLogPayload & { tagged_user_ids?: string[] }
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

    const callLog = data as CallLog;
    callLog.photos = [];

    // Insert photos if provided
    if (payload.photo_urls && payload.photo_urls.length > 0) {
      const photoRows = payload.photo_urls.map((url) => ({
        call_log_id: callLog.id,
        photo_url: url,
      }));

      const { data: photos, error: photosError } = await supabase
        .from('call_photos')
        .insert(photoRows)
        .select();

      if (photosError) {
        console.error('Failed to insert call photos:', photosError.message);
      } else {
        callLog.photos = (photos as CallPhoto[]) || [];
      }
    }

    // Create notifications for tagged users
    if (payload.tagged_user_ids && payload.tagged_user_ids.length > 0) {
      const { data: callerData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', callerId)
        .single();
      const callerName = callerData?.full_name || 'A team member';

      const { data: leadData } = await supabase
        .from('leads')
        .select('school_name')
        .eq('id', leadId)
        .single();
      const schoolName = leadData?.school_name || 'a lead';

      const notificationMessage = `${callerName} tagged you in a call log for ${schoolName}`;

      const notificationRows = payload.tagged_user_ids.map((recipientId) => ({
        recipient_id: recipientId,
        sender_id: callerId,
        lead_id: leadId,
        message: notificationMessage,
        is_read: false,
      }));

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notificationRows);

      if (notificationError) {
        console.error('Failed to create notifications:', notificationError.message);
      }
    }

    return callLog;
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
