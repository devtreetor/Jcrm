import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getMentionableUsers } from '@/lib/db/users';

export async function GET(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');
    const teamLeadId = request.headers.get('x-user-tl-id');

    if (!userId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();
    const users = await getMentionableUsers(
      supabase,
      userId,
      role,
      teamLeadId || null
    );

    return NextResponse.json({ data: users });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch mentionable users';
    console.error('GET /api/users/mentionable error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
