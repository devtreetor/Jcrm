import { type SupabaseClient } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id: string;
  lead_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: { full_name: string; role: string };
  lead?: { school_name: string };
}

export async function getNotificationsForUser(
  supabase: SupabaseClient,
  recipientId: string
): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, sender:sender_id(full_name, role), lead:lead_id(school_name)')
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Notification[];
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
    throw new Error(message);
  }
}

export async function markNotificationAsRead(
  supabase: SupabaseClient,
  notificationId: string,
  recipientId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('recipient_id', recipientId);

    if (error) throw error;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to mark notification as read';
    throw new Error(message);
  }
}

export async function markAllNotificationsAsRead(
  supabase: SupabaseClient,
  recipientId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', recipientId)
      .eq('is_read', false);

    if (error) throw error;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to mark all notifications as read';
    throw new Error(message);
  }
}

export async function createNotifications(
  supabase: SupabaseClient,
  recipientIds: string[],
  senderId: string,
  leadId: string,
  message: string
): Promise<void> {
  try {
    if (recipientIds.length === 0) return;
    const rows = recipientIds.map(recipientId => ({
      recipient_id: recipientId,
      sender_id: senderId,
      lead_id: leadId,
      message
    }));

    const { error } = await supabase
      .from('notifications')
      .insert(rows);

    if (error) throw error;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create notifications';
    throw new Error(message);
  }
}
