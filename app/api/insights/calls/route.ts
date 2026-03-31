import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getCallInsights } from '@/lib/db/insights';
import type { InsightsRange } from '@/types/team.types';

const callInsightsQuerySchema = z.object({
  range: z.enum(['day', 'month', '6m']).default('month'),
});

export async function GET(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    if (!userId || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (role !== 'admin' && role !== 'team_lead') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = callInsightsQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const range = parsed.data.range as InsightsRange;
    const supabase = getSupabaseServiceClient();

    const data = await getCallInsights(
      supabase,
      range,
      role === 'team_lead' ? userId : undefined
    );

    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch call insights';
    console.error('GET /api/insights/calls error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
