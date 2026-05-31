import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import {
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/db/notifications';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();
    const notifications = await getNotificationsForUser(supabase, userId);

    return NextResponse.json({ data: notifications });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
    console.error('GET /api/notifications error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = getSupabaseServiceClient();

    if (body.all) {
      await markAllNotificationsAsRead(supabase, userId);
    } else if (body.id) {
      await markNotificationAsRead(supabase, body.id, userId);
    } else {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update notifications';
    console.error('PATCH /api/notifications error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
