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

    // Role check — buyer only
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    if (profile.role !== 'buyer') {
      return NextResponse.json({ error: 'Forbidden: buyer role required' }, { status: 403 });
    }

    const body = await req.json();
    const { paymentId, reason } = body as { paymentId: string; reason: string };

    if (!paymentId || !reason) {
      return NextResponse.json(
        { error: 'paymentId and reason are required' },
        { status: 400 },
      );
    }

    // Verify payment belongs to this buyer and is confirmed
    const { data: payment, error: paymentError } = await adminClient
      .from('payments')
      .select('id, buyer_id, status')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (payment.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Only confirmed payments can be refunded' },
        { status: 400 },
      );
    }

    const { error: updateError } = await adminClient
      .from('payments')
      .update({
        status: 'refund_requested',
        refund_requested_at: new Date().toISOString(),
        refund_reason: reason,
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
