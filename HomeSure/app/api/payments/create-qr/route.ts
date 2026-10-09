import { NextResponse } from 'next/server';
import { createXenditQRCode } from '@/lib/xendit';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, user_id, seller_id, listing_id } = body;

    if (!amount || !user_id) {
      return NextResponse.json(
        { error: 'amount and user_id are required parameters.' },
        { status: 400 }
      );
    }

    // 1. Generate Xendit QRPH Code
    const xenditResponse = await createXenditQRCode({
      amount: parseFloat(amount),
      user_id,
      seller_id,
      listing_id,
    });

    // 2. Insert payment record into Supabase
    const supabase = createAdminClient();
    const { data: paymentRecord, error: dbError } = await supabase
      .from('payments')
      .insert([
        {
          external_id: xenditResponse.externalId,
          xendit_qr_id: xenditResponse.qrId,
          user_id,
          seller_id: seller_id || null,
          listing_id: listing_id || null,
          amount: parseFloat(amount),
          fee: 0,
          net_amount: parseFloat(amount),
          type: 'rent',
          status: 'PENDING',
          payment_method: 'QRPH',
          qr_code_url: xenditResponse.qrString,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database Error storing QR code payment:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'QRPH payment code created successfully',
      payment: paymentRecord,
      qr_string: xenditResponse.qrString,
      external_id: xenditResponse.externalId,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in /api/payments/create-qr:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
