import { NextRequest, NextResponse } from 'next/server';
import { assignLeadSchema } from '@/lib/schemas/lead.schema';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { assignLead, getLeadById } from '@/lib/db/leads';
import { assignmentGuard } from '@/lib/guards/assignment';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');
    const userTlId = request.headers.get('x-user-tl-id') || null;

    if (!userId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (role === 'caller') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = assignLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    const existingLead = await getLeadById(supabase, params.id);
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (role === 'team_lead' && existingLead.assigned_tl_id !== userId) {
      return NextResponse.json(
        { error: 'You can only assign leads assigned to your team' },
        { status: 403 }
      );
    }

    const guardResult = await assignmentGuard({
      assignedTlId: parsed.data.assigned_tl_id,
      assignedClId: parsed.data.assigned_cl_id,
      requestingUserRole: role,
      requestingUserTlId: role === 'team_lead' ? userId : userTlId,
      supabase,
    });

    if (!guardResult.valid) {
      return NextResponse.json(
        { error: guardResult.error },
        { status: guardResult.status }
      );
    }

    const updated = await assignLead(
      supabase,
      params.id,
      parsed.data.assigned_tl_id,
      parsed.data.assigned_cl_id
    );

    return NextResponse.json({ data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to assign lead';
    console.error('PATCH /api/leads/[id]/assign error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
