import { NextRequest, NextResponse } from 'next/server';
import { changePasswordSchema } from '@/lib/schemas/user.schema';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getUserById } from '@/lib/db/users';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { current_password, new_password } = parsed.data;

    const supabase = getSupabaseServiceClient();

    // Get the user's email to verify current password
    const user = await getUserById(supabase, userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify the current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current_password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Get the Supabase auth user ID to update the password
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json(
        { error: 'Failed to verify user account' },
        { status: 500 }
      );
    }

    const authUser = authUsers.users.find((u) => u.email === user.email);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Auth account not found. Contact administrator.' },
        { status: 404 }
      );
    }

    // Update the password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { password: new_password }
    );

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update password: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { message: 'Password changed successfully' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to change password';
    console.error('POST /api/auth/change-password error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
