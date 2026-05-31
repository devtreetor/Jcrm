import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getLeadById, updateLead, deleteLead } from '@/lib/db/leads';
import { updateLeadSchema } from '@/lib/schemas/lead.schema';

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

    const supabase = getSupabaseServiceClient();
    const lead = await getLeadById(supabase, params.id);

    if (role === 'team_lead' && lead.assigned_tl_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (role === 'caller' && lead.assigned_cl_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updatedLead = await updateLead(supabase, params.id, parsed.data);
    return NextResponse.json({ data: updatedLead });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update lead';
    console.error('PATCH /api/leads/[id] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    if (!userId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Only admins can delete leads.' }, { status: 403 });
    }

    const supabase = getSupabaseServiceClient();
    await deleteLead(supabase, params.id);

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete lead';
    console.error('DELETE /api/leads/[id] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
