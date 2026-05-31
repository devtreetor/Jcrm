import { NextRequest, NextResponse } from 'next/server';
import { createUserSchema } from '@/lib/schemas/user.schema';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getUsers, createUser, getUsersByTeamLead } from '@/lib/db/users';
import type { CreateUserPayload } from '@/types/user.types';

export async function GET(request: NextRequest) {
  try {
    const role = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    if (role !== 'admin' && role !== 'team_lead') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseServiceClient();
    let users;

    if (role === 'admin') {
      users = await getUsers(supabase);
    } else {
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      users = await getUsersByTeamLead(supabase, userId);
    }

    return NextResponse.json({ data: users });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch users';
    console.error('GET /api/users error:', message);
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
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: parsed.data.email,
      password: 'TempPass123!',
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json(
        { error: `Auth creation failed: ${authError.message}` },
        { status: 400 }
      );
    }

    const user = await createUser(supabase, {
      ...parsed.data,
      team_lead_id: parsed.data.team_lead_id ?? null,
    } as CreateUserPayload);

    return NextResponse.json(
      {
        data: {
          ...user,
          auth_id: authUser.user.id,
          temp_password: 'TempPass123!',
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create user';
    console.error('POST /api/users error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
