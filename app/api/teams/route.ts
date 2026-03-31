import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getTeams, createTeam } from '@/lib/db/teams';

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(200),
  team_lead_id: z.string().uuid('Invalid team lead ID'),
});

export async function GET(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');

    if (role !== 'admin' && role !== 'team_lead') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseServiceClient();
    const teams = await getTeams(supabase);

    return NextResponse.json({ data: teams });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch teams';
    console.error('GET /api/teams error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createTeamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();
    const team = await createTeam(supabase, parsed.data);

    return NextResponse.json({ data: team }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create team';
    console.error('POST /api/teams error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
