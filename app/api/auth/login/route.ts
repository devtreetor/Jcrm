import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { loginSchema } from '@/lib/schemas/user.schema';
import { getSupabaseServiceClient } from '@/lib/supabase/server';
import { getUserByEmail } from '@/lib/db/users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = getSupabaseServiceClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = await getUserByEmail(supabase, email);
    if (!user) {
      return NextResponse.json(
        { error: 'User profile not found. Contact administrator.' },
        { status: 404 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated. Contact administrator.' },
        { status: 403 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const jwtExpiry = parseInt(process.env.JWT_EXPIRY ?? '3600', 10);
    const secret = new TextEncoder().encode(jwtSecret);

    const token = await new SignJWT({
      id: user.id,
      role: user.role,
      team_lead_id: user.team_lead_id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(`${jwtExpiry}s`)
      .sign(secret);

    const response = NextResponse.json({
      data: {
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          team_lead_id: user.team_lead_id,
        },
      },
    });

    response.cookies.set('supabase-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: jwtExpiry,
      path: '/',
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    console.error('Login error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
