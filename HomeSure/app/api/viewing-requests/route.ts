import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get('buyer_id');
    const sellerId = searchParams.get('seller_id');

    const supabase = createAdminClient();
    let query = supabase
      .from('viewing_requests')
      .select('*, listing:listing_id(*), buyer:buyer_id(full_name, email, phone), seller:seller_id(full_name, email, phone)')
      .order('created_at', { ascending: false });

    if (buyerId) {
      query = query.eq('buyer_id', buyerId);
    }
    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ viewing_requests: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { listing_id, buyer_id, seller_id, preferred_date, preferred_time, notes } = body;

    if (!listing_id || !buyer_id || !seller_id || !preferred_date || !preferred_time) {
      return NextResponse.json(
        { error: 'listing_id, buyer_id, seller_id, preferred_date, and preferred_time are required.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('viewing_requests')
      .insert([
        {
          listing_id,
          buyer_id,
          seller_id,
          preferred_date,
          preferred_time,
          notes,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Viewing request submitted', viewing_request: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
