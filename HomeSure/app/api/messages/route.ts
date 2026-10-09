import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const recipientId = searchParams.get('recipient_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id param is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    let query = supabase
      .from('messages')
      .select('*, sender:sender_id(full_name, avatar_url), receiver:receiver_id(full_name, avatar_url)')
      .order('created_at', { ascending: true });

    if (recipientId) {
      query = query.or(`and(sender_id.eq.${userId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${userId})`);
    } else {
      query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ messages: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sender_id, receiver_id, listing_id, content } = body;

    if (!sender_id || !receiver_id || !content) {
      return NextResponse.json(
        { error: 'sender_id, receiver_id, and content are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id,
          receiver_id,
          listing_id: listing_id || null,
          content,
          is_read: false,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Message sent', data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
