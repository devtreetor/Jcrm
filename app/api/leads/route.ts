import { NextRequest, NextResponse } from 'next/server';
import { leadFiltersSchema } from '@/lib/schemas/lead.schema';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getLeads } from '@/lib/db/leads';
import type { LeadFilters } from '@/types/lead.types';

export async function GET(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    if (!userId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = leadFiltersSchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid filters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const filters = parsed.data;

    if (role === 'team_lead') {
      filters.assigned_tl_id = userId;
    } else if (role === 'caller') {
      filters.assigned_cl_id = userId;
    }

    const supabase = getSupabaseServiceClient();
    const result = await getLeads(supabase, filters as LeadFilters);

    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch leads';
    console.error('GET /api/leads error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
