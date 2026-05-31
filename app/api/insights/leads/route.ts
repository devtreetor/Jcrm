import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { LEAD_STAGES } from '@/lib/constants';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getLeadsByStageInRange, getCalledLeadsInRange } from '@/lib/db/insightLeads';
import type { LeadStage } from '@/types/lead.types';
import type { InsightsRange } from '@/types/team.types';

const querySchema = z.object({
  type: z.enum(['stage', 'calls']),
  stage: z.enum(LEAD_STAGES as unknown as [string, ...string[]]).optional(),
  range: z.enum(['day', 'month', '6m']).default('month'),
});

export async function GET(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    if (!userId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = querySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, stage, range } = parsed.data;

    if (type === 'stage' && !stage) {
      return NextResponse.json(
        { error: 'stage parameter is required when type is "stage"' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    // Determine role-based scoping (same logic as /api/insights)
    let teamLeadId: string | undefined;
    let callerId: string | undefined;

    if (role === 'team_lead') {
      teamLeadId = userId;
    } else if (role === 'caller') {
      callerId = userId;
    }
    // admin sees everything — no filters

    if (type === 'stage') {
      const leads = await getLeadsByStageInRange(
        supabase,
        stage as LeadStage,
        range as InsightsRange,
        teamLeadId,
        callerId
      );
      return NextResponse.json({ data: { type: 'stage', leads } });
    }

    // type === 'calls'
    const result = await getCalledLeadsInRange(
      supabase,
      range as InsightsRange,
      teamLeadId,
      callerId
    );
    return NextResponse.json({ data: { type: 'calls', ...result } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch insight leads';
    console.error('GET /api/insights/leads error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
