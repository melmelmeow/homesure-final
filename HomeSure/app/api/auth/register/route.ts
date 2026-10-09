import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, role = 'buyer', phone } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required.' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // 1. Sign up user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role,
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user?.id;

    if (userId) {
      // 2. Ensure profile entry exists in profiles table using Admin client
      const adminSupabase = createAdminClient();
      await adminSupabase.from('profiles').upsert({
        id: userId,
        email: email,
        full_name: full_name,
        role: role,
        phone: phone || null,
        is_verified: false,
      });
    }

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: userId,
          email,
          full_name,
          role,
        },
        session: authData.session,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
