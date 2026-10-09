import { NextResponse } from 'next/server';
import { createXenditInvoice } from '@/lib/xendit';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, user_id, seller_id, listing_id, payer_email, description, payment_type = 'rent' } = body;

    if (!amount || !user_id || !payer_email) {
      return NextResponse.json(
        { error: 'amount, user_id, and payer_email are required parameters.' },
        { status: 400 }
      );
    }

    // 1. Create Xendit Payment Invoice
    const xenditResponse = await createXenditInvoice({
      amount: parseFloat(amount),
      user_id,
      seller_id,
      listing_id,
      payer_email: payer_email,
      description: description || 'HomeSure Property Rental Payment',
      payment_type,
    });

    // 2. Insert payment record into Supabase payments table
    const supabase = createAdminClient();
    const { data: paymentRecord, error: dbError } = await supabase
      .from('payments')
      .insert([
        {
          external_id: xenditResponse.externalId,
          xendit_invoice_id: xenditResponse.invoiceId,
          user_id,
          seller_id: seller_id || null,
          listing_id: listing_id || null,
          amount: parseFloat(amount),
          fee: 0,
          net_amount: parseFloat(amount),
          type: payment_type,
          status: 'PENDING',
          payment_method: 'UNKNOWN',
          checkout_url: xenditResponse.checkoutUrl,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database Error storing payment:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Payment invoice created successfully',
      payment: paymentRecord,
      checkout_url: xenditResponse.checkoutUrl,
      external_id: xenditResponse.externalId,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in /api/payments/create-invoice:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
