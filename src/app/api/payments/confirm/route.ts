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

    // Role check — seller only
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    if (profile.role !== 'seller') {
      return NextResponse.json({ error: 'Forbidden: seller role required' }, { status: 403 });
    }

    const body = await req.json();
    const { paymentId, action } = body as {
      paymentId: string;
      action: 'confirm' | 'reject';
    };

    if (!paymentId || !['confirm', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'paymentId and valid action (confirm | reject) are required' },
        { status: 400 },
      );
    }

    // Fetch payment to verify existence and get property_id
    const { data: payment, error: paymentError } = await adminClient
      .from('payments')
      .select('id, property_id')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verify property belongs to this seller
    const { data: property, error: propertyError } = await adminClient
      .from('properties')
      .select('landowner_id')
      .eq('id', payment.property_id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (property.landowner_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: this property does not belong to you' },
        { status: 403 },
      );
    }

    const newStatus = action === 'confirm' ? 'confirmed' : 'rejected';

    const { error: updateError } = await adminClient
      .from('payments')
      .update({ status: newStatus })
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
