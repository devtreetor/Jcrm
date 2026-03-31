import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getInsights } from '@/lib/db/insights';
import type { InsightsRange } from '@/types/team.types';

const insightsQuerySchema = z.object({
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
    const parsed = insightsQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const range = parsed.data.range as InsightsRange;
    const supabase = getSupabaseServiceClient();

    let data;
    if (role === 'admin') {
      data = await getInsights(supabase, range);
    } else if (role === 'team_lead') {
      data = await getInsights(supabase, range, userId);
    } else {
      data = await getInsights(supabase, range, undefined, userId);
    }

    return NextResponse.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch insights';
    console.error('GET /api/insights error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
