import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check — admin or superadmin only
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    const allowedRoles = ['admin', 'superadmin', 'super_duper_admin'];
    if (!allowedRoles.includes(profile.role as string)) {
      return NextResponse.json(
        { error: 'Forbidden: admin role required' },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { paymentId } = body as { paymentId: string };

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
    }

    // Fetch payment to confirm it exists
    const { data: payment, error: paymentError } = await adminClient
      .from('payments')
      .select('id, status')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const { error: updateError } = await adminClient
      .from('payments')
      .update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
