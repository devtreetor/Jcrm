import { NextRequest, NextResponse } from 'next/server';
import { updateStageSchema } from '@/lib/schemas/lead.schema';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getLeadById, updateLeadStage } from '@/lib/db/leads';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    if (!userId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateStageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();
    const lead = await getLeadById(supabase, params.id);

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (role === 'team_lead' && lead.assigned_tl_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (role === 'caller' && lead.assigned_cl_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (lead.stage === parsed.data.stage) {
      return NextResponse.json(
        { error: `Lead is already at stage "${parsed.data.stage}"` },
        { status: 400 }
      );
    }

    const updated = await updateLeadStage(
      supabase,
      params.id,
      parsed.data.stage,
      userId,
      lead.stage
    );

    return NextResponse.json({ data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update stage';
    console.error('PATCH /api/leads/[id]/stage error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
