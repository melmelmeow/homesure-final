import { NextResponse } from 'next/server';
import { verifyXenditWebhookToken } from '@/lib/xendit';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const callbackToken = request.headers.get('x-callback-token');

    // 1. Token validation
    if (!verifyXenditWebhookToken(callbackToken)) {
      console.warn('Unauthorized Xendit Webhook payload received: Invalid token');
      return NextResponse.json({ error: 'Unauthorized webhook token' }, { status: 401 });
    }

    const payload = await request.json();
    console.log('Xendit Webhook Received:', JSON.stringify(payload, null, 2));

    const externalId = payload.external_id || payload.data?.external_id;
    const status = payload.status || payload.data?.status;
    const paymentChannel = payload.payment_channel || payload.payment_method || payload.data?.payment_channel || 'UNKNOWN';

    if (!externalId) {
      return NextResponse.json({ error: 'Missing external_id in payload' }, { status: 400 });
    }

    // Determine normalized payment status
    let normalizedStatus: 'PAID' | 'PENDING' | 'EXPIRED' | 'FAILED' = 'PENDING';
    if (['PAID', 'SETTLED', 'SUCCEEDED', 'COMPLETED'].includes(status?.toUpperCase())) {
      normalizedStatus = 'PAID';
    } else if (['EXPIRED'].includes(status?.toUpperCase())) {
      normalizedStatus = 'EXPIRED';
    } else if (['FAILED'].includes(status?.toUpperCase())) {
      normalizedStatus = 'FAILED';
    }

    // Map payment channel
    let paymentMethod: 'GCASH' | 'MAYA' | 'QRPH' | 'CARD' | 'UNKNOWN' = 'UNKNOWN';
    const channelStr = String(paymentChannel).toUpperCase();
    if (channelStr.includes('GCASH')) paymentMethod = 'GCASH';
    else if (channelStr.includes('PAYMAYA') || channelStr.includes('MAYA')) paymentMethod = 'MAYA';
    else if (channelStr.includes('QR')) paymentMethod = 'QRPH';
    else if (channelStr.includes('CARD')) paymentMethod = 'CARD';

    // Update payment record in Supabase
    const supabase = createAdminClient();
    const { data: updatedPayment, error: dbError } = await supabase
      .from('payments')
      .update({
        status: normalizedStatus,
        payment_method: paymentMethod,
        paid_at: normalizedStatus === 'PAID' ? new Date().toISOString() : null,
        raw_webhook_payload: payload,
      })
      .eq('external_id', externalId)
      .select()
      .single();

    if (dbError) {
      console.error('Error updating payment in database via webhook:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // If rental payment paid, update listing status if listing_id is attached
    if (normalizedStatus === 'PAID' && updatedPayment?.listing_id) {
      await supabase
        .from('listings')
        .update({ status: 'rented' })
        .eq('id', updatedPayment.listing_id);
    }

    return NextResponse.json({
      message: 'Webhook processed successfully',
      external_id: externalId,
      status: normalizedStatus,
    });
  } catch (error: any) {
    console.error('Webhook execution error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
