import { NextRequest, NextResponse } from 'next/server';
import { createCallLogSchema } from '@/lib/schemas/call.schema';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getCallLogsByLead, createCallLog } from '@/lib/db/calls';
import { getLeadById } from '@/lib/db/leads';
import type { CreateCallLogPayload } from '@/types/call.types';

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

    const logs = await getCallLogsByLead(supabase, params.id);
    return NextResponse.json({ data: logs });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch call logs';
    console.error('GET /api/leads/[id]/calls error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    if (!userId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (role !== 'caller' && role !== 'admin' && role !== 'team_lead') {
      return NextResponse.json(
        { error: 'You do not have permission to log calls' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createCallLogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();
    const lead = await getLeadById(supabase, params.id);

    if (role === 'caller' && lead.assigned_cl_id !== userId) {
      return NextResponse.json(
        { error: 'You can only log calls for leads assigned to you' },
        { status: 403 }
      );
    }

    if (role === 'team_lead' && lead.assigned_tl_id !== userId) {
      return NextResponse.json(
        { error: 'You can only log calls for leads assigned to your team' },
        { status: 403 }
      );
    }

    const callLog = await createCallLog(supabase, params.id, userId, parsed.data as CreateCallLogPayload);
    return NextResponse.json({ data: callLog }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to log call';
    console.error('POST /api/leads/[id]/calls error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
