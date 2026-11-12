import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    // Validate Xendit callback token
    const callbackToken = req.headers.get('x-callback-token');
    if (!callbackToken || callbackToken !== process.env.XENDIT_CALLBACK_TOKEN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await req.json()) as {
      reference_id?: string;
      external_id?: string;
      status?: string;
      data?: {
        reference_id?: string;
        status?: string;
      };
      [key: string]: unknown;
    };

    const reference_id = body.reference_id ?? body.external_id ?? body.data?.reference_id;
    const status = body.status ?? body.data?.status;

    if (!reference_id) {
      return NextResponse.json({ received: true });
    }

    if (status === 'SUCCEEDED') {
      const { error: updateError } = await adminClient
        .from('payments')
        .update({
          status: 'confirmed',
          paid_at: new Date().toISOString(),
        })
        .eq('xendit_reference_id', reference_id);

      if (updateError) {
        // Log but still return 200 so Xendit doesn't retry indefinitely
        console.error('[xendit webhook] DB update error:', updateError.message);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[xendit webhook] error:', message);
    return NextResponse.json({ received: true });
  }
}
