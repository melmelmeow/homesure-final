import { NextRequest, NextResponse } from 'next/server';
import Xendit from 'xendit-node';
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

    const body = await req.json();
    const { propertyId, purpose, period, dueDate, depositMonths } = body as {
      propertyId: string;
      purpose: string;
      period?: string;
      dueDate?: string;
      depositMonths?: number;
    };

    if (!propertyId || !purpose) {
      return NextResponse.json(
        { error: 'propertyId and purpose are required' },
        { status: 400 },
      );
    }

    // Fetch listing price from DB — never trust client-sent amount
    const { data: property, error: propError } = await adminClient
      .from('properties')
      .select('id, title, price, landowner_id')
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const amount = property.price as number;
    const userId = user.id;
    const referenceId = `kf-${Date.now()}-${userId.slice(0, 8)}`;

    // Create Xendit QR Ph
    const x = new Xendit({ secretKey: process.env.XENDIT_SECRET_KEY! });
    let qr: Record<string, unknown> | null = null;
    const xAny = x as unknown as { QrCode?: { createQRCode: (args: unknown) => Promise<Record<string, unknown>> } };
    if (xAny.QrCode?.createQRCode) {
      qr = await xAny.QrCode.createQRCode({
        data: {
          referenceId,
          type: 'DYNAMIC',
          currency: 'PHP',
          amount,
        },
      });
    } else {
      const authHeader = Buffer.from(`${process.env.XENDIT_SECRET_KEY}:`).toString('base64');
      const res = await fetch('https://api.xendit.co/qr_codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          reference_id: referenceId,
          type: 'DYNAMIC',
          currency: 'PHP',
          amount,
        }),
      });
      qr = (await res.json()) as Record<string, unknown>;
    }

    const qrString = (qr?.qr_string ?? qr?.qrString ?? null) as string | null;

    // Insert payment row
    const { data: payment, error: insertError } = await adminClient
      .from('payments')
      .insert({
        buyer_id: userId,
        property_id: propertyId,
        amount,
        purpose,
        period: period ?? null,
        due_date: dueDate ?? null,
        deposit_months: depositMonths ?? null,
        status: 'pending',
        method: 'qr',
        xendit_reference_id: referenceId,
        qr_code_url: qrString,
        xendit_qr_string: qrString,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ payment, qr });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
