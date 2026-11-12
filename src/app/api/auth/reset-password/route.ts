import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ResetPasswordSchema = z.object({
  access_token: z.string().min(1, 'access_token is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  refresh_token: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Validation error' },
        { status: 422 },
      );
    }

    const { access_token, new_password, refresh_token } = parsed.data;

    const supabase = createSupabaseServerClient();
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token ?? '',
    });

    if (sessionError) {
      return NextResponse.json(
        { error: sessionError.message },
        { status: 401 },
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
