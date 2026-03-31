import { NextRequest, NextResponse } from 'next/server';
import { updateUserSchema } from '@/lib/schemas/user.schema';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { updateUser, getUserById } from '@/lib/db/users';
import type { UpdateUserPayload } from '@/types/user.types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = request.headers.get('x-user-role');

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    const existing = await getUserById(supabase, params.id);
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updated = await updateUser(supabase, params.id, parsed.data as UpdateUserPayload);
    return NextResponse.json({ data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update user';
    console.error('PATCH /api/users/[id] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
