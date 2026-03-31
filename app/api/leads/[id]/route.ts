import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getLeadById } from '@/lib/db/leads';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    if (!userId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();
    const lead = await getLeadById(supabase, params.id);

    if (role === 'team_lead' && lead.assigned_tl_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (role === 'caller' && lead.assigned_cl_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: lead });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch lead';
    console.error('GET /api/leads/[id] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
